/**
 * Mechanical verification of an extracted claim against its source text.
 *
 * The extractor prompt tells the model not to infer. This module is what makes
 * that a guarantee rather than an instruction. Every extracted string must be
 * findable in title+content — directly, or via a known alias for the resolved
 * entity. Anything that is not present is nulled; a player that is not present
 * rejects the whole claim.
 *
 * The method is the one that proved the hedges were verbatim: substring
 * containment against the source. It generalises to every field, and unlike a
 * prompt rule it cannot be talked out of.
 *
 * Pure: no database access. The alias index is injected so the same code runs
 * offline in tests and DB-backed in production.
 */

import type { RawClaim } from '@/lib/extract-claims'

/**
 * Alias lookup, keyed by NORMALISED alias.
 *
 * In production, built from the player_aliases and club_aliases tables. In
 * tests, built inline. Values are the canonical slug.
 */
export interface AliasIndex {
  players: Map<string, string>
  clubs: Map<string, string>
}

export const emptyAliasIndex = (): AliasIndex => ({ players: new Map(), clubs: new Map() })

/**
 * Fold accents, lowercase, collapse whitespace, drop typographic punctuation.
 *
 * Needed because feeds are inconsistent about diacritics and quote characters:
 * "Vinícius Júnior" and "Vinicius Jr." refer to one player, and an outlet may
 * print either. Without folding, a correct extraction would be rejected as
 * unverifiable.
 */
export function normalise(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[’‘`´]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, '-')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

/** True when `value` occurs in `text`, after normalising both. */
export function appearsIn(value: string, text: string): boolean {
  const v = normalise(value)
  return v.length > 0 && normalise(text).includes(v)
}

/**
 * True when the value, or any alias of the entity it names, occurs in the text.
 *
 * Two directions matter. The model may return the canonical name when the text
 * used a nickname ("Tottenham" for "Spurs"), or a nickname when the text used
 * the canonical name. Both are legitimate; only an entity absent from the text
 * entirely is a fabrication.
 */
export function appearsViaAlias(
  value: string,
  text: string,
  index: Map<string, string>,
): boolean {
  if (appearsIn(value, text)) return true

  const slug = index.get(normalise(value))
  if (!slug) return false

  for (const [alias, aliasSlug] of index) {
    if (aliasSlug === slug && normalise(text).includes(alias)) return true
  }
  return false
}

export type VerifiedField =
  | 'player_name' | 'to_club' | 'from_club'
  | 'fee_raw' | 'deadline_raw' | 'hedge_text'

export interface VerificationResult {
  /** The claim with unverifiable fields nulled. Null when rejected outright. */
  claim: RawClaim | null
  /** True when the claim was dropped (player_name unverifiable). */
  rejected: boolean
  /** Machine-readable reason when rejected. */
  rejectReason?: 'player_not_in_text' | 'no_club_side' | 'empty_player_name'
  /** Fields nulled because they did not appear in the source. */
  nulled: VerifiedField[]
  /** Always set, pass or fail — the audit trail for claims.verified_at. */
  verifiedAt: string
}

/**
 * Verify one extracted claim against the article it came from.
 *
 * Rules:
 *   - player_name absent  -> REJECT. An unresolvable player can never be
 *     scored, and this is the field the Fulham-class fabrication attaches to.
 *   - to_club / from_club absent -> null that side. If both end up null the
 *     claim is rejected, since claims_club_side_present requires one.
 *   - fee_raw / deadline_raw / hedge_text absent -> null the field. These are
 *     verbatim by contract, so containment is exact evidence.
 *   - fee_amount / fee_currency are DERIVED from fee_raw and are cleared with
 *     it. They are convenience, never evidence, so they are never verified
 *     directly — a parsed 135000000 will not appear in text reading "€135m".
 */
export function verifyClaim(
  claim: RawClaim,
  title: string,
  content: string | null,
  aliases: AliasIndex = emptyAliasIndex(),
): VerificationResult {
  const text = `${title ?? ''}\n${content ?? ''}`
  const verifiedAt = new Date().toISOString()
  const nulled: VerifiedField[] = []

  if (!claim.player_name || !claim.player_name.trim()) {
    return { claim: null, rejected: true, rejectReason: 'empty_player_name', nulled, verifiedAt }
  }
  if (!appearsViaAlias(claim.player_name, text, aliases.players)) {
    console.warn(
      `[verify-claim] REJECT player not in source: ${JSON.stringify(claim.player_name)}`,
    )
    return { claim: null, rejected: true, rejectReason: 'player_not_in_text', nulled, verifiedAt }
  }

  const out: RawClaim = { ...claim }

  for (const side of ['to_club', 'from_club'] as const) {
    const v = out[side]
    if (v && !appearsViaAlias(v, text, aliases.clubs)) {
      console.warn(`[verify-claim] NULL ${side} not in source: ${JSON.stringify(v)}`)
      out[side] = null
      nulled.push(side)
    }
  }

  if (!out.to_club && !out.from_club) {
    return { claim: null, rejected: true, rejectReason: 'no_club_side', nulled, verifiedAt }
  }

  for (const field of ['fee_raw', 'deadline_raw', 'hedge_text'] as const) {
    const v = out[field]
    if (v && !appearsIn(v, text)) {
      console.warn(`[verify-claim] NULL ${field} not verbatim: ${JSON.stringify(v)}`)
      out[field] = null
      nulled.push(field)
    }
  }

  // Parsed fee fields are derived from fee_raw; if the raw string could not be
  // verified, the parse of it has no evidence either.
  if (nulled.includes('fee_raw')) {
    out.fee_amount = null
    out.fee_currency = null
  }

  return { claim: out, rejected: false, nulled, verifiedAt }
}

export interface BatchVerification {
  accepted: RawClaim[]
  rejected: { claim: RawClaim; reason: string }[]
  /** Count of fields nulled across all claims — the fabrication rate. */
  nulledFieldCount: number
  verifiedAt: string
}

/** Verify every claim from one article and log the aggregate. */
export function verifyClaims(
  claims: RawClaim[],
  title: string,
  content: string | null,
  aliases: AliasIndex = emptyAliasIndex(),
): BatchVerification {
  const accepted: RawClaim[] = []
  const rejected: { claim: RawClaim; reason: string }[] = []
  let nulledFieldCount = 0
  let verifiedAt = new Date().toISOString()

  for (const c of claims) {
    const r = verifyClaim(c, title, content, aliases)
    verifiedAt = r.verifiedAt
    nulledFieldCount += r.nulled.length
    if (r.rejected || !r.claim) rejected.push({ claim: c, reason: r.rejectReason ?? 'unknown' })
    else accepted.push(r.claim)
  }

  if (rejected.length || nulledFieldCount) {
    console.log(
      `[verify-claim] ${accepted.length} accepted, ${rejected.length} rejected, ` +
        `${nulledFieldCount} field(s) nulled as unverifiable`,
    )
  }
  return { accepted, rejected, nulledFieldCount, verifiedAt }
}

/** Build an AliasIndex from rows shaped like the alias tables. */
export function buildAliasIndex(
  playerAliases: { alias: string; player_slug: string }[],
  clubAliases: { alias: string; club_slug: string }[],
): AliasIndex {
  const players = new Map<string, string>()
  const clubs = new Map<string, string>()
  for (const r of playerAliases) players.set(normalise(r.alias), r.player_slug)
  for (const r of clubAliases) clubs.set(normalise(r.alias), r.club_slug)
  return { players, clubs }
}
