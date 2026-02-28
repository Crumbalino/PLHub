'use client'

import { useState, useRef, useEffect } from 'react'
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

/**
 * Split summary into paragraphs on ". " followed by capital letter
 */
function splitSummaryIntoParagraphs(summary: string): string[] {
  return summary.split(/\.\s+(?=[A-Z])/).map(p => p.trim() + (p.endsWith('.') ? '' : '.'))
}

/**
 * Get index score color coding
 */
function getScoreColorClass(score: number): { bg: string; text: string; border: string; glow: string } {
  if (score >= 70) {
    return {
      bg: 'bg-[#C4A23E]/20',
      text: 'text-[#C4A23E]',
      border: 'border border-[#C4A23E]/30',
      glow: 'shadow-lg shadow-[#C4A23E]/20',
    }
  }
  if (score >= 50) {
    return {
      bg: 'bg-white/10',
      text: 'text-white',
      border: 'border border-white/20',
      glow: '',
    }
  }
  return {
    bg: 'bg-white/5',
    text: 'text-gray-400',
    border: 'border border-white/5',
    glow: '',
  }
}

export default function StoryCard({ post, isExpanded, onToggleExpand, index = 0 }: StoryCardProps) {
  const [imgError, setImgError] = useState(false)
  const [summaryExpanded, setSummaryExpanded] = useState(false)
  const [spPulsing, setSpPulsing] = useState(false)
  const [borderPulsing, setBorderPulsing] = useState(false)
  const [cardHovered, setCardHovered] = useState(false)
  const [animatedScore, setAnimatedScore] = useState(0)
  const [hasAnimatedScore, setHasAnimatedScore] = useState(false)
  const cardRef = useRef<HTMLArticleElement>(null)

  const hasImage = !!post.imageUrl && !imgError
  const sourceName = getSourceName(post.sourceInfo.name)
  const sourceDomain = getSourceDomain(post.sourceInfo.name)
  const staggerDelay = index < 10 ? `${index * 60}ms` : '0ms'
  const hasSummary = !!post.summary
  const paragraphs = hasSummary ? splitSummaryIntoParagraphs(post.summary) : []
  const spTriggerText = post.summaryHook || 'The Pundit\'s Take'
  const teaser = hasSummary ? post.summary.substring(0, 60).trim() + '...' : null

  // Animated score count-up with IntersectionObserver
  useEffect(() => {
    if (!post.indexScore || hasAnimatedScore || !cardRef.current) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasAnimatedScore(true)
          const target = post.indexScore
          let current = 0
          const increment = target / 60 // 60 frames over ~1s
          const interval = setInterval(() => {
            current += increment
            if (current >= target) {
              setAnimatedScore(target)
              clearInterval(interval)
            } else {
              setAnimatedScore(Math.floor(current))
            }
          }, 16) // ~60fps

          observer.unobserve(entry.target)
        }
      },
      { threshold: 0.5 }
    )

    observer.observe(cardRef.current)
    return () => observer.disconnect()
  }, [post.indexScore, hasAnimatedScore])

  const handleCardClick = () => {
    if (!hasSummary) return
    setSpPulsing(true)
    setBorderPulsing(true)
    setSummaryExpanded(!summaryExpanded)
    setTimeout(() => setSpPulsing(false), 300)
    setTimeout(() => setBorderPulsing(false), 500)
  }

  const scoreColor = getScoreColorClass(post.indexScore || 0)
  const displayScore = hasAnimatedScore ? animatedScore : post.indexScore || 0

  return (
    <article
      ref={cardRef}
      id={`post-${post.id}`}
      onClick={handleCardClick}
      onMouseEnter={() => setCardHovered(true)}
      onMouseLeave={() => setCardHovered(false)}
      className={`story-card bg-[#1A2A2B] rounded-xl overflow-hidden border border-white/5 p-4 sm:p-5 pb-4 transition-all duration-200 ease-out hover:border-white/10 hover:shadow-lg hover:shadow-black/20 animate-card-enter ${
        hasSummary ? 'cursor-pointer' : ''
      } ${borderPulsing ? 'animate-border-pulse' : ''}`}
      style={{
        animationDelay: staggerDelay,
        borderColor: borderPulsing ? 'rgba(196,162,62,0.3)' : undefined,
      }}
    >
      {/* ROW 1: SOURCE + CLUB + TIMESTAMP + INDEX SCORE */}
      <div className="flex items-center justify-between mb-4 gap-3">
        {/* Left side: Favicon, source name, club badge, club name, timestamp */}
        <div className="flex items-center gap-2 min-w-0 flex-wrap">
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
          <span className="text-xs text-gray-300 font-medium whitespace-nowrap">
            {sourceName}
          </span>

          {/* Separator dot */}
          <span className="text-gray-400 mx-1">·</span>

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
              <span className="text-xs text-gray-300 whitespace-nowrap">
                {post.clubs[0].shortName}
              </span>

              {/* Separator dot before timestamp */}
              <span className="text-gray-400 mx-1">·</span>
            </>
          )}

          {/* Timestamp */}
          <span className="text-xs text-gray-400 whitespace-nowrap">
            {post.timeDisplay}
          </span>
        </div>

        {/* Right side: INDEX SCORE */}
        {post.indexScore && (
          <div
            className={`${scoreColor.bg} ${scoreColor.text} ${scoreColor.border} text-sm font-bold rounded-md px-2 py-0.5 tabular-nums ${scoreColor.glow} transition-all duration-200 flex-shrink-0`}
          >
            {displayScore}
          </div>
        )}
      </div>

      {/* ROW 2: IMAGE */}
      {hasImage && (
        <div className="relative w-[calc(100%+2rem)] -mx-4 sm:-mx-5 sm:w-[calc(100%+2.5rem)] mb-4 h-[200px] sm:h-[300px] overflow-hidden rounded-lg">
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

      {/* ROW 3: HEADLINE */}
      <h3 className="text-xl font-semibold text-white leading-tight mt-3 line-clamp-3">
        {post.title}
      </h3>

      {/* TEASER LINE: First 60 chars of summary */}
      {teaser && (
        <p
          className={`text-sm mt-2 transition-colors duration-200 ease-out ${
            cardHovered ? 'text-gray-200' : 'text-gray-300'
          }`}
        >
          {teaser}
        </p>
      )}

      {/* ROW 4: SECRET PUNDIT REVEAL */}
      {hasSummary && (
        <>
          {/* Trigger button */}
          <div className="w-full mt-3 flex items-center gap-2 rounded-lg py-2.5 px-3 bg-white/[0.03] hover:bg-white/[0.06] transition-all duration-200 ease-out">
            {/* SP Circle */}
            <div
              className={`flex-shrink-0 w-7 h-7 rounded-full bg-[#00555A] text-white text-xs font-bold flex items-center justify-center transition-all duration-300 ${
                spPulsing ? 'animate-badge-pulse' : ''
              }`}
              style={
                summaryExpanded || cardHovered
                  ? { boxShadow: '0 0 8px rgba(196,162,62,0.3)' }
                  : {}
              }
            >
              SP
            </div>

            {/* Label — shows hook if available, otherwise "The Pundit's Take" */}
            <span
              className={`text-sm font-medium flex-1 text-left transition-colors duration-200 ${
                spTriggerText && spTriggerText !== 'The Pundit\'s Take'
                  ? 'text-gray-200 italic'
                  : 'text-gray-200'
              }`}
            >
              {spTriggerText}
            </span>

            {/* Chevron */}
            <span
              className="text-gray-300 text-sm transition-transform duration-300 flex-shrink-0"
              style={{
                transform: summaryExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
              }}
            >
              ▸
            </span>
          </div>

          {/* Summary container — smooth expand/collapse */}
          <div
            className="overflow-hidden transition-all ease-out"
            style={{
              maxHeight: summaryExpanded ? '1000px' : '0px',
              opacity: summaryExpanded ? 1 : 0,
              transitionDuration: summaryExpanded ? '0.35s' : '0.25s',
              transitionTimingFunction: summaryExpanded ? 'ease-out' : 'ease-in',
            }}
          >
            <div className="mt-2 pl-4 border-l-2 border-[#00555A] py-3 space-y-4">
              {/* Summary paragraphs */}
              {paragraphs.map((para, idx) => (
                <p key={idx} className="text-base text-gray-200 leading-[1.8]">
                  {para}
                </p>
              ))}

              {/* CTA Link inside summary */}
              <div className="mt-4 mb-2">
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
              </div>
            </div>
          </div>
        </>
      )}
    </article>
  )
}
