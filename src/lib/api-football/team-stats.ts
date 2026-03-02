/**
 * Team Statistics Endpoint
 * GET /teams/statistics?league=39&season=2025&team={team_id}
 * Cache TTL: 12 hours
 * Calls per day: ~2 (only refresh as needed)
 */

import { fetchFromApiFootball } from './client'
import { getCachedOrFetch } from './cache'

const LEAGUE_ID = 39
const SEASON = 2025
const CACHE_TTL = 43200 // 12 hours

export interface TeamStatsResponse {
  team: {
    id: number
    name: string
    logo: string
  }
  statistics: {
    played: {
      home: number
      away: number
      total: number
    }
    wins: {
      home: number
      away: number
      total: number
    }
    draws: {
      home: number
      away: number
      total: number
    }
    loses: {
      home: number
      away: number
      total: number
    }
    goals: {
      for: {
        total: number
        average: string
        minute: {
          '0-15': number | null
          '16-30': number | null
          '31-45': number | null
          '46-60': number | null
          '61-75': number | null
          '76-90': number | null
          '91-105': number | null
          '106-120': number | null
        }
      }
      against: {
        total: number
        average: string
        minute: {
          '0-15': number | null
          '16-30': number | null
          '31-45': number | null
          '46-60': number | null
          '61-75': number | null
          '76-90': number | null
          '91-105': number | null
          '106-120': number | null
        }
      }
    }
    biggest: {
      streak: {
        wins: number
        draws: number
        loses: number
      }
      wins: {
        home: string
        away: string
      }
      loses: {
        home: string
        away: string
      }
      goals: {
        for: {
          home: number
          away: number
        }
        against: {
          home: number
          away: number
        }
      }
    }
    clean_sheet: {
      home: number
      away: number
      total: number
    }
    failed_to_score: {
      home: number
      away: number
      total: number
    }
    penalty: {
      scored: {
        total: number
        percentage: string
      }
      missed: {
        total: number
        percentage: string
      }
    }
    lineups: unknown[]
    cards: {
      yellow: {
        0?: number
        [key: string]: number | undefined
      }
      red: {
        0?: number
        [key: string]: number | undefined
      }
    }
  }
}

/**
 * Get season statistics for a team
 * @param teamId API-Football team ID
 * @returns Season statistics including goals, clean sheets, form, biggest wins
 */
export async function getTeamStats(teamId: number): Promise<TeamStatsResponse> {
  const cacheKey = `team_stats:${LEAGUE_ID}:${SEASON}:${teamId}`

  return getCachedOrFetch(cacheKey, async () => {
    const data = await fetchFromApiFootball<TeamStatsResponse>(
      '/teams/statistics',
      {
        league: LEAGUE_ID,
        season: SEASON,
        team: teamId,
      }
    )
    return data
  }, CACHE_TTL)
}

/**
 * Helper: Extract commonly used stats
 */
export function extractCommonStats(stats: TeamStatsResponse['statistics']) {
  return {
    played: stats.played.total,
    wins: stats.wins.total,
    draws: stats.draws.total,
    losses: stats.loses.total,
    goalsFor: stats.goals.for.total,
    goalsAgainst: stats.goals.against.total,
    goalDifference: stats.goals.for.total - stats.goals.against.total,
    cleanSheets: stats.clean_sheet.total,
    failedToScore: stats.failed_to_score.total,
    penaltiesScored: stats.penalty.scored.total,
    penaltiesMissed: stats.penalty.missed.total,
    winStreak: stats.biggest.streak.wins,
    lossStreak: stats.biggest.streak.loses,
    drawStreak: stats.biggest.streak.draws,
  }
}
