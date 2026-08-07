// Plain server-rendered facts, directly below the hero.
//
// Why it exists: AI crawlers enter on the homepage roughly a fifth of the
// time, and the hero is four elements with nothing citable on it. This block
// is the first thing on the page that states what the site is and shows real,
// current content — as ordinary HTML in the initial response, not fetched
// after hydration.
//
// Deliberately plain markup: a paragraph, a list of headlines with real
// links, and a short definition list of numbers. No client JavaScript, no
// carousel, nothing that needs hydration to read.

import type { FeedPost } from '@/lib/types'
import type { SiteStats } from '@/lib/stats'

interface FactsBlockProps {
  latest: FeedPost[]
  stats: SiteStats
  /** getInScopeClubs().length — the same array the nav renders. */
  clubsCovered: number
}

const fmt = (n: number) => n.toLocaleString('en-GB')

export default function FactsBlock({ latest, stats, clubsCovered }: FactsBlockProps) {
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

      {latest.length > 0 && (
        <>
          <h3 className="tfh-facts-subtitle">
            Latest
          </h3>
          <ul className="tfh-facts-list">
            {latest.slice(0, 3).map((post) => (
              <li key={post.id}>
                <a href={post.url ?? '#'} rel="noopener noreferrer nofollow" target="_blank">
                  {post.title}
                </a>
                {post.sourceInfo?.name && (
                  <span className="tfh-facts-source"> — {post.sourceInfo.name}</span>
                )}
              </li>
            ))}
          </ul>
        </>
      )}

      {/* Any figure that failed to read comes back as 0 and is omitted rather
          than printed as a zero, which would read as a claim. */}
      <dl className="tfh-facts-numbers">
        {stats.postsIngested > 0 && (
          <div>
            <dt>Stories logged</dt>
            <dd>{fmt(stats.postsIngested)}</dd>
          </div>
        )}
        {stats.postsAttributed > 0 && (
          <div>
            <dt>Pinned to a club</dt>
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
