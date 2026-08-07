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
//   3. HomeContent   — the real feed, restored; it was built and unplugged
//
// Page 1 of the feed is fetched HERE and passed down, same treatment as the
// club page: getFeed() called directly, never this app's own API route.
// ─────────────────────────────────────────────────────────────────

import type { Metadata } from 'next'
import { SITE_URL } from '@/lib/site'
import Hero from '@/components/home/Hero'
import FactsBlock from '@/components/home/FactsBlock'
import HomeContent from '@/components/HomeContent'
import { getFeed, emptyFeed } from '@/lib/feed'
import { getSiteStats } from '@/lib/stats'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  alternates: { canonical: '/' },
  title: 'The Football Hub',
  description: 'Transfer gossip. Scored.',
}

export default async function HomePage() {
  const [feed, stats] = await Promise.all([
    getFeed({ club: null, sort: 'pulse', page: 1, limit: 20 }).catch((err) => {
      console.error('[home] feed failed:', err)
      return emptyFeed()
    }),
    getSiteStats(),
  ])

  return (
    <div className="tfh-home">
      <Hero />
      <FactsBlock latest={feed.posts.slice(0, 3)} stats={stats} />
      <HomeContent
        clubSlug={null}
        initialPosts={feed.posts}
        initialHasMore={feed.hasMore}
      />
    </div>
  )
}
