// ============================================================
// GET /api/trending
//
// Returns the top 5 posts by pulse index for the trending strip.
// These are the hottest stories right now — high engagement + recency.
//
// Query params:
//   count = 1-10 (default: 5)
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { filterPLContent, deduplicatePosts } from '@/lib/content-filter'
import { sortPosts } from '@/lib/scoring'
import { transformTrendingPosts } from '@/lib/transform'
import type { Post, TrendingResponse } from '@/lib/types'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const count = Math.min(10, Math.max(1, parseInt(searchParams.get('count') || '5', 10)))

    const supabase = createServerClient()

    // Fetch recent high-scoring posts from the last 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

    const { data: rawPosts, error } = await supabase
      .from('posts')
      .select(
        'id, external_id, title, url, summary, content, source, club_slug, author, score, subreddit, image_url, fetched_at, published_at, clubs(*)'
      )
      .gte('published_at', twentyFourHoursAgo)
      .order('score', { ascending: false })
      .limit(50) // overfetch for filter loss

    if (error) {
      console.error('[/api/trending] Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch trending posts' },
        { status: 500 }
      )
    }

    const posts = (rawPosts as unknown as Post[]) || []

    // Filter and sort by pulse (recency × engagement)
    const filtered = deduplicatePosts(filterPLContent(posts))
    const sorted = sortPosts(filtered, 'pulse')
    const top = sorted.slice(0, count)

    const response: TrendingResponse = {
      posts: transformTrendingPosts(top),
    }

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    })
  } catch (err) {
    console.error('[/api/trending] Unexpected error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
