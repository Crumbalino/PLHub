// ============================================================
// PLHub Constants & Design Tokens v2.2
// Platform-agnostic — no DOM, no React Native dependencies
// ============================================================

// --- Colour System (v2.2 navy) ---

export const COLORS = {
  bgPage: '#0D1B2A',
  bgCard: '#112238',
  bgCardHover: '#162D45',
  bgCardExpanded: 'rgba(250,245,240,0.03)',
  brandPink: '#E84080',
  brandGold: '#D4A843',
  brandGoldMuted: 'rgba(212,168,67,0.5)',
  brandTeal: '#3AAFA9',
  textPrimary: '#FAF5F0',
  textSecondary: '#FFFFFF',
  textMuted: '#FFFFFF',
  textGhost: '#FFFFFF',
  border: 'rgba(250,245,240,0.05)',
  borderSubtle: 'rgba(250,245,240,0.1)',
} as const

// --- Source Colours (v2.2 editorial palette) ---

export const SOURCE_COLORS: Record<string, string> = {
  'BBC Sport': '#D4A843',
  'Sky Sports': '#E84080',
  'The Guardian': '#3AAFA9',
  'talkSPORT': '#8AACCC',
  'Goal': '#C084FC',
  'Goal.com': '#C084FC',
  '90min': '#F97316',
  'Reddit': '#F97316',
  'YouTube': '#E84080',
  'ESPN FC': '#E8402A',
  'The Independent': '#6B9E78',
  'Evening Standard': '#8AACCC',
  // Legacy fallbacks for any sources still using old names
  'The Athletic': '#D4A843',
  'The Telegraph': '#8AACCC',
  'Mirror': '#E84080',
  'FourFourTwo': '#C084FC',
  'Football365': '#F97316',
  'football.london': '#E84080',
  'Manchester Evening News': '#8AACCC',
  'Liverpool Echo': '#E84080',
  'Chronicle Live': '#8AACCC',
} as const

// --- Source Logos (public path) ---

export const SOURCE_LOGOS: Record<string, string> = {
  'BBC Sport': '/sources/bbc.png',
  'Sky Sports': '/sources/skysports.png',
  'The Guardian': '/sources/guardian.png',
  'talkSPORT': '/sources/talksport.png',
  'Goal': '/sources/goal.png',
  '90min': '/sources/90min.png',
  'Reddit': '/sources/reddit.png',
} as const

// --- Feed Config ---

export const FEED = {
  postsPerPage: 20,
  trendingCount: 5,
  hotWindowHours: 6,
  previewBlurbMaxChars: 140,
  previewBlurbMinChars: 30,
} as const

// --- Scoring Config ---

export const SCORING = {
  hotThresholdMultiplier: 0.7,   // Score > maxScore * this = "Hot"
  warmThresholdMultiplier: 0.3,  // Score > maxScore * this = "Warm"
  hotGravity: 1.5,               // Gravity for hot score decay
} as const

// --- Animation Durations (ms) ---

export const ANIMATION = {
  cardExpand: 600,
  cardCollapse: 300,
  summaryReveal: 500,
  badgePulse: 500,
  sortTransition: 200,
  feedStagger: 50,
} as const

// --- Club Badge URL Template ---

export const BADGE_URL_TEMPLATE = 'https://resources.premierleague.com/premierleague/badges/t{code}.png'

export function getBadgeUrl(code: string): string {
  return BADGE_URL_TEMPLATE.replace('{code}', code)
}
