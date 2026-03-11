'use client';
import YourVerdict from '../YourVerdict';
import { type ReactionIdx } from '@/lib/reactions';

const TEAL = '#3AAFA9';
const WHITE = '#F8F9FB';
const W70 = 'rgba(248,249,251,0.7)';

interface StatCardProps {
  id: string;
  stat: string;
  value: string | number;
  label: string;
  context?: string;
}

export default function StatCard({ id, stat, value, label, context }: StatCardProps) {
  const handleVote = (reactionIdx: ReactionIdx) => {
    console.log(`[StatCard] Voted with reaction ${reactionIdx}`);
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
        {/* Stat Header */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '12px' }}>
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '32px',
              fontWeight: 700,
              color: TEAL,
              lineHeight: 1,
            }}
          >
            {value}
          </span>
          <span
            style={{
              fontFamily: "'Sora', sans-serif",
              fontSize: '12px',
              fontWeight: 500,
              color: W70,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            {stat}
          </span>
        </div>

        {/* Label */}
        <div style={{ marginBottom: context ? '16px' : '0' }}>
          <p
            style={{
              fontFamily: "'Sora', sans-serif",
              fontSize: '14px',
              color: WHITE,
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            {label}
          </p>
        </div>

        {/* Context */}
        {context && (
          <p
            style={{
              fontFamily: "'Sora', sans-serif",
              fontSize: '12px',
              color: W70,
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            {context}
          </p>
        )}

        {/* Verdict */}
        <YourVerdict cardId={id} onVote={handleVote} />
      </div>
    </div>
  );
}
