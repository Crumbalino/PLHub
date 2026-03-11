'use client';
import YourVerdict from '../YourVerdict';
import { type ReactionIdx } from '@/lib/reactions';

const PINK = '#E84080';
const WHITE = '#F8F9FB';
const W70 = 'rgba(248,249,251,0.7)';

interface TriviaCardProps {
  id: string;
  fact: string;
  title: string;
}

export default function TriviaCard({ id, fact, title }: TriviaCardProps) {
  const handleVote = (reactionIdx: ReactionIdx) => {
    console.log(`[TriviaCard] Voted with reaction ${reactionIdx}`);
  };

  return (
    <div
      style={{
        borderRadius: '10px',
        background: 'var(--plh-card)',
        border: '1px solid var(--plh-border)',
        overflow: 'hidden',
        animation: 'tfhSlideUp 0.5s ease-out',
      }}
    >
      <div style={{ padding: '24px' }}>
        {/* Icon / Badge */}
        <div style={{ marginBottom: '16px' }}>
          <span style={{ fontSize: '28px' }}>🎯</span>
        </div>

        {/* Title */}
        <div style={{ marginBottom: '12px' }}>
          <span
            style={{
              fontFamily: "'Sora', sans-serif",
              fontSize: '11px',
              fontWeight: 600,
              color: PINK,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            Did You Know?
          </span>
        </div>

        {/* Fact */}
        <p
          style={{
            fontFamily: "'Sora', sans-serif",
            fontSize: '14px',
            color: WHITE,
            margin: '0 0 12px 0',
            lineHeight: 1.6,
          }}
        >
          {fact}
        </p>

        {/* Subtext */}
        <p
          style={{
            fontFamily: "'Sora', sans-serif",
            fontSize: '12px',
            color: W70,
            margin: '0 0 16px 0',
            lineHeight: 1.4,
          }}
        >
          {title}
        </p>

        {/* Verdict */}
        <YourVerdict cardId={id} onVote={handleVote} />
      </div>
    </div>
  );
}
