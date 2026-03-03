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

    // Fetch only 2 posts per run (strict limit for Hobby plan)
    // Order by created_at DESC so newest posts get summaries first
    const { data: posts, error: fetchError } = await supabase
      .from('posts')
      .select('id, title, content, created_at')
      .is('summary', null)
      .order('created_at', { ascending: false })
      .limit(2)

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
        const { summary } = await generateSummary(post.title, post.content)

        if (!summary) {
          failed++
          continue
        }

        const { error: updateError } = await supabase
          .from('posts')
          .update({ summary })
          .eq('id', post.id)

        if (updateError) {
          console.error(`Failed to update post ${post.id}:`, updateError)
          failed++
        } else {
          updated++
        }
      } catch (err) {
        console.error(`Error processing post ${post.id}:`, err)
        failed++
      }
    }

    // Count remaining posts without summaries
    const { count: remaining } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .is('summary', null)

    const executionTime = Date.now() - startTime
    await logCronJob({
      jobName: 'backfill_summaries',
      status: 'success',
      storiesProcessed: updated,
      executionTimeMs: executionTime,
    })

    return NextResponse.json({
      success: true,
      processed: posts.length,
      updated,
      failed,
      remaining: remaining ?? 0,
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
