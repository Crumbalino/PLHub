// ─────────────────────────────────────────────────────────────────
// Homepage. Server component.
//
// Was a 'use client' page carrying a hardcoded PLACEHOLDER_FEED of five fake
// stories with picsum.photos images, which it tried to replace after
// hydration. That meant the homepage shipped invented headlines and made a
// third-party image request on every visit. All of it is gone: real content
// or nothing.
//
// Order is fixed:
//   1. Hero          — locked, four elements, sized to fit a 6" screen
//   2. FactsBlock    — plain server HTML, for crawlers entering here
//   3. SiteNav       — the club list
//
// HomeContent is deliberately NOT rendered here. It was restored on 7 Aug after
// five months unplugged and shipped ~30 screens of stacked full-bleed images, a
// white ground overriding the dark theme, empty widget containers and horse
// racing — on the day the site went indexable. Its design tokens are undefined
// in the live DOM: the March migration from CSS custom properties to inline TS
// tokens ran through StoryCard, SnapshotContainer, PLTable, fixtures and
// ClubFilterBar, then stopped before reaching it. An undefined token renders
// invisibly and passes every build check, so `npm run build` proves nothing.
// The component file stays — it is the input to the homepage rebuild, which is
// blocked on ten hand-written column items. Do not re-plug it here.
//
// getFeed() is still called: FactsBlock needs the three latest posts. Same
// treatment as the club page — called directly, never this app's own API route.
// ─────────────────────────────────────────────────────────────────

import type { Metadata } from 'next'
import { SITE_URL } from '@/lib/site'
import Hero from '@/components/home/Hero'
import FactsBlock from '@/components/home/FactsBlock'
import SiteNav from '@/components/home/SiteNav'
import { getFeed, emptyFeed } from '@/lib/feed'
import { getSiteStats, getInScopeClubs } from '@/lib/stats'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  alternates: { canonical: '/' },
  title: 'The Football Hub',
  description: 'Transfer gossip. Scored.',
}

export default async function HomePage() {
  const [feed, stats, navClubs] = await Promise.all([
    getFeed({ club: null, sort: 'pulse', page: 1, limit: 20 }).catch((err) => {
      console.error('[home] feed failed:', err)
      return emptyFeed()
    }),
    getSiteStats(),
    getInScopeClubs(),
  ])

  return (
    <div className="tfh-home">
      <Hero />
      <FactsBlock
        latest={feed.posts.slice(0, 3)}
        stats={stats}
        clubsCovered={navClubs.length}
      />
      <SiteNav clubs={navClubs} />
    </div>
  )
}
