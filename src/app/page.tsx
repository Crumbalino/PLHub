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
// getFeed() is NO LONGER called here. It existed to feed FactsBlock's "Latest"
// list, which was removed rather than hidden: it put raw ingest directly under
// "Some of this is true.", so whatever the feed returned became the site's first
// editorial statement — on removal day, a death story. The homepage does not
// render ingest. See FactsBlock.tsx.
//
// This page now reads only aggregate counts and the club list, so nothing on it
// can be surprised by an individual story.
// ─────────────────────────────────────────────────────────────────

import type { Metadata } from 'next'
import { SITE_URL } from '@/lib/site'
import Hero from '@/components/home/Hero'
import FactsBlock from '@/components/home/FactsBlock'
import SiteNav from '@/components/home/SiteNav'
import { getSiteStats, getInScopeClubs } from '@/lib/stats'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  alternates: { canonical: '/' },
  title: 'The Football Hub',
  description: 'Transfer gossip. Scored.',
}

export default async function HomePage() {
  const [stats, navClubs] = await Promise.all([
    getSiteStats(),
    getInScopeClubs(),
  ])

  return (
    <div className="tfh-home">
      <Hero />
      <FactsBlock stats={stats} clubsCovered={navClubs.length} />
      <SiteNav clubs={navClubs} />
    </div>
  )
}
