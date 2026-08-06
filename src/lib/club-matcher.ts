/**
 * Two-signal club classification. String matching only — no model call.
 *
 * Assigns a post to at most one club, and only when TWO INDEPENDENT signal
 * types agree. One signal is not enough: "Arsenal" in a paragraph about a
 * transfer target is not an Arsenal story, and a bare surname or a
 * three-letter code is not evidence at all.
 *
 * Why not the existing detectAllClubs() in src/lib/clubs.ts: that matcher is
 * single-signal regex over the title, built to decorate a card with badges,
 * where a loose match costs nothing. This one decides which page a post lands
 * on, so a wrong answer is a wrong page. Measured over the live corpus, the
 * two-signal rule classified 30.9% of 19,447 posts and rejected a further
 * 2,923 that fired exactly one signal.
 *
 * AMBIGUOUS TOKENS ARE NEVER SIGNALS. "United", "City", "Forest", "Palace",
 * "Blues", "Reds", "Town", "Rovers", "Albion" and every three-letter code name
 * more than one club, so they are excluded by construction rather than
 * disambiguated by guesswork — the same rule the alias index follows. A signal
 * that names a set is not evidence about a member of it.
 */

import { CLUBS } from '@/config/clubs'

export type ClubSignal = 'name' | 'url' | 'stadium' | 'manager' | 'nickname'

/** Minimum distinct signal types required to assign a post to a club. */
export const REQUIRED_SIGNALS = 2

export interface ClubMatch {
  slug: string
  signals: ClubSignal[]
}

/**
 * Long forms that name exactly one Premier League club.
 *
 * "Brighton", "Leicester" and "Ipswich" are here without their suffixes
 * because no other PL club shares them, but they are also the tokens that
 * collide with other sports (Leicester Tigers) and with place names
 * (r/ipswich). That is precisely what the second signal is for.
 */
const NAMES: Record<string, string[]> = {
  arsenal: ['arsenal'],
  'aston-villa': ['aston villa'],
  bournemouth: ['bournemouth'],
  brentford: ['brentford'],
  brighton: ['brighton & hove albion', 'brighton and hove albion', 'brighton'],
  chelsea: ['chelsea'],
  'crystal-palace': ['crystal palace'],
  everton: ['everton'],
  fulham: ['fulham'],
  ipswich: ['ipswich town', 'ipswich'],
  leicester: ['leicester city', 'leicester'],
  liverpool: ['liverpool'],
  'man-city': ['manchester city', 'man city'],
  'man-utd': ['manchester united', 'man united', 'man utd'],
  newcastle: ['newcastle united', 'newcastle'],
  'nottingham-forest': ['nottingham forest', "nott'm forest"],
  southampton: ['southampton'],
  tottenham: ['tottenham hotspur', 'tottenham'],
  'west-ham': ['west ham united', 'west ham'],
  wolves: ['wolverhampton wanderers', 'wolves'],
}

/**
 * Nicknames that name exactly one club.
 *
 * Deliberately empty for Chelsea, Liverpool and Wolves. "Blues" is Chelsea,
 * Everton and Manchester City; "Reds" is Liverpool and Nottingham Forest.
 * A nickname shared by two clubs is worth less than no nickname at all.
 */
const NICKNAMES: Record<string, string[]> = {
  arsenal: ['gunners'],
  'aston-villa': ['villans'],
  bournemouth: ['cherries'],
  brentford: ['bees'],
  brighton: ['seagulls'],
  chelsea: [],
  'crystal-palace': ['eagles'],
  everton: ['toffees'],
  fulham: ['cottagers'],
  ipswich: ['tractor boys'],
  leicester: ['foxes'],
  liverpool: [],
  'man-city': ['cityzens'],
  'man-utd': ['red devils'],
  newcastle: ['magpies', 'toon'],
  'nottingham-forest': ['tricky trees'],
  southampton: ['saints'],
  tottenham: ['spurs'],
  'west-ham': ['hammers', 'irons'],
  wolves: [],
}

/**
 * Other sports that reuse these club names. Warrington Wolves and Leicester
 * Tigers both cleared the two-signal bar on the live corpus — "wolves" in the
 * text and "wolves" in a rugby-league URL are two signals for the wrong sport.
 * Nothing here can be rescued by a second signal, so it vetoes the post
 * outright rather than costing it a signal.
 */
const OTHER_SPORT_VETO = [
  'rugby', 'super league', 'warrington', 'wigan warriors', 'st helens',
  'leeds rhinos', 'hull kr', 'castleford', 'salford red devils',
  'leicester tigers', 'sale sharks', 'saracens', 'northampton saints',
  'harlequins', 'gloucester rugby', 'bath rugby', 'exeter chiefs',
  'cricket', 'the hundred', 'county championship',
]

/** Fold accents, lowercase, collapse whitespace. Mirrors verify-claim.ts. */
export function fold(s: string | null | undefined): string {
  return (s ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/**
 * Whole-word containment. "leicester" must not match "leicestershire", and
 * "toon" must not match "cartoon".
 */
export function wordIn(needle: string, haystack: string): boolean {
  if (!needle) return false
  return new RegExp(`(?<![a-z0-9])${escapeRe(needle)}(?![a-z0-9])`).test(haystack)
}

/** URL tokens per club, built once. Short tokens are dropped as too collidable. */
const URL_TOKENS: Record<string, string[]> = Object.fromEntries(
  Object.keys(NAMES).map((slug) => {
    const toks = new Set<string>([slug, slug.replace(/-/g, '')])
    for (const n of NAMES[slug]) {
      toks.add(n.replace(/\s+/g, '-'))
      toks.add(n.replace(/\s+/g, ''))
    }
    return [slug, [...toks].filter((t) => t.length >= 5)]
  }),
)

/**
 * Every club with at least one signal, and which signals fired.
 * Exported for tests and for the backfill's reporting; callers that just want
 * an answer should use classifyClub().
 */
export function matchClubs(
  title: string | null,
  content: string | null,
  url: string | null,
): ClubMatch[] {
  const text = fold(`${title ?? ''} ${content ?? ''}`)
  const link = fold(url)

  if (OTHER_SPORT_VETO.some((k) => wordIn(k, text) || link.includes(k.replace(/\s+/g, '-')))) {
    return []
  }

  const out: ClubMatch[] = []
  for (const slug of Object.keys(NAMES)) {
    const club = CLUBS[slug]
    const signals: ClubSignal[] = []

    if (NAMES[slug].some((n) => wordIn(n, text))) signals.push('name')
    if (URL_TOKENS[slug].some((t) => link.includes(t))) signals.push('url')
    if (club && wordIn(fold(club.stadium), text)) signals.push('stadium')
    if (club && wordIn(fold(club.manager), text)) signals.push('manager')
    if (NICKNAMES[slug].some((n) => wordIn(n, text))) signals.push('nickname')

    if (signals.length) out.push({ slug, signals })
  }
  return out
}

/**
 * The single club this post belongs to, or null.
 *
 * THE RULE, in order:
 *   1. Fewer than two signals -> null. The post keeps club_slug NULL and lands
 *      in the general feed, which is the correct home for anything we cannot
 *      place. Null is a normal outcome, not a failure.
 *   2. Most signals wins. "Bournemouth blow title race wide open with victory
 *      at nervous Arsenal" fires name+stadium+url for Arsenal against name+url
 *      for Bournemouth, and the Arsenal page is where it belongs.
 *   3. A TIE IS NULL. "Sources: Liverpool beat Newcastle to Munoz deal" is two
 *      signals each way and genuinely belongs to both, but club_slug holds one
 *      value. Filing it under the loser's rival is worse than filing it under
 *      neither, so it goes to the general feed. Measured on the live corpus
 *      this nulls 1,071 of the 1,600 multi-club posts — a real cost, paid
 *      deliberately, and recoverable later by a join table rather than by
 *      guessing now.
 */
export function classifyClub(
  title: string | null,
  content: string | null,
  url: string | null,
): string | null {
  const qualified = matchClubs(title, content, url).filter(
    (m) => m.signals.length >= REQUIRED_SIGNALS,
  )
  if (qualified.length === 0) return null
  if (qualified.length === 1) return qualified[0].slug

  const best = Math.max(...qualified.map((m) => m.signals.length))
  const top = qualified.filter((m) => m.signals.length === best)
  return top.length === 1 ? top[0].slug : null
}
