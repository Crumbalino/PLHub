'use client';

import { useState, useRef } from 'react';
import type { FeedPost } from '@/lib/types';

const PUBLISHER_COLORS: Record<string, string> = {
  'BBC Sport': '#D4A843',
  'Sky Sports': '#E84080',
  'The Guardian': '#6B9E78',
  'Goal.com': '#7B5EA7',
  '90min': '#FF6B35',
  'Football365': '#E84080',
  'The Independent': '#C0392B',
  'ESPN FC': '#E84080',
  'FourFourTwo': '#D4A843',
};

function getPublisherColor(publisherName: string): string {
  return PUBLISHER_COLORS[publisherName] || 'rgba(248,249,251,0.4)';
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function StoryCard({
  post,
  index = 0,
  onRead,
  onExpand,
}: {
  post: FeedPost;
  index?: number;
  onRead?: () => void;
  onExpand?: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [hasBeenRead, setHasBeenRead] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const nextCardRef = useRef<HTMLElement | null>(null);
  const hasBeenExpandedRef = useRef(false);

  const sourceColor = getPublisherColor(post.sourceInfo.name);

  const isLive =
    (/\blive\b/i.test(post.title) &&
      !/live stream|how to watch|watch live|stream live|live blog/i.test(post.title)) ||
    post.sourceInfo.name.toLowerCase().includes('live');
  const isBreaking = post.title.toUpperCase().includes('BREAKING');
  const isPriority = isLive || isBreaking;
  const borderColor = isPriority ? '#E84080' : sourceColor;

  const summaryText = post.summary || post.summaryHook;
  const hasSummary = !!summaryText;
  const teaserText = summaryText ? summaryText.slice(0, 85) : null;

  function handleExpand() {
    if (!hasSummary) return;
    if (!expanded) {
      setExpanded(true);
      if (!hasBeenRead) {
        setHasBeenRead(true);
        onRead?.();
      }
      // Call onExpand only on first expand
      if (!hasBeenExpandedRef.current) {
        hasBeenExpandedRef.current = true;
        onExpand?.();
      }
    } else {
      setExpanded(false);
    }
  }

  function handleNextStory() {
    const nextCard = cardRef.current?.nextElementSibling as HTMLElement | null;
    if (nextCard) {
      nextCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  return (
    <>
      <style>{`
        @keyframes bob {
          0%, 100% { transform: translateY(0); opacity: 0.4; }
          55% { transform: translateY(5px); opacity: 1; }
        }
        .nudge { animation: bob 1.9s ease-in-out infinite; display: inline-block; }

        @keyframes typewrite {
          0% { width: 0; }
          99% { width: 100%; }
          100% { width: 100%; }
        }
        .typewriter { overflow: hidden; display: inline-block; }

        .teaser-fade {
          mask-image: linear-gradient(90deg, #000 50%, transparent 92%);
          -webkit-mask-image: linear-gradient(90deg, #000 50%, transparent 92%);
          overflow: hidden;
          white-space: nowrap;
        }

        .summary-grid {
          display: grid;
          transition: grid-template-rows 0.4s cubic-bezier(0.4,0,0.2,1), opacity 0.35s ease;
        }
        .summary-grid.open {
          grid-template-rows: 1fr;
          opacity: 1;
        }
        .summary-grid.closed {
          grid-template-rows: 0fr;
          opacity: 0;
        }
        .summary-inner {
          overflow: hidden;
        }
      `}</style>

      <article
        ref={cardRef}
        id={`story-${post.id}`}
        className="animate-card-enter"
        style={{
          background: expanded ? 'rgba(58,175,169,0.035)' : 'var(--plh-card)',
          border: '1px solid var(--plh-border)',
          borderLeftWidth: '3px',
          borderLeftColor: expanded ? borderColor : hexToRgba(borderColor, 0.4),
          borderRadius: '10px',
          overflow: 'hidden',
          boxShadow: 'var(--plh-shadow)',
          animationDelay: `${index * 50}ms`,
          cursor: hasSummary ? 'pointer' : 'default',
          transition: 'background 0.3s ease, border-left-color 0.3s ease',
        }}
        onClick={handleExpand}
      >
        <div style={{ padding: '16px' }}>
          {/* HEADLINE */}
          <h3
            style={{
              fontSize: '17px',
              fontWeight: 600,
              color: '#F8F9FB',
              fontFamily: "'Sora', sans-serif",
              lineHeight: 1.3,
              marginBottom: expanded ? '16px' : '12px',
            }}
          >
            {post.title}
          </h3>

          {/* META ROW — Publisher, Time, Clubs, Score */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: expanded ? '16px' : '8px', fontSize: '11px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', minWidth: 0, flex: 1 }}>
              {/* Publisher dot + name */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: sourceColor,
                    flexShrink: 0,
                  }}
                />
                <span style={{ color: sourceColor, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {post.sourceInfo.name}
                </span>
              </div>

              {/* Separator */}
              <span style={{ color: 'rgba(248,249,251,0.7)' }}>·</span>

              {/* Time */}
              <span style={{ color: 'rgba(248,249,251,0.7)' }}>
                {post.timeDisplay}
              </span>

              {/* Clubs */}
              {post.clubs.length > 0 && (
                <>
                  <span style={{ color: 'rgba(248,249,251,0.25)' }}>·</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {post.clubs.slice(0, 2).map((club) => (
                      <span
                        key={club.slug}
                        style={{
                          fontSize: '9px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          background: '#3AAFA9',
                          color: '#0D1B2A',
                          fontFamily: "'JetBrains Mono', monospace",
                          borderRadius: '3px',
                          padding: '2px 6px',
                        }}
                      >
                        {club.code}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Score (right-aligned) */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                flexShrink: 0,
                color: '#F8F9FB',
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 700,
                fontSize: '12px',
              }}
            >
              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" style={{ stroke: '#F8F9FB', strokeWidth: '3.5', strokeLinecap: 'round' }}>
                <path d="M2 14V2H14" />
              </svg>
              {post.indexScore}
            </div>

            {/* Read dot (top-right if has been read and collapsed) */}
            {hasBeenRead && !expanded && (
              <div
                style={{
                  width: '5px',
                  height: '5px',
                  borderRadius: '50%',
                  background: '#3AAFA9',
                  opacity: 0.5,
                  flexShrink: 0,
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                }}
              />
            )}
          </div>

          {/* TEASER (collapsed only) */}
          {hasSummary && !expanded && teaserText && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px',
                marginBottom: '4px',
              }}
            >
              <span
                className="teaser-fade"
                style={{
                  color: 'rgba(248,249,251,0.7)',
                  fontStyle: 'italic',
                  flex: 1,
                }}
              >
                {teaserText}
              </span>
              <span style={{ color: '#3AAFA9', fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0 }}>
                read →
              </span>
            </div>
          )}

          {/* SUMMARY GRID (expanded only) */}
          {hasSummary && expanded && (
            <div className={`summary-grid ${expanded ? 'open' : 'closed'}`}>
              <div className="summary-inner">
                {/* THE HUB TAKE header */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginBottom: '12px',
                  }}
                >
                  <div
                    style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      background: '#3AAFA9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '8px',
                      color: '#0D1B2A',
                      fontWeight: 700,
                    }}
                  >
                    ✦
                  </div>
                  <span
                    style={{
                      color: '#3AAFA9',
                      fontSize: '10px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.07em',
                      fontFamily: "'Sora', sans-serif",
                    }}
                  >
                    The Hub Take
                  </span>
                </div>

                {/* Summary text */}
                <p
                  className="typewriter"
                  style={{
                    fontSize: '15px',
                    lineHeight: 1.72,
                    color: 'rgba(248,249,251,0.82)',
                    fontFamily: "'Sora', sans-serif",
                    margin: '0 0 16px 0',
                    animation: `typewrite ${(summaryText?.length ?? 0) * 0.018}s steps(${summaryText?.length ?? 1}, end) 1`,
                  }}
                >
                  {summaryText}
                </p>

                {/* Read on Publisher link */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <a
                    href={post.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      color: sourceColor,
                      fontSize: '12px',
                      fontWeight: 700,
                      fontFamily: "'Sora', sans-serif",
                      textDecoration: 'none',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      transition: 'opacity 0.2s ease',
                      opacity: 0.85,
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.85')}
                  >
                    Read on {post.sourceInfo.name} →
                  </a>

                  {/* Next story button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNextStory();
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#3AAFA9',
                      fontSize: '12px',
                      fontWeight: 600,
                      fontFamily: "'Sora', sans-serif",
                      padding: 0,
                    }}
                  >
                    next story <span className="nudge">↓</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </article>
    </>
  );
}
