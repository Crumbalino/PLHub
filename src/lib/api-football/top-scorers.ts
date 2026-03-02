/**
 * Top Scorers Endpoint
 * GET /players/topscorers?league=39&season=2025
 * Cache TTL: 12 hours
 * Calls per day: ~2
 */

import { fetchFromApiFootball } from './client'
import { getCachedOrFetch } from './cache'

const LEAGUE_ID = 39
const SEASON = 2025
const CACHE_TTL = 43200 // 12 hours

export interface TopScorer {
  player: {
    id: number
    name: string
    firstname: string
    lastname: string
    age: number
    nationality: string
    height: string
    weight: string
    injured: boolean
    photo: string
  }
  statistics: Array<{
    team: {
      id: number
      name: string
      logo: string
    }
    league: {
      id: number
      name: string
      country: string
      logo: string
      flag: string
      season: number
      standings: number
    }
    games: {
      appearances: number
      lineups: number
      minutes: number
      number: number | null
      position: string
      rating: string | null
      captain: boolean
    }
    substitutes: {
      in: number
      out: number
      bench: number
    }
    shots: {
      total: number
      on: number
    }
    goals: {
      total: number
      conceded: number
      assists: number | null
      saves: number | null
    }
    passes: {
      total: number
      key: number
      accuracy: string | null
    }
    tackles: {
      total: number
      blocks: number
      interceptions: number
    }
    duels: {
      total: number
      won: number
    }
    dribbles: {
      attempts: number
      success: number
      nutmegs: number | null
    }
    fouls: {
      drawn: number
      committed: number
    }
    cards: {
      yellow: number
      yellowred: number
      red: number
    }
    penalty: {
      won: number | null
      commited: number | null
      scored: number
      missed: number
    }
  }>
}

export interface TopScorersResponse {
  scorers: TopScorer[]
}

/**
 * Get top scorers for the season
 * Returns top 20 with full statistics including assists
 */
export async function getTopScorers(): Promise<TopScorer[]> {
  const cacheKey = `topscorers:${LEAGUE_ID}:${SEASON}`

  return getCachedOrFetch(cacheKey, async () => {
    const data = await fetchFromApiFootball<TopScorersResponse>(
      '/players/topscorers',
      {
        league: LEAGUE_ID,
        season: SEASON,
      }
    )
    return data.scorers
  }, CACHE_TTL)
}

/**
 * Get top N scorers
 */
export async function getTopNScorers(n: number = 10): Promise<TopScorer[]> {
  const scorers = await getTopScorers()
  return scorers.slice(0, n)
}

/**
 * Get a specific player's top scorer stats
 */
export async function getPlayerScorersStats(
  playerId: number
): Promise<TopScorer | null> {
  const scorers = await getTopScorers()
  return scorers.find((s) => s.player.id === playerId) || null
}

/**
 * Helper: Extract commonly used scorer stats
 */
export function extractScorerStats(player: TopScorer) {
  const stats = player.statistics[0]
  if (!stats) return null

  return {
    playerName: player.player.name,
    playerId: player.player.id,
    teamId: stats.team.id,
    teamName: stats.team.name,
    goals: stats.goals.total,
    assists: stats.goals.assists ?? 0,
    appearances: stats.games.appearances,
    minutes: stats.games.minutes,
    shotsOnTarget: stats.shots.on,
    position: stats.games.position,
    rating: stats.games.rating ? parseFloat(stats.games.rating) : null,
  }
}
