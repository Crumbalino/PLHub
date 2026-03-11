import { NextRequest, NextResponse } from 'next/server'
import { fetchSingleFeed, FEEDS } from "@/lib/rss"
import { createServerClient } from '@/lib/supabase'
import { upgradeImageUrl } from '@/lib/formatting'
import { logCronJob } from '@/lib/cron-logging'
import { detectCardType, type CardType } from '@/lib/detectCardType'
import { generateSummary } from '@/lib/claude'
import Anthropic from '@anthropic-ai/sdk'

export const maxDuration = 10

async function isRelevantToPL(title: string): Promise<boolean> {
  try {
    const client = new Anthropic()
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 20,
      messages: [{
        role: 'user',
        content: `You are an editorial filter for a Premier League football news site.
Respond with only KEEP or REMOVE.

KEEP if the headline is about:
- Premier League clubs, players, managers, or matches
- Transfers involving Premier League clubs
- FA Cup, League Cup, Champions League, or Europa League involving PL clubs
- Premier League governance, finance, or rules
- England national team involving Premier League players

REMOVE if the headline is about:
- Any sport other than football
- Football outside the Premier League with no PL club involved
- Betting tips or gambling promotions
- General football news without PL connection
- Championship or lower English leagues
- Scottish football
- European football without PL clubs

Headline: "${title}"`,
      }],
    })

    const content = response.content[0]
    if (content.type === 'text') {
      return content.text.toUpperCase().includes('KEEP')
    }
    return false
  } catch (err) {
    console.error('[isRelevantToPL] AI filter error:', err)
    // On error, allow the post (be permissive)
    return true
  }
}

export async function GET(req: NextRequest) {
  const startTime = Date.now()
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = createServerClient()

    // Cleanup: delete existing bad posts
    const CLEANUP = ['NFL', 'NBA', 'boxing', 'bout', 'Katie Taylor', 'Tua Tagovailoa', 'betting tips', 'free bets', 'Almeria', 'Segunda Division', 'American football', 'Conference League']
    for (const kw of CLEANUP) {
      await supabase.from('posts').delete().ilike('title', `%${kw}%`)
    }

    // Rotate one feed per run — same pattern as YouTube cron.
    // With 5 feeds on a 15-min cron, each feed is checked every ~75 minutes.
    const runIndex = Math.floor(Date.now() / (15 * 60 * 1000))
    const feedIndex = runIndex % FEEDS.length
    const { name: feedName, posts } = await fetchSingleFeed(feedIndex)

    // Batch duplicate check: fetch all existing external_ids and urls in one query
    const externalIds = posts.map(p => p.external_id)
    const urls = posts.map(p => p.url).filter(Boolean)

    const { data: existingByExtId } = await supabase
      .from('posts')
      .select('external_id, score')
      .in('external_id', externalIds)

    const { data: existingByUrl } = await supabase
      .from('posts')
      .select('url')
      .in('url', urls)

    const existingExtIds = new Map(
      (existingByExtId ?? []).map(e => [e.external_id, e.score])
    )
    const existingUrls = new Set(
      (existingByUrl ?? []).map(e => e.url)
    )

    let inserted = 0
    let skipped = 0
    let errors = 0

    for (const post of posts) {
      // Check for duplicate by external_id
      if (existingExtIds.has(post.external_id)) {
        // Post exists — update score
        const { error } = await supabase
          .from('posts')
          .update({
            score: post.score,
            fetched_at: new Date().toISOString(),
          })
          .eq('external_id', post.external_id)

        if (error) {
          console.error('Update error:', error)
          errors++
        } else {
          skipped++
        }
        continue
      }

      // Check for duplicate by URL
      if (post.url && existingUrls.has(post.url)) {
        skipped++
        continue
      }

      // Detect card type using deterministic patterns
      let detectedType = detectCardType(post.title, post.source)

      // Try to get card_type_hint from Claude if we have sufficient content
      let summary: string | null = null
      let generatedHeadline: string | null = null
      const contentLength = (post.content ?? '').trim().length
      if (contentLength >= 300) {
        try {
          const summaryData = await generateSummary(post.title, post.content)
          summary = summaryData.summary
          generatedHeadline = summaryData.hook

          // Upgrade 'story' to 'lol' if Claude detects it
          if (detectedType === 'story' && summaryData.cardTypeHint === 'lol') {
            detectedType = 'lol'
          }
        } catch (err) {
          console.error('[RSS ingest] generateSummary error:', err)
          // Fall back to deterministic detection if Claude fails
        }
      }

      // Insert with card_type and optionally generated summary/headline
      const { error } = await supabase.from('posts').insert({
        external_id: post.external_id,
        title: post.title,
        url: post.url,
        content: post.content,
        summary,
        summary_hook: generatedHeadline,
        source: post.source,
        club_slug: post.club_slug,
        author: post.author,
        score: post.score,
        subreddit: post.subreddit,
        image_url: upgradeImageUrl(post.image_url) || null,
        published_at: post.published_at,
        card_type: detectedType,
        generated_headline: generatedHeadline,
      })

      if (error) {
        console.error('Insert error:', error)
        errors++
      } else {
        inserted++
      }
    }

    const executionTime = Date.now() - startTime
    await logCronJob({
      jobName: 'rss_fetch',
      status: 'success',
      storiesProcessed: inserted,
      executionTimeMs: executionTime,
    })

    return NextResponse.json({
      success: true,
      feed: feedName,
      feedIndex,
      total: posts.length,
      inserted,
      skipped,
      errors,
    })
  } catch (err) {
    const executionTime = Date.now() - startTime
    const errorMessage = err instanceof Error ? err.message : String(err)
    console.error('RSS cron error:', err)

    await logCronJob({
      jobName: 'rss_fetch',
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
