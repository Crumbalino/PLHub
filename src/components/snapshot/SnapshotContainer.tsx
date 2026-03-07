'use client'

import { useEffect, useState } from 'react'
import HeroGrid from './HeroGrid'
import BottomCards from './BottomCards'
import SnapshotCardGrid from './SnapshotCardGrid'
import ByTheNumbers from './ByTheNumbers'
import QuoteStrip from './QuoteStrip'
import StaleDataBanner from './StaleDataBanner'

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
    fantasy_premier_league: SnapshotStory[]
    by_the_numbers: {
      tiles: Array<{
        number: string
        label: string
        context: string
        accent: boolean
      }>
      matchday: number
    } | null
    the_table: {
      standings: Array<{
        position: number
        club: string
        points: number
      }>
      highlighted_club: string | null
    } | null
    fixture_focus: Array<{
      home: { name: string; slug: string }
      away: { name: string; slug: string }
      kickoff: string
      status: string
      score: { home: number; away: number } | null
      stakes_line: string | null
    }> | null
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
      plhub_index: number | null
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
                  style={{ color: 'var(--plh-text-100)', fontFamily: 'var(--font-sora)', fontSize: '24px' }}
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
              style={{ color: 'var(--plh-text-75)', fontFamily: 'var(--font-sora)' }}
            >
              Matchday{' '}
              <span style={{ fontFamily: 'var(--font-mono)' }}>
                {matchdayProp.split(' ')[1] || matchdayProp}
              </span>
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
  const fplStory = snapshotData?.modules.fantasy_premier_league?.[0] || null
  const theRestData = snapshotData?.modules.and_finally || null
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
                style={{ color: 'var(--plh-text-100)', fontFamily: 'var(--font-sora)', fontSize: '24px' }}
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
            style={{ color: 'var(--plh-text-75)', fontFamily: 'var(--font-sora)' }}
          >
            Matchday{' '}
            <span style={{ fontFamily: 'var(--font-mono)' }}>
              {matchday.split(' ')[1] || matchday}
            </span>
          </div>
        </div>

        {/* Stale Data Banner */}
        <StaleDataBanner />

        {/* Magazine-style layout with reordered modules */}
        <div className="space-y-2">
          {/* Row 1: Hero Grid (Get Caught Up) */}
          {!isLoading && (
            <HeroGrid
              stories={getCaughtUpStories}
              isLoading={isLoading}
              error={error}
            />
          )}
          {isLoading && <HeroGridSkeleton />}

          {/* Rows 2-4: Transfers, Beyond Big Six, The Rest — 3-column grid */}
          {!isLoading && (
            <SnapshotCardGrid
              cards={[
                transferStory
                  ? { label: 'TRANSFERS', story: transferStory, source: transferStory.source }
                  : null,
                beyondBigSixStory
                  ? { label: 'BEYOND BIG SIX', story: beyondBigSixStory, source: beyondBigSixStory.source }
                  : null,
                theRestData?.has_content
                  ? { label: 'THE REST', headline: theRestData.headline, imageUrl: theRestData.image_url, plhubIndex: theRestData.plhub_index }
                  : null,
              ].filter((c) => c !== null) as Array<any>}
            />
          )}

          {/* Row 4: By The Numbers */}
          {!isLoading && snapshotData && (
            <ByTheNumbersModule snapshotData={snapshotData} />
          )}

          {/* Quote Strip (conditional) */}
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
            background: 'linear-gradient(to right, var(--plh-pink), transparent)',
          }}
        />
      </div>
    </div>
  )
}

interface SnapshotTableEntry {
  position: number
  club: string
  points: number
}

interface SnapshotFixture {
  home: { name: string }
  away: { name: string }
  kickoff: string
}

interface ByTheNumbersData {
  tiles: Array<{
    number: string
    label: string
    context: string
    accent: boolean
  }>
  matchday: number
}

interface ByTheNumbersModuleProps {
  snapshotData: SnapshotData
}

/**
 * Build evergreen fallback tiles from snapshot data
 */
function buildEvergreens(snapshotData: SnapshotData): Array<{
  number: string
  label: string
  isEvergreen: boolean
}> {
  const evergreens: Array<{ number: string; label: string; isEvergreen: boolean }> = []

  // Pull from the_table
  const standings = snapshotData.modules.the_table?.standings || []
  const topTeam = standings[0]
  const eighteenthPlace = standings[17]

  if (topTeam) {
    evergreens.push({
      number: topTeam.points.toString(),
      label: `${topTeam.club} top of the table`,
      isEvergreen: true,
    })
  }

  // Pull from fixture_focus (next fixture)
  const nextFixture = snapshotData.modules.fixture_focus?.[0]
  if (nextFixture && nextFixture.kickoff) {
    try {
      const kickoffDate = new Date(nextFixture.kickoff)
      const kickoffHour = String(kickoffDate.getHours()).padStart(2, '0')
      const kickoffMin = String(kickoffDate.getMinutes()).padStart(2, '0')
      evergreens.push({
        number: `${kickoffHour}:${kickoffMin}`,
        label: `${nextFixture.home.name} vs ${nextFixture.away.name}`,
        isEvergreen: true,
      })
    } catch (err) {
      console.warn('[ByTheNumbers] Error parsing fixture kickoff:', err)
    }
  }

  // Relegation gap: points difference between 18th and 17th
  if (standings.length >= 18) {
    const seventeenthPlace = standings[16]
    if (eighteenthPlace && seventeenthPlace) {
      const gap = seventeenthPlace.points - eighteenthPlace.points
      evergreens.push({
        number: gap.toString(),
        label: `points above relegation for ${eighteenthPlace.club}`,
        isEvergreen: true,
      })
    }
  }

  return evergreens.filter((e) => e.number) // Remove any with null numbers
}

/**
 * Build hero tile from evergreen data when AI data is unavailable
 */
function buildEvergreensHero(snapshotData: SnapshotData): {
  number: string
  label: string
  context: string
  usePink: boolean
  isEvergreen: boolean
} | null {
  // Candidate 1: Total goals scored across all matches this matchday
  const fixtures = snapshotData.modules.fixture_focus || []
  const finishedMatches = fixtures.filter((f) => f.status === 'finished' && f.score)

  if (finishedMatches.length > 0) {
    const totalGoals = finishedMatches.reduce((sum, m) => {
      if (m.score) {
        return sum + m.score.home + m.score.away
      }
      return sum
    }, 0)

    if (totalGoals > 0) {
      // Find the highest-scoring match
      const highestScoringMatch = finishedMatches.reduce((max, m) => {
        const matchTotal = (m.score ? m.score.home + m.score.away : 0)
        const maxTotal = (max.score ? max.score.home + max.score.away : 0)
        return matchTotal > maxTotal ? m : max
      })

      const scoreStr = highestScoringMatch.score
        ? `${highestScoringMatch.score.home}–${highestScoringMatch.score.away}`
        : ''

      return {
        number: totalGoals.toString(),
        label: 'goals across the matchday',
        context: scoreStr ? `A busy one — ${scoreStr} the standout scoreline.` : `A busy one across the matchday.`,
        usePink: false,
        isEvergreen: true,
      }
    }
  }

  // Candidate 2: League leader's points
  const standings = snapshotData.modules.the_table?.standings || []
  const topTeam = standings[0]
  const secondTeam = standings[1]

  if (topTeam && secondTeam) {
    const pointsGap = topTeam.points - secondTeam.points
    const gapText = pointsGap > 0 ? `${pointsGap} point${pointsGap !== 1 ? 's' : ''}` : 'tied on points'
    return {
      number: topTeam.points.toString(),
      label: `${topTeam.club} lead the league`,
      context: `${gapText} clear of ${secondTeam.club}. Title race is on.`,
      usePink: false,
      isEvergreen: true,
    }
  }

  // Candidate 3: Relegation gap
  if (standings.length >= 18) {
    const eighteenthPlace = standings[17]
    const seventeenthPlace = standings[16]

    if (eighteenthPlace && seventeenthPlace) {
      const gap = seventeenthPlace.points - eighteenthPlace.points
      if (gap > 0) {
        return {
          number: gap.toString(),
          label: 'points between safety and the drop',
          context: `${eighteenthPlace.club} are in the red zone. Fight's on.`,
          usePink: false,
          isEvergreen: true,
        }
      }
    }
  }

  return null
}

/**
 * ByTheNumbers module wrapper — handles data extraction and fallback logic
 */
function ByTheNumbersModule({ snapshotData }: ByTheNumbersModuleProps) {
  const byTheNumbersData = snapshotData.modules.by_the_numbers as ByTheNumbersData | null
  const evergreens = buildEvergreens(snapshotData)

  // Extract hero (the accent tile) and supporting tiles
  let heroTile = null
  let supportingTiles: Array<{
    number: string
    label: string
    context?: string
    usePink?: boolean
    isEvergreen?: boolean
  }> = []

  if (byTheNumbersData?.tiles && byTheNumbersData.tiles.length > 0) {
    // Find the accent tile (hero)
    const accentIdx = byTheNumbersData.tiles.findIndex((t) => t.accent)
    const heroIdx = accentIdx >= 0 ? accentIdx : 0

    const heroData = byTheNumbersData.tiles[heroIdx]
    heroTile = {
      number: heroData.number,
      label: heroData.label,
      context: heroData.context,
      usePink: true, // Always use pink for AI-generated hero
    }

    // Collect supporting tiles (non-hero)
    supportingTiles = byTheNumbersData.tiles
      .map((tile, idx) => ({
        number: tile.number,
        label: tile.label,
        context: tile.context,
        usePink: false,
        isEvergreen: false,
      }))
      .filter((_, idx) => idx !== heroIdx)
  } else {
    // Fallback: build hero from evergreen data
    heroTile = buildEvergreensHero(snapshotData)
  }

  // Backfill supporting tiles with evergreens to reach 3 total
  while (supportingTiles.length < 3 && evergreens.length > 0) {
    const evergreen = evergreens.shift()
    if (evergreen) {
      supportingTiles.push({
        ...evergreen,
        usePink: false,
      })
    }
  }

  // If no hero at all, don't render the module
  if (!heroTile) {
    return null
  }

  return (
    <ByTheNumbers
      heroTile={heroTile}
      supportingTiles={supportingTiles}
      matchday={snapshotData.metadata.matchday}
    />
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
