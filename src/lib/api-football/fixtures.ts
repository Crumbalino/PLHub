/**
 * Fixtures Endpoint
 * GET /fixtures?league=39&season=2025&from=YYYY-MM-DD&to=YYYY-MM-DD
 * Cache TTL: 5 minutes on match days, 6 hours otherwise
 * Calls per day: ~10 on match days, ~4 on quiet days
 */

import { fetchFromApiFootball } from './client'
import { getCachedOrFetch } from './cache'

const LEAGUE_ID = 2021  // Premier League (not 39, which is Championship)
const SEASON = 2025

export interface FixtureTeam {
  id: number
  name: string
  logo: string
  winner: boolean | null
}

export interface Fixture {
  id: number
  referee: string | null
  timezone: string
  date: string
  timestamp: number
  week: number
  status: {
    long: string
    short: string
    elapsed: number | null
  }
  league: {
    id: number
    name: string
    country: string
    logo: string
    flag: string
    season: number
    round: string
  }
  teams: {
    home: FixtureTeam
    away: FixtureTeam
  }
  goals: {
    home: number | null
    away: number | null
  }
  score: {
    halftime: {
      home: number | null
      away: number | null
    }
    fulltime: {
      home: number | null
      away: number | null
    }
    penalty: {
      home: number | null
      away: number | null
    }
  }
  events?: unknown[]
  lineups?: unknown[]
  statistics?: unknown[]
  players?: unknown[]
}

/**
 * Get fixtures in a date range
 * @param from Start date (YYYY-MM-DD)
 * @param to End date (YYYY-MM-DD)
 * @returns Array of fixtures
 */
export async function getFixtures(from: string, to: string): Promise<Fixture[]> {
  // Use shorter TTL (5 min) for dates near today, longer (6h) for future dates
  const today = new Date().toISOString().split('T')[0]
  const isNearToday = from <= today && to >= today
  const ttl = isNearToday ? 300 : 21600 // 5 min vs 6 hours

  const cacheKey = `fixtures:${LEAGUE_ID}:${SEASON}:${from}:${to}`

  return getCachedOrFetch(cacheKey, async () => {
    const data = await fetchFromApiFootball<{ fixtures: Fixture[] }>(
      '/fixtures',
      {
        league: LEAGUE_ID,
        season: SEASON,
        from,
        to,
      }
    )
    return data.fixtures
  }, ttl)
}

/**
 * Get today's fixtures
 */
export async function getTodaysMatches(): Promise<Fixture[]> {
  const today = new Date().toISOString().split('T')[0]
  return getFixtures(today, today)
}

/**
 * Get next matchday fixtures
 * Fetches fixtures from today to 7 days ahead, then groups by round
 * Returns all matches from the first round found
 */
export async function getNextMatchday(): Promise<Fixture[]> {
  const today = new Date().toISOString().split('T')[0]
  const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0]

  const fixtures = await getFixtures(today, nextWeek)

  if (fixtures.length === 0) return []

  // Find first round with matches
  const firstRound = fixtures[0]?.league.round
  if (!firstRound) return []

  // Return all matches from that round
  return fixtures.filter((f) => f.league.round === firstRound)
}

/**
 * Get fixtures for a specific team
 */
export async function getTeamFixtures(
  teamId: number,
  from: string,
  to: string
): Promise<Fixture[]> {
  const allFixtures = await getFixtures(from, to)
  return allFixtures.filter(
    (f) => f.teams.home.id === teamId || f.teams.away.id === teamId
  )
}

/**
 * Get a specific fixture by ID
 */
export async function getFixtureById(fixtureId: number): Promise<Fixture | null> {
  const today = new Date().toISOString().split('T')[0]
  // Try today's matches first, then expand search if needed
  const matches = await getTodaysMatches()
  return matches.find((f) => f.id === fixtureId) || null
}
