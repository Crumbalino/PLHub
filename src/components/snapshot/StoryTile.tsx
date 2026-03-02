'use client'

import { useState } from 'react'
import { getSourceColor } from '@/lib/theme'

interface StoryTileProps {
  headline: string
  summary?: string | null
  source: { name: string; url: string }
  clubs?: string[]
  plhubIndex?: number | null
  variant: 'full' | 'compact'
  storyId: string
  onClick?: () => void
}

export default function StoryTile({
  headline,
  summary,
  source,
  clubs = [],
  plhubIndex,
  variant,
  storyId,
  onClick,
}: StoryTileProps) {
  const [isHovering, setIsHovering] = useState(false)
  const sourceColor = getSourceColor(source.name)

  const handleClick = () => {
    // Scroll to corresponding StoryCard in feed
    const el = document.getElementById(`post-${storyId}`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    onClick?.()
  }

  if (variant === 'compact') {
    return (
      <div
        className="py-2 px-0 cursor-pointer transition-colors duration-200"
        style={{
          borderBottom: '1px solid rgba(250, 245, 240, 0.04)',
          backgroundColor: isHovering ? 'rgba(250, 245, 240, 0.03)' : 'transparent',
        }}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        onClick={handleClick}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          {/* Source badge */}
          <span
            className="text-[9px] font-semibold uppercase tracking-[0.5px] flex-shrink-0"
            style={{ color: sourceColor }}
          >
            {source.name}
          </span>

          {/* Headline */}
          <h3
            className="text-[14px] font-medium line-clamp-1 min-w-0"
            style={{ color: 'rgba(250, 245, 240, 0.95)' }}
          >
            {headline}
          </h3>
        </div>
      </div>
    )
  }

  // FULL VARIANT
  return (
    <div
      className="p-2 sm:p-3 cursor-pointer transition-colors duration-200 rounded-lg"
      style={{
        backgroundColor: isHovering ? 'rgba(250, 245, 240, 0.03)' : 'transparent',
      }}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onClick={handleClick}
    >
      {/* Source badge */}
      <div className="mb-1">
        <span
          className="inline-block text-[10px] font-semibold uppercase tracking-[1px] px-2 py-1 rounded"
          style={{
            color: 'rgba(250, 245, 240, 0.6)',
            border: '1px solid rgba(250, 245, 240, 0.08)',
          }}
        >
          {source.name}
        </span>
      </div>

      {/* Headline */}
      <h3
        className="text-sm sm:text-base font-semibold leading-[1.3] mb-1 line-clamp-2"
        style={{ color: 'rgba(250, 245, 240, 0.95)' }}
      >
        {headline}
      </h3>

      {/* Summary */}
      {summary && (
        <p
          className="text-[13px] leading-[1.5] mb-2 line-clamp-2"
          style={{ color: 'rgba(250, 245, 240, 0.6)' }}
        >
          {summary.split(/[.!?]/).slice(0, 1).join('.')}
          {summary.includes('.') && '.'}
        </p>
      )}

      {/* Footer: Club tags and PLHub Index */}
      <div className="flex items-center justify-between gap-2">
        {/* Club tags */}
        {clubs.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap min-w-0">
            {clubs.map((club) => (
              <span
                key={club}
                className="text-[10px] font-semibold px-2 py-0.5 rounded text-nowrap"
                style={{
                  color: 'rgba(58, 175, 169, 0.8)',
                  backgroundColor: 'rgba(58, 175, 169, 0.08)',
                  border: '1px solid rgba(58, 175, 169, 0.12)',
                }}
              >
                {club}
              </span>
            ))}
          </div>
        )}

        {/* PLHub Index */}
        {plhubIndex !== undefined && plhubIndex !== null && (
          <div className="flex items-center gap-1 flex-shrink-0 ml-auto">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path
                d="M2 14V2H14"
                stroke="#3AAFA9"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
            <span
              className="text-[12px] font-semibold tabular-nums"
              style={{ color: '#3AAFA9' }}
            >
              {plhubIndex}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
