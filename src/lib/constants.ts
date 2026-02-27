// ============================================================
// PLHub Constants & Design Tokens
// Platform-agnostic — no DOM, no React Native dependencies
// ============================================================

// --- Colour System ---

export const COLORS = {
  bgPage: '#0B1F21',
  bgCard: '#183538',
  bgCardHover: '#1D3D41',
  bgCardExpanded: 'rgba(255,255,255,0.03)',
  brandGold: '#C4A23E',
  brandGoldMuted: '#C4A23E80',
  brandTeal: '#00555A',
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255,255,255,0.7)',
  textMuted: 'rgba(255,255,255,0.5)',
  textGhost: 'rgba(255,255,255,0.3)',
  border: 'rgba(255,255,255,0.05)',
  borderSubtle: 'rgba(255,255,255,0.1)',
} as const

// --- Source Colours ---

export const SOURCE_COLORS: Record<string, string> = {
  'BBC Sport': '#FFD008',
  'Sky Sports': '#0072BC',
  'The Guardian': '#052962',
  'The Athletic': '#D4442E',
  'talkSPORT': '#E4002B',
  'Goal': '#00A550',
  '90min': '#8B5CF6',
  'The Telegraph': '#1D1D1B',
  'Mirror': '#E00000',
  'The Sun': '#C4122F',
  'Reddit': '#FF4500',
  'YouTube': '#FF0000',
  'football.london': '#E63329',
  'Manchester Evening News': '#004080',
  'Liverpool Echo': '#C8102E',
  'Chronicle Live': '#000000',
  'FourFourTwo': '#E30613',
  'Football365': '#00AEEF',
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
