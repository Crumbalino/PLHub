'use client';
import YourVerdict from '../YourVerdict';
import { type ReactionIdx } from '@/lib/reactions';

const TEAL = '#3AAFA9';
const WHITE = '#F8F9FB';
const W70 = 'rgba(248,249,251,0.7)';

interface FixtureCardProps {
  id: string;
  homeTeam: string;
  awayTeam: string;
  date: string;
  time?: string;
  status: 'upcoming' | 'live' | 'finished';
  homeScore?: number;
  awayScore?: number;
}

export default function FixtureCard({
  id,
  homeTeam,
  awayTeam,
  date,
  time,
  status,
  homeScore,
  awayScore,
}: FixtureCardProps) {
  const handleVote = (reactionIdx: ReactionIdx) => {
    console.log(`[FixtureCard] Voted with reaction ${reactionIdx}`);
  };

  const isFinished = status === 'finished';
  const isLive = status === 'live';

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
        {/* Status Badge */}
        <div style={{ marginBottom: '16px' }}>
          <span
            style={{
              fontFamily: "'Sora', sans-serif",
              fontSize: '9px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '1px',
              color: isLive ? '#E8622A' : isFinished ? TEAL : W70,
              padding: '4px 8px',
              borderRadius: '4px',
              background: isLive ? 'rgba(232,98,42,0.1)' : isFinished ? 'rgba(58,175,169,0.1)' : 'rgba(248,249,251,0.05)',
              border: `1px solid ${
                isLive ? 'rgba(232,98,42,0.2)' : isFinished ? 'rgba(58,175,169,0.2)' : 'rgba(248,249,251,0.1)'
              }`,
            }}
          >
            {isLive ? '🔴 Live' : isFinished ? 'Final' : 'Upcoming'}
          </span>
        </div>

        {/* Date & Time */}
        <div style={{ marginBottom: '18px' }}>
          <p
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '11px',
              color: W70,
              margin: 0,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            {date}
            {time && ` • ${time}`}
          </p>
        </div>

        {/* Match Score/Teams */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
          {/* Home Team */}
          <div style={{ flex: 1, textAlign: 'center' }}>
            <p
              style={{
                fontFamily: "'Sora', sans-serif",
                fontSize: '13px',
                fontWeight: 600,
                color: WHITE,
                margin: '0 0 4px 0',
              }}
            >
              {homeTeam}
            </p>
            {isFinished && typeof homeScore === 'number' && (
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '20px',
                  fontWeight: 700,
                  color: TEAL,
                }}
              >
                {homeScore}
              </span>
            )}
          </div>

          {/* VS / Score Separator */}
          <div style={{ textAlign: 'center' }}>
            {isFinished ? (
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '12px',
                  color: W70,
                }}
              >
                vs
              </span>
            ) : (
              <span
                style={{
                  fontFamily: "'Sora', sans-serif",
                  fontSize: '11px',
                  color: W70,
                  textTransform: 'uppercase',
                  fontWeight: 600,
                }}
              >
                VS
              </span>
            )}
          </div>

          {/* Away Team */}
          <div style={{ flex: 1, textAlign: 'center' }}>
            <p
              style={{
                fontFamily: "'Sora', sans-serif",
                fontSize: '13px',
                fontWeight: 600,
                color: WHITE,
                margin: '0 0 4px 0',
              }}
            >
              {awayTeam}
            </p>
            {isFinished && typeof awayScore === 'number' && (
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '20px',
                  fontWeight: 700,
                  color: TEAL,
                }}
              >
                {awayScore}
              </span>
            )}
          </div>
        </div>

        {/* Verdict */}
        <YourVerdict cardId={id} onVote={handleVote} />
      </div>
    </div>
  );
}
