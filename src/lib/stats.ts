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
import { getAllClubSlugs } from '@/config/clubs'

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
