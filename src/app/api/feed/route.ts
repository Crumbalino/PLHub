// ============================================================
// GET /api/feed
//
// The single endpoint for the PLHub feed.
// Returns enriched FeedPost objects with all display data
// pre-computed — the UI just renders props.
//
// Query params:
//   sort  = pulse | hot | new       (default: pulse)
//   club  = arsenal | chelsea | ... (optional, filters to one club)
//   page  = 1, 2, 3 ...            (default: 1)
//   limit = 1-50                    (default: 20)
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { filterPLContent, deduplicatePosts } from '@/lib/content-filter'
import { sortPosts } from '@/lib/scoring'
import { transformPosts } from '@/lib/transform'
import type { Post, SortMode, FeedResponse } from '@/lib/types'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const DEFAULT_LIMIT = 20
const MAX_LIMIT = 50
const OVERFETCH_MULTIPLIER = 3 // fetch extra rows to compensate for filtering

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sort = (searchParams.get('sort') || 'pulse') as SortMode
    const club = searchParams.get('club') || null
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(searchParams.get('limit') || String(DEFAULT_LIMIT), 10)))

    const supabase = createServerClient()

    // Overfetch to compensate for content filter removing non-PL posts
    const fetchLimit = limit * OVERFETCH_MULTIPLIER
    const offset = (page - 1) * fetchLimit

    // Build query
    let query = supabase
      .from('posts')
      .select(
        'id, external_id, title, url, summary, content, source, club_slug, author, score, subreddit, image_url, fetched_at, published_at, clubs(*)',
        { count: 'exact' }
      )

    // Club filter at database level
    if (club) {
      query = query.eq('club_slug', club)
    }

    // For 'hot' sort, only fetch recent posts (last 6h)
    if (sort === 'hot') {
      const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
      query = query.gte('published_at', sixHoursAgo)
    }

    // Always order by published_at from DB — we re-sort in JS after filtering
    query = query.order('published_at', { ascending: false })

    const { data: rawPosts, count, error } = await query.range(offset, offset + fetchLimit - 1)

    if (error) {
      console.error('[/api/feed] Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch posts', detail: error.message },
        { status: 500 }
      )
    }

    const posts = (rawPosts as unknown as Post[]) || []

    // Content filter pipeline: remove non-PL, gambling, duplicates
    const filtered = deduplicatePosts(filterPLContent(posts))

    // Sort using shared scoring logic
    const sorted = sortPosts(filtered, sort)

    // Page the filtered results
    const paged = sorted.slice(0, limit)

    // Transform raw DB posts into enriched FeedPost objects
    const feedPosts = transformPosts(paged)

    const response: FeedResponse = {
      posts: feedPosts,
      total: count || 0,
      page,
      hasMore: filtered.length > limit,
    }

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
      },
    })
  } catch (err) {
    console.error('[/api/feed] Unexpected error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
