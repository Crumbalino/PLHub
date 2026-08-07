// ============================================================
// Running aggregate numbers for the homepage facts block.
//
// Server-only, two cheap count queries. These exist so the homepage has
// something concrete and citable in the HTML a crawler receives — the hero
// above it is deliberately four elements and carries no facts at all.
//
// Counts are read live on every request. A number in a doc is a timestamped
// reading, not a fact (see CLAUDE.md); the same is true on a page, so these
// must never be hardcoded or cached into staleness.
// ============================================================

import { createServerClient } from '@/lib/supabase'
import { getAllClubSlugs, getClub } from '@/config/clubs'

export interface SiteStats {
  /** Every row in posts, whatever its source or classification. */
  postsIngested: number
  /** Posts the two-signal matcher could attribute to exactly one club. */
  postsAttributed: number
  /** Club pages that exist. Derived from config, not from the database. */
  clubsCovered: number
}

export async function getSiteStats(): Promise<SiteStats> {
  const clubsCovered = getAllClubSlugs().length

  try {
    const supabase = createServerClient()

    const [total, attributed] = await Promise.all([
      supabase.from('posts').select('id', { count: 'exact', head: true }),
      supabase
        .from('posts')
        .select('id', { count: 'exact', head: true })
        .not('club_slug', 'is', null),
    ])

    if (total.error) throw total.error
    if (attributed.error) throw attributed.error

    return {
      postsIngested: total.count ?? 0,
      postsAttributed: attributed.count ?? 0,
      clubsCovered,
    }
  } catch (err) {
    console.error('[stats] Failed to read counts:', err)
    // Degrade to zeros rather than break the page. The facts block hides any
    // figure that is zero, so a failed read shows nothing instead of a lie.
    return { postsIngested: 0, postsAttributed: 0, clubsCovered }
  }
}

export interface NavClub {
  slug: string
  name: string
}

/**
 * The clubs the homepage links to: currently in the Premier League AND
 * having a page.
 *
 * in_scope lives in the database, not in src/config/clubs.ts, so the source
 * of truth for "is this club in the league right now" is queried rather than
 * duplicated — this list corrects itself on promotion and relegation without
 * a code change.
 *
 * Intersected with the config because a clubs row without a config entry has
 * no page: /clubs/<slug> would 404. Linking to a 404 from the homepage is
 * worse than omitting the club, so a row we cannot render is skipped.
 */
export async function getInScopeClubs(): Promise<NavClub[]> {
  try {
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('clubs')
      .select('slug')
      .eq('in_scope', true)
      .order('slug')

    if (error) throw error

    return (data ?? [])
      .map((row) => {
        const club = getClub(row.slug)
        return club ? { slug: row.slug, name: club.shortName } : null
      })
      .filter((c): c is NavClub => c !== null)
      .sort((a, b) => a.name.localeCompare(b.name, 'en-GB'))
  } catch (err) {
    console.error('[stats] Failed to read in-scope clubs:', err)
    return []
  }
}
