'use client'

import { useState } from 'react'
import Image from 'next/image'
import type { FeedPost } from '@/lib/types'
import { getPreviewSummary } from '@/lib/formatting'
import PulseIcon from './PulseIcon'

interface StoryCardProps {
  post: FeedPost
  isExpanded: boolean
  onToggleExpand: () => void
  index?: number
}

/**
 * Get the colored dot for a source
 */
function getSourceDot(source: string): { color: string; label: string } {
  const sourceMap: Record<string, { color: string; label: string }> = {
    'bbc': { color: '#F59E0B', label: 'BBC Sport' },
    'guardian': { color: '#3B82F6', label: 'The Guardian' },
    'sky': { color: '#3B82F6', label: 'Sky Sports' },
    'talksport': { color: '#9CA3AF', label: 'talkSPORT' },
    'reddit': { color: '#9CA3AF', label: 'Reddit' },
    'youtube': { color: '#EF4444', label: 'YouTube' },
  }

  // Detect source from sourceInfo.name
  const lowerName = source.toLowerCase()
  for (const [key, value] of Object.entries(sourceMap)) {
    if (lowerName.includes(key)) return value
  }
  return { color: '#9CA3AF', label: source }
}

/**
 * Check if a source is trusted
 */
function isTrustedSource(source: string): boolean {
  const lowerName = source.toLowerCase()
  return lowerName.includes('bbc') || lowerName.includes('sky') || lowerName.includes('guardian')
}

export default function StoryCard({ post, isExpanded, onToggleExpand, index = 0 }: StoryCardProps) {
  const [imgError, setImgError] = useState(false)
  const hasImage = !!post.imageUrl && !imgError
  const previewSummary = getPreviewSummary(post.summary)
  const sourceInfo = getSourceDot(post.sourceInfo.name)
  const isTrusted = isTrustedSource(post.sourceInfo.name)
  const staggerDelay = index < 10 ? `${index * 60}ms` : '0ms'

  return (
    <article
      id={`post-${post.id}`}
      className="story-card bg-[#1A2A2B] rounded-xl overflow-hidden border border-white/5 p-5 animate-card-enter"
      style={{ animationDelay: staggerDelay }}
    >
      {/* HEADER ROW: Source, Club, Timestamp */}
      <div className="flex items-center justify-between mb-4 gap-3">
        {/* Source with colored dot */}
        <div className="flex items-center gap-2 min-w-0">
          <div
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: sourceInfo.color }}
          />
          <span
            className="text-xs font-semibold whitespace-nowrap"
            style={{ color: sourceInfo.color }}
          >
            {sourceInfo.label}
          </span>
        </div>

        {/* Club badge + short name (middle) */}
        {post.clubs.length > 0 && (
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <div className="w-5 h-5 flex-shrink-0">
              <Image
                src={post.clubs[0].badgeUrl}
                alt={post.clubs[0].shortName}
                width={20}
                height={20}
                unoptimized
                className="w-full h-full object-contain"
              />
            </div>
            <span className="text-xs text-white/80 font-medium whitespace-nowrap">
              {post.clubs[0].shortName}
            </span>
          </div>
        )}

        {/* Timestamp (right) */}
        <span className="text-xs text-white/60 whitespace-nowrap ml-auto">
          {post.timeDisplay}
        </span>
      </div>

      {/* IMAGE */}
      {hasImage && (
        <div className="relative w-[calc(100%+2.5rem)] -mx-5 mb-4 h-[160px] sm:h-[200px] overflow-hidden rounded-lg">
          <img
            src={post.imageUrl!}
            alt=""
            className="w-full h-full object-cover object-top"
            onError={() => setImgError(true)}
            loading="lazy"
            decoding="async"
          />

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

      {/* HEADLINE — Dominant element */}
      <h3 className="text-lg sm:text-xl font-semibold text-white leading-tight mb-3 line-clamp-3">
        {post.title}
      </h3>

      {/* AI SUMMARY — Visible by default */}
      {previewSummary && (
        <div className="border-l-2 border-l-[#00555A] pl-3 py-2 mb-4 text-sm text-gray-200 leading-relaxed line-clamp-3">
          {previewSummary}
        </div>
      )}

      {/* CTA LINK */}
      <a
        href={post.url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="inline-block text-sm font-medium text-[#C4A23E] hover:underline transition-colors mb-3"
      >
        {post.source === 'youtube'
          ? 'Watch video →'
          : post.source === 'reddit'
            ? 'Read thread →'
            : 'Read article →'}
      </a>

      {/* SOURCE CREDIBILITY BADGE */}
      <div className="mb-3">
        {isTrusted ? (
          <span className="text-xs font-semibold text-[#C4A23E]">Trusted Source</span>
        ) : (
          <span className="text-xs text-white/40">Community</span>
        )}
      </div>

      {/* PLHub Index Score */}
      {post.indexScore && (
        <div className="flex items-center gap-2 mb-4">
          <div className="bg-[#00777A] text-white px-2 py-0.5 rounded-md text-sm font-medium flex items-center gap-1.5 tabular-nums">
            <PulseIcon size={12} color="white" />
            <span>Index {post.indexScore}</span>
          </div>
        </div>
      )}

      {/* FOOTER — All clubs */}
      {post.clubs.length > 0 && (
        <div className="flex items-center gap-1.5 pt-3 border-t border-white/5">
          {post.clubs.map((club, idx) => (
            <div key={club.slug} className="flex items-center gap-1">
              {idx === 1 && post.isMatchReport && (
                <span className="text-[10px] text-white/30 mx-0.5">vs</span>
              )}
              {idx > 0 && !post.isMatchReport && (
                <span className="text-[10px] text-white/20 mx-0.5">·</span>
              )}
              <Image
                src={club.badgeUrl}
                alt={club.shortName}
                width={16}
                height={16}
                unoptimized
                className="w-4 h-4 object-contain"
              />
              <span className="text-xs text-white/70">{club.shortName}</span>
            </div>
          ))}
        </div>
      )}
    </article>
  )
}
