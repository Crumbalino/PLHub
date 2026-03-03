import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'
import { logCronJob } from '@/lib/cron-logging'

export const dynamic = 'force-dynamic'

/**
 * Cron job: Fixtures refresh
 * Frequency: Every 15 minutes on match days, otherwise every 2 hours
 * Task: Fetch current matchday from Football Data API and cache it
 */

interface Match {
  id: number
  season: { currentMatchday: number }
}

interface ApiResponse {
  matches: Match[]
  season?: { currentMatchday: number }
}

async function getCurrentMatchday(): Promise<number | null> {
  const apiKey = process.env.FOOTBALL_DATA_API_KEY
  if (!apiKey) return null

  try {
    const res = await fetch('https://api.football-data.org/v4/competitions/PL/matches?limit=1', {
      headers: { 'X-Auth-Token': apiKey },
      next: { revalidate: 0 },
    })

    if (!res.ok) return null
    const data: ApiResponse = await res.json()

    // Current matchday is in the season object
    return data.season?.currentMatchday ?? null
  } catch {
    return null
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now()
  // Validate cron secret
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = getSupabase()
    const matchday = await getCurrentMatchday()

    if (matchday === null) {
      const executionTime = Date.now() - startTime
      const errorMessage = 'Failed to fetch current matchday'
      console.error('[fixtures-refresh]', errorMessage)

      await logCronJob({
        jobName: 'fixtures_refresh',
        status: 'error',
        errorMessage,
        executionTimeMs: executionTime,
      })

      return NextResponse.json(
        {
          error: errorMessage,
          matchday: null,
        },
        { status: 500 }
      )
    }

    // Cache the current matchday (2-hour TTL for frequent updates)
    const cacheKey = 'current_matchday:pl:2025'
    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000) // 2 hours

    await supabase.from('api_cache').upsert({
      cache_key: cacheKey,
      data: { matchday },
      cached_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString(),
      source: 'football-data-org',
    })

    const executionTime = Date.now() - startTime
    await logCronJob({
      jobName: 'fixtures_refresh',
      status: 'success',
      executionTimeMs: executionTime,
    })

    return NextResponse.json(
      {
        success: true,
        matchday,
        message: `Cached matchday ${matchday}`,
      },
      { status: 200 }
    )
  } catch (err) {
    const executionTime = Date.now() - startTime
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    console.error('[fixtures-refresh] Error:', err)

    await logCronJob({
      jobName: 'fixtures_refresh',
      status: 'error',
      errorMessage,
      executionTimeMs: executionTime,
    })

    return NextResponse.json(
      {
        error: errorMessage,
        matchday: null,
      },
      { status: 500 }
    )
  }
}
