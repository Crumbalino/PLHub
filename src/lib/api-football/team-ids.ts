/**
 * API-Football Team ID Mapping
 * Maps PLHub club slugs to API-Football team IDs for Premier League 2024/25
 * Source: https://v3.football.api-sports.io/teams?league=39&season=2025
 */

export const TEAM_IDS: Record<string, number> = {
  'arsenal': 42,
  'aston-villa': 66,
  'bournemouth': 35,
  'brentford': 55,
  'brighton': 51,
  'chelsea': 49,
  'crystal-palace': 52,
  'everton': 45,
  'fulham': 36,
  'ipswich': 57,
  'leicester': 46,
  'liverpool': 40,
  'man-city': 50,
  'man-united': 33,
  'newcastle': 34,
  'nottingham-forest': 65,
  'southampton': 41,
  'tottenham': 47,
  'west-ham': 48,
  'wolves': 39,
}

/**
 * Reverse mapping: API-Football ID to club slug
 * Used when processing API responses to identify clubs
 */
export const TEAM_IDS_REVERSE = Object.fromEntries(
  Object.entries(TEAM_IDS).map(([slug, id]) => [id, slug])
)

/**
 * Get API-Football team ID from club slug
 * @throws Error if slug is not found
 */
export function getTeamId(slug: string): number {
  const id = TEAM_IDS[slug]
  if (!id) {
    throw new Error(`Unknown club slug: ${slug}`)
  }
  return id
}

/**
 * Get club slug from API-Football team ID
 * @throws Error if ID is not found
 */
export function getClubSlug(teamId: number): string {
  const slug = TEAM_IDS_REVERSE[teamId]
  if (!slug) {
    throw new Error(`Unknown team ID: ${teamId}`)
  }
  return slug
}
