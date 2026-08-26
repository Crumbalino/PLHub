// ============================================================
// POST /api/cron/source-detection
// Detects multi-source story clusters and updates source_count + story_cluster
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { logCronJob } from '@/lib/cron-logging'
import { detectClusters, extractClubs, extractKeywords, type StoryFingerprint } from '@/lib/source-detection'

export const maxDuration = 10

async function handleRequest(request: NextRequest) {
  // Verify cron secret. Read per-request, not at module scope: an unset
  // secret must 401 rather than compare against the string "Bearer undefined".
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Unlogged until now, which is why `posts.story_cluster` being null on every
  // row could not be distinguished from "ran and found nothing".
  const startedAt = Date.now()

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
      await logCronJob({
        jobName: 'source_detection',
        status: 'error',
        errorMessage: `fetch posts failed: ${error.message}`,
        executionTimeMs: Date.now() - startedAt,
      })
      return NextResponse.json(
        { error: 'Failed to fetch posts', detail: error.message },
        { status: 500 }
      )
    }

    if (!posts || posts.length === 0) {
      await logCronJob({
        jobName: 'source_detection',
        status: 'success',
        storiesProcessed: 0,
        errorMessage: 'no posts in the 48h window',
        executionTimeMs: Date.now() - startedAt,
      })
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

    // storiesProcessed is posts UPDATED, not posts read — a run that reads 200
    // and writes 0 is the signal that matters here.
    await logCronJob({
      jobName: 'source_detection',
      status: 'success',
      storiesProcessed: postsUpdated,
      errorMessage: `analysed=${posts.length} clusters=${clusters.size}`,
      executionTimeMs: Date.now() - startedAt,
    })
    return NextResponse.json({
      postsAnalysed: posts.length,
      clustersFound: clusters.size,
      postsUpdated,
    })
  } catch (err) {
    console.error('[source-detection] Unexpected error:', err)
    await logCronJob({
      jobName: 'source_detection',
      status: 'error',
      errorMessage: err instanceof Error ? err.message : String(err),
      executionTimeMs: Date.now() - startedAt,
    })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  return handleRequest(request)
}

export async function POST(request: NextRequest) {
  return handleRequest(request)
}
