'use client'

import { useState } from 'react'
import Image from 'next/image'
import type { FeedPost } from '@/lib/types'

interface StoryCardProps {
  post: FeedPost
  isExpanded: boolean
  onToggleExpand: () => void
  index?: number
}

/**
 * Map source names to domains for favicon lookup
 */
function getSourceDomain(source: string): string {
  const domainMap: Record<string, string> = {
    'bbc': 'bbc.co.uk',
    'guardian': 'theguardian.com',
    'sky': 'skysports.com',
    'athletic': 'theathletic.com',
    'espn': 'espn.com',
    'talksport': 'talksport.com',
    'reddit': 'reddit.com',
    'goal': 'goal.com',
    '90min': '90min.com',
    'youtube': 'youtube.com',
  }

  const lowerSource = source.toLowerCase()
  for (const [key, domain] of Object.entries(domainMap)) {
    if (lowerSource.includes(key)) return domain
  }
  return source
}

/**
 * Get the source name for display
 */
function getSourceName(source: string): string {
  const nameMap: Record<string, string> = {
    'bbc': 'BBC Sport',
    'guardian': 'The Guardian',
    'sky': 'Sky Sports',
    'athletic': 'The Athletic',
    'espn': 'ESPN',
    'talksport': 'talkSPORT',
    'reddit': 'Reddit',
    'goal': 'Goal.com',
    '90min': '90min',
    'youtube': 'YouTube',
  }

  const lowerSource = source.toLowerCase()
  for (const [key, name] of Object.entries(nameMap)) {
    if (lowerSource.includes(key)) return name
  }
  return source
}

export default function StoryCard({ post, isExpanded, onToggleExpand, index = 0 }: StoryCardProps) {
  const [imgError, setImgError] = useState(false)
  const [summaryExpanded, setSummaryExpanded] = useState(false)
  const [spPulsing, setSpPulsing] = useState(false)

  const hasImage = !!post.imageUrl && !imgError
  const sourceName = getSourceName(post.sourceInfo.name)
  const sourceDomain = getSourceDomain(post.sourceInfo.name)
  const staggerDelay = index < 10 ? `${index * 60}ms` : '0ms'
  const hasSummary = !!post.summary

  const handleSummaryToggle = () => {
    setSpPulsing(true)
    setTimeout(() => setSpPulsing(false), 300)
    setSummaryExpanded(!summaryExpanded)
  }

  return (
    <article
      id={`post-${post.id}`}
      className="story-card bg-[#1A2A2B] rounded-xl overflow-hidden border border-white/5 p-4 sm:p-5 transition-all duration-200 ease-out hover:border-white/10 hover:shadow-lg hover:shadow-black/20 animate-card-enter"
      style={{ animationDelay: staggerDelay }}
    >
      {/* ROW 1: SOURCE + CLUB + TIMESTAMP */}
      <div className="flex items-center justify-between mb-4 gap-3">
        {/* Left side: Favicon, source name, club badge, club name */}
        <div className="flex items-center gap-2 min-w-0">
          {/* Favicon */}
          <img
            src={`https://www.google.com/s2/favicons?domain=${sourceDomain}&sz=32`}
            alt={sourceName}
            className="w-5 h-5 rounded-sm flex-shrink-0"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
            }}
          />

          {/* Source name */}
          <span className="text-xs text-gray-400 font-medium whitespace-nowrap">
            {sourceName}
          </span>

          {/* Separator dot */}
          <span className="text-gray-600 mx-2">·</span>

          {/* Club badge + short name */}
          {post.clubs.length > 0 && (
            <>
              <div className="w-5 h-5 flex-shrink-0">
                <Image
                  src={post.clubs[0].badgeUrl}
                  alt={post.clubs[0].shortName}
                  width={20}
                  height={20}
                  unoptimized
                  className="w-full h-full object-contain rounded-full"
                />
              </div>
              <span className="text-xs text-gray-400">
                {post.clubs[0].shortName}
              </span>
            </>
          )}
        </div>

        {/* Right side: Timestamp */}
        <span className="text-xs text-gray-500 whitespace-nowrap ml-auto">
          {post.timeDisplay}
        </span>
      </div>

      {/* IMAGE */}
      {hasImage && (
        <div className="relative w-[calc(100%+2rem)] -mx-4 sm:-mx-5 sm:w-[calc(100%+2.5rem)] mb-4 h-[160px] sm:h-[200px] overflow-hidden rounded-lg">
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

      {/* ROW 2: HEADLINE */}
      <h3 className="text-xl font-semibold text-white leading-tight mt-3 line-clamp-3">
        {post.title}
      </h3>

      {/* ROW 3: SECRET PUNDIT REVEAL */}
      {hasSummary && (
        <>
          {/* Trigger button */}
          <button
            onClick={handleSummaryToggle}
            className="w-full mt-3 flex items-center gap-2 rounded-lg py-2.5 px-3 bg-white/[0.03] hover:bg-white/[0.06] transition-all duration-200 ease-out cursor-pointer"
          >
            {/* SP Circle */}
            <div
              className={`flex-shrink-0 w-7 h-7 rounded-full bg-[#00555A] text-white text-xs font-bold flex items-center justify-center transition-all duration-300 ${
                spPulsing ? 'animate-badge-pulse' : ''
              }`}
              style={
                summaryExpanded
                  ? { boxShadow: '0 0 8px rgba(196,162,62,0.3)' }
                  : {}
              }
            >
              SP
            </div>

            {/* Label */}
            <span className="text-sm text-gray-300 font-medium flex-1 text-left">
              The Pundit's Take
            </span>

            {/* Chevron */}
            <span
              className="text-gray-500 text-sm transition-transform duration-300 flex-shrink-0"
              style={{
                transform: summaryExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
              }}
            >
              ▸
            </span>
          </button>

          {/* Summary container */}
          <div
            className="overflow-hidden transition-all duration-300 ease-out"
            style={{
              maxHeight: summaryExpanded ? '500px' : '0px',
              opacity: summaryExpanded ? 1 : 0,
            }}
          >
            <div className="mt-2 pl-4 border-l-2 border-[#00555A] py-3">
              <p className="text-base text-gray-200 leading-relaxed">
                {post.summary}
              </p>
            </div>
          </div>
        </>
      )}

      {/* ROW 4: FOOTER */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
        {/* Left side: CTA link */}
        <a
          href={post.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-sm font-medium text-[#C4A23E] hover:underline transition-colors"
        >
          {post.source === 'youtube'
            ? 'Watch video →'
            : post.source === 'reddit'
              ? 'Read thread →'
              : 'Read article →'}
        </a>

        {/* Right side: Index score badge */}
        {post.indexScore && (
          <div className="bg-[#00777A] text-white text-sm font-medium rounded-md px-2.5 py-1 flex items-center gap-1.5 tabular-nums flex-shrink-0">
            <span className="text-xs">✦</span>
            <span>{post.indexScore}</span>
          </div>
        )}
      </div>
    </article>
  )
}
