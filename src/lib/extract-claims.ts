/**
 * Claim extraction — pure module. No database access, no cron wiring.
 *
 * Reads an article's title and content and returns the transfer claims asserted
 * in that text. The output is NOT trusted: every extracted string must go
 * through verifyClaim() before it reaches the database. The prompt below tells
 * the model not to infer; verify-claim.ts is what guarantees it.
 *
 * Model: claude-opus-5. Structured outputs (`output_config.format`) are not
 * supported on claude-sonnet-4-6, the model the rest of the repo uses, so the
 * schema requirement forces the change rather than cost or quality preference.
 */

import Anthropic from '@anthropic-ai/sdk'
import { stripCodeFences } from '@/lib/claude'

export const EXTRACTOR_MODEL = 'claude-opus-5'

/** Mirrors the claim_type enum in migrations/2026-08-06-claim-ledger.sql. */
export const CLAIM_TYPES = [
  'interest', 'bid_made', 'bid_rejected', 'bid_accepted', 'personal_terms_agreed',
  'medical_scheduled', 'medical_completed', 'deal_agreed', 'deal_off',
  'contract_extension', 'release_clause_activated', 'loan_agreed', 'exit_sought', 'other',
] as const
export type ClaimType = (typeof CLAIM_TYPES)[number]

/** Mirrors the origin_kind enum. Three states, because a boolean left the
 *  "no origin stated" case undefined and the model handled it inconsistently. */
export const ORIGIN_KINDS = ['none', 'vague', 'named'] as const
export type OriginKind = (typeof ORIGIN_KINDS)[number]

/** One extracted claim, pre-verification. Field names match the claims table. */
export interface RawClaim {
  player_name: string
  to_club: string | null
  from_club: string | null
  type: ClaimType
  is_completed_event: boolean
  hedge_text: string | null
  claim_text: string
  origin: OriginKind
  origin_raw: string | null
  is_self_reported: boolean
  fee_raw: string | null
  fee_amount: number | null
  fee_currency: string | null
  deadline_raw: string | null
}

export interface ExtractionResult {
  claims: RawClaim[]
  usage: { input_tokens: number; output_tokens: number }
  /** Set when the call or parse failed. claims is [] in that case. */
  error?: string
}

/** JSON schema handed to output_config.format. Enums mirror the DDL exactly. */
export const CLAIM_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['claims'],
  properties: {
    claims: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: [
          'player_name', 'to_club', 'from_club', 'type', 'is_completed_event',
          'hedge_text', 'claim_text', 'origin', 'origin_raw', 'is_self_reported',
          'fee_raw', 'fee_amount', 'fee_currency', 'deadline_raw',
        ],
        properties: {
          player_name:        { type: 'string' },
          to_club:            { type: ['string', 'null'] },
          from_club:          { type: ['string', 'null'] },
          type:               { type: 'string', enum: [...CLAIM_TYPES] },
          is_completed_event: { type: 'boolean' },
          hedge_text:         { type: ['string', 'null'] },
          claim_text:         { type: 'string' },
          origin:             { type: 'string', enum: [...ORIGIN_KINDS] },
          origin_raw:         { type: ['string', 'null'] },
          is_self_reported:   { type: 'boolean' },
          fee_raw:            { type: ['string', 'null'] },
          fee_amount:         { type: ['number', 'null'] },
          fee_currency:       { type: ['string', 'null'] },
          deadline_raw:       { type: ['string', 'null'] },
        },
      },
    },
  },
} as const

export const EXTRACTOR_SYSTEM_PROMPT = `You extract transfer-rumour claims from football article text for an accountability ledger. The ledger records what an outlet ASSERTED, so accuracy about the text matters more than accuracy about football.

## What a claim is

One claim = one assertion about ONE player and ONE club. An article saying two clubs are chasing the same player yields TWO claims. An article with no transfer assertion yields ZERO claims — return an empty array rather than inventing one. Most articles yield none.

## NEVER INFER. This is the most important rule.

Every value you return must come from the supplied text. Do not add facts you happen to know about football. Do not complete a partial picture. If the text does not state it, the field is null.

You will often recognise a player and know which club he plays for. That knowledge is not evidence and must not appear in your output.

### Negative example — this exact failure has occurred

Text: "Man United are looking at USMNT's Antonee Robinson."

WRONG:
  { "player_name": "Antonee Robinson", "to_club": "Manchester United",
    "from_club": "Fulham", "type": "interest", ... }

Robinson does play for Fulham. The text does not say so. Supplying "Fulham"
is fabrication, and it is the failure mode this prompt exists to prevent.

CORRECT:
  { "player_name": "Antonee Robinson", "to_club": "Manchester United",
    "from_club": null, "type": "interest", ... }

The same applies to every field. Do not infer a fee that is not printed, a
deadline that is not stated, or a selling club that is merely implied.

## player_name

Must be a NAMED individual as written in the text. If the article says "a Real
Madrid centre-back" or "a Championship winger" with no name, emit NO claim for
it — an unnamed player can never be resolved, so the claim could never be
scored.

## hedge_text — verbatim, character for character

Copy the hedging language EXACTLY as it appears: "understood to be closing in
on", "looked set to", "moved a step closer to". Do not paraphrase, tidy,
shorten, or correct it. The precise wording is the evidence the ledger exists
to preserve — an outlet that hedges everything and is technically never wrong
is a different failure from one that commits and misses, and only the exact
string distinguishes them.

If the assertion carries no hedging, use null. Do not manufacture one.

Prefer the hedging phrase attached to the assertion. Do not return a rhetorical
question or an editorial aside as a hedge.

## fee_raw and deadline_raw — verbatim too

fee_raw is the fee exactly as printed ("€135m", "£115.7m", "a club-record fee").
fee_amount and fee_currency are your parse of it; if you cannot parse
confidently, leave them null but still return fee_raw. Same for deadline_raw
versus stated deadline.

## origin — who the OUTLET says it heard from

- "named": a specific journalist or outlet is credited AND identifiable.
- "vague": an origin is stated but unattributable — "sources in Spain",
  "according to reports", "it is understood".
- "none": no origin is stated at all.

origin_raw is that phrasing verbatim, or null when origin is "none".
is_self_reported is true when the outlet presents it as its own reporting.

## is_completed_event

True when the text reports a transfer that has already happened, as fact rather
than as a rumour. These are recorded but scored differently, so mark them
explicitly — do not signal it by leaving hedge_text null.

## claim_text

The verbatim sentence from the text that carries the assertion.`

/** Build the user turn. Title and content only — no metadata, no feed name. */
export function buildExtractionInput(title: string, content: string | null): string {
  return `TITLE: ${title}\n\nTEXT: ${(content ?? '').trim()}`
}

export interface ExtractOptions {
  client?: Anthropic
  model?: string
  /** 'low' suits mechanical extraction from a short description. */
  effort?: 'low' | 'medium' | 'high' | 'xhigh' | 'max'
}

/**
 * Extract claims from one article.
 *
 * Never throws: an API or parse failure returns `{ claims: [], error }` so a
 * batch cannot be halted by one bad article. The caller records the error as
 * `extract_status` rather than losing it — a swallowed failure that looks like
 * "no claims" is how the previous pipeline died unnoticed for five months.
 */
export async function extractClaims(
  title: string,
  content: string | null,
  opts: ExtractOptions = {},
): Promise<ExtractionResult> {
  const client = opts.client ?? new Anthropic()
  const model = opts.model ?? EXTRACTOR_MODEL
  const empty = { input_tokens: 0, output_tokens: 0 }

  let response: any
  try {
    response = await client.messages.create({
      model,
      max_tokens: 2000,
      system: EXTRACTOR_SYSTEM_PROMPT,
      output_config: {
        format: { type: 'json_schema', schema: CLAIM_SCHEMA },
        effort: opts.effort ?? 'low',
      },
      messages: [{ role: 'user', content: buildExtractionInput(title, content) }],
    } as any)
  } catch (err: any) {
    console.error('[extract-claims] API call failed:', err?.status, err?.message)
    return { claims: [], usage: empty, error: `api_failed: ${err?.message ?? err}` }
  }

  const usage = {
    input_tokens: response.usage?.input_tokens ?? 0,
    output_tokens: response.usage?.output_tokens ?? 0,
  }

  const block = response.content?.find((b: any) => b.type === 'text')
  if (!block) return { claims: [], usage, error: 'no_text_block' }

  // Structured outputs should make fences impossible, but strip anyway: the
  // fenced-JSON failure was silent for months on the summariser path.
  const raw = String(block.text).trim()
  try {
    const parsed = JSON.parse(stripCodeFences(raw))
    return { claims: Array.isArray(parsed.claims) ? parsed.claims : [], usage }
  } catch (err: any) {
    console.error('[extract-claims] JSON parse failed:', err?.message)
    console.error('[extract-claims] raw model output was:', JSON.stringify(raw))
    return { claims: [], usage, error: `parse_failed: ${err?.message}` }
  }
}
