import { NextRequest, NextResponse } from 'next/server'
import { generateSummary } from '@/lib/claude'
import { createServerClient } from '@/lib/supabase'
import { logCronJob } from '@/lib/cron-logging'

export const maxDuration = 10

/**
 * Backfill AI summaries for posts.
 * Uses rotation pattern: process only 2-3 posts per 15-min cron run.
 * Vercel Hobby plan = 10s limit. 1 Anthropic call ≈ 3-4s, so 2-3 posts is the safe limit.
 *
 * With 60+ unsummarized posts and a 15-min cron:
 * - 2 posts/run × 4 runs/hour = 8 posts/hour
 * - Complete backfill in ~8 hours
 *
 * Posts are processed newest first (recent posts get summaries faster).
 */
export async function GET(req: NextRequest) {
  const startTime = Date.now()
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = createServerClient()

    // Fetch only 3 posts per run (strict limit for Hobby plan)
    // Order by fetched_at DESC so newest posts get summaries first
    const { data: posts, error: fetchError } = await supabase
      .from('posts')
      .select('id, title, content, fetched_at')
      .is('summary', null)
      .gte('published_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('fetched_at', { ascending: false })
      .limit(3)

    if (fetchError) {
      const executionTime = Date.now() - startTime
      await logCronJob({
        jobName: 'backfill_summaries',
        status: 'error',
        errorMessage: fetchError.message,
        executionTimeMs: executionTime,
      })
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    // No posts to process
    if (!posts || posts.length === 0) {
      return NextResponse.json({
        success: true,
        processed: 0,
        updated: 0,
        message: 'No posts need summaries',
      })
    }

    let updated = 0
    let failed = 0

    // Process each post sequentially
    for (const post of posts) {
      try {
        let summary: string | null = null
        let hook: string | null = null
        let significance: number | null = null
        try {
          const result = await generateSummary(post.title, post.content)
          summary = result.summary
          hook = result.hook
          significance = result.significance
        } catch (summarizeErr) {
          console.error(`[backfill-summaries] Anthropic API error for post ${post.id}:`, summarizeErr instanceof Error ? summarizeErr.message : String(summarizeErr))
          failed++
          continue
        }

        if (!summary) {
          failed++
          continue
        }

        // Build update object with all available fields
        const updateData: Record<string, string | number | null> = { summary }
        if (hook) {
          updateData.summary_hook = hook
        }
        if (significance !== null && significance !== undefined) {
          updateData.score_significance = significance
        }

        const { error: updateError } = await supabase
          .from('posts')
          .update(updateData)
          .eq('id', post.id)

        if (updateError) {
          console.error(`[backfill-summaries] Failed to update post ${post.id}:`, updateError)
          failed++
        } else {
          updated++
        }
      } catch (err) {
        console.error(`[backfill-summaries] Unexpected error processing post ${post.id}:`, err)
        failed++
      }
    }

    // Count remaining posts without summaries (don't let this fail the whole endpoint)
    let remaining = 0
    try {
      const { count } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .is('summary', null)
      remaining = count ?? 0
    } catch (countErr) {
      console.error('[backfill-summaries] Failed to count remaining posts:', countErr)
      // Don't fail the endpoint if we can't get the count
    }

    const executionTime = Date.now() - startTime
    try {
      await logCronJob({
        jobName: 'backfill_summaries',
        status: 'success',
        storiesProcessed: updated,
        executionTimeMs: executionTime,
      })
    } catch (logErr) {
      console.error('[backfill-summaries] Failed to log cron job:', logErr)
      // Don't fail the endpoint if logging fails
    }

    return NextResponse.json({
      success: true,
      processed: posts.length,
      updated,
      failed,
      remaining,
    })
  } catch (err) {
    const executionTime = Date.now() - startTime
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    console.error('[backfill-summaries] Error:', err)

    await logCronJob({
      jobName: 'backfill_summaries',
      status: 'error',
      errorMessage,
      executionTimeMs: executionTime,
    })

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
