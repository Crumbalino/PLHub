'use client'

import { useState } from 'react'

interface FixtureEntry {
  id: number
  home: string
  homeCrest: string
  away: string
  awayCrest: string
  date: string
  status: string
  homeScore: number | null
  awayScore: number | null
}

interface ResultEntry {
  id: number
  home: string
  homeCrest: string
  away: string
  awayCrest: string
  homeScore: number
  awayScore: number
}

const formatMatchTime = (utcDate: string): string => {
  const date = new Date(utcDate)
  const now = new Date()
  const diffHours = (date.getTime() - now.getTime()) / (1000 * 60 * 60)

  if (diffHours < 0 && diffHours > -2) return 'Now'
  if (diffHours < 24 && diffHours > 0) return 'Today'
  if (diffHours < 48) return 'Tomorrow'
  return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
}

const formatKickoff = (utcDate: string): string => {
  const date = new Date(utcDate)
  return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

export default function NextFixturesClient({
  upcoming,
  recent,
}: {
  upcoming: FixtureEntry[]
  recent: ResultEntry[]
}) {
  const [expanded, setExpanded] = useState(false)

  const visibleFixtures = expanded ? upcoming : upcoming.slice(0, 3)

  return (
    <div
      className="relative rounded-[10px] overflow-hidden"
      style={{
        background: 'var(--plh-card)',
        border: '1px solid var(--plh-border)',
        boxShadow: 'var(--plh-shadow)',
      }}
    >
      {/* Top-left bracket */}
      <div className="absolute top-[8px] left-[8px] w-6 h-6 pointer-events-none" style={{ zIndex: 10 }}>
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          style={{ opacity: 0.15 }}
        >
          <path
            d="M2 14V2H14"
            stroke="#E84080"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Bottom-right bracket */}
      <div className="absolute bottom-[8px] right-[8px] w-6 h-6 pointer-events-none" style={{ zIndex: 10 }}>
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          style={{ opacity: 0.15 }}
        >
          <path
            d="M22 10V22H10"
            stroke="#E84080"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
      </div>
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-2.5"
        style={{
          borderBottom: '1px solid var(--plh-border)',
        }}
      >
        <span className="text-sm font-bold" style={{ color: 'var(--plh-gold)', fontFamily: "'Sora', sans-serif" }}>Fixtures</span>
        <span className="text-[10px]" style={{ color: 'var(--plh-text-40)', fontFamily: "'Sora', sans-serif" }}>Upcoming</span>
      </div>

      {/* Matches */}
      <div style={{ borderTop: 'none' }}>
        {visibleFixtures.map((match, idx) => {
          const isLive = ['LIVE', 'IN_PLAY', 'PAUSED'].includes(match.status)
          return (
            <div
              key={match.id}
              className="px-3 py-2.5 transition-colors"
              style={{
                borderBottom: '1px solid color-mix(in srgb, var(--plh-text-100) 4%, transparent)',
                background: 'color-mix(in srgb, var(--plh-text-100) 0%, transparent)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'color-mix(in srgb, var(--plh-text-100) 4%, transparent)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'color-mix(in srgb, var(--plh-text-100) 0%, transparent)'
              }}
            >
              {/* Date/Time */}
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--plh-text-40)', fontFamily: "'Sora', sans-serif" }}>
                  {isLive ? (
                    <span className="font-bold animate-pulse" style={{ color: 'var(--plh-pink)' }}>● LIVE</span>
                  ) : (
                    formatMatchTime(match.date)
                  )}
                </span>
                <span className="font-mono text-[10px]" style={{ color: 'var(--plh-text-40)' }}>{formatKickoff(match.date)}</span>
              </div>

              {/* Teams */}
              <div className="flex items-center gap-2 justify-between">
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  <img src={match.homeCrest} alt="" className="w-4 h-4 object-contain shrink-0" />
                  <span className="text-xs truncate" style={{ color: 'var(--plh-text-100)', fontFamily: "'Sora', sans-serif" }}>{match.home}</span>
                </div>

                {isLive && match.homeScore !== null ? (
                  <span className="font-mono text-sm font-bold tabular-nums shrink-0 mx-1" style={{ color: 'var(--plh-pink)' }}>
                    {match.homeScore} - {match.awayScore}
                  </span>
                ) : (
                  <span className="text-[10px] shrink-0 mx-1" style={{ color: 'var(--plh-text-40)', fontFamily: "'Sora', sans-serif" }}>vs</span>
                )}

                <div className="flex items-center gap-1.5 flex-1 justify-end min-w-0">
                  <span className="text-xs truncate" style={{ color: 'var(--plh-text-100)', fontFamily: "'Sora', sans-serif" }}>{match.away}</span>
                  <img src={match.awayCrest} alt="" className="w-4 h-4 object-contain shrink-0" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Expand */}
      {upcoming.length > 3 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full py-2 text-center text-xs transition-colors"
          style={{
            borderTop: '1px solid var(--plh-border)',
            color: 'var(--plh-gold)',
            fontFamily: "'Sora', sans-serif",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '0.8'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '1'
          }}
        >
          {expanded ? 'Show less' : `All fixtures ↓`}
        </button>
      )}

      {/* Recent Results */}
      {recent.length > 0 && (
        <>
          <div className="px-3 py-2" style={{ borderTop: '1px solid var(--plh-border)' }}>
            <span className="text-xs font-bold" style={{ color: 'var(--plh-gold)', fontFamily: "'Sora', sans-serif" }}>Results</span>
          </div>
          <div>
            {recent.slice(0, 3).map((result, idx) => (
              <div
                key={result.id}
                className="flex items-center gap-2 px-3 py-1.5 justify-between"
                style={{
                  borderBottom: idx < 2 ? '1px solid color-mix(in srgb, var(--plh-text-100) 3%, transparent)' : 'none',
                }}
              >
                <div className="flex items-center gap-1 flex-1 min-w-0">
                  <img src={result.homeCrest} alt="" className="w-3 h-3 object-contain shrink-0" />
                  <span className="text-[11px] truncate" style={{ color: 'var(--plh-text-100)', fontFamily: "'Sora', sans-serif" }}>{result.home}</span>
                </div>
                <span className="font-mono text-xs font-bold tabular-nums shrink-0" style={{ color: 'var(--plh-text-100)' }}>
                  {result.homeScore} - {result.awayScore}
                </span>
                <div className="flex items-center gap-1 flex-1 justify-end min-w-0">
                  <span className="text-[11px] truncate" style={{ color: 'var(--plh-text-100)', fontFamily: "'Sora', sans-serif" }}>{result.away}</span>
                  <img src={result.awayCrest} alt="" className="w-3 h-3 object-contain shrink-0" />
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
