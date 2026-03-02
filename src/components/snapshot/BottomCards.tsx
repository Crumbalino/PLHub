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

interface AndFinallyData {
  headline: string | null
  image_url?: string | null
}

interface BottomCardsProps {
  transferStory?: SnapshotStory | null
  beyondBigSixStory?: SnapshotStory | null
  andFinallyData?: AndFinallyData | null
}

// Moody fallback gradient for null images
const FALLBACK_GRADIENT =
  'linear-gradient(135deg, #1a3a2a 0%, #0d2818 30%, #1a4a32 60%, #0a1f12 100%)'

export default function BottomCards({
  transferStory,
  beyondBigSixStory,
  andFinallyData,
}: BottomCardsProps) {
  const cards = [
    transferStory ? { story: transferStory, label: 'TRANSFERS', color: '#3AAFA9' } : null,
    beyondBigSixStory ? { story: beyondBigSixStory, label: 'BEYOND BIG SIX', color: '#3AAFA9' } : null,
    andFinallyData ? { headline: andFinallyData.headline, label: 'AND FINALLY', color: '#E84080', image_url: andFinallyData.image_url } : null,
  ].filter((c) => c !== null) as Array<{
    label: string
    color: string
    story?: SnapshotStory
    headline?: string | null
    image_url?: string | null
  }>

  if (cards.length === 0) {
    return null
  }

  return (
    <div
      className="grid gap-1.5 w-full"
      style={{
        gridTemplateColumns:
          cards.length === 3
            ? 'repeat(auto-fit, minmax(300px, 1fr))'
            : cards.length === 2
              ? 'repeat(2, 1fr)'
              : '1fr',
      }}
    >
      {cards.map((card, idx) => (
        <Card
          key={`card-${idx}`}
          label={card.label}
          color={card.color}
          story={('story' in card && card.story) || null}
          headline={('headline' in card && card.headline) || null}
          imageUrl={('image_url' in card && card.image_url) || null}
        />
      ))}
    </div>
  )
}

interface CardProps {
  label: string
  color: string
  story: SnapshotStory | null
  headline: string | null
  imageUrl: string | null
}

function Card({ label, color, story, headline, imageUrl }: CardProps) {
  const displayHeadline = story?.headline || headline
  const backgroundImage = (story?.image_url || imageUrl)
    ? `url(${story?.image_url || imageUrl})`
    : 'none'
  const backgroundColor = (story?.image_url || imageUrl) ? 'transparent' : FALLBACK_GRADIENT

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
      className="rounded-lg border overflow-hidden transition-colors duration-200 hover:bg-[#162D45] cursor-pointer"
      style={{
        borderColor: 'rgba(250, 245, 240, 0.04)',
        backgroundColor: '#112238',
      }}
      onClick={handleClick}
    >
      {/* Image section */}
      <div
        className="h-[90px] overflow-hidden transition-transform duration-300 hover:scale-y-[1.05]"
        style={{
          background: backgroundColor,
          backgroundImage,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          position: 'relative',
        }}
      >
        {/* Subtle bottom gradient blending into card */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '30px',
            background: 'linear-gradient(transparent, rgba(17, 34, 56, 0.8))',
          }}
        />
      </div>

      {/* Text section */}
      <div className="p-4">
        {/* Label row with PLHub index */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <span
            className="text-[9px] font-semibold uppercase tracking-[1px]"
            style={{ color }}
          >
            {label}
          </span>
          {story?.plhub_index !== null && story?.plhub_index !== undefined && (
            <span
              className="text-[9px] font-semibold"
              style={{ color: '#3AAFA9' }}
            >
              {story.plhub_index}
            </span>
          )}
        </div>

        {/* Headline */}
        <h3
          className="text-[12px] font-semibold leading-tight text-white line-clamp-2 mb-3"
          style={{
            fontFamily: 'Sora, sans-serif',
          }}
        >
          {displayHeadline}
        </h3>

        {/* Club tags (only for stories, not and_finally) */}
        {story && story.clubs.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap">
            {story.clubs.map((club) => (
              <span
                key={club.slug}
                className="text-[10px] font-semibold uppercase tracking-[0.5px] px-2 py-0.5 rounded-[2px]"
                style={{
                  color: '#3AAFA9',
                  background: 'rgba(58, 175, 169, 0.12)',
                }}
              >
                {club.code}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
