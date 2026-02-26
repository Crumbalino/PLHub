import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export const maxDuration = 60

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
  const cleanupSecret = process.env.CLEANUP_SECRET

  if (!cleanupSecret || authHeader !== `Bearer ${cleanupSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = createServerClient()
    let deletedCount = 0

    // Delete non-PL content
    for (const keyword of NON_PL) {
      const { data: toDelete, error: selectError } = await supabase
        .from('posts')
        .select('id')
        .ilike('title', `%${keyword}%`)

      if (!selectError && toDelete) {
        const { count, error: deleteError } = await supabase
          .from('posts')
          .delete()
          .ilike('title', `%${keyword}%`)

        if (!deleteError) {
          deletedCount += count || 0
          console.log(`Deleted posts matching "${keyword}": ${count || 0}`)
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Cleanup completed',
      deletedNonPLCount: deletedCount,
    })
  } catch (err) {
    console.error('Cleanup error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
