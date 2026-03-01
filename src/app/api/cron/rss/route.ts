import { NextRequest, NextResponse } from 'next/server'
import { fetchSingleFeed, FEEDS } from "@/lib/rss"
import { createServerClient } from '@/lib/supabase'
import { upgradeImageUrl } from '@/lib/formatting'

export const maxDuration = 10

export async function GET(req: NextRequest) {
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

      // Insert without summary — backfill-summaries cron will generate them
      const { error } = await supabase.from('posts').insert({
        external_id: post.external_id,
        title: post.title,
        url: post.url,
        content: post.content,
        summary: null,
        source: post.source,
        club_slug: post.club_slug,
        author: post.author,
        score: post.score,
        subreddit: post.subreddit,
        image_url: upgradeImageUrl(post.image_url) || null,
        published_at: post.published_at,
      })

      if (error) {
        console.error('Insert error:', error)
        errors++
      } else {
        inserted++
      }
    }

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
    console.error('RSS cron error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
