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
      // If no posts without summaries, try to fill in missing hooks
      const hookResult = await backfillMissingHooks(supabase, limit)
      // If we backfilled hooks and there are no more, try significance scores
      if (hookResult.status === 200) {
        const hookData = await hookResult.json()
        if (hookData.processed === 0) {
          return await backfillMissingSignificance(supabase, limit)
        }
      }
      return hookResult
    }

    let updated = 0
    let failed = 0

    for (const post of posts) {
      const { summary, hook, significance } = await generateSummary(post.title, post.content)

      if (!summary) {
        failed++
        continue
      }

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

async function backfillMissingHooks(supabase: ReturnType<typeof createServerClient>, limit: number) {
  // Fetch posts that have summaries but no hook yet
  const { data: postsWithoutHooks, error: fetchError } = await supabase
    .from('posts')
    .select('id, title, content, summary')
    .not('summary', 'is', null)
    .is('summary_hook', null)
    .limit(limit)

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 })
  }

  if (!postsWithoutHooks || postsWithoutHooks.length === 0) {
    return NextResponse.json({ success: true, processed: 0, message: 'All posts have hooks.' })
  }

  let updated = 0
  let failed = 0

  for (const post of postsWithoutHooks) {
    const { hook } = await generateSummary(post.title, post.content)

    if (!hook) {
      failed++
      continue
    }

    const { error: updateError } = await supabase
      .from('posts')
      .update({ summary_hook: hook })
      .eq('id', post.id)

    if (updateError) {
      console.error(`Failed to update hook for post ${post.id}:`, updateError)
      failed++
    } else {
      updated++
    }
  }

  // Count remaining posts without hooks
  const { count: remaining } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true })
    .not('summary', 'is', null)
    .is('summary_hook', null)

  return NextResponse.json({
    success: true,
    processed: postsWithoutHooks.length,
    updated,
    failed,
    remaining: remaining ?? 0,
    message: 'Backfilling missing hooks',
  })
}

async function backfillMissingSignificance(supabase: ReturnType<typeof createServerClient>, limit: number) {
  // Fetch posts that have summaries but no significance score yet
  const { data: postsWithoutSignificance, error: fetchError } = await supabase
    .from('posts')
    .select('id, title, content, summary')
    .not('summary', 'is', null)
    .is('score_significance', null)
    .limit(limit)

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 })
  }

  if (!postsWithoutSignificance || postsWithoutSignificance.length === 0) {
    return NextResponse.json({ success: true, processed: 0, message: 'All posts have significance scores.' })
  }

  let updated = 0
  let failed = 0

  for (const post of postsWithoutSignificance) {
    const { significance } = await generateSummary(post.title, post.content)

    if (significance === null || significance === undefined) {
      failed++
      continue
    }

    const { error: updateError } = await supabase
      .from('posts')
      .update({ score_significance: significance })
      .eq('id', post.id)

    if (updateError) {
      console.error(`Failed to update significance for post ${post.id}:`, updateError)
      failed++
    } else {
      updated++
    }
  }

  // Count remaining posts without significance
  const { count: remaining } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true })
    .not('summary', 'is', null)
    .is('score_significance', null)

  return NextResponse.json({
    success: true,
    processed: postsWithoutSignificance.length,
    updated,
    failed,
    remaining: remaining ?? 0,
    message: 'Backfilling missing significance scores',
  })
}
