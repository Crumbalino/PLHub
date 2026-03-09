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
          TWO COLUMN LAYOUT (desktop) / SINGLE COLUMN (mobile)
          ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_35%] gap-8">
        {/* LEFT — Feed (65%) */}
        <main className="min-w-0">
          {/* Reading Progress Zone */}
          <div>
            <ReadingProgressWrapper />
          </div>

          {/* Club Filter Bar */}
          <div className="mt-8">
            <ClubFilterBar currentClub={clubSlug ?? undefined} />
          </div>

          {/* Feed */}
          <div className="mt-8 transition-opacity duration-300" key={clubSlug || 'all'}>
            <FeedList club={clubSlug} />
          </div>
        </main>

        {/* RIGHT — Snapshot (35%, sticky on desktop, stacked on mobile) */}
        <aside className="order-first lg:order-last">
          <div className="lg:sticky lg:top-20">
            {!clubSlug && <SnapshotContainer matchday="Matchday 30" club={clubSlug} />}

            {/* Mobile: Table + Fixtures below snapshot */}
            <div className="lg:hidden mt-8 space-y-6">
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
          </div>
        </aside>
      </div>
    </div>
  );
}
