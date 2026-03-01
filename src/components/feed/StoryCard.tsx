'use client';

import { useState } from 'react';
import Image from 'next/image';
import { getSourceColor } from '@/lib/theme';
import type { FeedPost } from '@/lib/types';

// ──────────────────────────────────────────
// COMPONENT
// ──────────────────────────────────────────

export default function StoryCard({ post, index = 0 }: { post: FeedPost; index?: number }) {
  const [punditOpen, setPunditOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const sourceColor = getSourceColor(post.sourceInfo.name);
  const primaryClub = post.clubs[0];

  // v2.2: Priority detection — pink border for LIVE / BREAKING
  const isLive = post.title.toLowerCase().includes('live') ||
    post.sourceInfo.name.toLowerCase().includes('live');
  const isBreaking = post.title.toUpperCase().includes('BREAKING');
  const isPriority = isLive || isBreaking;
  const borderColor = isPriority ? 'var(--plh-pink)' : 'var(--plh-teal)';

  // v2.2: Share always points to PLHub, never to the original source
  // TODO: Update to plhub.co.uk/story/[slug] when story pages are built
  async function onShare(e: React.MouseEvent) {
    e.stopPropagation();

    const plhubUrl = typeof window !== 'undefined'
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
      } catch {
        // cancelled
      }
    } else {
      await navigator.clipboard.writeText(plhubUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <article
      className="
        bg-[var(--plh-card)]
        rounded-[10px]
        border border-[var(--plh-border)]
        border-l-2
        p-4
        transition-all duration-200 ease-out
        cursor-pointer
        animate-card-enter
      "
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
      // v2.2: Card tap opens Pundit's Take — does NOT navigate to source
      onClick={() => {
        if (post.summary) {
          setPunditOpen(!punditOpen);
        }
      }}
    >
      {/* ── META ROW ── */}
      <div className="flex items-center justify-between mb-2 gap-3">
        <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
          {/* Source logo */}
          {post.sourceInfo.logo && (
            <Image
              src={post.sourceInfo.logo}
              alt={post.sourceInfo.name}
              width={18}
              height={18}
              className="w-[18px] h-[18px] rounded-sm flex-shrink-0"
            />
          )}

          {/* Source name */}
          <span
            className="text-[10px] font-semibold uppercase tracking-[1.5px] whitespace-nowrap"
            style={{ color: sourceColor }}
          >
            {post.sourceInfo.name}
          </span>

          {/* v2.2: LIVE / BREAKING badges */}
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
              <span className="text-[13px] text-[var(--plh-teal)] whitespace-nowrap">
                {primaryClub.shortName}
              </span>
            </>
          )}

          <span className="text-[var(--plh-text-40)] text-[10px]">·</span>

          <span className="text-[10px] text-[var(--plh-text-50)] whitespace-nowrap">
            {post.timeDisplay}
          </span>
        </div>

        {/* Pulse score */}
        <span
          className="text-[11px] font-bold tabular-nums flex-shrink-0 px-2 py-0.5 rounded-[6px]"
          style={{
            color: 'var(--plh-gold)',
            background: 'color-mix(in srgb, var(--plh-gold) 12%, transparent)',
          }}
        >
          ⚡ {post.indexScore}
        </span>
      </div>

      {/* ── HEADLINE ── */}
      <h3 className="text-[18px] font-semibold text-[var(--plh-text-100)] leading-[1.35] line-clamp-3">
        {post.title}
      </h3>

      {/* ── BLURB — 75% opacity ── */}
      {post.previewBlurb && (
        <p className="text-[14px] font-light text-[var(--plh-text-75)] leading-[1.6] mt-1.5">
          {post.previewBlurb}
        </p>
      )}

      {/* ── FOOTER ROW: club tags + share ── */}
      <div className="flex items-center justify-between mt-3">
        {/* Club tags (multi-club stories) */}
        <div className="flex items-center gap-1.5">
          {post.clubs.length > 1 &&
            post.clubs.map((club) => (
              <span
                key={club.slug}
                className="text-[8px] font-semibold uppercase tracking-[1px] text-[var(--plh-teal)] px-1.5 py-0.5 rounded-[3px]"
                style={{ background: 'color-mix(in srgb, var(--plh-teal) 12%, transparent)' }}
              >
                {club.code}
              </span>
            ))}
        </div>

        {/* Share button */}
        <button
          onClick={onShare}
          className="
            flex items-center gap-1.5 px-2 py-1
            text-[11px] font-medium
            text-[var(--plh-text-50)]
            rounded-[6px]
            transition-all duration-200
          "
          onMouseEnter={(e) => {
            const el = e.currentTarget;
            el.style.color = 'var(--plh-teal)';
            el.style.background = 'color-mix(in srgb, var(--plh-teal) 8%, transparent)';
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget;
            el.style.color = 'var(--plh-text-50)';
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

      {/* ── PUNDIT'S TAKE ── */}
      {post.summary && (
        <div className="mt-3 pt-3 border-t border-[var(--plh-border)]">
          <button
            className="
              w-full flex items-center gap-2.5
              rounded-[8px] py-2 px-2
              transition-all duration-200 ease-out
              text-left
            "
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background =
                'color-mix(in srgb, var(--plh-teal) 4%, transparent)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = 'transparent';
            }}
            onClick={(e) => {
              e.stopPropagation();
              setPunditOpen(!punditOpen);
            }}
            aria-expanded={punditOpen}
          >
            <div
              className="
                flex-shrink-0 w-[28px] h-[28px]
                rounded-[6px]
                text-[var(--plh-teal)]
                text-[10px] font-semibold
                flex items-center justify-center
              "
              style={{ background: 'color-mix(in srgb, var(--plh-teal) 15%, transparent)' }}
            >
              SP
            </div>

            <span className="text-[13px] font-medium text-[var(--plh-text-75)] flex-1">
              The Pundit&apos;s Take
            </span>

            <span
              className="text-[13px] text-[var(--plh-text-40)] transition-transform duration-200"
              style={{ transform: punditOpen ? 'rotate(90deg)' : 'none' }}
            >
              ▸
            </span>
          </button>

          {punditOpen && (
            <div className="px-2 pt-2.5 pb-1 animate-summary-reveal">
              <p className="text-[13px] font-light text-[var(--plh-text-75)] leading-[1.7]">
                {post.summary}
              </p>
              {/* Read original — deliberate extra step, opens source in new tab */}
              <a
                href={post.url}
                target="_blank"
                rel="noopener noreferrer"
                className="
                  inline-block mt-3 text-[12px] font-medium
                  text-[var(--plh-teal)]
                  transition-colors duration-200
                "
                onMouseEnter={(e) => {
                  const el = e.currentTarget;
                  el.style.color = 'var(--plh-pink)';
                  el.style.textDecoration = 'underline';
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget;
                  el.style.color = 'var(--plh-teal)';
                  el.style.textDecoration = 'none';
                }}
                onClick={(e) => e.stopPropagation()}
              >
                Read original →
              </a>
            </div>
          )}
        </div>
      )}
    </article>
  );
}
