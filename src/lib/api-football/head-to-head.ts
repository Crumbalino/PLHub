/**
 * Head to Head Endpoint
 * GET /fixtures/headtohead?h2h={team1_id}-{team2_id}&last=10
 * Cache TTL: 24 hours
 * Calls per day: ~2 max (only for club page pre-match)
 */

import { fetchFromApiFootball } from './client'
import { getCachedOrFetch } from './cache'

const CACHE_TTL = 86400 // 24 hours

export interface H2HFixture {
  id: number
  date: string
  teams: {
    home: {
      id: number
      name: string
      logo: string
      winner: boolean | null
    }
    away: {
      id: number
      name: string
      logo: string
      winner: boolean | null
    }
  }
  goals: {
    home: number | null
    away: number | null
  }
  score: {
    fulltime: {
      home: number | null
      away: number | null
    }
  }
  status: {
    short: string
    long: string
  }
}

export interface H2HResponse {
  fixture: {
    id: number
    date: string
    timezone: string
    teams: {
      home: {
        id: number
        name: string
        logo: string
      }
      away: {
        id: number
        name: string
        logo: string
      }
    }
  }
  results: H2HFixture[]
  statistics: {
    team1: { id: number; name: string; wins: number; draws: number; losses: number }
    team2: { id: number; name: string; wins: number; draws: number; losses: number }
  }
}

/**
 * Get head-to-head history between two teams
 * @param team1Id First team ID
 * @param team2Id Second team ID
 * @param last Number of previous meetings to retrieve (default: 10)
 * @returns H2H data including last matches and overall record
 */
export async function getH2H(
  team1Id: number,
  team2Id: number,
  last: number = 10
): Promise<H2HResponse> {
  const cacheKey = `h2h:${team1Id}-${team2Id}:last${last}`

  return getCachedOrFetch(cacheKey, async () => {
    const data = await fetchFromApiFootball<H2HResponse>('/fixtures/headtohead', {
      h2h: `${team1Id}-${team2Id}`,
      last,
    })
    return data
  }, CACHE_TTL)
}

/**
 * Helper: Get head-to-head summary stats
 */
export function extractH2HStats(response: H2HResponse) {
  const { statistics, results } = response

  return {
    team1: {
      id: statistics.team1.id,
      name: statistics.team1.name,
      wins: statistics.team1.wins,
      draws: statistics.team1.draws,
      losses: statistics.team1.losses,
    },
    team2: {
      id: statistics.team2.id,
      name: statistics.team2.name,
      wins: statistics.team2.wins,
      draws: statistics.team2.draws,
      losses: statistics.team2.losses,
    },
    recentMatches: results,
    matchCount: results.length,
  }
}

/**
 * Determine head-to-head advantage (for context generation)
 * @returns "dominant", "slight_edge", "balanced", or "underdog"
 */
export function getH2HAdvantage(
  team1Wins: number,
  team2Wins: number,
  team1Losses: number,
  team2Losses: number
): 'dominant' | 'slight_edge' | 'balanced' | 'underdog' {
  const winDiff = team1Wins - team2Wins
  const lossDiff = team1Losses - team2Losses

  if (winDiff > 3 && lossDiff < -1) return 'dominant'
  if (winDiff > 1 && lossDiff <= 0) return 'slight_edge'
  if (winDiff <= 1 && lossDiff >= -1) return 'balanced'
  return 'underdog'
}
