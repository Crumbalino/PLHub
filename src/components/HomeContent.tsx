import ClubFilterBar from '@/components/ClubFilterBar';
import PLTable from '@/components/PLTable';
import NextFixtures from '@/components/NextFixtures';
import FeedList from '@/components/feed/FeedList';
import SnapshotContainer from '@/components/snapshot/SnapshotContainer';
import ReadingProgressWrapper from '@/components/ReadingProgressWrapper';

interface HomeContentProps {
  clubSlug: string | null;
}

export default function HomeContent({ clubSlug }: HomeContentProps) {

  return (
    <div className="max-w-[1400px] mx-auto px-4 pt-8">
      {/* ============================================================
          THREE COLUMN LAYOUT (desktop) / SINGLE COLUMN (mobile)
          ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_280px] gap-6">
        {/* LEFT SIDEBAR — PL Table (desktop only) */}
        <aside className="hidden lg:block">
          <div className="space-y-6">
            <PLTable />
            <div
              className="rounded-[10px] p-4 text-center text-xs h-[250px] flex items-center justify-center"
              style={{
                background: 'var(--plh-card)',
                border: '1px solid var(--plh-border)',
                color: 'var(--plh-text-40)',
              }}
            >
              Ad
            </div>
          </div>
        </aside>

        {/* CENTRE — Feed */}
        <main className="min-w-0">
          {/* The Snapshot Container */}
          {!clubSlug && <SnapshotContainer matchday="Matchday 30" club={clubSlug} />}

          {/* Reading Progress Zone */}
          <div className="mt-8">
            <ReadingProgressWrapper />
          </div>

          {/* Club Filter Bar — between Snapshot and Feed */}
          <div className="mt-8">
            <ClubFilterBar currentClub={clubSlug ?? undefined} />
          </div>

          {/* Feed with fade transition — tight spacing above */}
          <div className="mt-8 transition-opacity duration-300" key={clubSlug || 'all'}>
            <FeedList club={clubSlug} />
          </div>

          {/* Mobile: Table + Fixtures below feed */}
          <div className="lg:hidden mt-10 space-y-6">
            <hr className="section-divider" />
            <details className="group">
              <summary className="flex items-center justify-between cursor-pointer py-3">
                <h3 className="text-sm font-bold" style={{ color: 'var(--plh-text-100)' }}>
                  League Table
                </h3>
                <span
                  className="text-xs group-open:rotate-180 transition-transform"
                  style={{ color: 'var(--plh-text-40)' }}
                >
                  ▼
                </span>
              </summary>
              <div className="pt-2 pb-4">
                <PLTable />
              </div>
            </details>
            <details className="group">
              <summary className="flex items-center justify-between cursor-pointer py-3">
                <h3 className="text-sm font-bold" style={{ color: 'var(--plh-text-100)' }}>
                  Upcoming Fixtures
                </h3>
                <span
                  className="text-xs group-open:rotate-180 transition-transform"
                  style={{ color: 'var(--plh-text-40)' }}
                >
                  ▼
                </span>
              </summary>
              <div className="pt-2 pb-4">
                <NextFixtures />
              </div>
            </details>
          </div>
        </main>

        {/* RIGHT SIDEBAR — Fixtures (desktop only) */}
        <aside className="hidden lg:block">
          <div className="space-y-6">
            <NextFixtures />
            <div
              className="rounded-[10px] p-4 text-center text-xs h-[600px] flex items-center justify-center"
              style={{
                background: 'var(--plh-card)',
                border: '1px solid var(--plh-border)',
                color: 'var(--plh-text-40)',
              }}
            >
              Ad
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
