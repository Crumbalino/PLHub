'use client';

import { useState } from 'react';
import Image from 'next/image';
import { getSourceColor } from '@/lib/theme';
import type { FeedPost } from '@/lib/types';

export default function StoryCard({
  post,
  index = 0,
}: {
  post: FeedPost;
  index?: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const sourceColor =
    (post.sourceInfo as any).color ||
    getSourceColor(post.sourceInfo.name) ||
    'var(--plh-text-100)';

  const isLive = post.title.toLowerCase().includes('live') ||
    post.sourceInfo.name.toLowerCase().includes('live');
  const isBreaking = post.title.toUpperCase().includes('BREAKING');
  const isPriority = isLive || isBreaking;
  const borderColor = isPriority ? 'var(--plh-pink)' : sourceColor;

  const hasImage = !!(post as any).imageUrl;
  const imageUrl = (post as any).imageUrl as string | undefined;
  const summaryText = post.summary || post.summaryHook;
  const hasSummary = !!summaryText;
  const score = post.indexScore ?? 0;
  const isHeroImage = hasImage && score >= 70;
  const isThumbnailImage = hasImage && score >= 50 && score < 70;

  // Split summary into sentences for paragraph rendering
  const summaryParagraphs = summaryText
    ? summaryText.split(/(?<=\.)\s+/).filter(Boolean)
    : [];

  async function handleShare(e: React.MouseEvent) {
    e.stopPropagation();
    const shareUrl = typeof window !== 'undefined' ? window.location.origin : 'https://thefootballhub.uk';
    if (navigator.share) {
      try { await navigator.share({ title: post.title, url: shareUrl }); } catch {}
    } else {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <article
      id={`post-${post.id}`}
      className="bg-[var(--plh-card)] rounded-[10px] overflow-hidden border border-[var(--plh-border)] transition-all duration-200 ease-out animate-card-enter"
      style={{
        borderLeftWidth: '3px',
        borderLeftColor: borderColor,
        boxShadow: 'var(--plh-shadow)',
        animationDelay: `${index * 50}ms`,
        cursor: hasSummary ? 'pointer' : 'default',
      }}
      onClick={() => hasSummary && setExpanded(!expanded)}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = 'var(--plh-border-hover)';
        (e.currentTarget as HTMLElement).style.borderLeftColor = borderColor;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = 'var(--plh-border)';
        (e.currentTarget as HTMLElement).style.borderLeftColor = borderColor;
      }}
    >
      {/* HERO IMAGE — full-width, only for top stories (score >= 70) */}
      {isHeroImage && imageUrl && (
        <div style={{ width: '100%', height: '160px', position: 'relative', overflow: 'hidden' }}>
          <Image
            src={imageUrl}
            alt={post.title}
            fill
            style={{ objectFit: 'cover', objectPosition: 'center top' }}
            sizes="(max-width: 700px) 100vw, 700px"
          />
          {isPriority && (
            <div style={{ position: 'absolute', top: 8, left: 8 }}>
              <span
                className="flex items-center gap-1 px-2 py-0.5 rounded-full"
                style={{ background: 'var(--plh-pink)', color: '#fff', fontSize: '9px', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', fontFamily: "'JetBrains Mono', monospace" }}
              >
                {isLive && <span className="w-[5px] h-[5px] rounded-full bg-white" style={{ animation: 'livePulse 2s ease-in-out infinite' }} />}
                {isLive ? 'LIVE' : 'BREAKING'}
              </span>
            </div>
          )}
        </div>
      )}

      {/* CARD BODY */}
      <div className="p-4">

        {/* HEADLINE ROW */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1 min-w-0">
            {/* LIVE/BREAKING label — only show inline if NOT hero image */}
            {!isHeroImage && isPriority && (
              <div className="flex items-center gap-1.5 mb-1.5">
                {isLive && (
                  <span className="w-[6px] h-[6px] rounded-full bg-[var(--plh-pink)]" style={{ animation: 'livePulse 2s ease-in-out infinite' }} />
                )}
                <span className="text-[9px] font-bold uppercase tracking-[1.5px] text-[var(--plh-pink)]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  {isLive ? 'LIVE' : 'BREAKING'}
                </span>
              </div>
            )}
            <h3 className="text-[19px] font-semibold leading-[1.3]" style={{ color: 'var(--plh-text-100)' }}>
              {post.title}
            </h3>
          </div>

          {/* Thumbnail image — right side for mid-tier stories (50-69) */}
          {isThumbnailImage && imageUrl && (
            <div
              style={{
                position: 'relative',
                width: '80px',
                height: '80px',
                flexShrink: 0,
                borderRadius: '6px',
                overflow: 'hidden',
                marginLeft: '8px',
              }}
            >
              <Image
                src={imageUrl}
                alt={post.title}
                fill
                style={{ objectFit: 'cover', objectPosition: 'center top' }}
                sizes="80px"
              />
            </div>
          )}

          {/* Expand chevron — only if summary exists */}
          {hasSummary && (
            <svg
              width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="var(--plh-text-40)" strokeWidth="2" strokeLinecap="round"
              style={{
                flexShrink: 0,
                marginTop: '4px',
                transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 250ms ease',
              }}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          )}
        </div>

        {/* SUMMARY PANEL — expands between headline and bottom bar */}
        {hasSummary && expanded && (
          <div
            className="mb-3"
            style={{
              background: 'var(--plh-elevated)',
              borderRadius: '6px',
              padding: '12px 14px',
              borderLeft: '2px solid var(--plh-pink)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Paragraphs */}
            <div className="mb-3">
              {summaryParagraphs.map((para, i) => (
                <p
                  key={i}
                  className="text-[14px] font-light leading-[1.65]"
                  style={{
                    color: 'var(--plh-text-100)',
                    marginBottom: i < summaryParagraphs.length - 1 ? '10px' : '0',
                  }}
                >
                  {para}
                </p>
              ))}
            </div>

            {/* Full story + Share — right-aligned */}
            <div className="flex items-center justify-end gap-4">
              <button
                onClick={handleShare}
                className="flex items-center gap-1.5 text-[12px] font-medium transition-colors duration-200"
                style={{ color: 'var(--plh-text-75)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                {copied ? (
                  <>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--plh-teal)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span style={{ color: 'var(--plh-teal)' }}>Copied</span>
                  </>
                ) : (
                  <>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                    </svg>
                    Share
                  </>
                )}
              </button>
              <a
                href={post.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-[12px] font-semibold transition-colors duration-200"
                style={{ color: 'var(--plh-teal)', textDecoration: 'none' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.textDecoration = 'underline'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.textDecoration = 'none'; }}
              >
                Full story →
              </a>
            </div>
          </div>
        )}

        {/* BOTTOM BAR */}
        <div className="flex items-center justify-between gap-2">
          {/* Left: source dot · name · time · clubs */}
          <div className="flex items-center gap-1.5 flex-wrap min-w-0">
            <span className="w-[6px] h-[6px] rounded-full flex-shrink-0" style={{ background: sourceColor }} />
            <span
              className="text-[11px] font-semibold uppercase tracking-[1px] whitespace-nowrap"
              style={{ color: 'var(--plh-text-100)' }}
            >
              {post.sourceInfo.name}
            </span>
            <span style={{ color: 'var(--plh-text-40)', fontSize: '10px' }}>·</span>
            <span className="text-[11px] whitespace-nowrap" style={{ color: 'var(--plh-text-75)' }}>
              {post.timeDisplay}
            </span>
            {post.clubs.length > 0 && (
              <>
                <span style={{ color: 'var(--plh-text-40)', fontSize: '10px' }}>·</span>
                <div className="flex items-center gap-1">
                  {post.clubs.slice(0, 3).map((club) => (
                    <span
                      key={club.slug}
                      className="text-[10px] font-bold uppercase tracking-[0.5px] rounded-[3px] px-1.5 py-0.5"
                      style={{
                        background: '#3AAFA9',
                        color: '#0D1B2A',
                        fontFamily: "'JetBrains Mono', 'Consolas', monospace",
                      }}
                    >
                      {club.code}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Right: Hub Index score */}
          <div
            className="flex items-center gap-1 flex-shrink-0 px-2 py-0.5 rounded-[5px] cursor-default select-none"
            style={{
              background: 'color-mix(in srgb, var(--plh-text-100) 7%, transparent)',
              border: '1px solid color-mix(in srgb, var(--plh-text-100) 12%, transparent)',
            }}
            title="Hub Index score — ranked by relevance and recency"
          >
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
              <path d="M2 14V2H14" stroke="var(--plh-teal)" strokeWidth="3.5" strokeLinecap="round" />
            </svg>
            <span style={{
              fontSize: '13px',
              fontWeight: 700,
              fontFamily: "'JetBrains Mono', 'Consolas', monospace",
              color: 'var(--plh-text-100)',
              lineHeight: 1,
            }}>
              {post.indexScore}
            </span>
          </div>
        </div>

      </div>
    </article>
  );
}
