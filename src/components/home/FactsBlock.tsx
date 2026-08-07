// Plain server-rendered facts, directly below the hero.
//
// Why it exists: AI crawlers enter on the homepage roughly a fifth of the
// time, and the hero is four elements with nothing citable on it. This block
// states what the site is, as ordinary HTML in the initial response.
//
// A "Latest" list of the three newest headlines used to sit between the lede
// and the numbers. IT WAS REMOVED, NOT HIDDEN — do not restore it. It rendered
// raw ingest directly under "Some of this is true.", unscored and uncurated,
// so whatever the feed happened to return became the site's first editorial
// statement. On the day it was removed that included "Perimeter walls around
// pitches banned after Vigar death" — a death, sitting under the hero line, on
// a page whose whole claim is that it scores how well-sourced a rumour is.
//
// The homepage does not show ingest. When there is something to show it will be
// the column: hand-picked items with a score, at one permanent URL.
//
// Deliberately plain markup: a paragraph and a short definition list of
// numbers. No client JavaScript, nothing that needs hydration to read.

import type { SiteStats } from '@/lib/stats'

interface FactsBlockProps {
  stats: SiteStats
  /** getInScopeClubs().length — the same array the nav renders. */
  clubsCovered: number
}

const fmt = (n: number) => n.toLocaleString('en-GB')

export default function FactsBlock({ stats, clubsCovered }: FactsBlockProps) {
  return (
    <section className="tfh-facts" aria-labelledby="tfh-facts-title">
      <h2 id="tfh-facts-title" className="tfh-facts-title">
        What this is
      </h2>

      <p className="tfh-facts-lede">
        The Football Hub logs Premier League transfer rumours and scores how
        well each one is sourced. Not whether it will happen — how much is
        behind it. Every claim keeps the outlet that published it, the wording
        they hedged with, and whoever they credited.
      </p>

      {/* Any figure that failed to read comes back as 0 and is omitted rather
          than printed as a zero, which would read as a claim. */}
      <dl className="tfh-facts-numbers">
        {/* Labels say "this window" because the counts are windowed to
            TRANSFER_WINDOW_OPENED. "Stories logged" unqualified read as an
            all-time archive figure, which is what it was. If the window is ever
            removed, these labels have to change back in the same commit. */}
        {stats.postsIngested > 0 && (
          <div>
            <dt>Stories logged this window</dt>
            <dd>{fmt(stats.postsIngested)}</dd>
          </div>
        )}
        {stats.postsAttributed > 0 && (
          <div>
            <dt>Pinned to a club this window</dt>
            <dd>{fmt(stats.postsAttributed)}</dd>
          </div>
        )}
        {clubsCovered > 0 && (
          <div>
            <dt>Clubs covered</dt>
            <dd>{fmt(clubsCovered)}</dd>
          </div>
        )}
      </dl>
    </section>
  )
}
