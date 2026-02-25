import { NextRequest, NextResponse } from 'next/server'
import { fetchAllRedditPosts } from '@/lib/reddit'
import { generateSummary, delay } from '@/lib/claude'
import { createServerClient } from '@/lib/supabase'

export const maxDuration = 300

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = createServerClient()
    const posts = await fetchAllRedditPosts()

    let inserted = 0
    let skipped = 0
    let errors = 0

    for (const post of posts) {
      // Check for duplicate
      const { data: existing } = await supabase
        .from('posts')
        .select('id, score')
        .eq('external_id', post.external_id)
        .single()

      if (existing) {
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

      // Generate AI summary for new posts
      const summary = await generateSummary(post.title, post.content)
      await delay(200) // Rate limiting between Claude calls

      const { error } = await supabase.from('posts').insert({
        external_id: post.external_id,
        title: post.title,
        url: post.url,
        content: post.content,
        summary,
        source: post.source,
        club_slug: post.club_slug,
        author: post.author,
        score: post.score,
        subreddit: post.subreddit,
        image_url: post.image_url,
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
      total: posts.length,
      inserted,
      skipped,
      errors,
    })
  } catch (err) {
    console.error('Reddit cron error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
