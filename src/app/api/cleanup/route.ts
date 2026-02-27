import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export const maxDuration = 10

const NON_PL = [
  'NFL', 'NBA', 'boxing', 'bout', 'Katie Taylor', 'Tom Brady', 'Raiders', 'AFC West',
  'Tua Tagovailoa', 'betting tips', 'free bets', 'odds boost', 'accumulator', 'best football bets',
  'Almeria', 'Segunda Division', 'American football', 'Conference League', 'Europa Conference',
  'Champions League cash', 'World Cup', 'Carabao Cup', 'Celtic', 'Rangers', 'Scottish',
  'Championship', 'League One', 'League Two', 'EFL', 'Plymouth', 'Mexico Open',
  'tennis', 'golf', 'cricket', 'rugby', 'MMA', 'UFC', 'Fenerbahce', 'Zrinjski',
  'betting offer', 'Bet £10', 'free bets'
]

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const cleanupSecret = process.env.CRON_SECRET

  if (!cleanupSecret || authHeader !== `Bearer ${cleanupSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = createServerClient()
    let deletedNonPLCount = 0
    let duplicatesRemoved = 0

    // TASK 1: Delete non-PL content
    for (const keyword of NON_PL) {
      const { count, error } = await supabase
        .from('posts')
        .delete()
        .ilike('title', `%${keyword}%`)

      if (!error) {
        deletedNonPLCount += count || 0
        console.log(`Deleted posts matching "${keyword}": ${count || 0}`)
      }
    }

    // TASK 2: Deduplicate posts by URL
    const { data: allPosts, error: fetchError } = await supabase
      .from('posts')
      .select('id, url, created_at')
      .order('created_at', { ascending: false })

    if (!fetchError && allPosts) {
      const seen = new Map<string, string>()
      const dupeIds: string[] = []

      for (const post of allPosts) {
        if (!post.url) continue
        if (seen.has(post.url)) {
          dupeIds.push(post.id)
        } else {
          seen.set(post.url, post.id)
        }
      }

      // Delete duplicates in batches of 100
      if (dupeIds.length > 0) {
        for (let i = 0; i < dupeIds.length; i += 100) {
          const batch = dupeIds.slice(i, i + 100)
          const { count, error: deleteError } = await supabase
            .from('posts')
            .delete()
            .in('id', batch)

          if (!deleteError) {
            duplicatesRemoved += count || 0
          }
        }
        console.log(`Removed ${duplicatesRemoved} duplicate posts`)
      }
    }

    // TASK 5: Note about unique constraint
    const sqlStatement = 'CREATE UNIQUE INDEX IF NOT EXISTS posts_url_unique ON posts (url);'

    return NextResponse.json({
      success: true,
      deleted_non_pl: deletedNonPLCount,
      duplicates_removed: duplicatesRemoved,
      note: 'Database cleanup completed',
      next_step: `Run this in Supabase SQL editor to prevent future duplicates: ${sqlStatement}`,
    })
  } catch (err) {
    console.error('Cleanup error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
