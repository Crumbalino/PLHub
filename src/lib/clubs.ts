import { Club } from '@/types'

const PL_CDN = 'https://resources.premierleague.com/premierleague/badges'

export const CLUBS: Club[] = [
  {
    slug: 'arsenal',
    name: 'Arsenal',
    shortName: 'Arsenal',
    subreddit: 'Gunners',
    primaryColor: '#EF0107',
    secondaryColor: '#023474',
    badgeEmoji: '🔴',
    badgeUrl: `${PL_CDN}/t3.svg`,
  },
  {
    slug: 'aston-villa',
    name: 'Aston Villa',
    shortName: 'Aston Villa',
    subreddit: 'avfc',
    primaryColor: '#670E36',
    secondaryColor: '#95BFE5',
    badgeEmoji: '🟣',
    badgeUrl: `${PL_CDN}/t7.svg`,
  },
  {
    slug: 'brentford',
    name: 'Brentford',
    shortName: 'Brentford',
    subreddit: 'Brentford',
    primaryColor: '#E30613',
    secondaryColor: '#FFD700',
    badgeEmoji: '🐝',
    badgeUrl: `${PL_CDN}/t94.svg`,
  },
  {
    slug: 'brighton',
    name: 'Brighton',
    shortName: 'Brighton',
    subreddit: 'BrightonHoveAlbion',
    primaryColor: '#0057B8',
    secondaryColor: '#FFCD00',
    badgeEmoji: '🔵',
    badgeUrl: `${PL_CDN}/t36.svg`,
  },
  {
    slug: 'bournemouth',
    name: 'Bournemouth',
    shortName: 'Bournemouth',
    subreddit: 'AFCBournemouth',
    primaryColor: '#DA291C',
    secondaryColor: '#000000',
    badgeEmoji: '🍒',
    badgeUrl: `${PL_CDN}/t91.svg`,
  },
  {
    slug: 'chelsea',
    name: 'Chelsea',
    shortName: 'Chelsea',
    subreddit: 'chelseafc',
    primaryColor: '#034694',
    secondaryColor: '#DBA111',
    badgeEmoji: '💙',
    badgeUrl: `${PL_CDN}/t8.svg`,
  },
  {
    slug: 'coventry',
    name: 'Coventry City',
    shortName: 'Coventry',
    subreddit: 'ccfc',
    primaryColor: '#78D0F3',
    secondaryColor: '#1D1D5F',
    badgeEmoji: '🔵',
    badgeUrl: `${PL_CDN}/t9.svg`,
  },
  {
    slug: 'crystal-palace',
    name: 'Crystal Palace',
    shortName: 'Palace',
    subreddit: 'crystalpalace',
    primaryColor: '#1B458F',
    secondaryColor: '#C4122E',
    badgeEmoji: '🦅',
    badgeUrl: `${PL_CDN}/t31.svg`,
  },
  {
    slug: 'everton',
    name: 'Everton',
    shortName: 'Everton',
    subreddit: 'Everton',
    primaryColor: '#003399',
    secondaryColor: '#FFFFFF',
    badgeEmoji: '💙',
    badgeUrl: `${PL_CDN}/t11.svg`,
  },
  {
    slug: 'fulham',
    name: 'Fulham',
    shortName: 'Fulham',
    subreddit: 'fulhamfc',
    primaryColor: '#000000',
    secondaryColor: '#FFFFFF',
    badgeEmoji: '⚫',
    badgeUrl: `${PL_CDN}/t54.svg`,
  },
  {
    slug: 'hull',
    name: 'Hull City',
    shortName: 'Hull',
    subreddit: 'HullCity',
    primaryColor: '#F18A00',
    secondaryColor: '#000000',
    badgeEmoji: '🐅',
    badgeUrl: `${PL_CDN}/t88.svg`,
  },
  {
    slug: 'ipswich',
    name: 'Ipswich Town',
    shortName: 'Ipswich',
    subreddit: 'IpswichTown',
    primaryColor: '#0053A0',
    secondaryColor: '#FFFFFF',
    badgeEmoji: '💙',
    badgeUrl: `${PL_CDN}/t40.svg`,
  },
  {
    slug: 'leeds',
    name: 'Leeds',
    shortName: 'Leeds',
    subreddit: 'LeedsUnited',
    primaryColor: '#1D428A',
    secondaryColor: '#FFCD00',
    badgeEmoji: '⚪',
    badgeUrl: `${PL_CDN}/t2.svg`,
  },
  {
    slug: 'liverpool',
    name: 'Liverpool',
    shortName: 'Liverpool',
    subreddit: 'LiverpoolFC',
    primaryColor: '#C8102E',
    secondaryColor: '#00B2A9',
    badgeEmoji: '🔴',
    badgeUrl: `${PL_CDN}/t14.svg`,
  },
  {
    slug: 'man-city',
    name: 'Man City',
    shortName: 'Man City',
    subreddit: 'MCFC',
    primaryColor: '#6CABDD',
    secondaryColor: '#1C2C5B',
    badgeEmoji: '🩵',
    badgeUrl: `${PL_CDN}/t43.svg`,
  },
  {
    slug: 'man-utd',
    name: 'Man United',
    shortName: 'Man Utd',
    subreddit: 'reddevils',
    primaryColor: '#DA291C',
    secondaryColor: '#FFE500',
    badgeEmoji: '👹',
    badgeUrl: `${PL_CDN}/t1.svg`,
  },
  {
    slug: 'newcastle',
    name: 'Newcastle',
    shortName: 'Newcastle',
    subreddit: 'NUFC',
    primaryColor: '#241F20',
    secondaryColor: '#41B6E6',
    badgeEmoji: '⬛',
    badgeUrl: `${PL_CDN}/t4.svg`,
  },
  {
    slug: 'nottingham-forest',
    name: "Nott'm Forest",
    shortName: 'Forest',
    subreddit: 'nffc',
    primaryColor: '#E53233',
    secondaryColor: '#FFFFFF',
    badgeEmoji: '🌲',
    badgeUrl: `${PL_CDN}/t17.svg`,
  },
  {
    slug: 'tottenham',
    name: 'Tottenham',
    shortName: 'Spurs',
    subreddit: 'coys',
    primaryColor: '#132257',
    secondaryColor: '#FFFFFF',
    badgeEmoji: '🐓',
    badgeUrl: `${PL_CDN}/t6.svg`,
  },
  {
    slug: 'sunderland',
    name: 'Sunderland',
    shortName: 'Sunderland',
    subreddit: 'safc',
    primaryColor: '#EB6E1F',
    secondaryColor: '#FFFFFF',
    badgeEmoji: '⚫',
    // t58 was wrong and 403s on the CDN — Sunderland's badge code is 56.
    badgeUrl: `${PL_CDN}/t56.svg`,
  },
]

export const CLUBS_BY_SLUG: Record<string, Club> = Object.fromEntries(
  CLUBS.map((c) => [c.slug, c])
)

export const CLUBS_BY_SUBREDDIT: Record<string, string> = Object.fromEntries(
  CLUBS.map((c) => [c.subreddit.toLowerCase(), c.slug])
)

// --- Club Codes (three-letter display codes) ---

export const CLUB_CODES: Record<string, string> = {
  arsenal: 'ARS',
  'aston-villa': 'AVL',
  bournemouth: 'BOU',
  brentford: 'BRE',
  brighton: 'BHA',
  chelsea: 'CHE',
  coventry: 'COV',
  'crystal-palace': 'CRY',
  everton: 'EVE',
  fulham: 'FUL',
  hull: 'HUL',
  ipswich: 'IPS',
  leeds: 'LEE',
  liverpool: 'LIV',
  'man-city': 'MCI',
  'man-utd': 'MUN',
  newcastle: 'NEW',
  'nottingham-forest': 'NFO',
  sunderland: 'SUN',
  tottenham: 'TOT',
}

export function getClubCode(slug: string): string {
  return CLUB_CODES[slug] || slug
}

// --- Club Nicknames (for narrative content) ---
// Primary nickname that fans use (no "The" prefix). For 2026/27 PL season.

export const CLUB_NICKNAMES: Record<string, string> = {
  arsenal: 'Gunners',
  'aston-villa': 'Villa',
  bournemouth: 'Bournemouth',
  brentford: 'Brentford',
  brighton: 'Brighton',
  chelsea: 'Chelsea',
  coventry: 'Sky Blues',
  'crystal-palace': 'Palace',
  everton: 'Everton',
  fulham: 'Fulham',
  hull: 'Tigers',
  ipswich: 'Ipswich',
  leeds: 'Leeds',
  liverpool: 'Liverpool',
  'man-city': 'City',
  'man-utd': 'United',
  newcastle: 'Newcastle',
  'nottingham-forest': 'Forest',
  sunderland: 'Sunderland',
  tottenham: 'Spurs',
}

export function getClubNickname(slug: string): string {
  const club = CLUBS_BY_SLUG[slug]
  const nickname = CLUB_NICKNAMES[slug]
  // Return nickname if available, otherwise fallback to short name, then full name
  return nickname || club?.shortName || slug
}

// --- Multi-Club Detection ---

const CLUB_PATTERNS: [RegExp, string][] = [
  [/\barsenal\b/i, 'arsenal'],
  [/\baston villa\b/i, 'aston-villa'],
  [/\bbournemouth\b/i, 'bournemouth'],
  [/\bbrentford\b/i, 'brentford'],
  [/\bbrighton\b/i, 'brighton'],
  [/\bchelsea\b/i, 'chelsea'],
  [/\bcoventry\b/i, 'coventry'],
  [/\bcrystal palace\b/i, 'crystal-palace'],
  [/\beverton\b/i, 'everton'],
  [/\bfulham\b/i, 'fulham'],
  [/\bhull\b/i, 'hull'],
  [/\bipswich\b/i, 'ipswich'],
  [/\bleeds\b/i, 'leeds'],
  [/\bliverpool\b/i, 'liverpool'],
  [/\bman(?:chester)?\s*city\b/i, 'man-city'],
  [/\bman(?:chester)?\s*(?:utd|united)\b/i, 'man-utd'],
  [/\bnewcastle\b/i, 'newcastle'],
  [/\bnott(?:ingham)?\s*forest\b/i, 'nottingham-forest'],
  [/\bsunderland\b/i, 'sunderland'],
  [/\b(?:spurs|tottenham)\b/i, 'tottenham'],
]

/**
 * Detect all PL clubs mentioned in a post's text.
 * Primary club (from club_slug) is listed first.
 */
export function detectAllClubs(
  title: string,
  content: string | null,
  summary: string | null,
  primaryClubSlug: string | null
): string[] {
  const text = `${title || ''} ${summary || ''} ${content || ''}`.toLowerCase()
  const found: string[] = []

  // Primary club first
  if (primaryClubSlug) found.push(primaryClubSlug)

  for (const [pattern, slug] of CLUB_PATTERNS) {
    if (pattern.test(text) && !found.includes(slug)) {
      found.push(slug)
    }
  }

  return found
}

/**
 * Convert club slugs to ClubBadge objects for the API response.
 */
export function toClubBadges(slugs: string[]): import('./types').ClubBadge[] {
  return slugs
    .map(slug => {
      const club = CLUBS_BY_SLUG[slug]
      if (!club) return null
      return {
        slug,
        shortName: club.shortName,
        code: getClubCode(slug),
        badgeUrl: club.badgeUrl,
      }
    })
    .filter((b): b is import('./types').ClubBadge => b !== null)
}
