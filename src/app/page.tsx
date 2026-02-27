import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { CLUBS } from '@/lib/clubs'
import ClubSelector from '@/components/ClubSelector'
import PLTable from '@/components/PLTable'
import NextFixtures from '@/components/NextFixtures'
import TrendingStrip from '@/components/trending/TrendingStrip'
import FeedList from '@/components/feed/FeedList'

export const dynamic = 'force-dynamic'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://plhub.co.uk'

export const metadata: Metadata = {
  title: 'PLHub — Premier League News. Right Now.',
  description:
    'The pulse of the Premier League. News and views from all 20 clubs ranked by the community. Transfer rumours, match reports and fan discussion. Updated constantly.',
  alternates: {
    canonical: siteUrl,
  },
}

interface PageProps {
  searchParams: { club?: string }
}

export default async function HomePage({ searchParams }: PageProps) {
  const clubSlug = searchParams.club || null

  return (
    <div className="min-h-screen bg-[#0B1F21]">
      <div className="max-w-[1400px] mx-auto px-4 pt-4">

        {/* ============================================================
            MOBILE: Feed-first layout
            Hero + club badges hidden on mobile. Just the news.
            ============================================================ */}

        {/* Compact club filter — mobile only */}
        <div className="sm:hidden mb-4">
          <ClubSelector currentSlug={clubSlug ?? undefined} />
        </div>

        {/* ============================================================
            DESKTOP: Hero + Club Selector (hidden on mobile)
            ============================================================ */}
        <div className="hidden sm:block">
          {/* Hero SEO Section */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-white">
              The Pulse of the Premier League
            </h1>
            <p className="text-base text-white/60 mt-2">
              AI-powered Premier League news, ranked by what matters
            </p>
          </div>

          {/* Club Selector with badge grid */}
          <section
            className="border-b border-white/10 py-10 text-center mx-auto mb-8"
            style={{
              background:
                'radial-gradient(ellipse at center, #0F2D31 0%, #0B1F21 70%)',
            }}
          >
            <p className="text-sm text-white/60 text-center mb-3">
              Select your club
            </p>

            <div className="mx-auto max-w-4xl px-4 mt-2">
              <div className="flex justify-center mb-4">
                <Link
                  href="/"
                  className={`text-xs font-medium rounded-full px-4 py-1.5 transition-colors ${
                    !clubSlug
                      ? 'bg-white/10 text-white ring-2 ring-[#C4A23E]'
                      : 'text-white bg-white/10 hover:bg-white/20'
                  }`}
                >
                  All
                </Link>
              </div>

              <div className="flex flex-wrap gap-3 justify-center">
                {CLUBS.map((club) => (
                  <Link
                    key={club.slug}
                    href={`/?club=${club.slug}`}
                    className={`w-10 h-10 md:w-9 md:h-9 rounded-full p-1.5 cursor-pointer transition-colors ${
                      clubSlug === club.slug
                        ? 'bg-white/10 ring-2 ring-[#C4A23E]'
                        : 'bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <Image
                      src={club.badgeUrl}
                      alt={club.name}
                      width={28}
                      height={28}
                      unoptimized
                      className="w-full h-full object-contain"
                    />
                  </Link>
                ))}
              </div>
            </div>
          </section>
        </div>

        {/* ============================================================
            THREE COLUMN LAYOUT (desktop) / SINGLE COLUMN (mobile)
            ============================================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_280px] gap-6">
          {/* LEFT SIDEBAR — PL Table (desktop only) */}
          <aside className="hidden lg:block">
            <div className="sticky top-20 space-y-6 max-h-[calc(100vh-6rem)] overflow-y-auto scrollbar-hide">
              <PLTable />
              <div className="bg-[#183538] rounded-xl p-4 text-center text-xs text-white/30 h-[250px] flex items-center justify-center border border-white/5">
                Ad
              </div>
            </div>
          </aside>

          {/* CENTRE — Feed */}
          <main className="min-w-0">
            {/* Trending — only on unfiltered home */}
            {!clubSlug && <TrendingStrip />}

            {/* Divider between trending and feed */}
            {!clubSlug && <hr className="section-divider mb-6" />}

            {/* Club filter indicator */}
            {clubSlug && (
              <div className="flex items-center gap-2 text-sm text-white/80 mb-6">
                <span>
                  Showing:{' '}
                  <span className="font-semibold text-white capitalize">
                    {clubSlug.replace('-', ' ')}
                  </span>
                </span>
                <Link
                  href="/"
                  className="ml-2 text-white/60 hover:text-white transition-colors"
                >
                  ✕ Clear
                </Link>
              </div>
            )}

            {/* Feed */}
            <FeedList club={clubSlug} />

            {/* Mobile: Table + Fixtures below feed */}
            <div className="lg:hidden mt-10 space-y-6">
              <hr className="section-divider" />
              <details className="group">
                <summary className="flex items-center justify-between cursor-pointer py-3">
                  <h3 className="text-sm font-bold text-white">League Table</h3>
                  <span className="text-white/40 text-xs group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <div className="pt-2 pb-4">
                  <PLTable />
                </div>
              </details>
              <details className="group">
                <summary className="flex items-center justify-between cursor-pointer py-3">
                  <h3 className="text-sm font-bold text-white">Upcoming Fixtures</h3>
                  <span className="text-white/40 text-xs group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <div className="pt-2 pb-4">
                  <NextFixtures />
                </div>
              </details>
            </div>
          </main>

          {/* RIGHT SIDEBAR — Fixtures (desktop only) */}
          <aside className="hidden lg:block">
            <div className="sticky top-20 space-y-6 max-h-[calc(100vh-6rem)] overflow-y-auto scrollbar-hide">
              <NextFixtures />
              <div className="bg-[#183538] rounded-xl p-4 text-center text-xs text-white/30 h-[600px] flex items-center justify-center border border-white/5">
                Ad
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
