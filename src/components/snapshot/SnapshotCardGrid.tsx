'use client'

import { useState } from 'react'
import { getSourceColor } from '@/lib/theme'

interface SnapshotStory {
  id: string
  headline: string
  summary: string | null
  source: { name: string; url: string }
  clubs: Array<{ slug: string; shortName: string; code: string; badgeUrl: string }>
  plhub_index: number | null
  published_at: string
  story_card_id: string
  image_url: string | null
}

interface CardGridData {
  label: string
  story?: SnapshotStory | null
  headline?: string | null
  imageUrl?: string | null
  source?: { name: string } | null
  plhubIndex?: number | null
}

interface SnapshotCardGridProps {
  cards: CardGridData[]
}

// Fallback gradients — subtle navy
const FALLBACK_GRADIENTS: Record<string, string> = {
  teal: 'linear-gradient(135deg, #1c2c3a 0%, #141f28 30%, #1c3a48 60%, #0f1820 100%)',
  pink: 'linear-gradient(135deg, #1c2c3a 0%, #141f28 30%, #1c3a48 60%, #0f1820 100%)',
}

function GridCard({
  label,
  story,
  headline,
  imageUrl,
  source,
  sourceColor,
  plhubIndex,
}: CardGridData & { sourceColor: string }) {
  const [hovered, setHovered] = useState(false)
  const displayHeadline = story?.headline || headline
  const imageUrl_final = story?.image_url || imageUrl
  const fallbackColor =
    label === 'THE REST' ? FALLBACK_GRADIENTS.pink : FALLBACK_GRADIENTS.teal
  const backgroundColor = imageUrl_final ? 'transparent' : fallbackColor
  const metricIndex = story?.plhub_index ?? plhubIndex

  const handleClick = () => {
    if (story?.id) {
      const el = document.getElementById(`post-${story.id}`)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }
  }

  return (
    <div
      className="relative overflow-hidden cursor-pointer rounded-lg"
      onClick={handleClick}
      style={{
        aspectRatio: '4/3',
        background: backgroundColor,
        borderLeft: `3px solid ${sourceColor}`,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Background image */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: imageUrl_final ? `url(${imageUrl_final})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          overflow: 'hidden',
          borderRadius: 'inherit',
          transform: hovered ? 'scale(1.04)' : 'scale(1)',
          transition: 'transform 300ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        }}
      />

      {/* Dark gradient overlay */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(transparent 20%, rgba(13,27,42,0.4) 45%, rgba(13,27,42,0.92) 100%)',
        }}
      />

      {/* Content overlay */}
      <div className="relative h-full flex flex-col p-3 group">
        {/* Metric overlay in top-right corner */}
        {metricIndex !== null && metricIndex !== undefined && (
          <div style={{ position: 'absolute', top: '8px', right: '8px', display: 'flex', alignItems: 'center', gap: '4px', filter: hovered ? 'drop-shadow(0 0 8px rgba(212, 168, 67, 0.7))' : 'none', transition: 'filter 300ms ease' }}>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              style={{ color: 'var(--plh-gold)' }}
            >
              <path d="M2 14V2H14" stroke="var(--plh-gold)" strokeWidth="3.5" strokeLinecap="round"/>
            </svg>
            <span
              style={{
                color: 'var(--plh-gold)',
                fontWeight: 700,
                fontFamily: "'Consolas','Courier New',monospace",
                fontSize: '16px',
                lineHeight: 1,
              }}
            >
              {metricIndex}
            </span>
          </div>
        )}

        {/* Spacer to push content to bottom */}
        <div className="flex-1" />

        {/* Category label */}
        <span
          className="text-[9px] font-semibold uppercase tracking-widest text-white/70 mb-1"
          style={{ color: sourceColor }}
        >
          {label}
        </span>

        {/* Headline */}
        <h3
          className="text-[13px] font-semibold leading-tight text-white line-clamp-2 mb-2"
          style={{
            fontFamily: 'var(--font-sora)',
          }}
        >
          {displayHeadline}
        </h3>

        {/* Bottom row: source on left, club tags on right */}
        <div className="flex items-end justify-between gap-1">
          {/* Source name */}
          {source && (
            <span
              style={{
                color: getSourceColor(source.name),
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.3px',
                fontSize: '9px',
              }}
            >
              {source.name}
            </span>
          )}

          {/* Club tags (only for stories) */}
          {story && story.clubs.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap justify-end">
              {story.clubs.map((club) => (
                <span
                  key={club.slug}
                  className="text-[9px] font-semibold uppercase tracking-[0.5px] px-1.5 py-0.5 rounded-[2px]"
                  style={{
                    color: 'white',
                    background: '#3AAFA9',
                  }}
                >
                  {club.code}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function SnapshotCardGrid({ cards }: SnapshotCardGridProps) {
  if (cards.length === 0) {
    return null
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {cards.map((card, idx) => {
        const sourceColor =
          card.label === 'THE REST'
            ? 'var(--plh-pink)'
            : 'var(--plh-teal)'

        return (
          <GridCard
            key={`grid-card-${idx}`}
            label={card.label}
            story={card.story || null}
            headline={card.headline || null}
            imageUrl={card.imageUrl || null}
            source={card.source || null}
            sourceColor={sourceColor}
            plhubIndex={card.plhubIndex || null}
          />
        )
      })}
    </div>
  )
}
