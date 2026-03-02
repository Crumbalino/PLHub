'use client'

import { useEffect, useState } from 'react'

interface Fixture {
  home: { name: string; slug: string }
  away: { name: string; slug: string }
  kickoff: string
  status: 'upcoming' | 'live' | 'finished'
  score: { home: number; away: number } | null
  stakes_line: string | null
}

interface FixtureFocusProps {
  club?: string | null
}

export default function FixtureFocus({ club = null }: FixtureFocusProps) {
  const [fixtures, setFixtures] = useState<Fixture[]>([])
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
        if (club) {
          url.searchParams.set('club', club)
        }

        const response = await fetch(url.toString())
        if (!response.ok) {
          throw new Error('Failed to fetch snapshot')
        }

        const data = await response.json()
        if (data.success && data.data?.modules?.fixture_focus) {
          setFixtures(data.data.modules.fixture_focus || [])
          setError(null)
        } else {
          throw new Error('Invalid response format')
        }
      } catch (err) {
        console.error('[FixtureFocus] Error fetching data:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
        setFixtures([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [club])

  // Don't render if no data
  if (!isLoading && fixtures.length === 0) {
    return null
  }

  // Hide on desktop (≥1024px) since sidebar shows it
  const hideOnDesktop = 'hidden lg:hidden'

  // Loading skeleton
  if (isLoading) {
    return (
      <div className={hideOnDesktop}>
        <h2
          className="text-[11px] font-semibold uppercase tracking-[2px] mb-4"
          style={{ color: 'var(--plh-teal)' }}
        >
          Fixture Focus
        </h2>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={`skeleton-${i}`} className="space-y-2">
              <div
                className="h-6 rounded animate-pulse"
                style={{ backgroundColor: 'rgba(250, 245, 240, 0.04)' }}
              />
              <div
                className="h-3 rounded w-3/4 animate-pulse"
                style={{ backgroundColor: 'rgba(250, 245, 240, 0.04)' }}
              />
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return null
  }

  return (
    <div className={hideOnDesktop}>
      {/* Module header */}
      <h2
        className="text-[11px] font-semibold uppercase tracking-[2px] mb-4"
        style={{ color: 'var(--plh-teal)' }}
      >
        Fixture Focus
      </h2>

      {/* Fixtures */}
      <div className="space-y-4">
        {fixtures.map((fixture, idx) => {
          const isLive = fixture.status === 'live'
          const isFinished = fixture.status === 'finished'
          const isUpcoming = fixture.status === 'upcoming'

          // Format kickoff time
          const kickoffDate = new Date(fixture.kickoff)
          const kickoffTime = kickoffDate.toLocaleTimeString('en-GB', {
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'Europe/London',
          })

          return (
            <div key={`${fixture.home.slug}-${fixture.away.slug}-${idx}`}>
              {/* Match row */}
              <div className="flex items-center justify-between gap-2">
                {/* Home team */}
                <div className="flex-1 text-right pr-2">
                  <span style={{ color: 'rgba(250, 245, 240, 0.95)' }}>
                    {fixture.home.name}
                  </span>
                </div>

                {/* Score or time with live indicator */}
                <div className="flex items-center gap-2 min-w-[80px] justify-center">
                  {isLive && (
                    <div
                      className="w-2 h-2 rounded-full animate-pulse"
                      style={{
                        backgroundColor: 'var(--plh-pink)',
                        animation: 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                      }}
                    />
                  )}
                  <span
                    className="font-mono font-semibold"
                    style={{
                      color: isFinished ? 'rgba(250, 245, 240, 0.7)' : 'rgba(250, 245, 240, 0.95)',
                      fontSize: '14px',
                    }}
                  >
                    {isUpcoming
                      ? kickoffTime
                      : isLive || isFinished
                        ? `${fixture.score?.home ?? '0'}-${fixture.score?.away ?? '0'}`
                        : '—'}
                  </span>
                </div>

                {/* Away team */}
                <div className="flex-1 text-left pl-2">
                  <span style={{ color: 'rgba(250, 245, 240, 0.95)' }}>
                    {fixture.away.name}
                  </span>
                </div>
              </div>

              {/* Stakes line */}
              {fixture.stakes_line && (
                <div
                  className="text-[10px] mt-1 leading-tight"
                  style={{
                    color: 'rgba(250, 245, 240, 0.35)',
                    textAlign: 'center',
                  }}
                >
                  {fixture.stakes_line}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* CSS for pulse animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.4;
          }
        }
      `}</style>
    </div>
  )
}
