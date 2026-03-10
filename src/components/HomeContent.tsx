import FeedList from '@/components/feed/FeedList';
import SnapshotContainer from '@/components/snapshot/SnapshotContainer';
import ClubFilterBar from '@/components/ClubFilterBar';

interface HomeContentProps {
  clubSlug: string | null;
}

export default function HomeContent({ clubSlug }: HomeContentProps) {
  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px 24px 80px' }}>
      <style>{`
        .tfh-layout { display: grid; grid-template-columns: 1fr; gap: 32px; }
        @media (min-width: 1024px) {
          .tfh-layout { grid-template-columns: 1fr 380px; }
          .tfh-feed { order: 1; }
          .tfh-snapshot { order: 2; }
        }
      `}</style>

      <div className="tfh-layout">
        <main className="tfh-feed" style={{ minWidth: 0 }}>
          <div style={{ marginBottom: '24px' }}>
            <ClubFilterBar currentClub={clubSlug ?? undefined} />
          </div>
          <FeedList club={clubSlug} />
        </main>

        <aside className="tfh-snapshot">
          <div style={{ position: 'sticky', top: '80px', maxHeight: 'calc(100vh - 100px)', overflowY: 'auto' }}>
            {!clubSlug && <SnapshotContainer />}
          </div>
        </aside>
      </div>
    </div>
  );
}
