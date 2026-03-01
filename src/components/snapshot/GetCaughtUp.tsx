'use client'

import { getSourceColor } from '@/lib/theme'
import ModuleTile from './ModuleTile'

interface Story {
  id: string
  title: string
  summary: string | null
  previewBlurb: string | null
  source: string
  sourceColor?: string
  clubs: Array<{ slug: string; shortName: string; code: string }>
  indexScore: number | null
  timeDisplay: string
  publishedAt: string
}

interface GetCaughtUpProps {
  stories: Story[]
}

export default function GetCaughtUp({ stories }: GetCaughtUpProps) {
  const handleAnchor = (id: string) => {
    const el = document.getElementById(`post-${id}`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  if (stories.length === 0) {
    return (
      <ModuleTile icon="📰" label="Get Caught Up" defaultOpen={true}>
        <div
          className="text-center py-6 text-[13px]"
          style={{ color: 'rgba(250, 245, 240, 0.5)' }}
        >
          No stories yet
        </div>
      </ModuleTile>
    )
  }

  return (
    <ModuleTile icon="📰" label="Get Caught Up" defaultOpen={true}>
      <div className="space-y-0">
        {stories.map((story, idx) => {
          const sourceColor = getSourceColor(story.source)

          // Trim summary to max 2 sentences
          let displaySummary = story.summary
          if (displaySummary) {
            const sentences = displaySummary.split(/(?<=[.!?])\s+/)
            displaySummary = sentences.slice(0, 2).join(' ')
          }

          return (
            <div key={story.id}>
              {/* Story item */}
              <div className="px-4 py-3">
                {/* Top row: source · timestamp | index score */}
                <div className="flex items-center justify-between gap-3 mb-1.5">
                  <span
                    className="text-[9px] font-semibold uppercase tracking-[1.5px] flex-shrink-0"
                    style={{ color: sourceColor }}
                  >
                    {story.source}
                  </span>
                  <span
                    className="text-[9px] flex-shrink-0"
                    style={{ color: 'rgba(250, 245, 240, 0.5)' }}
                  >
                    {story.timeDisplay}
                  </span>
                  {story.indexScore !== null && (
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
                        {story.indexScore}
                      </span>
                    </div>
                  )}
                </div>

                {/* Headline (clickable, links to feed) */}
                <button
                  onClick={() => handleAnchor(story.id)}
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
                  {story.title}
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
                {story.clubs.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    {story.clubs.map(club => (
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
              {idx < stories.length - 1 && (
                <div
                  className="h-px"
                  style={{ background: 'rgba(250, 245, 240, 0.03)' }}
                />
              )}
            </div>
          )
        })}
      </div>
    </ModuleTile>
  )
}
