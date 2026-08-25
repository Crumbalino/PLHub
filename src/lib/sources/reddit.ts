/**
 * Reddit source adapter — public JSON, hot threads per subreddit.
 *
 * Feeds PAGE_SPEC block 16, Fan Pulse (§7.16). No auth, no key: the public
 * `.json` view of any subreddit listing.
 *
 * TITLES AND SCORES ONLY. `selftext` is never read, never stored and never
 * returned by anything in this module — §7.16 forbids reproducing comment or
 * post bodies, and the block links out instead. The parser deliberately
 * projects the three fields it is allowed to use rather than passing the
 * upstream object through, so a body cannot leak by accident downstream.
 *
 * The block is labelled fan discussion, not reporting. If Reddit disappears
 * this returns null, Fan Pulse does not render, and nothing else breaks.
 */

import { fetchJson } from './cache'

const BASE = 'https://www.reddit.com'

/**
 * Reddit rate-limits and blocks anonymous clients hard, and is stricter about
 * datacentre ranges than residential ones. An honest identifying UA is what
 * their API guidance asks for.
 */
const HEADERS = {
  'User-Agent': 'TheFootballHub/1.0 (+https://thefootballhub.uk)',
}

/**
 * Fan Pulse is the slowest-value block on the page and the most rate-limited
 * source. Thirty minutes is generous to Reddit and invisible to the reader.
 */
const HOT_TTL = 30 * 60 * 1000

/** §7.16 cap. */
export const FAN_PULSE_CAP = 3

// ---------------------------------------------------------------------------
// Upstream types — only the three fields we are permitted to read.
// ---------------------------------------------------------------------------

interface RedditPost {
  title?: string
  score?: number
  permalink?: string
  stickied?: boolean
  removed_by_category?: string | null
}

interface RedditListing {
  data?: {
    children?: Array<{ kind?: string; data?: RedditPost }>
  }
}

// ---------------------------------------------------------------------------
// Domain types
// ---------------------------------------------------------------------------

export interface FanThread {
  title: string
  score: number
  url: string
}

export interface FanPulse {
  subreddit: string
  threads: FanThread[]
}

// ---------------------------------------------------------------------------
// Transforms — pure
// ---------------------------------------------------------------------------

/**
 * Reddit HTML-escapes titles in the JSON view. Decode the handful of entities
 * it actually emits; do not run a general HTML parser over user-supplied text.
 */
export function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&nbsp;/g, ' ')
}

/**
 * Project a hot listing to titles and scores.
 *
 * Removed and deleted posts are dropped — they carry a title but no thread
 * worth linking to. Stickied posts are kept: the match thread is stickied and
 * is precisely what the block exists to surface.
 */
export function parseHotThreads(
  listing: RedditListing,
  cap: number = FAN_PULSE_CAP
): FanThread[] {
  const children = listing?.data?.children ?? []
  const threads: FanThread[] = []

  for (const child of children) {
    const post = child?.data
    if (!post) continue
    if (post.removed_by_category) continue
    const title = (post.title ?? '').trim()
    if (!title) continue
    if (!post.permalink) continue

    threads.push({
      title: decodeEntities(title),
      score: typeof post.score === 'number' ? post.score : 0,
      url: `${BASE}${post.permalink}`,
    })

    if (threads.length >= cap) break
  }

  return threads
}

/** Guard against a caller passing a subreddit name that is really a path. */
export function isValidSubreddit(subreddit: string): boolean {
  return /^[A-Za-z0-9_]{2,21}$/.test(subreddit)
}

// ---------------------------------------------------------------------------
// Fetchers and composed reads
// ---------------------------------------------------------------------------

/** Raw hot listing. Null on any failure, including a block or a rate limit. */
export function fetchHot(subreddit: string, limit = 10): Promise<RedditListing | null> {
  if (!isValidSubreddit(subreddit)) {
    console.error(`[sources] refusing malformed subreddit: ${subreddit}`)
    return Promise.resolve(null)
  }
  return fetchJson<RedditListing>(
    `${BASE}/r/${subreddit}/hot.json?limit=${limit}&raw_json=1`,
    { ttlMs: HOT_TTL, headers: HEADERS }
  )
}

/**
 * §7.16 Fan Pulse for one subreddit.
 *
 * Returns null when the source is unreachable and when it returns nothing —
 * both mean the block does not render, and the caller should not have to tell
 * the two apart.
 */
export async function getFanPulse(
  subreddit: string,
  cap: number = FAN_PULSE_CAP
): Promise<FanPulse | null> {
  const listing = await fetchHot(subreddit, Math.max(cap * 3, 10))
  if (!listing) return null
  const threads = parseHotThreads(listing, cap)
  if (!threads.length) return null
  return { subreddit, threads }
}
