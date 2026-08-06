/**
 * Keyword gate in front of the claim extractor.
 *
 * The extractor must call the API on an article to discover whether it holds a
 * claim, so roughly two thirds of calls return an empty array. This gate drops
 * the obvious non-candidates for free before any spend.
 *
 * Measured on the 24-item stratified sample (2026-08-06): 8/8 claim-bearing
 * articles kept, 12/16 non-yielding dropped -- 50% fewer API calls at no recall
 * cost on that sample. Eight positives is a small sample; treat 100% recall as
 * encouraging, not established, and re-measure before trusting it at scale.
 *
 * NEVER drops silently. A pre-filter that quietly discards claims is worse than
 * no pre-filter, because the loss is invisible: the article simply never
 * appears, and nothing distinguishes "no claim" from "never looked".
 */

/** Transfer vocabulary. Whole-word matched, so 'fee' does not match 'feels'. */
export const PREFILTER_KEYWORDS = [
  'transfer', 'transfers', 'transferred',
  'sign', 'signs', 'signing', 'signed',
  'join', 'joins', 'joining', 'joined',
  'bid', 'bids',
  'interest', 'interested',
  'fee', 'fees',
  'medical',
  'deal', 'deals',
  'talks',
  'approach', 'approached',
  'move', 'moves',
] as const

const PATTERN = new RegExp(`\\b(${PREFILTER_KEYWORDS.join('|')})\\b`, 'i')

export interface PrefilterResult {
  /** True when the article should go to the extractor. */
  passes: boolean
  /** Keywords found, lowercased and de-duplicated. Empty when dropped. */
  matched: string[]
}

/**
 * Decide whether an article is worth an extraction call.
 *
 * Word-boundary matched on purpose. Naive substring matching produced two false
 * positives in testing -- 'fee' inside "feels", 'join' inside "joined in with
 * the singing" -- and the first of those is a pure fragment artefact.
 */
export function prefilter(title: string, content: string | null): PrefilterResult {
  const text = `${title ?? ''} ${content ?? ''}`
  const found = new Set<string>()
  for (const kw of PREFILTER_KEYWORDS) {
    if (new RegExp(`\\b${kw}\\b`, 'i').test(text)) found.add(kw)
  }
  return { passes: PATTERN.test(text), matched: [...found] }
}

export interface PrefilterLogger {
  (event: {
    decision: 'keep' | 'drop'
    title: string
    matched: string[]
  }): void
}

/** Default logger. Every drop is recorded; silence is the failure mode. */
const defaultLogger: PrefilterLogger = ({ decision, title, matched }) => {
  if (decision === 'drop') {
    console.log(`[prefilter] DROP no transfer vocabulary: ${JSON.stringify(title)}`)
  } else {
    console.log(`[prefilter] KEEP [${matched.join(',')}]: ${JSON.stringify(title)}`)
  }
}

export interface PartitionResult<T> {
  kept: T[]
  dropped: T[]
}

/**
 * Partition a batch, logging every decision.
 *
 * Returns the dropped articles as well as the kept ones so the caller can mark
 * them `extract_status = 'prefiltered'` -- which is what keeps a dropped
 * article distinguishable from one the extractor never reached.
 */
export function partitionByPrefilter<T extends { title: string; content: string | null }>(
  articles: T[],
  log: PrefilterLogger = defaultLogger,
): PartitionResult<T> {
  const kept: T[] = []
  const dropped: T[] = []
  for (const a of articles) {
    const { passes, matched } = prefilter(a.title, a.content)
    log({ decision: passes ? 'keep' : 'drop', title: a.title, matched })
    ;(passes ? kept : dropped).push(a)
  }
  console.log(
    `[prefilter] ${kept.length} kept, ${dropped.length} dropped of ${articles.length} ` +
      `(${articles.length ? Math.round((dropped.length / articles.length) * 100) : 0}% fewer extraction calls)`,
  )
  return { kept, dropped }
}
