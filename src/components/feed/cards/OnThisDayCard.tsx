'use client';
import YourVerdict from '../YourVerdict';
import { type ReactionIdx } from '@/lib/reactions';

const GOLD = '#D4A843';
const WHITE = '#F8F9FB';
const W70 = 'rgba(248,249,251,0.7)';

interface OnThisDayCardProps {
  id: string;
  date: string;
  event: string;
  teams?: string;
  year?: number;
}

export default function OnThisDayCard({
  id,
  date,
  event,
  teams,
  year,
}: OnThisDayCardProps) {
  const handleVote = (reactionIdx: ReactionIdx) => {
    console.log(`[OnThisDayCard] Voted with reaction ${reactionIdx}`);
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
        {/* Header */}
        <div style={{ marginBottom: '16px' }}>
          <span
            style={{
              fontFamily: "'Sora', sans-serif",
              fontSize: '11px',
              fontWeight: 600,
              color: GOLD,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            On This Day
          </span>
          {year && (
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '11px',
                color: W70,
                marginLeft: '8px',
              }}
            >
              {year}
            </span>
          )}
        </div>

        {/* Date Display */}
        <div style={{ marginBottom: '12px' }}>
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '24px',
              fontWeight: 700,
              color: GOLD,
              lineHeight: 1,
            }}
          >
            {date}
          </span>
        </div>

        {/* Event */}
        <p
          style={{
            fontFamily: "'Sora', sans-serif",
            fontSize: '14px',
            color: WHITE,
            margin: '0 0 12px 0',
            lineHeight: 1.6,
          }}
        >
          {event}
        </p>

        {/* Teams */}
        {teams && (
          <p
            style={{
              fontFamily: "'Sora', sans-serif",
              fontSize: '12px',
              color: W70,
              margin: '0 0 16px 0',
              lineHeight: 1.4,
            }}
          >
            {teams}
          </p>
        )}

        {/* Verdict */}
        <YourVerdict cardId={id} onVote={handleVote} />
      </div>
    </div>
  );
}
