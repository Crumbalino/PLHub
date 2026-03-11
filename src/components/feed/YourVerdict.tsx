'use client';
import { useState, useEffect } from 'react';
import { REACTIONS, type ReactionIdx, type VerdictPhase } from '@/lib/reactions';

const TEAL = '#3AAFA9';
const PINK = '#E84080';
const WHITE = '#F8F9FB';
const W70 = 'rgba(248,249,251,0.7)';

interface VoteCount {
  reaction_idx: ReactionIdx;
  count: number;
}

interface YourVerdictProps {
  cardId: string;
  onVote?: (reactionIdx: ReactionIdx) => void;
}

export default function YourVerdict({ cardId, onVote }: YourVerdictProps) {
  const [phase, setPhase] = useState<VerdictPhase>('idle');
  const [votes, setVotes] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(false);
  const [voted, setVoted] = useState(false);

  // Fetch initial vote counts
  useEffect(() => {
    const fetchVotes = async () => {
      try {
        const res = await fetch(`/api/reactions/${cardId}`);
        if (res.ok) {
          const data = await res.json();
          setVotes(data.reactions || {});
        }
      } catch (err) {
        console.error('[YourVerdict] Failed to fetch votes:', err);
      }
    };

    fetchVotes();
  }, [cardId]);

  const handleReactionClick = async (reactionIdx: ReactionIdx) => {
    if (loading || voted) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/reactions/${cardId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reactionIdx }),
      });

      if (res.ok) {
        const data = await res.json();
        setVotes(prev => ({
          ...prev,
          [reactionIdx]: data.count,
        }));
        setPhase('voted');
        setVoted(true);
        onVote?.(reactionIdx);
      }
    } catch (err) {
      console.error('[YourVerdict] Failed to post reaction:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenVerdict = () => {
    setPhase('picking');
  };

  const handleCancel = () => {
    setPhase('idle');
  };

  // Idle state: collapsed prompt
  if (phase === 'idle') {
    return (
      <div
        onClick={handleOpenVerdict}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 14px',
          marginTop: '14px',
          borderRadius: '6px',
          background: 'rgba(58,175,169,0.08)',
          border: `1px solid ${TEAL}30`,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={e => {
          if (e.currentTarget instanceof HTMLElement) {
            e.currentTarget.style.background = 'rgba(58,175,169,0.12)';
            e.currentTarget.style.borderColor = `${TEAL}50`;
          }
        }}
        onMouseLeave={e => {
          if (e.currentTarget instanceof HTMLElement) {
            e.currentTarget.style.background = 'rgba(58,175,169,0.08)';
            e.currentTarget.style.borderColor = `${TEAL}30`;
          }
        }}
      >
        <span
          style={{
            fontFamily: "'Sora', sans-serif",
            fontSize: '12px',
            fontWeight: 600,
            color: TEAL,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          Your verdict?
        </span>
        <span style={{ color: W70, fontSize: '12px' }}>→</span>
      </div>
    );
  }

  // Picking state: show emoji buttons
  if (phase === 'picking') {
    return (
      <div
        style={{
          padding: '14px',
          marginTop: '14px',
          borderRadius: '8px',
          background: 'rgba(58,175,169,0.06)',
          border: `1px solid ${TEAL}40`,
          animation: 'tfhSlideUp 0.25s ease-out',
        }}
      >
        <div style={{ marginBottom: '10px' }}>
          <span
            style={{
              fontFamily: "'Sora', sans-serif",
              fontSize: '11px',
              fontWeight: 600,
              color: W70,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            Pick one
          </span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: '8px',
            marginBottom: '12px',
          }}
        >
          {REACTIONS.map(reaction => (
            <button
              key={reaction.id}
              onClick={() => handleReactionClick(reaction.id as ReactionIdx)}
              disabled={loading}
              title={reaction.label}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                padding: '8px',
                borderRadius: '6px',
                background: 'rgba(248,249,251,0.05)',
                border: `1px solid rgba(248,249,251,0.1)`,
                cursor: loading ? 'default' : 'pointer',
                opacity: loading ? 0.5 : 1,
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => {
                if (!loading && e.currentTarget instanceof HTMLElement) {
                  e.currentTarget.style.background = 'rgba(248,249,251,0.08)';
                  e.currentTarget.style.borderColor = `rgba(248,249,251,0.2)`;
                }
              }}
              onMouseLeave={e => {
                if (e.currentTarget instanceof HTMLElement) {
                  e.currentTarget.style.background = 'rgba(248,249,251,0.05)';
                  e.currentTarget.style.borderColor = `rgba(248,249,251,0.1)`;
                }
              }}
            >
              <span style={{ fontSize: '18px' }}>{reaction.emoji}</span>
              <span
                style={{
                  fontFamily: "'Sora', sans-serif",
                  fontSize: '9px',
                  color: W70,
                  textAlign: 'center',
                  lineHeight: 1,
                }}
              >
                {reaction.label}
              </span>
            </button>
          ))}
        </div>

        <div style={{ textAlign: 'right' }}>
          <button
            onClick={handleCancel}
            disabled={loading}
            style={{
              fontFamily: "'Sora', sans-serif",
              fontSize: '11px',
              color: W70,
              background: 'none',
              border: 'none',
              cursor: loading ? 'default' : 'pointer',
              opacity: loading ? 0.5 : 0.7,
              textDecoration: 'underline',
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // Voted state: show results
  const totalVotes = Object.values(votes).reduce((sum, count) => sum + count, 0);

  return (
    <div
      style={{
        padding: '14px',
        marginTop: '14px',
        borderRadius: '8px',
        background: 'rgba(212,168,67,0.06)',
        border: `1px solid rgba(212,168,67,0.15)`,
        animation: 'tfhSlideUp 0.25s ease-out',
      }}
    >
      <div style={{ marginBottom: '10px' }}>
        <span
          style={{
            fontFamily: "'Sora', sans-serif",
            fontSize: '11px',
            fontWeight: 600,
            color: '#D4A843',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          Results ({totalVotes})
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {REACTIONS.map(reaction => {
          const count = votes[reaction.id] || 0;
          const percentage = totalVotes > 0 ? (count / totalVotes) * 100 : 0;

          return (
            <div key={reaction.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '16px', minWidth: '20px' }}>{reaction.emoji}</span>
              <div
                style={{
                  flex: 1,
                  height: '4px',
                  borderRadius: '2px',
                  background: 'rgba(248,249,251,0.1)',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${percentage}%`,
                    background: '#D4A843',
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '10px',
                  color: W70,
                  minWidth: '28px',
                  textAlign: 'right',
                }}
              >
                {count}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
