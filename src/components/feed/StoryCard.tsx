'use client';

import { useState, useRef } from 'react';
import type { FeedPost } from '@/lib/types';

// ─── Brand tokens (locked) ────────────────────────────────────────────────────
const PINK   = '#E84080';
const TEAL   = '#3AAFA9';
const GOLD   = '#D4A843';
const ORANGE = '#E8622A';
const NAVY   = '#0D1B2A';
const WHITE  = '#F8F9FB';
const W70    = 'rgba(248,249,251,0.7)';

// ─── Publisher colours (brand-locked) ────────────────────────────────────────
const PUBLISHER_COLORS: Record<string, string> = {
  'BBC Sport':    GOLD,
  'Sky Sports':   PINK,
  'The Guardian': '#6B9E78',
  'talkSPORT':    '#A8D8EA',
  'Goal.com':     '#7B5EA7',
  '90min':        ORANGE,
};
function getPublisherColor(name: string): string {
  return PUBLISHER_COLORS[name] ?? WHITE;
}

// ─── Types ────────────────────────────────────────────────────────────────────
type CardType = 'story' | 'stat' | 'quote' | 'result' | 'lol' | 'rumour';
interface ExtendedFeedPost extends FeedPost {
  card_type?: CardType;
  generated_headline?: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function extractStatNumber(title: string): string {
  const m = title.match(/\b(\d[\d,]*)\b/);
  return m ? m[1] : '?';
}

function extractQuoteText(title: string): string {
  const m = title.match(/["""''](.*?)["""'']/s);
  if (m) return m[1].length > 80 ? m[1].slice(0, 80) + '…' : m[1];
  return title.slice(0, 80);
}

function extractAttribution(title: string): string {
  const m = title.match(/["""''']\s*[-–—]?\s*([A-Z][^,.\n]{2,35})(?:$|,|\.)/);
  return m ? m[1].trim() : '';
}

function extractScore(title: string): string {
  const m = title.match(/\b(\d{1,2})\s*[-–]\s*(\d{1,2})\b/);
  return m ? `${m[1]}–${m[2]}` : '?–?';
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function StoryCard({
  post: rawPost,
  index = 0,
  onRead,
  onExpand,
}: {
  post: FeedPost;
  index?: number;
  onRead?: () => void;
  onExpand?: () => void;
}) {
  const post = rawPost as ExtendedFeedPost;

  const [expanded, setExpanded]       = useState(false);
  const [hasBeenRead, setHasBeenRead] = useState(false);
  const [imgError, setImgError]       = useState(false);
  const hasExpandedOnce               = useRef(false);
  const cardRef                       = useRef<HTMLDivElement>(null);

  const cardType     = (post.card_type ?? 'story') as CardType;
  const pubColor     = getPublisherColor(post.sourceInfo.name);
  const isLive       = (/\blive\b/i.test(post.title) && !/live stream|how to watch|watch live|stream live|live blog/i.test(post.title)) || post.sourceInfo.name.toLowerCase().includes('live');
  const isBreaking   = post.title.toUpperCase().includes('BREAKING');
  const isPriority   = isLive || isBreaking;
  const displayTitle = post.generated_headline ?? post.title;
  const summaryText  = post.summary ?? post.summaryHook ?? post.previewBlurb;
  const isAiSummary  = !!(post.summary ?? post.summaryHook);
  const hasSummary   = !!summaryText;
  const teaserText   = summaryText ? (summaryText.length > 90 ? summaryText.slice(0, 90) + '…' : summaryText) : null;

  // Left border colour — LIVE/BREAKING always overrides
  const leftBorderColor =
    isPriority          ? PINK
    : cardType === 'stat'   ? TEAL
    : cardType === 'quote'  ? PINK
    : cardType === 'result' ? ORANGE
    : cardType === 'lol'    ? GOLD
    : pubColor;

  // Rumour gets a dashed border instead
  const borderIsDashed = cardType === 'rumour';

  function handleExpand() {
    if (!hasSummary) return;
    if (!expanded) {
      setExpanded(true);
      if (!hasBeenRead) { setHasBeenRead(true); onRead?.(); }
      if (!hasExpandedOnce.current) { hasExpandedOnce.current = true; onExpand?.(); }
    } else {
      setExpanded(false);
    }
  }

  function handleNextStory() {
    const next = cardRef.current?.nextElementSibling as HTMLElement | null;
    next?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  // ─── Top zone ───────────────────────────────────────────────────────────────
  // Rule: only render if the zone contains actual content.
  // Story / LOL — only if there is a real image. No image = no zone.
  // Stat / Quote / Result — always (they display data).
  // Rumour — never.
  function renderTopZone(): React.ReactNode {
    // Stat — teal block, giant number
    if (cardType === 'stat') {
      return (
        <div style={{
          background: TEAL,
          padding: '20px 16px',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: '4px',
        }}>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontWeight: 700, fontSize: '56px', lineHeight: 1,
            color: NAVY, letterSpacing: '-2px',
          }}>
            {extractStatNumber(post.title)}
          </span>
          <span style={{
            fontFamily: "'Sora', sans-serif",
            fontSize: '10px', fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.1em',
            color: NAVY, opacity: 0.6,
          }}>
            by the numbers
          </span>
        </div>
      );
    }

    // Quote — pink block, oversized quote mark + excerpt
    if (cardType === 'quote') {
      const quoteText   = extractQuoteText(post.title);
      const attribution = extractAttribution(post.title);
      return (
        <div style={{
          background: PINK,
          padding: '16px 18px 18px',
          display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
        }}>
          <div style={{
            fontFamily: "'Sora', sans-serif", fontWeight: 700,
            fontSize: '64px', lineHeight: 0.8,
            color: WHITE, opacity: 0.35,
            marginBottom: '8px', userSelect: 'none',
          }}>
            "
          </div>
          <p style={{
            fontFamily: "'Sora', sans-serif",
            fontStyle: 'italic', fontSize: '13px', lineHeight: 1.5,
            color: WHITE, margin: 0, fontWeight: 500,
          }}>
            {quoteText}
          </p>
          {attribution && (
            <span style={{
              fontFamily: "'Sora', sans-serif",
              fontSize: '11px', color: W70, marginTop: '6px',
            }}>
              — {attribution}
            </span>
          )}
        </div>
      );
    }

    // Result — orange block, Club · score · Club
    if (cardType === 'result') {
      const score = extractScore(post.title);
      const home  = post.clubs[0]?.code ?? post.clubs[0]?.shortName ?? '';
      const away  = post.clubs[1]?.code ?? post.clubs[1]?.shortName ?? '';
      return (
        <div style={{
          background: ORANGE,
          padding: '20px 16px',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: '6px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {home && (
              <span style={{
                fontFamily: "'Sora', sans-serif",
                fontWeight: 700, fontSize: '14px', color: WHITE,
              }}>
                {home}
              </span>
            )}
            {home && <span style={{ color: WHITE, opacity: 0.4 }}>·</span>}
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: 700, fontSize: '40px', lineHeight: 1,
              color: WHITE, letterSpacing: '-1px',
            }}>
              {score}
            </span>
            {away && <span style={{ color: WHITE, opacity: 0.4 }}>·</span>}
            {away && (
              <span style={{
                fontFamily: "'Sora', sans-serif",
                fontWeight: 700, fontSize: '14px', color: WHITE,
              }}>
                {away}
              </span>
            )}
          </div>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '9px', fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.15em',
            color: WHITE, opacity: 0.5,
          }}>
            FULL TIME
          </span>
        </div>
      );
    }

    // Story / LOL — only if there is a real image (not broken)
    if ((cardType === 'story' || cardType === 'lol') && post.imageUrl && !imgError) {
      return (
        <div style={{ position: 'relative', height: '200px', overflow: 'hidden' }}>
          <img
            src={post.imageUrl}
            alt=""
            onError={() => setImgError(true)}
            style={{
              position: 'absolute', inset: 0,
              width: '100%', height: '100%',
              objectFit: 'cover', display: 'block',
            }}
          />
          {/* Subtle gradient so headline text is readable if overlaid */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to top, rgba(13,27,42,0.5) 0%, transparent 50%)',
          }} />
        </div>
      );
    }

    // All other cases: no top zone
    return null;
  }

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @keyframes tfhEnter {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes tfhSummaryIn {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes tfhBob {
          0%, 100% { transform: translateY(0);   opacity: 0.45; }
          55%       { transform: translateY(5px); opacity: 1; }
        }
        .tfh-card {
          animation: tfhEnter 0.4s ease both;
          transition: transform 0.15s ease, box-shadow 0.15s ease,
                      background 0.25s ease, border-left-color 0.25s ease;
        }
        .tfh-card:hover { transform: translateY(-2px); }
        .tfh-nudge { animation: tfhBob 1.9s ease-in-out infinite; display: inline-block; }
        .tfh-teaser {
          mask-image: linear-gradient(90deg, #000 55%, transparent 96%);
          -webkit-mask-image: linear-gradient(90deg, #000 55%, transparent 96%);
          overflow: hidden; white-space: nowrap;
        }
        .tfh-summary { animation: tfhSummaryIn 0.35s ease forwards; }
        .tfh-chevron { transition: transform 0.25s ease, stroke 0.15s ease; }
      `}</style>

      <article
        ref={cardRef}
        id={`story-${post.id}`}
        className="tfh-card"
        style={{
          position: 'relative',
          background: expanded ? 'rgba(58,175,169,0.03)' : 'var(--plh-card)',
          border: borderIsDashed
            ? `1px dashed rgba(248,249,251,0.3)`
            : '1px solid var(--plh-border)',
          borderLeftWidth: borderIsDashed ? undefined : '4px',
          borderLeftStyle: borderIsDashed ? undefined : 'solid',
          borderLeftColor: borderIsDashed
            ? undefined
            : (expanded ? leftBorderColor : `${leftBorderColor}66`),
          borderRadius: '10px',
          overflow: 'hidden',
          boxShadow: 'var(--plh-shadow)',
          animationDelay: `${index * 50}ms`,
          cursor: hasSummary ? 'pointer' : 'default',
        }}
        onClick={handleExpand}
      >
        {/* TOP ZONE */}
        {renderTopZone()}

        {/* CARD BODY */}
        <div style={{ padding: '14px 16px 16px' }}>

          {/* LIVE / BREAKING badge */}
          {isPriority && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '5px',
              background: `${PINK}20`, border: `1px solid ${PINK}55`,
              borderRadius: '4px', padding: '2px 7px', marginBottom: '8px',
            }}>
              {isLive && !isBreaking && (
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: PINK }} />
              )}
              <span style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '9px', fontWeight: 700,
                letterSpacing: '0.12em', color: PINK,
              }}>
                {isBreaking ? 'BREAKING' : 'LIVE'}
              </span>
            </div>
          )}

          {/* RUMOUR badge */}
          {cardType === 'rumour' && (
            <div style={{
              display: 'inline-flex',
              background: `${TEAL}18`, border: `1px solid ${TEAL}40`,
              borderRadius: '4px', padding: '2px 7px', marginBottom: '8px',
            }}>
              <span style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '9px', fontWeight: 700,
                letterSpacing: '0.12em', color: TEAL,
                textTransform: 'uppercase',
              }}>
                RUMOUR
              </span>
            </div>
          )}

          {/* HEADLINE */}
          <h3 style={{
            fontFamily: "'Sora', sans-serif",
            fontSize: '16px', fontWeight: 600,
            color: WHITE, lineHeight: 1.35,
            marginBottom: '10px',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            {displayTitle}
          </h3>

          {/* META ROW */}
          <div style={{
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px', marginBottom: '8px', fontSize: '11px',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center',
              gap: '6px', flexWrap: 'wrap', flex: 1, minWidth: 0,
            }}>
              <span style={{
                width: '6px', height: '6px', borderRadius: '50%',
                background: pubColor, flexShrink: 0,
              }} />
              <span style={{
                color: pubColor, fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.04em',
                whiteSpace: 'nowrap',
              }}>
                {post.sourceInfo.name}
              </span>
              <span style={{ color: W70 }}>·</span>
              <span style={{ color: W70, fontFamily: "'JetBrains Mono', monospace" }}>
                {post.timeDisplay}
              </span>
              {post.clubs.length > 0 && (
                <>
                  <span style={{ color: 'rgba(248,249,251,0.2)' }}>·</span>
                  <div style={{ display: 'flex', gap: '3px' }}>
                    {post.clubs.slice(0, 2).map((c) => (
                      <span key={c.slug} style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: '9px', fontWeight: 700,
                        textTransform: 'uppercase', letterSpacing: '0.04em',
                        background: TEAL, color: NAVY,
                        borderRadius: '3px', padding: '2px 5px',
                      }}>
                        {c.code}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Index score */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '3px',
              flexShrink: 0, color: WHITE,
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: 700, fontSize: '12px',
            }}>
              <svg width="7" height="7" viewBox="0 0 24 24" fill="none"
                style={{ stroke: WHITE, strokeWidth: '3.5', strokeLinecap: 'round' }}>
                <path d="M2 14V2H14" />
              </svg>
              {post.indexScore}
            </div>
          </div>

          {/* COLLAPSED — teaser */}
          {!expanded && hasSummary && teaserText && (
            <div style={{
              display: 'flex', alignItems: 'center',
              justifyContent: 'space-between', gap: '8px',
            }}>
              <span className="tfh-teaser" style={{
                fontFamily: "'Sora', sans-serif",
                fontSize: '13px', fontStyle: 'italic',
                color: W70, flex: 1,
              }}>
                {teaserText}
              </span>
            </div>
          )}

          {/* EXPANDED — Hub Take + summary + footer */}
          {expanded && hasSummary && (
            <div>
              {isAiSummary && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  marginBottom: '10px',
                }}>
                  <div style={{
                    width: '12px', height: '12px', borderRadius: '50%',
                    background: TEAL,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '8px', color: NAVY, fontWeight: 700, flexShrink: 0,
                  }}>
                    ✦
                  </div>
                  <span style={{
                    fontFamily: "'Sora', sans-serif",
                    fontSize: '10px', fontWeight: 700,
                    textTransform: 'uppercase', letterSpacing: '0.08em',
                    color: TEAL,
                  }}>
                    The Hub Take
                  </span>
                </div>
              )}

              {cardType === 'rumour' && (
                <p style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '10px', color: TEAL, opacity: 0.7,
                  marginBottom: '8px',
                }}>
                  Unconfirmed — treat accordingly.
                </p>
              )}

              <p className="tfh-summary" style={{
                fontFamily: "'Sora', sans-serif",
                fontSize: '14px', lineHeight: 1.72,
                color: 'rgba(248,249,251,0.82)',
                margin: '0 0 14px 0',
              }}>
                {summaryText}
              </p>

              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <a
                  href={post.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    fontFamily: "'Sora', sans-serif",
                    fontSize: '11px', fontWeight: 700,
                    color: pubColor, textDecoration: 'none',
                    textTransform: 'uppercase', letterSpacing: '0.05em',
                    opacity: 0.85, transition: 'opacity 0.15s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.85')}
                >
                  Read on {post.sourceInfo.name} →
                </a>
                <button
                  onClick={(e) => { e.stopPropagation(); handleNextStory(); }}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                    fontFamily: "'Sora', sans-serif",
                    fontSize: '11px', fontWeight: 600, color: TEAL,
                  }}
                >
                  next story <span className="tfh-nudge">↓</span>
                </button>
              </div>
            </div>
          )}

          {/* Unified chevron — always bottom-right, rotates on expand */}
          {hasSummary && (
            <div style={{
              position: 'absolute', bottom: '12px', right: '12px',
            }}>
              <svg className="tfh-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none"
                style={{
                  stroke: TEAL, strokeWidth: '2.5',
                  strokeLinecap: 'round', strokeLinejoin: 'round',
                  transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                }}>
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
          )}

          {/* Read dot */}
          {hasBeenRead && !expanded && (
            <div style={{
              position: 'absolute', top: '12px', right: '12px',
              width: '5px', height: '5px', borderRadius: '50%',
              background: TEAL, opacity: 0.4,
            }} />
          )}
        </div>
      </article>
    </>
  );
}
