import type { Metadata } from 'next'
import Link from 'next/link'
import ClubSelectorBar from '@/components/ClubSelectorBar'
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
    <>
      {/* Sticky Club Selector Bar */}
      <ClubSelectorBar currentSlug={clubSlug ?? undefined} />

      <div className="min-h-screen bg-[#0B1F21]">
        <div className="max-w-[1400px] mx-auto px-4 pt-4">

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
    </>
  )
}
