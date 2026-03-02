/**
 * Standings Endpoint
 * GET /standings?league=39&season=2025
 * Cache TTL: 6 hours (21600 seconds)
 * Calls per day: ~4
 */

import { fetchFromApiFootball } from './client'
import { getCachedOrFetch } from './cache'

const LEAGUE_ID = 39
const SEASON = 2025
const CACHE_TTL = 21600 // 6 hours

interface TeamStanding {
  rank: number
  team: {
    id: number
    name: string
    logo: string
  }
  points: number
  goalsDiff: number
  group: string | null
  form: string
  status: string
  description: string
  played: number
  win: number
  draw: number
  lose: number
  goals: {
    for: number
    against: number
  }
  all?: {
    played: number
    win: number
    draw: number
    lose: number
    goals: {
      for: number
      against: number
    }
  }
  home?: {
    played: number
    win: number
    draw: number
    lose: number
    goals: {
      for: number
      against: number
    }
  }
  away?: {
    played: number
    win: number
    draw: number
    lose: number
    goals: {
      for: number
      against: number
    }
  }
}

interface StandingsResponse {
  league: {
    id: number
    name: string
    country: string
    logo: string
    flag: string
    season: number
    standings: TeamStanding[][]
  }
}

/**
 * Get Premier League standings
 * Returns full 20-team table with points, form, and detailed stats
 */
export async function getStandings(): Promise<StandingsResponse> {
  const cacheKey = `standings:${LEAGUE_ID}:${SEASON}`

  return getCachedOrFetch(cacheKey, async () => {
    const data = await fetchFromApiFootball<StandingsResponse>('/standings', {
      league: LEAGUE_ID,
      season: SEASON,
    })
    return data
  }, CACHE_TTL)
}

/**
 * Get standings table (just the standings array)
 * Convenience wrapper that extracts the table from the full response
 */
export async function getStandingsTable(): Promise<TeamStanding[]> {
  const response = await getStandings()
  // API returns standings as array of arrays (one per group, usually just one for PL)
  return response.league.standings[0] || []
}

/**
 * Get a specific team's standing
 */
export async function getTeamStanding(teamId: number): Promise<TeamStanding | null> {
  const table = await getStandingsTable()
  return table.find((team) => team.team.id === teamId) || null
}
