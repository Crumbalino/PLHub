// ─────────────────────────────────────────────────────────────────
// THE FOOTBALL HUB — Design Token System v6.0
// Single source of truth for web AND React Native.
// Import this file in both platforms — never duplicate values.
// ─────────────────────────────────────────────────────────────────

// ── Raw palette (never use directly in components — use semantic tokens) ──
const PALETTE = {
  navy:         "#0D1B2A",
  navyCard:     "#112238",
  navyElevated: "#162D45",
  pink:         "#E84080",
  pinkHover:    "#D03670",
  pinkActive:   "#B82E60",
  teal:         "#3AAFA9",
  tealDark:     "#2A9490",
  gold:         "#D4A843",
  goldDark:     "#B8923A",
  sage:         "#6B9E78",
  ice:          "#8AACCC",
  iceDark:      "#5A7F9F",
  violet:       "#C084FC",
  violetDark:   "#9B59B6",
  orange:       "#F97316",
  orangeDark:   "#D96A14",
  warmWhite:    "#FAF5F0",
  coolWhite:    "#F8F9FB",
  white:        "#FFFFFF",
  lightText:    "#1A1D23",
  navyDeep:     "#0D1B2A",
} as const;

// ── Semantic tokens: DARK mode (default) ──
export const DARK: TokenSet = {
  // Backgrounds
  bg:           PALETTE.navy,
  card:         PALETTE.navyCard,
  elevated:     PALETTE.navyElevated,

  // Text — warm white + opacity. Floor: 0.40. Never use grey hex codes.
  text100:      PALETTE.warmWhite,
  text75:       "rgba(250,245,240,0.75)",
  text70:       "rgba(250,245,240,0.70)",
  text50:       "rgba(250,245,240,0.50)",
  text40:       "rgba(250,245,240,0.40)",

  // Brand accent
  pink:         PALETTE.pink,
  pinkHover:    PALETTE.pinkHover,
  pinkActive:   PALETTE.pinkActive,

  // Structural / data
  teal:         PALETTE.teal,

  // Source label colours (editorial only — not brand colours)
  gold:         PALETTE.gold,
  sage:         PALETTE.sage,
  ice:          PALETTE.ice,
  violet:       PALETTE.violet,
  orange:       PALETTE.orange,

  // Borders
  border:       "rgba(250,245,240,0.05)",
  borderCard:   "rgba(250,245,240,0.06)",

  // Shadows (web only — RN uses elevation)
  shadow:       "0 2px 6px rgba(0,0,0,0.2), 0 1px 2px rgba(0,0,0,0.1)",
  shadowCard:   "0 2px 8px rgba(0,0,0,0.25)",

  // Logo
  logoText:     PALETTE.warmWhite,
  logoBracket:  PALETTE.teal,

  // Overlay / gradient stops (image zone gradient)
  imageOverlay: "linear-gradient(to bottom, transparent 20%, rgba(17,34,56,0.5) 60%, rgba(17,34,56,0.96) 100%)",

  // Nav background
  navBg:        "rgba(13,27,42,0.95)",
  navBorder:    "rgba(250,245,240,0.05)",
};

// ── Semantic tokens: LIGHT mode ──
export const LIGHT: TokenSet = {
  bg:           PALETTE.coolWhite,
  card:         PALETTE.white,
  elevated:     "#F0F1F4",

  // Text — navy + opacity
  text100:      PALETTE.lightText,
  text75:       "rgba(13,27,42,0.75)",
  text70:       "rgba(13,27,42,0.70)",
  text50:       "rgba(13,27,42,0.50)",
  text40:       "rgba(13,27,42,0.40)",

  pink:         PALETTE.pink,
  pinkHover:    PALETTE.pinkHover,
  pinkActive:   PALETTE.pinkActive,

  teal:         PALETTE.tealDark,

  gold:         PALETTE.goldDark,
  sage:         PALETTE.sage,
  ice:          PALETTE.iceDark,
  violet:       PALETTE.violetDark,
  orange:       PALETTE.orangeDark,

  border:       "rgba(13,27,42,0.08)",
  borderCard:   "rgba(13,27,42,0.08)",

  shadow:       "0 2px 6px rgba(13,27,42,0.05), 0 1px 2px rgba(13,27,42,0.03)",
  shadowCard:   "0 2px 8px rgba(13,27,42,0.08)",

  logoText:     PALETTE.lightText,
  logoBracket:  PALETTE.tealDark,

  imageOverlay: "linear-gradient(to bottom, transparent 20%, rgba(17,34,56,0.5) 60%, rgba(17,34,56,0.96) 100%)",

  navBg:        "rgba(248,249,251,0.97)",
  navBorder:    "rgba(13,27,42,0.06)",
};

// ── TypeScript shape (used by both token sets) ──
export interface TokenSet {
  bg: string;
  card: string;
  elevated: string;
  text100: string;
  text75: string;
  text70: string;
  text50: string;
  text40: string;
  pink: string;
  pinkHover: string;
  pinkActive: string;
  teal: string;
  gold: string;
  sage: string;
  ice: string;
  violet: string;
  orange: string;
  border: string;
  borderCard: string;
  shadow: string;
  shadowCard: string;
  logoText: string;
  logoBracket: string;
  imageOverlay: string;
  navBg: string;
  navBorder: string;
}

// ── Spacing (4px base grid) ──
export const SPACE = {
  1:  4,
  2:  8,
  3:  12,
  4:  16,
  5:  20,
  6:  24,
  8:  32,
  10: 40,
  12: 48,
} as const;

// ── Border radii ──
export const RADIUS = {
  sm:  6,
  md:  8,
  lg:  10,
  xl:  12,
  xxl: 14,
} as const;

// ── Typography ──
export const FONT = {
  sora:  "'Sora', sans-serif",
  mono:  "'JetBrains Mono', 'Consolas', monospace",
} as const;

// Font weights — identical on both platforms
export const WEIGHT = {
  light:     300,
  regular:   400,
  medium:    500,
  semibold:  600,
  bold:      700,
  extrabold: 800,
} as const;

// Font sizes — pixels (web) = dp (RN)
export const SIZE = {
  // UI labels
  label2xs: 8,
  labelXs:  9,
  labelSm:  10,
  // Body
  bodyXs:   11,
  bodySm:   12,
  bodyMd:   13,
  bodyLg:   14,
  // Headings
  headSm:   15,
  headMd:   16,
  headLg:   18,
  headXl:   22,
  head2xl:  24,
  // Display (Logo primary tier, stat numbers)
  display:  52,
  // Ghost decorations
  ghost:    96,
  ghostSm:  42,
  ghostMd:  52,
  ghostQ:   100,
} as const;

// ── Animation durations (ms) ──
export const DURATION = {
  fast:   200,
  normal: 300,
  slow:   450,
  reveal: 550,
  intro:  500,
} as const;

// ── Easing (web CSS strings — RN Easing equivalents noted) ──
export const EASE = {
  out:         "ease-out",
  in:          "ease-in",
  inOut:       "ease-in-out",
  spring:      "cubic-bezier(0.25, 1, 0.5, 1)",
} as const;

// ── Publisher colours ──
export const PUB_COLORS = {
  "BBC SPORT":    "#D4A843",
  "SKY SPORTS":   "#E84080",
  "THE GUARDIAN": "#6B9E78",
  "TALKSPORT":    "#8AACCC",
  "GOAL":         "#C084FC",
  "90MIN":        "#F97316",
  "ESPN":         "#E84080",
  DEFAULT:        "#3AAFA9",
} as const;

// ── Card accent colours by type ──
export const CARD_ACCENTS = {
  byTheNumbers: "#3AAFA9",
  trivia:       "#E84080",
  onThisDay:    "#D4A843",
  quote:        "#8AACCC",
  fixture:      "#C084FC",
} as const;

// ── Reaction definitions ──
export const REACTIONS = [
  { id: 0, emoji: "⚽", label: "Spot on"      },
  { id: 1, emoji: "🟥", label: "Out of order" },
  { id: 2, emoji: "🏆", label: "All-time"     },
  { id: 3, emoji: "📣", label: "Big noise"    },
  { id: 4, emoji: "💪", label: "Respect"      },
  { id: 5, emoji: "🤔", label: "Not sure"     },
  { id: 6, emoji: "💀", label: "Finished"     },
  { id: 7, emoji: "😂", label: "Clowning"     },
  { id: 8, emoji: "😬", label: "Awkward"      },
  { id: 9, emoji: "🤦", label: "Embarrassing" },
] as const;

// Seed vote counts — realistic distribution, reactions 0–3 weighted higher
export const SEED_VOTES: Record<number, number> = {
  0: 1847, 1: 2103, 2: 723,  3: 1205,
  4: 312,  5: 634,  6: 489,  7: 278,
  8: 401,  9: 156,
};

// ─────────────────────────────────────────────────────────────────
// BRAND-SWAP TOKENS — the set the snapshot page reads.
//
// A new logo, palette, type scale and spacing scale land in this object
// and nowhere else, and no component changes.
//
// ── PLAIN OBJECT, NEVER CSS CUSTOM PROPERTIES ────────────────────
//
// A CSS custom property that is never declared is not an error:
// `color: var(--plh-text-100)` with no declaration computes to nothing,
// the element renders invisibly, and every build check passes. That has
// taken this site down twice — 67 `var(--plh-*)` references with zero
// declarations, which is why globals.css still carries a shim.
//
// A missing key here is a TypeScript error at the call site. The failure
// moves from runtime-invisible to compile-time-loud, which is the point.
// Plain objects also port to React Native unchanged: the same values a
// StyleSheet consumes, with no cascade and no var() to resolve.
//
// ── WHERE THE VALUES CAME FROM ───────────────────────────────────
//
// Measured from the live DOM of /tottenham on 26 Aug 2026 —
// getComputedStyle over all 85 rendered elements, not read off source.
// Source says `text-[0.7rem]`; the browser says 11.2px, and the browser
// is the one telling the truth. `surface`, `elevated` and `accent` were
// read from the live custom properties on :root, since the page renders
// none of them.
//
// Sizes are kept in rem rather than the measured px so the page still
// responds to a reader's browser font size. At a 16px root they compute
// to exactly the measured pixel values.
//
// ── THE ONE PLACE A var() SURVIVES ───────────────────────────────
//
// `type.family`. next/font generates a hashed family name per build
// (`__Sora_2be303`) and exposes it only through a CSS variable it
// defines itself; hardcoding the hash would break on the next build.
// The rule above is about *undefined* variables rendering a component
// invisibly. These are defined by next/font on <body>, and each stack
// ends in a real generic family, so the worst case is a fallback face
// rather than nothing at all. React Native takes the family name
// directly and never sees the var().
//
// NOTE: the exports above (FONT, SIZE, WEIGHT, SPACE, RADIUS, …) are the
// v6.0 set, still imported by fourteen components. They are untouched.
// This object is the structure new work reads; the two meet when those
// components migrate.
// ─────────────────────────────────────────────────────────────────

export const tokens = {
  colour: {
    /** Page ground. */
    background: "#0D1B2A",
    /** Raised panel. Nothing on the snapshot page uses it yet. */
    surface: "#112238",
    /** Raised above `surface`. */
    elevated: "#162D45",
    /** The one brand accent. Club colour is never a page theme — PAGE_SPEC §1. */
    accent: "#E84080",

    text: {
      /** The only text colour. Hierarchy is opacity on this, never a grey hex. */
      base: "#FAF5F0",
      /**
       * Applied as the CSS `opacity` property, not as colour alpha — that is
       * what the page does today and what the measurement recorded. Each step
       * is a real rendered value, not a scale invented here.
       */
      step: {
        full: 1,
        muted: 0.7,
        faint: 0.6,
      },
    },

    /** Hairline between blocks. */
    rule: "rgba(255, 255, 255, 0.15)",

    /** Neutral fills, used by the loading skeleton. */
    overlay: {
      strong: "rgba(255, 255, 255, 0.10)",
      soft: "rgba(255, 255, 255, 0.05)",
    },
  },

  type: {
    family: {
      sans: "var(--font-sora), sans-serif",
      mono: "'JetBrains Mono', var(--font-mono), monospace",
    },
    /** Measured: 11.2 · 14 · 16 · 18 · 24 px at a 16px root. */
    size: {
      xs: "0.7rem",
      sm: "0.875rem",
      base: "1rem",
      lg: "1.125rem",
      xl: "1.5rem",
    },
    /**
     * Paired with `size` above.
     *
     * `xs` is deliberately NOT applied anywhere today. The utility it replaced
     * set a font size and no line height, so `xs` text inherits its parent's —
     * 1.5 in body copy, 20px inside the table. Forcing a value here changed the
     * table header by 3px, which is how it was caught. It stays declared for a
     * surface that needs to set it explicitly.
     */
    leading: {
      xs: "1.5",
      sm: "1.25rem",
      base: "1.5rem",
      lg: "1.75rem",
      xl: "2rem",
    },
    weight: {
      regular: 400,
      medium: 500,
      semibold: 600,
    },
    /** In `em`, so tracking scales with whatever size it is applied to. */
    tracking: {
      tight: "-0.025em",
      wide: "0.05em",
      widest: "0.15em",
    },
  },

  /**
   * One scale for margin, padding, gap, width and height, keyed in quarter-rem
   * steps — 4 is 1rem. Shared rather than split, because a 16px gap and a 16px
   * pad are the same decision.
   */
  space: {
    0: "0px",
    1: "0.25rem",
    2: "0.5rem",
    3: "0.75rem",
    4: "1rem",
    5: "1.25rem",
    6: "1.5rem",
    8: "2rem",
    10: "2.5rem",
    24: "6rem",
    32: "8rem",
    64: "16rem",
  },

  /** Rule weights. The hairline between blocks is the only one in use. */
  border: {
    hairline: "1px",
  },

  radius: {
    none: "0px",
    sm: "0.25rem",
  },

  /** Reading measure. 36rem is 576px at a 16px root. */
  measure: {
    page: "36rem",
  },
} as const;

export type Tokens = typeof tokens;
