import { NextRequest, NextResponse } from 'next/server'
import { generateSummary, delay } from '@/lib/claude'
import { createServerClient } from '@/lib/supabase'

export const maxDuration = 10

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  // Hobby plan = 10s limit. 1 Anthropic call ≈ 3-4s, so max 2 per run.
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '2', 10), 5)

  try {
    const supabase = createServerClient()

    // Fetch a batch of posts that have no summary yet
    const { data: posts, error: fetchError } = await supabase
      .from('posts')
      .select('id, title, content')
      .is('summary', null)
      .limit(limit)

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    if (!posts || posts.length === 0) {
      return NextResponse.json({ success: true, processed: 0, message: 'All posts have summaries.' })
    }

    let updated = 0
    let failed = 0

    for (const post of posts) {
      const summary = await generateSummary(post.title, post.content)

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
    }

    // Count remaining nulls so caller knows if more batches are needed
    const { count: remaining } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .is('summary', null)

    return NextResponse.json({
      success: true,
      processed: posts.length,
      updated,
      failed,
      remaining: remaining ?? 0,
    })
  } catch (err) {
    console.error('Backfill error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
