import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

/**
 * Cron job: Stats refresh
 * Frequency: Every 6 hours
 * Task: Fetch team season stats from API-Football and cache in Supabase
 * Batch strategy: Process 4-5 teams per invocation (rotate which teams)
 */

const PL_TEAMS = [
  'Arsenal', 'Aston Villa', 'Bournemouth', 'Brentford', 'Brighton',
  'Chelsea', 'Crystal Palace', 'Everton', 'Fulham', 'Ipswich',
  'Leicester', 'Liverpool', 'Man City', 'Man United', 'Newcastle',
  'Nottingham Forest', 'Southampton', 'Spurs', 'West Ham', 'Wolves',
]

interface StandingsEntry {
  position: number
  team: { name: string }
  playedGames: number
  goalDifference: number
  points: number
}

async function getStandingsData(): Promise<StandingsEntry[] | null> {
  const apiKey = process.env.FOOTBALL_DATA_API_KEY
  if (!apiKey) return null

  try {
    const res = await fetch('https://api.football-data.org/v4/competitions/PL/standings', {
      headers: { 'X-Auth-Token': apiKey },
      next: { revalidate: 0 },
    })

    if (!res.ok) return null
    const data = await res.json()
    return data.standings?.[0]?.table ?? null
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
    const standings = await getStandingsData()

    if (!standings) {
      return NextResponse.json(
        {
          error: 'Failed to fetch standings',
          processed: 0,
        },
        { status: 500 }
      )
    }

    // Rotate which teams to process (batch 4-5 at a time)
    // Simple strategy: use current hour to determine batch
    const hour = new Date().getHours()
    const batchSize = 5
    const startIndex = (hour % Math.ceil(PL_TEAMS.length / batchSize)) * batchSize
    const teamsToProcess = PL_TEAMS.slice(startIndex, startIndex + batchSize)

    let processed = 0

    for (const teamName of teamsToProcess) {
      const entry = standings.find((s) => s.team.name === teamName)
      if (!entry) continue

      // Cache the standings data for this team
      const cacheKey = `standings:${teamName}:${new Date().getFullYear()}`
      const expiresAt = new Date(Date.now() + 6 * 60 * 60 * 1000) // 6 hours

      await supabase.from('api_cache').upsert({
        cache_key: cacheKey,
        data: {
          position: entry.position,
          team_name: entry.team.name,
          played_games: entry.playedGames,
          goal_difference: entry.goalDifference,
          points: entry.points,
        },
        cached_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
        source: 'api-football',
      })

      processed++
    }

    return NextResponse.json(
      {
        success: true,
        message: `Processed ${processed} teams`,
        processed,
      },
      { status: 200 }
    )
  } catch (err) {
    console.error('[stats-refresh] Error:', err)
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : 'Unknown error',
        processed: 0,
      },
      { status: 500 }
    )
  }
}
