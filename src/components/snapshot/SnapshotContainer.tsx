'use client'

import { useEffect, useState } from 'react'
import HeroGrid from './HeroGrid'
import BottomCards from './BottomCards'
import ByTheNumbers from './ByTheNumbers'
import QuoteStrip from './QuoteStrip'

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

interface SnapshotData {
  metadata: {
    generatedAt: string
    matchday: number
    postsCount: number
  }
  modules: {
    get_caught_up: SnapshotStory[]
    transfers: SnapshotStory[]
    beyond_big_six: SnapshotStory[]
    by_the_numbers: {
      tiles: Array<{
        number: string
        label: string
        context: string
        accent: boolean
      }>
      matchday: number
    } | null
    the_quote: {
      has_quote: boolean
      quote: string | null
      attribution: string | null
      club: string | null
      context: string | null
    }
    and_finally: {
      has_content: boolean
      headline: string | null
      colour_line: string | null
      image_url?: string | null
    }
  }
}

interface SnapshotContainerProps {
  matchday?: string
  club?: string | null
  children?: React.ReactNode
}

export default function SnapshotContainer({
  matchday: matchdayProp = 'Matchday 30',
  club = null,
  children,
}: SnapshotContainerProps) {
  const [snapshotData, setSnapshotData] = useState<SnapshotData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSnapshot = async () => {
      try {
        setIsLoading(true)
        const url = new URL(
          '/api/snapshot',
          typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'
        )
        if (club) {
          url.searchParams.set('club', club)
        }

        const response = await fetch(url.toString())
        if (!response.ok) {
          throw new Error('Failed to fetch snapshot')
        }

        const responseData = await response.json()
        if (responseData.success && responseData.data) {
          setSnapshotData(responseData.data)
          setError(null)
        } else {
          throw new Error(responseData.error || 'Invalid response format')
        }
      } catch (err) {
        console.error('[SnapshotContainer] Error fetching data:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
        setSnapshotData(null)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSnapshot()
  }, [club])

  // If children are provided, render them instead (legacy support)
  if (children) {
    return (
      <div
        className="relative w-full mb-8 rounded-lg overflow-hidden"
        style={{
          background: 'var(--plh-card)',
        }}
      >
        {/* Main content area with padding */}
        <div className="relative px-3 pt-4 pb-4 sm:px-5 sm:pt-5 sm:pb-5">
          {/* Header Row */}
          <div className="mb-6 flex items-baseline justify-between gap-4">
            {/* Left: Title and subtitle */}
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-3">
                <h1
                  className="font-bold leading-tight"
                  style={{ color: 'var(--plh-text-100)', fontFamily: 'Sora, sans-serif', fontSize: '24px' }}
                >
                  The Snapshot
                </h1>
                <span
                  className="text-xs sm:text-sm font-mono flex-shrink-0"
                  style={{ color: 'var(--plh-text-40)', opacity: 0.4 }}
                >
                  P.302
                </span>
              </div>
            </div>

            {/* Right: Matchday indicator */}
            <div
              className="text-sm sm:text-base font-semibold flex-shrink-0"
              style={{ color: 'var(--plh-text-75)', fontFamily: 'Sora, sans-serif' }}
            >
              {matchdayProp}
            </div>
          </div>

          {/* Children content */}
          <div>{children}</div>
        </div>
      </div>
    )
  }

  // Determine matchday string
  const matchday = snapshotData
    ? `Matchday ${snapshotData.metadata.matchday}`
    : matchdayProp

  const getCaughtUpStories = snapshotData?.modules.get_caught_up || []
  const transferStory = snapshotData?.modules.transfers?.[0] || null
  const beyondBigSixStory = snapshotData?.modules.beyond_big_six?.[0] || null
  const andFinallyData = snapshotData?.modules.and_finally || null
  const quoteData = snapshotData?.modules.the_quote || null

  return (
    <div
      className="relative w-full mb-8 rounded-lg overflow-hidden"
      style={{
        background: 'var(--plh-card)',
      }}
    >
      {/* Main content area with padding */}
      <div className="relative px-4 pt-3 pb-3 sm:px-5 sm:pt-4 sm:pb-4">
        {/* Header Row */}
        <div className="mb-6 flex items-baseline justify-between gap-4">
          {/* Left: Title and subtitle */}
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-3">
              <h1
                className="font-bold leading-tight"
                style={{ color: 'var(--plh-text-100)', fontFamily: 'Sora, sans-serif', fontSize: '24px' }}
              >
                The Snapshot
              </h1>
              <span
                className="text-xs sm:text-sm font-mono flex-shrink-0"
                style={{ color: 'var(--plh-text-40)', opacity: 0.4 }}
              >
                P.302
              </span>
            </div>
          </div>

          {/* Right: Matchday indicator */}
          <div
            className="text-sm sm:text-base font-semibold flex-shrink-0"
            style={{ color: 'var(--plh-text-75)', fontFamily: 'Sora, sans-serif' }}
          >
            {matchday}
          </div>
        </div>

        {/* Magazine-style 4-row layout */}
        <div className="space-y-2">
          {/* Row 1: Hero Grid (top 5 stories) */}
          {!isLoading && (
            <HeroGrid
              stories={getCaughtUpStories}
              isLoading={isLoading}
              error={error}
            />
          )}
          {isLoading && <HeroGridSkeleton />}

          {/* Row 2: By The Numbers (2×2 stat grid) */}
          <ByTheNumbers club={club} />

          {/* Row 3: Bottom Cards (3 landscape cards) */}
          {!isLoading && snapshotData && (
            <BottomCards
              transferStory={transferStory}
              beyondBigSixStory={beyondBigSixStory}
              andFinallyData={andFinallyData?.has_content ? andFinallyData : null}
            />
          )}

          {/* Row 4: Quote Strip (conditional) */}
          {!isLoading && quoteData?.has_quote && quoteData.quote && quoteData.attribution && (
            <QuoteStrip
              quote={quoteData.quote}
              attribution={quoteData.attribution}
              club={quoteData.club}
              context={quoteData.context}
            />
          )}
        </div>

        {/* Pink end bar */}
        <div
          className="h-0.5 rounded-full mt-3"
          style={{
            background: 'linear-gradient(to right, #E84080, transparent)',
          }}
        />
      </div>
    </div>
  )
}

function HeroGridSkeleton() {
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
