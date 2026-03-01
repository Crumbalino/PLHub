/**
 * PLHub Design Tokens v2.1
 * Single source of truth for web (Tailwind/CSS) and React Native (StyleSheet).
 * Every colour, size, and spacing value lives here.
 */

// ──────────────────────────────────────────
// COLOURS
// ──────────────────────────────────────────

export const colors = {
  // Dark mode backgrounds
  navy: '#0D1B2A',
  navyCard: '#112238',
  navyElevated: '#162D45',

  // Brand
  pink: '#E84080',
  pinkHover: '#D03670',
  pinkActive: '#B82E60',
  gold: '#D4A843',
  teal: '#3AAFA9',

  // Editorial accents
  ice: '#8AACCC',
  violet: '#C084FC',
  orange: '#F97316',

  // Dark mode text base
  warmWhite: '#FAF5F0',

  // Light mode equivalents
  coolWhite: '#F8F9FB',
  whiteCard: '#FFFFFF',
  whiteHover: '#F0F1F4',
  textLight: '#1A1D23',

  // Light mode adjusted accents (darkened for contrast)
  tealLight: '#2A9490',
  goldLight: '#B8923A',
  iceLight: '#5A7F9F',
  violetLight: '#9B59B6',
  orangeLight: '#D96A14',
} as const;

// ──────────────────────────────────────────
// TEXT OPACITY SCALE
// No grey hex codes. Hierarchy via opacity on the base colour.
// Floor = 40%. Nothing below that.
// ──────────────────────────────────────────

export const textOpacity = {
  100: 1,      // Headlines, primary content
  75: 0.75,    // Summaries, body, Pundit's Take
  70: 0.7,     // Navigation, secondary content
  50: 0.5,     // Timestamps, metadata
  40: 0.4,     // Separators, dots — MINIMUM FLOOR
} as const;

// ──────────────────────────────────────────
// TYPOGRAPHY
// Sora everywhere. Monospace only for scores.
// ──────────────────────────────────────────

export const typography = {
  fontFamily: "'Sora', sans-serif",
  fontFamilyMono: "'Consolas', 'Courier New', monospace",

  headline:    { size: 18, weight: '600' as const, lineHeight: 1.35 },
  sectionHead: { size: 18, weight: '600' as const, lineHeight: 1.3 },
  summary:     { size: 14, weight: '300' as const, lineHeight: 1.6 },
  body:        { size: 14, weight: '300' as const, lineHeight: 1.6 },
  sourceLabel: { size: 10, weight: '600' as const, letterSpacing: 1.5, transform: 'uppercase' as const },
  clubName:    { size: 13, weight: '400' as const },
  timestamp:   { size: 10, weight: '400' as const },
  clubTag:     { size: 8,  weight: '600' as const, letterSpacing: 1, transform: 'uppercase' as const },
  punditLabel: { size: 13, weight: '500' as const },
  spBadge:     { size: 11, weight: '600' as const },
  uiLabel:     { size: 10, weight: '500' as const, letterSpacing: 2, transform: 'uppercase' as const },
  pulseScore:  { size: 11, weight: '700' as const },
} as const;

// ──────────────────────────────────────────
// SPACING (4px base grid)
// ──────────────────────────────────────────

export const spacing = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
} as const;

// ──────────────────────────────────────────
// BORDER RADIUS
// ──────────────────────────────────────────

export const radius = {
  sm: 6,
  md: 8,
  lg: 10,
  xl: 14,
} as const;

// ──────────────────────────────────────────
// SHADOWS
// ──────────────────────────────────────────

export const shadows = {
  card: '0 2px 6px rgba(0,0,0,0.2), 0 1px 2px rgba(0,0,0,0.1)',
  cardLight: '0 2px 6px rgba(13,27,42,0.05), 0 1px 2px rgba(13,27,42,0.03)',
} as const;

// ──────────────────────────────────────────
// TRANSITIONS
// ──────────────────────────────────────────

export const transitions = {
  fast: '200ms ease-out',
  page: '300ms ease',
} as const;

// ──────────────────────────────────────────
// BORDERS
// ──────────────────────────────────────────

export const borders = {
  dark: 'rgba(250,245,240,0.05)',
  darkHover: 'rgba(250,245,240,0.1)',
  light: 'rgba(13,27,42,0.08)',
  lightHover: 'rgba(13,27,42,0.12)',
} as const;

// ──────────────────────────────────────────
// BREAKPOINTS
// ──────────────────────────────────────────

export const breakpoints = {
  mobile: 0,
  tablet: 768,
  desktop: 1024,
  wide: 1400,
} as const;

// ──────────────────────────────────────────
// SOURCE COLOURS
// Each RSS feed gets a distinct editorial colour.
// ──────────────────────────────────────────

const sourceColors: Record<string, { dark: string; light: string }> = {
  'BBC Sport':     { dark: colors.gold,   light: colors.goldLight },
  'BBC':           { dark: colors.gold,   light: colors.goldLight },
  'Sky Sports':    { dark: colors.pink,   light: colors.pink },
  'Sky':           { dark: colors.pink,   light: colors.pink },
  'The Guardian':  { dark: colors.teal,   light: colors.tealLight },
  'Guardian':      { dark: colors.teal,   light: colors.tealLight },
  'talkSPORT':     { dark: colors.ice,    light: colors.iceLight },
  'TalkSport':     { dark: colors.ice,    light: colors.iceLight },
  'Goal.com':      { dark: colors.violet, light: colors.violetLight },
  'Goal':          { dark: colors.violet, light: colors.violetLight },
  '90min':         { dark: colors.orange, light: colors.orangeLight },
  'Football365':   { dark: '#E84080',     light: '#D03670' },
  'The Independent': { dark: '#C4A23E',   light: '#B8923A' },
  'ESPN FC':       { dark: '#D00000',     light: '#C41E3A' },
  'FourFourTwo':   { dark: '#1A8B5E',     light: '#0F6B48' },
  'Reddit':        { dark: colors.orange, light: colors.orangeLight },
  'YouTube':       { dark: colors.pink,   light: colors.pink },
};

/**
 * Get the display colour for a news source.
 * Falls back to teal for unknown sources.
 */
export function getSourceColor(name: string, mode: 'dark' | 'light' = 'dark'): string {
  const entry = sourceColors[name];
  if (entry) return entry[mode];

  // Fuzzy match — check if the source name contains a known key
  for (const [key, val] of Object.entries(sourceColors)) {
    if (name.toLowerCase().includes(key.toLowerCase())) return val[mode];
  }

  return mode === 'dark' ? colors.teal : colors.tealLight;
}
