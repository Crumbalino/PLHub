'use client'

import { useEffect, useState } from 'react'
import StoryTile from './StoryTile'

interface SnapshotStory {
  id: string
  headline: string
  summary: string | null
  source: { name: string; url: string }
  clubs: Array<{ slug: string; shortName: string; code: string; badgeUrl: string }>
  plhub_index: number | null
  published_at: string
  story_card_id: string
}

interface BeyondBigSixProps {
  club?: string | null
}

export default function BeyondBigSix({ club = null }: BeyondBigSixProps) {
  const [stories, setStories] = useState<SnapshotStory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const url = new URL(
          '/api/snapshot',
          typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'
        )
        // Don't fetch if on a club page — this module is only for homepage
        if (club) {
          setStories([])
          setIsLoading(false)
          return
        }

        const response = await fetch(url.toString())
        if (!response.ok) {
          throw new Error('Failed to fetch snapshot')
        }

        const data = await response.json()
        if (data.success && data.data?.modules?.beyond_big_six) {
          setStories(data.data.modules.beyond_big_six || [])
          setError(null)
        } else {
          throw new Error(data.error || 'Invalid response format')
        }
      } catch (err) {
        console.error('[BeyondBigSix] Error fetching data:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
        setStories([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [club])

  // Don't render if on a club page
  if (club) {
    return null
  }

  // Don't render if no stories
  if (!isLoading && stories.length === 0) {
    return null
  }

  // Loading skeleton
  if (isLoading) {
    return (
      <div>
        {/* Module header */}
        <h2
          className="text-[11px] font-semibold uppercase tracking-[2px] mb-4"
          style={{ color: 'var(--plh-teal)' }}
        >
          Beyond the Big Six
        </h2>

        {/* Story skeletons */}
        <div className="space-y-2">
          {[0, 1].map((i) => (
            <div
              key={`skeleton-${i}`}
              className="p-3 sm:p-4 rounded-lg animate-pulse space-y-2"
              style={{ backgroundColor: 'rgba(250, 245, 240, 0.04)' }}
            >
              <div
                className="h-4 rounded w-20"
                style={{ backgroundColor: 'rgba(250, 245, 240, 0.04)' }}
              />
              <div
                className="h-6 rounded w-full"
                style={{ backgroundColor: 'rgba(250, 245, 240, 0.04)' }}
              />
              <div
                className="h-5 rounded w-full"
                style={{ backgroundColor: 'rgba(250, 245, 240, 0.04)' }}
              />
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Error state - don't render
  if (error) {
    return null
  }

  // Show top 2 stories
  const displayStories = stories.slice(0, 2)

  return (
    <div>
      {/* Module header */}
      <h2
        className="text-[11px] font-semibold uppercase tracking-[2px] mb-4"
        style={{ color: 'var(--plh-teal)' }}
      >
        Beyond the Big Six
      </h2>

      {/* Stories */}
      <div className="space-y-2">
        {displayStories.map((story) => (
          <StoryTile
            key={story.id}
            variant="full"
            headline={story.headline}
            summary={story.summary}
            source={story.source}
            clubs={story.clubs.map((c) => c.code)}
            plhubIndex={story.plhub_index}
            storyId={story.story_card_id}
          />
        ))}
      </div>
    </div>
  )
}
