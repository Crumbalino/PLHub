'use client';
import { useState } from 'react';
import { useFeed } from '@/hooks/useFeed';
import StoryCard from './StoryCard';
import type { SortMode } from '@/lib/types';

const TEAL = '#3AAFA9';
const WHITE = '#F8F9FB';
const W70 = 'rgba(248,249,251,0.7)';

function trackExpand(postId: string, totalPosts: number) {
  try {
    const today = new Date().toDateString();
    const raw = localStorage.getItem('tfh_progress');
    const data = raw ? JSON.parse(raw) : null;
    const existing: string[] = data?.date === today ? data.expanded : [];
    if (!existing.includes(postId)) {
      localStorage.setItem('tfh_progress', JSON.stringify({
        date: today, expanded: [...existing, postId], total: totalPosts,
      }));
      window.dispatchEvent(new Event('tfh_progress_update'));
    }
  } catch {}
}

export default function FeedList({ club = null }: { club?: string | null }) {
  const [sortMode, setSortMode] = useState<SortMode>('pulse');
  const [fading, setFading] = useState(false);
  const { posts, isLoading, isLoadingMore, loadMore, hasMore } = useFeed({ club, sortMode });

  function toggleSort() {
    setFading(true);
    setTimeout(() => { setSortMode(s => s === 'pulse' ? 'new' : 'pulse'); setFading(false); }, 150);
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '20px', borderLeft: `3px solid ${TEAL}`, paddingLeft: '12px' }}>
        <h2 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: '18px', color: WHITE, margin: 0, opacity: fading ? 0 : 1, transition: 'opacity 0.15s ease' }}>
          {sortMode === 'pulse' ? 'Ranked by the Hub Index' : 'Latest stories'}
        </h2>
        <button onClick={toggleSort} style={{ fontFamily: "'Sora', sans-serif", fontSize: '12px', fontWeight: 500, color: TEAL, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          {sortMode === 'pulse' ? 'show latest' : 'rank by index'}
        </button>
      </div>

      {isLoading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} style={{ borderRadius: '10px', height: '90px', background: 'var(--plh-card)', border: '1px solid var(--plh-border)', animation: 'tfhPulse 1.8s ease-in-out infinite', animationDelay: `${i * 120}ms` }} />
          ))}
          <style>{`@keyframes tfhPulse { 0%,100%{opacity:0.4} 50%{opacity:0.15} }`}</style>
        </div>
      )}

      {!isLoading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }} key={`${sortMode}-${club}`}>
          {posts.map((post, idx) => (
            <StoryCard key={post.id} post={post} index={idx} onExpand={() => trackExpand(post.id, posts.length)} />
          ))}
        </div>
      )}

      {!isLoading && posts.length === 0 && (
        <div style={{ textAlign: 'center', padding: '64px 24px', border: '1px dashed rgba(248,249,251,0.1)', borderRadius: '10px' }}>
          <p style={{ fontFamily: "'Sora', sans-serif", color: W70, fontSize: '14px' }}>No stories yet. Check back soon.</p>
        </div>
      )}

      {!isLoading && hasMore && posts.length > 0 && (
        <div style={{ textAlign: 'center', marginTop: '32px' }}>
          <button onClick={loadMore} disabled={isLoadingMore} style={{ fontFamily: "'Sora', sans-serif", fontSize: '13px', fontWeight: 600, color: TEAL, background: 'none', border: `1px solid ${TEAL}40`, borderRadius: '8px', padding: '10px 28px', cursor: isLoadingMore ? 'default' : 'pointer', opacity: isLoadingMore ? 0.5 : 1 }}>
            {isLoadingMore ? 'Loading…' : 'Load more stories'}
          </button>
        </div>
      )}
    </div>
  );
}
