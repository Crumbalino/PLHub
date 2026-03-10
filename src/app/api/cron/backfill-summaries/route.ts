import { NextRequest, NextResponse } from 'next/server'
import { generateSummary } from '@/lib/claude'
import { scrapeArticle } from '@/lib/scraper'
import { createServerClient } from '@/lib/supabase'
import { logCronJob } from '@/lib/cron-logging'

export const maxDuration = 10

/**
 * Backfill AI summaries for posts.
 * Scrapes the full article URL before calling generateSummary.
 * If the article cannot be scraped or returns less than 300 chars, skip — do not generate from snippet.
 * Processes 2 posts per run to stay within Vercel Hobby 10s limit.
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

    // Fetch 2 posts per run — scraping adds ~2-3s each, 2 is the safe limit
    const { data: posts, error: fetchError } = await supabase
      .from('posts')
      .select('id, title, url')
      .is('summary', null)
      .not('url', 'is', null)
      .gte('published_at', new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString())
      .order('score', { ascending: false })
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

    if (!posts || posts.length === 0) {
      return NextResponse.json({
        success: true,
        processed: 0,
        updated: 0,
        message: 'No posts need summaries',
      })
    }

    let updated = 0
    let skipped = 0
    let failed = 0

    for (const post of posts) {
      try {
        // Scrape full article — no snippet fallback
        const articleContent = await scrapeArticle(post.url)

        if (!articleContent) {
          console.log(`[backfill-summaries] Skipped post ${post.id} — article could not be scraped`)
          skipped++
          continue
        }

        const result = await generateSummary(post.title, articleContent)

        if (!result.summary) {
          console.log(`[backfill-summaries] Skipped post ${post.id} — summary generation returned null`)
          skipped++
          continue
        }

        const updateData: Record<string, string | number | null> = {
          summary: result.summary,
        }
        if (result.hook) updateData.summary_hook = result.hook
        if (result.significance !== null && result.significance !== undefined) {
          updateData.score_significance = result.significance
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
        console.error(`[backfill-summaries] Unexpected error on post ${post.id}:`, err)
        failed++
      }
    }

    let remaining = 0
    try {
      const { count } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .is('summary', null)
      remaining = count ?? 0
    } catch {
      // non-fatal
    }

    const executionTime = Date.now() - startTime
    try {
      await logCronJob({
        jobName: 'backfill_summaries',
        status: 'success',
        storiesProcessed: updated,
        executionTimeMs: executionTime,
      })
    } catch {
      // non-fatal
    }

    return NextResponse.json({
      success: true,
      processed: posts.length,
      updated,
      skipped,
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
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
