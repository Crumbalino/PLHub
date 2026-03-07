'use client'
import { useState } from 'react'

const SHORT_NAMES: Record<string, string> = {
  'Arsenal': 'Arsenal',
  'Aston Villa': 'Aston Villa',
  'Bournemouth': 'Bournemouth',
  'AFC Bournemouth': 'Bournemouth',
  'Brentford': 'Brentford',
  'Brighton Hove': 'Brighton',
  'Brighton & Hove Albion': 'Brighton',
  'Brighton': 'Brighton',
  'Chelsea': 'Chelsea',
  'Crystal Palace': 'Palace',
  'Everton': 'Everton',
  'Fulham': 'Fulham',
  'Ipswich': 'Ipswich',
  'Ipswich Town': 'Ipswich',
  'Leicester': 'Leicester',
  'Leicester City': 'Leicester',
  'Liverpool': 'Liverpool',
  'Man City': 'Man City',
  'Manchester City': 'Man City',
  'Man United': 'Man Utd',
  'Manchester United': 'Man Utd',
  'Newcastle': 'Newcastle',
  'Newcastle United': 'Newcastle',
  'Nottingham': 'Forest',
  'Nottingham Forest': 'Forest',
  "Nott'm Forest": 'Forest',
  'Southampton': 'Saints',
  'Spurs': 'Spurs',
  'Tottenham': 'Spurs',
  'Tottenham Hotspur': 'Spurs',
  'West Ham': 'West Ham',
  'West Ham United': 'West Ham',
  'Wolves': 'Wolves',
  'Wolverhampton': 'Wolves',
  'Wolverhampton Wanderers': 'Wolves',
  'Sunderland': 'Sunderland',
  'Burnley': 'Burnley',
}

const shortName = (name: string): string => SHORT_NAMES[name] ?? name

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
  return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }).toUpperCase()
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

  // Group fixtures by date label
  const groupedFixtures = visibleFixtures.reduce((groups, match) => {
    const isLive = ['LIVE', 'IN_PLAY', 'PAUSED'].includes(match.status)
    const key = isLive ? '__LIVE__' : formatMatchTime(match.date)
    if (!groups[key]) groups[key] = []
    groups[key].push(match)
    return groups
  }, {} as Record<string, FixtureEntry[]>)

  return (
    <div
      className="rounded-[10px]"
      style={{
        background: 'var(--plh-card)',
        border: '1px solid var(--plh-border)',
        boxShadow: 'var(--plh-shadow)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-2.5"
        style={{ borderBottom: '1px solid var(--plh-border)' }}
      >
        <span className="text-sm font-bold" style={{ color: 'var(--plh-text-100)', fontFamily: "'Sora', sans-serif" }}>
          Fixtures
        </span>
        <span className="text-[10px] font-medium" style={{ color: 'var(--plh-text-40)', fontFamily: "'Sora', sans-serif" }}>
          Coming up
        </span>
      </div>

      {/* Grouped fixtures */}
      <div>
        {Object.entries(groupedFixtures).map(([dateKey, matches]) => (
          <div key={dateKey}>
            {/* Date group header */}
            <div className="px-3 pt-2 pb-0.5">
              <span
                className="text-[10px] font-medium uppercase tracking-[1.5px]"
                style={{ color: 'var(--plh-text-40)', fontFamily: "'Sora', sans-serif" }}
              >
                {dateKey === '__LIVE__' ? (
                  <span className="font-bold animate-pulse" style={{ color: 'var(--plh-pink)' }}>● LIVE</span>
                ) : dateKey}
              </span>
            </div>

            {/* Matches in this group */}
            {matches.map((match) => {
              const isLive = ['LIVE', 'IN_PLAY', 'PAUSED'].includes(match.status)
              return (
                <div
                  key={match.id}
                  className="px-3 py-2 transition-colors"
                  style={{
                    borderBottom: '1px solid color-mix(in srgb, var(--plh-text-100) 4%, transparent)',
                    background: 'transparent',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'color-mix(in srgb, var(--plh-text-100) 4%, transparent)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                >
                  <div className="flex items-center justify-between gap-2">
                    {/* Home */}
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                      <img
                        src={match.homeCrest}
                        alt=""
                        style={{ width: '24px', height: '24px', objectFit: 'contain' }}
                        className="shrink-0"
                      />
                      <span className="text-[11px] overflow-hidden whitespace-nowrap" style={{ color: 'var(--plh-text-100)', fontFamily: "'Sora', sans-serif", maxWidth: '80px' }}>
                        {shortName(match.home)}
                      </span>
                    </div>

                    {/* Score or kickoff */}
                    {isLive && match.homeScore !== null ? (
                      <span
                        className="text-sm font-bold tabular-nums shrink-0"
                        style={{ color: 'var(--plh-pink)', fontFamily: "'Consolas','Courier New',monospace" }}
                      >
                        {match.homeScore}–{match.awayScore}
                      </span>
                    ) : (
                      <span
                        className="text-[11px] tabular-nums shrink-0 font-medium"
                        style={{ color: 'var(--plh-text-40)', fontFamily: "'Consolas','Courier New',monospace" }}
                      >
                        {formatKickoff(match.date)}
                      </span>
                    )}

                    {/* Away */}
                    <div className="flex items-center gap-1.5 flex-1 justify-end min-w-0">
                      <span className="text-[11px] overflow-hidden whitespace-nowrap" style={{ color: 'var(--plh-text-100)', fontFamily: "'Sora', sans-serif", maxWidth: '80px' }}>
                        {shortName(match.away)}
                      </span>
                      <img
                        src={match.awayCrest}
                        alt=""
                        style={{ width: '24px', height: '24px', objectFit: 'contain' }}
                        className="shrink-0"
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {/* See all */}
      {upcoming.length > 3 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full py-2 text-center text-[11px] transition-colors"
          style={{
            borderTop: '1px solid var(--plh-border)',
            color: 'var(--plh-text-40)',
            fontFamily: "'Sora', sans-serif",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--plh-text-100)' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--plh-text-40)' }}
        >
          {expanded ? 'Show less ↑' : 'See all ↓'}
        </button>
      )}

      {/* Results */}
      {recent.length > 0 && (
        <>
          <div className="px-4 py-2.5" style={{ borderTop: '1px solid var(--plh-border)' }}>
            <span className="text-sm font-bold" style={{ color: 'var(--plh-text-100)', fontFamily: "'Sora', sans-serif" }}>
              Results
            </span>
          </div>
          <div>
            {recent.slice(0, 3).map((result, idx) => (
              <div
                key={result.id}
                className="flex items-center gap-2 px-3 py-2 justify-between"
                style={{
                  borderBottom: idx < 2 ? '1px solid color-mix(in srgb, var(--plh-text-100) 3%, transparent)' : 'none',
                }}
              >
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  <img
                    src={result.homeCrest}
                    alt=""
                    style={{ width: '20px', height: '20px', objectFit: 'contain' }}
                    className="shrink-0"
                  />
                  <span className="text-[11px] overflow-hidden whitespace-nowrap" style={{ color: 'var(--plh-text-100)', fontFamily: "'Sora', sans-serif", maxWidth: '80px' }}>
                    {shortName(result.home)}
                  </span>
                </div>
                <span
                  className="text-xs font-bold tabular-nums shrink-0"
                  style={{ color: 'var(--plh-text-100)', fontFamily: "'Consolas','Courier New',monospace" }}
                >
                  {result.homeScore}–{result.awayScore}
                </span>
                <div className="flex items-center gap-1.5 flex-1 justify-end min-w-0">
                  <span className="text-[11px] overflow-hidden whitespace-nowrap" style={{ color: 'var(--plh-text-100)', fontFamily: "'Sora', sans-serif", maxWidth: '80px' }}>
                    {shortName(result.away)}
                  </span>
                  <img
                    src={result.awayCrest}
                    alt=""
                    style={{ width: '20px', height: '20px', objectFit: 'contain' }}
                    className="shrink-0"
                  />
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
