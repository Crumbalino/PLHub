// Snapshot API v1.1 — queries posts table, sections into modules
// Queries published_at with correct column selection (no index_score)

import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'
import { transformPost } from '@/lib/transform'
import type { Post, FeedPost } from '@/lib/types'

// Big Six clubs for sectioning
const BIG_SIX = ['arsenal', 'chelsea', 'liverpool', 'man-city', 'man-united', 'tottenham']

interface SnapshotSection {
  caughtUp: FeedPost[]
  transfers: FeedPost[]
  beyondBigSix: FeedPost[]
  andFinally: FeedPost | null
  quote: null
}

interface SnapshotResponse {
  success: boolean
  data?: {
    metadata: {
      generatedAt: string
      matchday: number
      postsCount: number
    }
    modules: SnapshotSection
  }
  error?: string
}

/**
 * GET /api/snapshot
 * Assembles the Snapshot briefing from the best posts in Supabase.
 * Returns structured sections for each Snapshot module.
 */
export async function GET(request: NextRequest): Promise<NextResponse<SnapshotResponse>> {
  try {
    // Query posts from last 48 hours, limit 50
    const since = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()

    const client = getSupabase()
    const { data: posts, error } = await client
      .from('posts')
      .select(
        'id, external_id, title, url, summary, summary_hook, content, source, club_slug, author, score, subreddit, image_url, fetched_at, published_at, score_significance, clubs(*)'
      )
      .gte('published_at', since)
      .order('published_at', { ascending: false })
      .limit(50)

    if (error) throw error
    if (!posts || posts.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          metadata: {
            generatedAt: new Date().toISOString(),
            matchday: 29, // TODO: calculate dynamically from season
            postsCount: 0,
          },
          modules: {
            caughtUp: [],
            transfers: [],
            beyondBigSix: [],
            andFinally: null,
            quote: null,
          },
        },
      })
    }

    // Transform all posts
    const transformed: FeedPost[] = []
    for (const post of posts) {
      try {
        const feedPost = await transformPost(post as Post)
        transformed.push(feedPost)
      } catch (err) {
        // Skip posts that fail transformation
        console.error(`Failed to transform post ${post.id}:`, err)
      }
    }

    // Section the posts with de-duplication
    const usedIds = new Set<string>()

    // 1. caughtUp: top 5 posts
    const caughtUp = transformed.slice(0, 5)
    caughtUp.forEach(p => usedIds.add(p.id))

    // 2. transfers: top 3 posts with category='transfer' or 'contract'
    const transfers = transformed
      .filter(
        p =>
          !usedIds.has(p.id) &&
          ((p as any).category === 'transfer' || (p as any).category === 'contract')
      )
      .slice(0, 3)
    transfers.forEach(p => usedIds.add(p.id))

    // 3. beyondBigSix: top 2 posts without Big Six clubs
    const beyondBigSix = transformed
      .filter(p => {
        if (usedIds.has(p.id)) return false
        // Check if any clubs in this post are Big Six
        const hasBigSix = p.clubs.some(club => BIG_SIX.includes(club.slug))
        return !hasBigSix
      })
      .slice(0, 2)
    beyondBigSix.forEach(p => usedIds.add(p.id))

    // 4. andFinally: 1 remaining post
    const andFinally = transformed.find(p => !usedIds.has(p.id)) || null
    if (andFinally) usedIds.add(andFinally.id)

    return NextResponse.json(
      {
        success: true,
        data: {
          metadata: {
            generatedAt: new Date().toISOString(),
            matchday: 29, // TODO: calculate dynamically from season
            postsCount: transformed.length,
          },
          modules: {
            caughtUp,
            transfers,
            beyondBigSix,
            andFinally,
            quote: null,
          },
        },
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
          'Content-Type': 'application/json',
        },
      }
    )
  } catch (err) {
    let errorMessage = 'Unknown error'
    if (err instanceof Error) {
      errorMessage = err.message
    } else if (typeof err === 'object' && err !== null && 'message' in err) {
      errorMessage = String((err as any).message)
    } else if (typeof err === 'string') {
      errorMessage = err
    } else {
      errorMessage = JSON.stringify(err)
    }
    console.error('[Snapshot API v1.1] Catch block — Error:', errorMessage, err)
    const timestamp = new Date().toISOString()
    return NextResponse.json(
      {
        success: false,
        error: `[v1.1-${timestamp}] ${errorMessage}`,
        timestamp,
      },
      { status: 500 }
    )
  }
}
