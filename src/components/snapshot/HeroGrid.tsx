'use client'

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

interface HeroGridProps {
  stories: SnapshotStory[]
  isLoading?: boolean
  error?: string | null
}

// Moody fallback gradient for null images
const FALLBACK_GRADIENT =
  'linear-gradient(135deg, #1a3a2a 0%, #0d2818 30%, #1a4a32 60%, #0a1f12 100%)'

export default function HeroGrid({
  stories = [],
  isLoading = false,
  error = null,
}: HeroGridProps) {
  // Get first 5 stories, pad if needed
  const displayStories = [...stories].slice(0, 5)
  while (displayStories.length < 5) {
    displayStories.push(null as any)
  }

  const handleTileClick = (storyId: string) => {
    const el = document.getElementById(`post-${storyId}`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  if (isLoading) {
    return (
      <div className="w-full">
        {/* Desktop: 2-column grid for top 3 stories */}
        <div className="hidden sm:grid sm:grid-cols-2 sm:gap-1.5 mb-1.5">
          {/* Hero skeleton (left, spans 2 rows) */}
          <div
            className="sm:row-span-2 rounded-lg overflow-hidden"
            style={{
              minHeight: '320px',
              background: 'rgba(250, 245, 240, 0.04)',
              animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            }}
          />
          {/* Sidekick 1 skeleton (right top) */}
          <div
            className="rounded-lg overflow-hidden"
            style={{
              minHeight: '152px',
              background: 'rgba(250, 245, 240, 0.04)',
              animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            }}
          />
          {/* Sidekick 2 skeleton (right bottom) */}
          <div
            className="rounded-lg overflow-hidden"
            style={{
              minHeight: '152px',
              background: 'rgba(250, 245, 240, 0.04)',
              animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            }}
          />
        </div>

        {/* Mobile: single column */}
        <div className="sm:hidden flex flex-col gap-1.5">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={`skeleton-${i}`}
              className="rounded-lg"
              style={{
                height: i === 0 ? '200px' : '140px',
                background: 'rgba(250, 245, 240, 0.04)',
                animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
              }}
            />
          ))}
        </div>

        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}</style>
      </div>
    )
  }

  if (error || !displayStories.some((s) => s)) {
    return null
  }

  return (
    <div className="w-full">
      {/* Desktop: 2-column grid layout */}
      <div className="hidden sm:grid sm:grid-cols-2 sm:gap-1.5 mb-1.5">
        {/* Story 0: Hero tile (left column, spans 2 rows) */}
        {displayStories[0] && (
          <HeroTile
            story={displayStories[0]}
            isHero
            onClick={() => handleTileClick(displayStories[0].id)}
          />
        )}

        {/* Story 1: Sidekick tile (right top) */}
        {displayStories[1] && (
          <SidekickTile
            story={displayStories[1]}
            onClick={() => handleTileClick(displayStories[1].id)}
          />
        )}

        {/* Story 2: Sidekick tile (right bottom) */}
        {displayStories[2] && (
          <SidekickTile
            story={displayStories[2]}
            onClick={() => handleTileClick(displayStories[2].id)}
          />
        )}
      </div>

      {/* Stories 3-4: Compact rows (full width) */}
      <div className="w-full">
        {displayStories[3] && (
          <CompactRow
            story={displayStories[3]}
            onClick={() => handleTileClick(displayStories[3].id)}
          />
        )}
        {displayStories[4] && (
          <CompactRow
            story={displayStories[4]}
            onClick={() => handleTileClick(displayStories[4].id)}
            isLast
          />
        )}
      </div>

      {/* Mobile: single column stack */}
      <div className="sm:hidden flex flex-col gap-1.5">
        {/* Story 0: full-width hero */}
        {displayStories[0] && (
          <HeroTile
            story={displayStories[0]}
            isHero
            isMobile
            onClick={() => handleTileClick(displayStories[0].id)}
          />
        )}

        {/* Stories 1-2: full-width sidekicks */}
        {displayStories[1] && (
          <SidekickTile
            story={displayStories[1]}
            isMobile
            onClick={() => handleTileClick(displayStories[1].id)}
          />
        )}
        {displayStories[2] && (
          <SidekickTile
            story={displayStories[2]}
            isMobile
            onClick={() => handleTileClick(displayStories[2].id)}
          />
        )}

        {/* Stories 3-4: compact rows */}
        {displayStories[3] && (
          <CompactRow
            story={displayStories[3]}
            onClick={() => handleTileClick(displayStories[3].id)}
          />
        )}
        {displayStories[4] && (
          <CompactRow
            story={displayStories[4]}
            onClick={() => handleTileClick(displayStories[4].id)}
            isLast
          />
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  )
}

interface HeroTileProps {
  story: SnapshotStory
  isHero?: boolean
  isMobile?: boolean
  onClick: () => void
}

function HeroTile({ story, isHero = false, isMobile = false, onClick }: HeroTileProps) {
  const minHeight = isHero && !isMobile ? '320px' : isMobile ? '200px' : 'auto'
  const backgroundImage = story.image_url
    ? `url(${story.image_url})`
    : 'none'
  const backgroundColor = story.image_url ? 'transparent' : FALLBACK_GRADIENT

  return (
    <div
      className={`
        relative overflow-hidden cursor-pointer transition-transform duration-300
        rounded-lg hover:scale-y-[1.003]
        ${isHero && !isMobile ? 'sm:row-span-2' : ''}
      `}
      onClick={onClick}
      style={{
        minHeight,
        background: backgroundColor,
      }}
    >
      {/* Background image with overlay */}
      <div
        className="absolute inset-0 transition-transform duration-300 hover:scale-x-[1.03]"
        style={{
          backgroundImage,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />

      {/* Dark gradient overlay */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(transparent 20%, rgba(13,27,42,0.4) 45%, rgba(13,27,42,0.92) 100%)',
        }}
      />

      {/* Content */}
      <div className="relative h-full flex flex-col justify-end p-5">
        {/* Club tags */}
        {story.clubs.length > 0 && (
          <div className="flex items-center gap-1.5 mb-3">
            {story.clubs.map((club) => (
              <span
                key={club.slug}
                className="text-[11px] font-semibold uppercase tracking-[0.5px] px-2 py-1 rounded-[3px]"
                style={{
                  color: '#3AAFA9',
                  background: 'rgba(58, 175, 169, 0.2)',
                }}
              >
                {club.code}
              </span>
            ))}
          </div>
        )}

        {/* Headline */}
        <h3
          className={`
            font-semibold leading-tight text-white line-clamp-3
            ${isHero && !isMobile ? 'text-base sm:text-lg' : 'text-sm'}
          `}
          style={{
            fontFamily: 'Sora, sans-serif',
          }}
        >
          {story.headline}
        </h3>

        {/* Source and PLHub index */}
        <div
          className="flex items-center justify-between gap-2 mt-3"
          style={{ fontSize: '11px' }}
        >
          <span
            style={{
              color: getSourceColor(story.source.name),
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            {story.source.name}
          </span>
          {story.plhub_index !== null && (
            <span
              style={{
                color: '#3AAFA9',
                fontWeight: 600,
              }}
            >
              {story.plhub_index}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

interface SidekickTileProps {
  story: SnapshotStory
  isMobile?: boolean
  onClick: () => void
}

function SidekickTile({ story, isMobile = false, onClick }: SidekickTileProps) {
  const backgroundImage = story.image_url
    ? `url(${story.image_url})`
    : 'none'
  const backgroundColor = story.image_url ? 'transparent' : FALLBACK_GRADIENT

  return (
    <div
      className="relative overflow-hidden cursor-pointer transition-transform duration-300 rounded-[10px] hover:scale-y-[1.003]"
      onClick={onClick}
      style={{
        minHeight: isMobile ? '140px' : '152px',
        background: backgroundColor,
      }}
    >
      {/* Background image with overlay */}
      <div
        className="absolute inset-0 transition-transform duration-300 hover:scale-x-[1.03]"
        style={{
          backgroundImage,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />

      {/* Dark gradient overlay */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(transparent 20%, rgba(13,27,42,0.4) 45%, rgba(13,27,42,0.92) 100%)',
        }}
      />

      {/* Content */}
      <div className="relative h-full flex flex-col justify-end p-4">
        {/* Club tags */}
        {story.clubs.length > 0 && (
          <div className="flex items-center gap-1 mb-2 flex-wrap">
            {story.clubs.map((club) => (
              <span
                key={club.slug}
                className="text-[9px] font-semibold uppercase tracking-[0.3px] px-1.5 py-0.5 rounded-[2px]"
                style={{
                  color: '#3AAFA9',
                  background: 'rgba(58, 175, 169, 0.2)',
                }}
              >
                {club.code}
              </span>
            ))}
          </div>
        )}

        {/* Headline */}
        <h3
          className="text-sm font-semibold leading-tight text-white line-clamp-2"
          style={{
            fontFamily: 'Sora, sans-serif',
          }}
        >
          {story.headline}
        </h3>

        {/* Source and PLHub index */}
        <div
          className="flex items-center justify-between gap-2 mt-2"
          style={{ fontSize: '9px' }}
        >
          <span
            style={{
              color: getSourceColor(story.source.name),
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.3px',
            }}
          >
            {story.source.name}
          </span>
          {story.plhub_index !== null && (
            <span
              style={{
                color: '#3AAFA9',
                fontWeight: 600,
              }}
            >
              {story.plhub_index}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

interface CompactRowProps {
  story: SnapshotStory
  isLast?: boolean
  onClick: () => void
}

function CompactRow({ story, isLast = false, onClick }: CompactRowProps) {
  return (
    <div>
      <div
        className="px-1 py-2 hover:bg-[rgba(250,245,240,0.02)] transition-colors duration-200 cursor-pointer flex items-center gap-2"
        onClick={onClick}
      >
        {/* Source */}
        <span
          className="text-[9px] font-semibold uppercase tracking-[0.5px] flex-shrink-0"
          style={{
            color: getSourceColor(story.source.name),
          }}
        >
          {story.source.name}
        </span>

        {/* Headline (ellipsis) */}
        <h4
          className="text-[13px] font-medium text-[rgba(250,245,240,0.85)] flex-1 truncate"
          style={{
            fontFamily: 'Sora, sans-serif',
          }}
        >
          {story.headline}
        </h4>

        {/* PLHub index (far right) */}
        {story.plhub_index !== null && (
          <span
            className="text-[11px] font-semibold flex-shrink-0"
            style={{
              color: '#3AAFA9',
            }}
          >
            {story.plhub_index}
          </span>
        )}
      </div>

      {/* Divider */}
      {!isLast && (
        <div
          style={{
            height: '1px',
            background: 'rgba(250, 245, 240, 0.04)',
          }}
        />
      )}
    </div>
  )
}
