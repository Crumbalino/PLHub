'use client'

import { getSourceColor } from '@/lib/theme'

interface SnapshotStoryItemProps {
  id: string
  title: string
  summary: string | null
  previewBlurb: string | null
  source: string
  clubs: Array<{ slug: string; shortName: string; code: string }>
  indexScore: number | null
  timeDisplay: string
  isLast?: boolean
}

export default function SnapshotStoryItem({
  id,
  title,
  summary,
  previewBlurb,
  source,
  clubs,
  indexScore,
  timeDisplay,
  isLast = false,
}: SnapshotStoryItemProps) {
  const sourceColor = getSourceColor(source)

  const handleAnchor = () => {
    const el = document.getElementById(`post-${id}`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  // Trim summary to max 2 sentences
  let displaySummary = summary
  if (displaySummary) {
    const sentences = displaySummary.split(/(?<=[.!?])\s+/)
    displaySummary = sentences.slice(0, 2).join(' ')
  }

  return (
    <div>
      {/* Story item */}
      <div className="px-4 py-3">
        {/* Top row: source · timestamp | index score */}
        <div className="flex items-center justify-between gap-3 mb-1.5">
          <span
            className="text-[9px] font-semibold uppercase tracking-[1.5px] flex-shrink-0"
            style={{ color: sourceColor }}
          >
            {source}
          </span>
          <span
            className="text-[9px] flex-shrink-0"
            style={{ color: 'rgba(250, 245, 240, 0.5)' }}
          >
            {timeDisplay}
          </span>
          {indexScore !== null && (
            <div
              className="flex items-center gap-1 flex-shrink-0 ml-auto"
              style={{ color: '#3AAFA9' }}
            >
              <svg
                width="10"
                height="10"
                viewBox="0 0 36 36"
                fill="none"
                style={{ marginRight: '2px' }}
              >
                <path
                  d="M4 14V4H14"
                  stroke="#3AAFA9"
                  strokeWidth="4.5"
                  strokeLinecap="round"
                />
              </svg>
              <span className="text-[12px] font-semibold tabular-nums">
                {indexScore}
              </span>
            </div>
          )}
        </div>

        {/* Headline (clickable, links to feed) */}
        <button
          onClick={handleAnchor}
          className="
            text-left w-full
            text-[14px] font-semibold text-[rgba(250,245,240,1)]
            leading-[1.4]
            line-clamp-2
            mb-1
            cursor-pointer
            transition-colors duration-200
            hover:text-[#3AAFA9]
          "
        >
          {title}
        </button>

        {/* Summary (if exists, max 2 sentences) */}
        {displaySummary && (
          <p
            className="text-[12px] font-light leading-[1.5] mb-2"
            style={{ color: 'rgba(250, 245, 240, 0.65)' }}
          >
            {displaySummary}
          </p>
        )}

        {/* Club tags */}
        {clubs.length > 0 && (
          <div className="flex items-center gap-1.5">
            {clubs.map(club => (
              <span
                key={club.slug}
                className="text-[8px] font-semibold uppercase tracking-[1px] px-1.5 py-0.5 rounded-[3px]"
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

      {/* Divider (except for last item) */}
      {!isLast && (
        <div
          className="h-px"
          style={{ background: 'rgba(250, 245, 240, 0.03)' }}
        />
      )}
    </div>
  )
}
