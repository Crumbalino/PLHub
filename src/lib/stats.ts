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
import { getClub } from '@/config/clubs'

/**
 * Start of the current transfer window. Both homepage counts are windowed to it.
 *
 * WHY: unwindowed, `posts` answered 19,356 — and its earliest `published_at` is
 * 2017-05-15, so the archive reaches back nine years, not to February. A
 * five-figure all-time total on a page positioned around the *current* window
 * describes an aggregator's back catalogue, not a transfer window.
 *
 * ⚠ THE DATE ITSELF IS AN ASSUMPTION, NOT A VERIFIED FACT. DESIGN_SYSTEM §16.3
 * governs this and is not in the repo, so I could not read the boundary it
 * specifies. 2026-06-01 is the conventional opening of the English summer
 * window; the actual 2026 date has not been checked against a source and recent
 * seasons have varied (mid-June openings, and a separate early-June mini-window
 * in 2025). Nothing else in the codebase defines a transfer window — the only
 * near-match is `claims.resolution_window_ends`, which is per-claim and
 * unrelated.
 *
 * If §16.3 names a different date, change this one line. Counts measured
 * 7 Aug 2026 for the alternatives, so the cost of being wrong is visible:
 *
 *   since 2026-06-01   8,258 logged / 970 pinned   <- current setting
 *   since 2026-06-14   6,585 logged / 769 pinned
 *   since 2026-07-01   3,898 logged / 603 pinned
 *   all time          19,356 logged / 4,644 pinned  <- what shipped before
 */
export const TRANSFER_WINDOW_OPENED = '2026-06-01'

export interface SiteStats {
  /** Posts published since TRANSFER_WINDOW_OPENED, whatever their source. */
  postsIngested: number
  /**
   * Posts since TRANSFER_WINDOW_OPENED that the two-signal matcher could
   * attribute to exactly one club.
   */
  postsAttributed: number
}

// "Clubs covered" is deliberately NOT here. It is getInScopeClubs().length,
// passed in by the page, so the number and the nav list are the same array
// and cannot drift apart. Counting config entries made it 22 against a nav
// of 18 — both correct, counting different things, and wrong side by side.

export async function getSiteStats(): Promise<SiteStats> {
  try {
    const supabase = createServerClient()

    // Both counts windowed on published_at, not fetched_at: fetched_at is
    // refreshed every time a row reappears in a feed (see issue #51), so a
    // window built on it would pull in years-old stories that were merely
    // re-seen this week.
    const [total, attributed] = await Promise.all([
      supabase
        .from('posts')
        .select('id', { count: 'exact', head: true })
        .gte('published_at', TRANSFER_WINDOW_OPENED),
      supabase
        .from('posts')
        .select('id', { count: 'exact', head: true })
        .gte('published_at', TRANSFER_WINDOW_OPENED)
        .not('club_slug', 'is', null),
    ])

    if (total.error) throw total.error
    if (attributed.error) throw attributed.error

    return {
      postsIngested: total.count ?? 0,
      postsAttributed: attributed.count ?? 0,
    }
  } catch (err) {
    console.error('[stats] Failed to read counts:', err)
    // Degrade to zeros rather than break the page. The facts block hides any
    // figure that is zero, so a failed read shows nothing instead of a lie.
    return { postsIngested: 0, postsAttributed: 0 }
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
