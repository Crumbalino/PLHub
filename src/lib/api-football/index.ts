/**
 * API-Football Integration
 * Unified exports for all endpoints and utilities
 */

// Client and caching
export { fetchFromApiFootball } from './client'
export {
  getCachedOrFetch,
  invalidateCache,
  clearApiFootballCache,
  getCacheStats,
} from './cache'

// Team ID mappings
export { TEAM_IDS, TEAM_IDS_REVERSE, getTeamId, getClubSlug } from './team-ids'

// Standings
export {
  getStandings,
  getStandingsTable,
  getTeamStanding,
  type StandingsResponse,
  type TeamStanding,
} from './standings'

// Fixtures
export {
  getFixtures,
  getTodaysMatches,
  getNextMatchday,
  getTeamFixtures,
  getFixtureById,
  type Fixture,
  type FixtureTeam,
} from './fixtures'

// Match statistics
export {
  getFixtureStats,
  getStatValue,
  STAT_TYPES,
  type FixtureStatsResponse,
  type TeamStats,
} from './match-stats'

// Team season statistics
export {
  getTeamStats,
  extractCommonStats,
  type TeamStatsResponse,
} from './team-stats'

// Top scorers
export {
  getTopScorers,
  getTopNScorers,
  getPlayerScorersStats,
  extractScorerStats,
  type TopScorer,
  type TopScorersResponse,
} from './top-scorers'

// Head to head
export {
  getH2H,
  extractH2HStats,
  getH2HAdvantage,
  type H2HResponse,
  type H2HFixture,
} from './head-to-head'

/**
 * Constants
 */
export const API_FOOTBALL_CONFIG = {
  BASE_URL: 'https://v3.football.api-sports.io',
  LEAGUE_ID: 39, // Premier League
  SEASON: 2025,
  MAX_REQUESTS_PER_DAY: 100,
} as const
