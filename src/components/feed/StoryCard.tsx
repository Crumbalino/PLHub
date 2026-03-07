'use client';
import { useState } from 'react';
import Image from 'next/image';
import { getSourceColor } from '@/lib/theme';
import type { FeedPost } from '@/lib/types';

// ── Inline summary component ──────────────────────────────────
function InlineSummary({
  summary,
  hook,
  url,
}: {
  summary: string | null;
  hook: string | null;
  url: string;
}) {
  const [expanded, setExpanded] = useState(false);

  const sentences = summary
    ? (summary.match(/[^.!?]+[.!?]+/g) ?? [summary])
    : null;

  const first = sentences?.[0]?.trim() ?? hook ?? null;
  const rest =
    sentences && sentences.length > 1
      ? sentences.slice(1).join(' ').trim()
      : null;

  if (!first) return null;

  return (
    <div className="mt-2.5">
      <p
        className="text-[15px] font-light leading-[1.65]"
        style={{ color: 'rgba(250,245,240,0.85)' }}
      >
        {first}
        {!expanded && rest && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(true);
            }}
            className="ml-1.5 text-[13px] font-semibold cursor-pointer transition-opacity duration-150"
            style={{ color: 'var(--plh-gold)' }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.opacity = '0.7';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.opacity = '1';
            }}
          >
            more...
          </button>
        )}
        {expanded && rest && (
          <span style={{ color: 'rgba(250,245,240,0.75)' }}> {rest}</span>
        )}
      </p>
      {expanded && (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="inline-block mt-2 text-[12px] font-medium transition-colors duration-200"
          style={{ color: 'var(--plh-teal)', textDecoration: 'none' }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLElement;
            el.style.color = 'var(--plh-pink)';
            el.style.textDecoration = 'underline';
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLElement;
            el.style.color = 'var(--plh-teal)';
            el.style.textDecoration = 'none';
          }}
        >
          Read original →
        </a>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────
export default function StoryCard({
  post,
  index = 0,
}: {
  post: FeedPost;
  index?: number;
}) {
  const [copied, setCopied] = useState(false);
  const sourceColor = getSourceColor(post.sourceInfo.name);
  const primaryClub = post.clubs[0];

  const isLive =
    post.title.toLowerCase().includes('live') ||
    post.sourceInfo.name.toLowerCase().includes('live');
  const isBreaking = post.title.toUpperCase().includes('BREAKING');
  const isPriority = isLive || isBreaking;
  const borderColor = isPriority ? 'var(--plh-pink)' : 'var(--plh-teal)';

  async function onShare(e: React.MouseEvent) {
    e.stopPropagation();
    const plhubUrl =
      typeof window !== 'undefined'
        ? `${window.location.origin}`
        : 'https://plhub.co.uk';
    const shareData = {
      title: post.title,
      text: post.previewBlurb || undefined,
      url: plhubUrl,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {}
    } else {
      await navigator.clipboard.writeText(plhubUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <article
      id={`post-${post.id}`}
      className="bg-[var(--plh-card)] rounded-[10px] border border-[var(--plh-border)] border-l-2 p-4 transition-all duration-200 ease-out animate-card-enter"
      style={{
        borderLeftColor: borderColor,
        boxShadow: 'var(--plh-shadow)',
        animationDelay: `${index * 50}ms`,
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget;
        el.style.borderColor = 'var(--plh-border-hover)';
        el.style.borderLeftColor = borderColor;
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget;
        el.style.borderColor = 'var(--plh-border)';
        el.style.borderLeftColor = borderColor;
      }}
    >
      {/* ── META ROW ── */}
      <div className="flex items-center justify-between mb-2 gap-3">
        <div className="flex items-center gap-1.5 min-w-0 flex-wrap">

          {/* Source colour dot */}
          <span
            className="w-[7px] h-[7px] rounded-full flex-shrink-0"
            style={{ background: sourceColor, marginTop: '1px' }}
          />

          {/* Source name */}
          <span
            className="text-[12px] font-semibold uppercase tracking-[1.5px] whitespace-nowrap"
            style={{ color: sourceColor }}
          >
            {post.sourceInfo.name}
          </span>

          {/* LIVE / BREAKING */}
          {isLive && (
            <>
              <span className="text-[var(--plh-text-40)] text-[10px]">·</span>
              <span className="flex items-center gap-1">
                <span
                  className="w-[6px] h-[6px] rounded-full bg-[var(--plh-pink)]"
                  style={{ animation: 'livePulse 2s ease-in-out infinite' }}
                />
                <span className="text-[9px] font-bold uppercase tracking-[1.5px] text-[var(--plh-pink)]">
                  LIVE
                </span>
              </span>
            </>
          )}
          {isBreaking && !isLive && (
            <>
              <span className="text-[var(--plh-text-40)] text-[10px]">·</span>
              <span className="text-[9px] font-bold uppercase tracking-[1.5px] text-[var(--plh-pink)]">
                BREAKING
              </span>
            </>
          )}

          {/* Primary club */}
          {primaryClub && (
            <>
              <span className="text-[var(--plh-text-40)] text-[10px]">·</span>
              {primaryClub.badgeUrl && (
                <Image
                  src={primaryClub.badgeUrl}
                  alt={primaryClub.shortName}
                  width={18}
                  height={18}
                  className="w-[18px] h-[18px] object-contain flex-shrink-0"
                />
              )}
              <span className="text-[15px] font-medium text-[var(--plh-teal)] whitespace-nowrap">
                {primaryClub.shortName}
              </span>
            </>
          )}

          <span className="text-[var(--plh-text-40)] text-[10px]">·</span>
          <span className="text-[13px] text-[rgba(250,245,240,0.7)] whitespace-nowrap">
            {post.timeDisplay}
          </span>
        </div>

        {/* Score badge — BR chevron */}
        <span
          className="flex items-center gap-0.5 flex-shrink-0 px-2 py-0.5 rounded-[6px] font-bold tabular-nums text-[13px]"
          style={{
            color: 'var(--plh-gold)',
            background: 'color-mix(in srgb, var(--plh-gold) 12%, transparent)',
          }}
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
            <path d="M2 14V2H14" stroke="var(--plh-gold)" strokeWidth="3.5" strokeLinecap="round" />
          </svg>
          {post.indexScore}
        </span>
      </div>

      {/* ── HEADLINE ── */}
      <h3 className="text-[20px] font-semibold text-[var(--plh-text-100)] leading-[1.35] line-clamp-3">
        {post.title}
      </h3>

      {/* ── INLINE SUMMARY ── */}
      {(post.summary || post.summaryHook) && (
        <InlineSummary summary={post.summary} hook={post.summaryHook} url={post.url} />
      )}

      {/* ── FOOTER ROW ── */}
      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-1.5">
          {post.clubs.length > 1 &&
            post.clubs.map((club) => (
              <span
                key={club.slug}
                className="text-[12px] font-semibold uppercase tracking-[1px] text-[var(--plh-teal)] px-2 py-1 rounded-[3px]"
                style={{ background: 'color-mix(in srgb, var(--plh-teal) 12%, transparent)' }}
              >
                {club.code}
              </span>
            ))}
        </div>

        <button
          onClick={onShare}
          className="flex items-center gap-1.5 px-2 py-1 text-[13px] font-medium text-[rgba(250,245,240,0.7)] rounded-[6px] transition-all duration-200"
          onMouseEnter={(e) => {
            const el = e.currentTarget;
            el.style.color = 'var(--plh-teal)';
            el.style.background = 'color-mix(in srgb, var(--plh-teal) 8%, transparent)';
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget;
            el.style.color = 'rgba(250,245,240,0.7)';
            el.style.background = 'transparent';
          }}
          aria-label="Share this story"
        >
          {copied ? (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--plh-teal)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span className="text-[var(--plh-teal)]">Copied</span>
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
              <span>Share</span>
            </>
          )}
        </button>
      </div>
    </article>
  );
}
