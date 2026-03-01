// ============================================================
// POST /api/cron/source-detection
// Detects multi-source story clusters and updates source_count + story_cluster
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { detectClusters, extractClubs, extractKeywords, type StoryFingerprint } from '@/lib/source-detection'

export const maxDuration = 10

// Verify cron secret
const CRON_SECRET = process.env.CRON_SECRET

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = createServerClient()

    // Fetch posts from last 48 hours
    const twoHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()

    const { data: posts, error } = await supabase
      .from('posts')
      .select('id, title, subreddit, published_at, category')
      .gte('published_at', twoHoursAgo)
      .limit(200)

    if (error) {
      console.error('[source-detection] Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch posts', detail: error.message },
        { status: 500 }
      )
    }

    if (!posts || posts.length === 0) {
      return NextResponse.json({
        postsAnalysed: 0,
        clustersFound: 0,
        postsUpdated: 0,
      })
    }

    // Build StoryFingerprint array
    const fingerprints: StoryFingerprint[] = posts.map(post => ({
      id: post.id,
      title: post.title,
      publisher: post.subreddit || 'unknown',
      clubs: extractClubs(post.title),
      keywords: extractKeywords(post.title),
      publishedAt: post.published_at,
      category: post.category,
    }))

    // Detect clusters
    const clusters = detectClusters(fingerprints)

    // Update posts with source_count and story_cluster
    let postsUpdated = 0

    for (const [clusterId, postIds] of clusters) {
      const sourceCount = postIds.length

      for (const postId of postIds) {
        const { error: updateError } = await supabase
          .from('posts')
          .update({
            source_count: sourceCount,
            story_cluster: clusterId,
          })
          .eq('id', postId)

        if (updateError) {
          console.error(`[source-detection] Failed to update post ${postId}:`, updateError)
        } else {
          postsUpdated++
        }
      }
    }

    return NextResponse.json({
      postsAnalysed: posts.length,
      clustersFound: clusters.size,
      postsUpdated,
    })
  } catch (err) {
    console.error('[source-detection] Unexpected error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
