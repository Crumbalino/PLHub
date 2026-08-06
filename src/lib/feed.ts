// ============================================================
// The feed pipeline.
//
// Lifted out of /api/feed/route.ts unchanged so that a server component can
// call it directly. The club page used to be a server component that rendered
// a client component that fetched its own API route, which meant the server
// HTML contained a hero and a loading skeleton and nothing else — a crawler
// saw no post content on any club page.
//
// A server component MUST NOT fetch its own API route over HTTP. On Vercel
// that is a second request back into the same deployment: an extra cold start,
// an extra round trip, and a failure mode where the function calls a URL it
// cannot resolve. Import this instead.
//
// The route is now a thin wrapper over this function, so the server-rendered
// first page and the client's subsequent pages come from one implementation
// and cannot drift apart.
// ============================================================

import { createServerClient } from '@/lib/supabase'
import { filterPLContent, deduplicatePosts } from '@/lib/content-filter'
import { sortPosts } from '@/lib/scoring'
import { transformPosts } from '@/lib/transform'
import type { Post, SortMode, FeedResponse } from '@/lib/types'

export const DEFAULT_LIMIT = 20
export const MAX_LIMIT = 50
const OVERFETCH_MULTIPLIER = 3 // fetch extra rows to compensate for filtering

const SELECT =
  'id, external_id, title, url, summary, summary_hook, content, source, ' +
  'club_slug, author, score, subreddit, image_url, fetched_at, published_at, ' +
  'score_significance, card_type, generated_headline, clubs(*)'

// ─────────────────────────────────────────────────────
// Score rescaling: spread 30–95 instead of clustering 55–75
// ─────────────────────────────────────────────────────
function rescaleScores(posts: any[]): any[] {
  const scores = posts.map((p) => p.indexScore ?? 0).filter((s) => s > 0)
  if (scores.length < 2) return posts
  const min = Math.min(...scores)
  const max = Math.max(...scores)
  if (max === min) return posts
  return posts.map((p) => {
    if (!p.indexScore) return p
    const rescaled = Math.round(30 + ((p.indexScore - min) / (max - min)) * 65)
    return { ...p, indexScore: rescaled }
  })
}

export interface GetFeedOptions {
  sort?: SortMode
  club?: string | null
  page?: number
  limit?: number
}

/**
 * One page of the feed, filtered, scored, sorted and transformed.
 *
 * Throws on a database error rather than returning a shape the caller has to
 * inspect — the route catches and maps to a 500, and the club page catches and
 * falls back to an empty first page so a database blip degrades to the empty
 * state rather than a broken route.
 */
export async function getFeed(options: GetFeedOptions = {}): Promise<FeedResponse> {
  const sort = options.sort ?? 'pulse'
  const club = options.club ?? null
  const page = Math.max(1, options.page ?? 1)
  const limit = Math.min(MAX_LIMIT, Math.max(1, options.limit ?? DEFAULT_LIMIT))

  const supabase = createServerClient()

  const fetchLimit = limit * OVERFETCH_MULTIPLIER
  const offset = (page - 1) * fetchLimit

  let query = supabase.from('posts').select(SELECT, { count: 'exact' })

  if (club) query = query.eq('club_slug', club)

  // For 'hot' sort, only fetch recent posts (last 6h)
  if (sort === 'hot') {
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
    query = query.gte('published_at', sixHoursAgo)
  }

  // Always order by published_at from DB — we re-sort in JS after filtering
  query = query.order('published_at', { ascending: false })

  const { data: rawPosts, count, error } = await query.range(offset, offset + fetchLimit - 1)

  if (error) {
    console.error('[feed] Supabase error:', error)
    throw error
  }

  const posts = (rawPosts as unknown as Post[]) || []

  // Content filter pipeline: remove non-PL, gambling, duplicates
  const filtered = deduplicatePosts(filterPLContent(posts))
  const sorted = sortPosts(filtered, sort)
  const paged = sorted.slice(0, limit)
  const feedPosts = rescaleScores(transformPosts(paged))

  return {
    posts: feedPosts,
    total: count || 0,
    page,
    hasMore: filtered.length > limit,
  }
}

/** An empty page, for callers that must degrade rather than throw. */
export const emptyFeed = (page = 1): FeedResponse => ({
  posts: [],
  total: 0,
  page,
  hasMore: false,
})
