'use client'

import { useState } from 'react'
import type { FeedPost } from '@/lib/types'
import { formatSummaryForDisplay } from '@/lib/formatting'
import PulseIcon from './PulseIcon'

interface StoryCardProps {
  post: FeedPost
  isExpanded: boolean
  onToggleExpand: () => void
  /** Index in the feed list — used for stagger animation delay */
  index?: number
}

/**
 * StoryCard — the core feed item.
 *
 * Receives a fully enriched FeedPost with all display data pre-computed.
 * This component does ZERO business logic — it just renders props.
 * That's why it can port to React Native by swapping HTML elements.
 */
export default function StoryCard({ post, isExpanded, onToggleExpand, index = 0 }: StoryCardProps) {
  const [imgError, setImgError] = useState(false)

  const hasImage = !!post.imageUrl && !imgError
  const borderColor = post.sourceInfo.color

  // Stagger delay: first 10 cards get staggered entry, rest appear instantly
  const staggerDelay = index < 10 ? `${index * 60}ms` : '0ms'

  return (
    <article
      id={`post-${post.id}`}
      className={`story-card bg-[#183538] rounded-xl overflow-hidden border-l-4 animate-card-enter ${
        isExpanded ? 'animate-card-glow' : ''
      }`}
      style={{
        borderLeftColor: borderColor,
        animationDelay: staggerDelay,
      }}
    >
      {/* IMAGE BLOCK */}
      {hasImage && (
        <div className="relative w-full h-[160px] sm:h-[220px]">
          <img
            src={post.imageUrl!}
            alt=""
            className="w-full h-full object-cover object-top"
            onError={() => setImgError(true)}
            loading="lazy"
            decoding="async"
          />

          {/* Gradient overlay */}
          <div className="absolute bottom-0 left-0 right-0 h-[80px] bg-gradient-to-t from-[#0B1F21cc] to-transparent" />

          {/* Source badge on overlay */}
          <div className="absolute bottom-3 left-4 flex items-center gap-2 z-10">
            {post.sourceInfo.logo ? (
              <img
                src={post.sourceInfo.logo}
                alt=""
                className="w-5 h-5 rounded-full object-cover bg-white/10 shrink-0"
                onError={() => { (document.querySelector('#' + CSS.escape('img-err-' + Math.random())) as HTMLElement)?.remove?.() }}
              />
            ) : (
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: borderColor }}
              />
            )}
            <span className="text-sm font-medium text-white drop-shadow-md">
              {post.sourceInfo.name}
            </span>
          </div>

          {/* Timestamp */}
          <div className="absolute bottom-3 right-4 text-sm text-white/70">
            {post.timeDisplay}
          </div>

          {/* Score badge — heat-dependent */}
          {post.indexScore && (
            <div
              className={`absolute top-3 right-3 text-sm font-bold px-2.5 py-1.5 rounded-md flex items-center gap-1.5 z-10 shadow-lg tabular-nums ${
                post.heatLabel === 'Hot' ? 'heat-hot' :
                post.heatLabel === 'Warm' ? 'heat-warm' :
                'bg-[#00555A] text-white'
              } ${isExpanded ? 'animate-badge-pulse' : ''}`}
            >
              <PulseIcon size={14} color={post.heatLabel === 'Hot' ? '#0B1F21' : '#C4A23E'} />
              <span>{post.indexScore}</span>
            </div>
          )}

          {/* YouTube play button */}
          {post.source === 'youtube' && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-14 h-14 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
                <span className="text-2xl text-white">▶</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Text-only header (no image) */}
      {!hasImage && (
        <div className="flex items-center gap-2 px-5 pt-4 pb-2">
          {post.sourceInfo.logo ? (
            <img
              src={post.sourceInfo.logo}
              alt=""
              className="w-5 h-5 rounded-full object-cover bg-white/10 shrink-0"
              onError={() => { (document.querySelector('#' + CSS.escape('img-err-' + Math.random())) as HTMLElement)?.remove?.() }}
            />
          ) : (
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: borderColor }}
            />
          )}
          <span className="text-xs font-medium text-white/70">{post.sourceInfo.name}</span>
          <span className="flex-1" />
          {post.indexScore && (
            <div className={`text-sm font-bold px-2.5 py-1.5 rounded-md flex items-center gap-1.5 shadow-sm tabular-nums mr-2 ${
              post.heatLabel === 'Hot' ? 'heat-hot' :
              post.heatLabel === 'Warm' ? 'heat-warm' :
              'bg-[#00555A] text-white'
            }`}>
              <PulseIcon size={12} color={post.heatLabel === 'Hot' ? '#0B1F21' : '#C4A23E'} />
              <span>{post.indexScore}</span>
            </div>
          )}
          <span className="text-xs text-white/50">{post.timeDisplay}</span>
        </div>
      )}

      {/* CONTENT AREA */}
      <div className="px-4 sm:px-5 pt-4 pb-5">
        {/* Headline */}
        <h3 className="text-xl sm:text-2xl font-bold text-white leading-tight tracking-tight mb-2 line-clamp-3">
          {post.title}
        </h3>

        {/* Preview blurb */}
        {post.previewBlurb && !isExpanded && (
          <p className="text-sm text-white/60 leading-relaxed line-clamp-2 mb-3">
            {post.previewBlurb}
          </p>
        )}

        {/* Expand / AI Summary */}
        {post.summary && (
          <div className="mb-3">
            <div className="text-center mt-2">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onToggleExpand()
                }}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#C4A23E] hover:text-[#d4b24e] transition-all duration-200 cursor-pointer select-none group"
              >
                <PulseIcon
                  size={14}
                  className={`transition-all duration-300 ${
                    isExpanded ? 'animate-badge-pulse' : 'group-hover:scale-110'
                  }`}
                />
                {isExpanded ? 'Less' : 'Get the summary'}
              </button>
            </div>

            {/* Expandable summary panel */}
            <div
              className="overflow-hidden transition-all ease-out"
              style={{
                maxHeight: isExpanded ? '800px' : '0px',
                opacity: isExpanded ? 1 : 0,
                transitionDuration: isExpanded ? '600ms' : '300ms',
                transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              <div
                className={isExpanded ? 'animate-summary-reveal' : ''}
                style={{ animationDelay: '150ms' }}
              >
                <div className="border-l-2 border-l-[#C4A23E] pl-4 py-3 mb-3 mt-3 bg-white/[0.03] rounded-r-lg">
                  <div className="summary-text text-[15px] text-white leading-[2.1] tracking-wide whitespace-pre-line">
                    {formatSummaryForDisplay(post.summary)}
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    <span className="text-xs text-white/50">{post.readTimeLabel}</span>
                    <span className="text-xs text-white/30 select-none font-mono">.SP</span>
                  </div>

                  <a
                    href={post.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-block mt-3 text-xs text-white/40 hover:text-white/70 transition-colors"
                  >
                    {post.source === 'youtube'
                      ? 'Watch on YouTube ↗'
                      : post.source === 'reddit'
                        ? 'View original thread ↗'
                        : 'Read full article ↗'}
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer — club badges */}
        {post.clubs.length > 0 && (
          <div className="flex items-center gap-1.5 pt-3 border-t border-white/5">
            {post.clubs.slice(0, 4).map((club, idx) => (
              <div key={club.slug} className="flex items-center gap-1">
                {idx === 1 && post.isMatchReport && (
                  <span className="text-[10px] text-white/30 mx-0.5">vs</span>
                )}
                {idx > 0 && !post.isMatchReport && (
                  <span className="text-[10px] text-white/20 mx-0.5">·</span>
                )}
                <img
                  src={club.badgeUrl}
                  alt=""
                  className="w-5 h-5 object-contain"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = 'none'
                  }}
                />
                <span className="text-xs text-white/70">{club.shortName}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </article>
  )
}
