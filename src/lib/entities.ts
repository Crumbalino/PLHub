/**
 * The entity registry — what may live at the root of the site.
 *
 * PAGE_SPEC §1 and THE_FOOTBALL_HUB §5 both put clubs at the root: `/tottenham`,
 * not `/clubs/tottenham-hotspur-news`. That is the right URL and it has a cost —
 * every club slug now competes with every top-level route the site will ever
 * have, and the collision is silent. A club called "Search" would not throw; it
 * would quietly shadow or be shadowed by `/search`, depending on which Next.js
 * resolved first.
 *
 * So the reserved list exists BEFORE the routes do, and a test asserts no club
 * slug appears in it. That check is cheap now and impossible later: once
 * `/transfers` is live and a promoted club needs that slug, one of them has to
 * move, and moving a club URL costs its rankings.
 */

import { CLUBS } from '@/lib/clubs'

/**
 * Top-level paths a club slug may never take.
 *
 * From PAGE_SPEC §1, plus `snapshot` which §1 lists and THE_FOOTBALL_HUB §5
 * omits — the stricter of the two wins, because a name on one list and not the
 * other is exactly the ambiguity this registry exists to remove.
 *
 * This is not the same as "routes that exist". `transfers`, `matches`, `search`
 * and `terms` have no page yet; they are reserved so that building them later
 * is a decision rather than a collision.
 */
export const RESERVED_SLUGS: readonly string[] = [
  'transfers',
  'matches',
  'search',
  'about',
  'how-it-works',
  'privacy',
  'terms',
  'api',
  'snapshot',
  'deadline-day',
] as const

const RESERVED = new Set(RESERVED_SLUGS)

/** The homepage entity. Not a club — the league itself. */
export const HOMEPAGE_ENTITY = 'premier-league'

/** True when a slug is claimed by the site rather than available to a club. */
export function isReserved(slug: string): boolean {
  return RESERVED.has(slug.toLowerCase())
}

/** Every club slug, from the one registry that already exists. */
export function clubSlugs(): string[] {
  return CLUBS.map((c) => c.slug).sort()
}

/**
 * Every entity with a page: the clubs plus the league.
 *
 * §1 calls this twenty-one URLs. It is twenty clubs and one league, and it
 * comes from `CLUBS` rather than a second hand-written list — two lists of
 * clubs is how they drift.
 */
export function entitySlugs(): string[] {
  return [HOMEPAGE_ENTITY, ...clubSlugs()]
}

/** True when a slug has an entity page. */
export function isEntity(slug: string): boolean {
  const s = slug.toLowerCase()
  return s === HOMEPAGE_ENTITY || clubSlugs().includes(s)
}

/**
 * True for the league entity.
 *
 * The league has no squad, no fixture and no form, so most blocks have nothing
 * to feed them. What it does have is the table, and §7.7 says it shows the top
 * six rather than a window around itself — it has no position to be at the
 * centre of.
 */
export function isHomepageEntity(slug: string): boolean {
  return slug.toLowerCase() === HOMEPAGE_ENTITY
}
