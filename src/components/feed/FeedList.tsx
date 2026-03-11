'use client';
import { useState } from 'react';
import { useFeed } from '@/hooks/useFeed';
import StoryCard from './StoryCard';
import StatCard from './cards/StatCard';
import TriviaCard from './cards/TriviaCard';
import OnThisDayCard from './cards/OnThisDayCard';
import QuoteCard from './cards/QuoteCard';
import FixtureCard from './cards/FixtureCard';
import type { SortMode, FeedPost } from '@/lib/types';

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

function renderCardByType(post: FeedPost, idx: number, onExpand: () => void) {
  // If post has a card_type, render specialized card
  if (post.card_type === 'stat' && post.card_data) {
    const data = post.card_data as any;
    return (
      <StatCard
        key={post.id}
        id={post.id}
        stat={data.stat || ''}
        value={data.value || 0}
        label={data.label || ''}
        context={data.context}
      />
    );
  }

  if (post.card_type === 'trivia' && post.card_data) {
    const data = post.card_data as any;
    return (
      <TriviaCard
        key={post.id}
        id={post.id}
        fact={data.fact || ''}
        title={data.title || ''}
      />
    );
  }

  if (post.card_type === 'on-this-day' && post.card_data) {
    const data = post.card_data as any;
    return (
      <OnThisDayCard
        key={post.id}
        id={post.id}
        date={data.date || ''}
        event={data.event || ''}
        teams={data.teams}
        year={data.year}
      />
    );
  }

  if (post.card_type === 'quote' && post.card_data) {
    const data = post.card_data as any;
    return (
      <QuoteCard
        key={post.id}
        id={post.id}
        quote={data.quote || ''}
        author={data.author || ''}
        context={data.context}
      />
    );
  }

  if (post.card_type === 'fixture' && post.card_data) {
    const data = post.card_data as any;
    return (
      <FixtureCard
        key={post.id}
        id={post.id}
        homeTeam={data.homeTeam || ''}
        awayTeam={data.awayTeam || ''}
        date={data.date || ''}
        time={data.time}
        status={data.status || 'upcoming'}
        homeScore={data.homeScore}
        awayScore={data.awayScore}
      />
    );
  }

  // Default: render StoryCard
  return (
    <StoryCard
      key={post.id}
      post={post}
      index={idx}
      onExpand={onExpand}
    />
  );
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
          {posts.map((post, idx) =>
            renderCardByType(post, idx, () => trackExpand(post.id, posts.length))
          )}
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
