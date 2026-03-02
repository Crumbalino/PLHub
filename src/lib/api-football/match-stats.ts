/**
 * Fixture Statistics Endpoint
 * GET /fixtures/statistics?fixture={fixture_id}
 * Cache TTL: Permanent (completed match stats don't change)
 * Calls per day: ~10 after matchday, 0 otherwise
 */

import { fetchFromApiFootball } from './client'
import { getCachedOrFetch } from './cache'

const PERMANENT_TTL = 365 * 24 * 60 * 60 // 1 year (effectively permanent)

export interface TeamStats {
  team: {
    id: number
    name: string
    logo: string
  }
  statistics: Array<{
    type: string
    value: number | string | null
  }>
}

export interface FixtureStatsResponse {
  fixture: {
    id: number
    date: string
    status: {
      short: string
      long: string
      elapsed: number | null
    }
  }
  league: {
    id: number
    season: number
    name: string
  }
  teams: {
    home: TeamStats
    away: TeamStats
  }
  statistics: TeamStats[]
}

/**
 * Get match statistics for a completed fixture
 * Only call for completed fixtures — upcoming matches won't have stats
 * @param fixtureId The API-Football fixture ID
 * @returns Match statistics including shots, possession, corners, etc.
 */
export async function getFixtureStats(fixtureId: number): Promise<FixtureStatsResponse> {
  const cacheKey = `fixture_stats:${fixtureId}`

  return getCachedOrFetch(cacheKey, async () => {
    const data = await fetchFromApiFootball<FixtureStatsResponse>(
      '/fixtures/statistics',
      { fixture: fixtureId }
    )
    return data
  }, PERMANENT_TTL)
}

/**
 * Helper: Get a specific stat value for a team
 * @param stats Team statistics array
 * @param statType The stat type to find (e.g., 'Shots on Goal', 'Ball Possession (%)')
 * @returns The stat value or null if not found
 */
export function getStatValue(
  stats: Array<{ type: string; value: number | string | null }>,
  statType: string
): number | string | null {
  const stat = stats.find((s) => s.type === statType)
  return stat?.value ?? null
}

/**
 * Common stat types available in API responses:
 */
export const STAT_TYPES = {
  SHOTS: 'Shots on Goal',
  SHOTS_OFF_TARGET: 'Shots off Goal',
  TOTAL_SHOTS: 'Total Shots',
  BLOCKED_SHOTS: 'Blocked Shots',
  POSSESSION: 'Ball Possession (%)',
  PASS_ACCURACY: 'Pass Accuracy (%)',
  PASSES: 'Passes',
  ACCURATE_PASSES: 'Accurate Passes',
  TACKLES: 'Tackles',
  BLOCKS: 'Blocks',
  INTERCEPTIONS: 'Interceptions',
  FOULS: 'Fouls Committed',
  YELLOW_CARDS: 'Yellow Cards',
  RED_CARDS: 'Red Cards',
  OFFSIDES: 'Offsides',
  CORNERS: 'Corners',
  BALL_CONTACT: 'Ball Contact',
  GOALKEEPER_SAVES: 'Goalkeeper Saves',
  KEEPER_PUNCH: 'Keeper Punch',
  KEEPER_THROWS: 'Keeper Throws',
  EXPECTED_GOALS: 'Expected Goals (xG)',
  EXPECTED_ASSISTS: 'Expected Assists (xA)',
} as const
