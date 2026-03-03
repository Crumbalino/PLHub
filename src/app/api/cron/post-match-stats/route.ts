import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

/**
 * Cron job: Post-match stats
 * Frequency: Once daily at 23:00 UTC
 * Task: Fetch completed match stats from API-Football and cache them (immutable)
 */

interface Match {
  id: number
  status: string
  homeTeam: { name: string }
  awayTeam: { name: string }
  utcDate: string
  score: {
    fullTime: {
      home: number | null
      away: number | null
    }
  }
}

async function getCompletedMatches(): Promise<Match[] | null> {
  const apiKey = process.env.FOOTBALL_DATA_API_KEY
  if (!apiKey) return null

  try {
    // Fetch matches from today only
    const today = new Date().toISOString().split('T')[0]

    const res = await fetch(
      `https://api.football-data.org/v4/competitions/PL/matches?dateFrom=${today}&dateTo=${today}&status=FINISHED`,
      {
        headers: { 'X-Auth-Token': apiKey },
        next: { revalidate: 0 },
      }
    )

    if (!res.ok) return null
    const data = await res.json()
    return data.matches ?? null
  } catch {
    return null
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  // Validate cron secret
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = getSupabase()
    const completedMatches = await getCompletedMatches()

    if (!completedMatches || completedMatches.length === 0) {
      return NextResponse.json(
        {
          success: true,
          message: 'No completed matches today',
          processed: 0,
        },
        { status: 200 }
      )
    }

    let processed = 0

    for (const match of completedMatches) {
      // Cache completed match stats as permanent (immutable)
      // No TTL expiration for completed matches
      const cacheKey = `match:${match.id}:final`

      await supabase.from('api_cache').upsert({
        cache_key: cacheKey,
        data: {
          match_id: match.id,
          home_team: match.homeTeam.name,
          away_team: match.awayTeam.name,
          home_score: match.score.fullTime.home,
          away_score: match.score.fullTime.away,
          match_date: match.utcDate,
          is_complete: true,
        },
        cached_at: new Date().toISOString(),
        expires_at: new Date('2099-12-31').toISOString(), // Far future = permanent
        source: 'api-football',
      })

      processed++
    }

    return NextResponse.json(
      {
        success: true,
        message: `Cached ${processed} completed matches`,
        processed,
      },
      { status: 200 }
    )
  } catch (err) {
    console.error('[post-match-stats] Error:', err)
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : 'Unknown error',
        processed: 0,
      },
      { status: 500 }
    )
  }
}
