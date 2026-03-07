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
  const [revealedScores, setRevealedScores] = useState<Set<number>>(new Set())
  const [anyRevealed, setAnyRevealed] = useState(false)
  const visibleFixtures = expanded ? upcoming : upcoming.slice(0, 3)

  const toggleRevealScore = (resultId: number) => {
    setRevealedScores(prev => {
      const newSet = new Set(prev)
      if (newSet.has(resultId)) {
        newSet.delete(resultId)
      } else {
        newSet.add(resultId)
        setAnyRevealed(true)
      }
      return newSet
    })
  }

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
        <span style={{ fontSize: '16px', fontWeight: 700, color: '#F8F9FB', fontFamily: "'Sora', sans-serif" }}>
          Fixtures
        </span>
        <span className="text-[10px] font-medium" style={{ color: '#F8F9FB', fontFamily: "'Sora', sans-serif" }}>
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
                style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '1.5px', color: '#F8F9FB', fontFamily: "'Sora', sans-serif", textTransform: 'uppercase' }}
              >
                {dateKey === '__LIVE__' ? (
                  <span className="animate-pulse" style={{ color: 'var(--plh-pink)', fontWeight: 700 }}>● LIVE</span>
                ) : dateKey}
              </span>
            </div>

            {/* Matches in this group */}
            {matches.map((match) => {
              const isLive = ['LIVE', 'IN_PLAY', 'PAUSED'].includes(match.status)
              return (
                <div
                  key={match.id}
                  className="px-3 py-2.5"
                  style={{
                    borderBottom: '1px solid color-mix(in srgb, var(--plh-text-100) 4%, transparent)',
                    background: 'transparent',
                  }}
                >
                  <div className="flex items-center justify-between gap-2">
                    {/* Home badge + name */}
                    <div className="flex items-center gap-2 min-w-0">
                      <img
                        src={match.homeCrest}
                        alt=""
                        style={{ width: '32px', height: '32px', objectFit: 'contain', filter: 'drop-shadow(0 0 4px rgba(255,255,255,0.3))' }}
                        className="shrink-0"
                      />
                      <span
                        style={{ fontSize: '14px', fontWeight: 500, color: '#F8F9FB', fontFamily: "'Sora', sans-serif", maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                      >
                        {shortName(match.home)}
                      </span>
                    </div>

                    {/* Score or kickoff */}
                    {isLive && match.homeScore !== null ? (
                      <span
                        style={{ fontSize: '14px', fontWeight: 700, color: '#F8F9FB', fontFamily: "'JetBrains Mono','Consolas','Courier New',monospace" }}
                      >
                        {match.homeScore}–{match.awayScore}
                      </span>
                    ) : (
                      <span
                        style={{ fontSize: '14px', fontWeight: 700, color: '#F8F9FB', fontFamily: "'JetBrains Mono','Consolas','Courier New',monospace" }}
                      >
                        {formatKickoff(match.date)}
                      </span>
                    )}

                    {/* Away name + badge */}
                    <div className="flex items-center gap-2 min-w-0 justify-end">
                      <span
                        style={{ fontSize: '14px', fontWeight: 500, color: '#F8F9FB', fontFamily: "'Sora', sans-serif", maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                      >
                        {shortName(match.away)}
                      </span>
                      <img
                        src={match.awayCrest}
                        alt=""
                        style={{ width: '32px', height: '32px', objectFit: 'contain', filter: 'drop-shadow(0 0 4px rgba(255,255,255,0.3))' }}
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
            color: '#F8F9FB',
            fontFamily: "'Sora', sans-serif",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = '0.8' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = '1' }}
        >
          {expanded ? 'Show less ↑' : 'See all ↓'}
        </button>
      )}

      {/* Results */}
      {recent.length > 0 && (
        <>
          <div className="px-4 py-2.5" style={{ borderTop: '1px solid var(--plh-border)' }}>
            <span style={{ fontSize: '16px', fontWeight: 700, color: '#F8F9FB', fontFamily: "'Sora', sans-serif" }}>
              Results
            </span>
            {!anyRevealed && (
              <div style={{ fontSize: '9px', color: '#F8F9FB', fontFamily: 'var(--font-sora)', marginTop: '4px' }}>
                tap score to reveal
              </div>
            )}
          </div>
          <div>
            {recent.slice(0, 3).map((result, idx) => (
              <div
                key={result.id}
                className="flex items-center gap-2 px-3 py-2.5 justify-between"
                style={{
                  borderBottom: idx < 2 ? '1px solid color-mix(in srgb, var(--plh-text-100) 3%, transparent)' : 'none',
                }}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <img
                    src={result.homeCrest}
                    alt=""
                    style={{ width: '32px', height: '32px', objectFit: 'contain', filter: 'drop-shadow(0 0 4px rgba(255,255,255,0.3))' }}
                    className="shrink-0"
                  />
                  <span
                    style={{ fontSize: '14px', fontWeight: 500, color: '#F8F9FB', fontFamily: "'Sora', sans-serif", maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                  >
                    {shortName(result.home)}
                  </span>
                </div>
                <div
                  style={{
                    position: 'relative',
                    minWidth: '44px',
                    height: '1.25em',
                    cursor: 'pointer',
                  }}
                  onClick={() => toggleRevealScore(result.id)}
                >
                  {/* Redaction bar */}
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: 'rgba(13,27,42,0.95)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: '3px',
                      opacity: revealedScores.has(result.id) ? 0 : 1,
                      transition: 'opacity 0.2s ease',
                    }}
                  />
                  {/* Score text */}
                  <span
                    style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: 700,
                      color: '#F8F9FB',
                      fontFamily: "'JetBrains Mono','Consolas','Courier New',monospace",
                      opacity: revealedScores.has(result.id) ? 1 : 0,
                      transition: 'opacity 0.2s ease 0.1s',
                    }}
                  >
                    {result.homeScore}–{result.awayScore}
                  </span>
                </div>
                <div className="flex items-center gap-2 min-w-0 justify-end">
                  <span
                    style={{ fontSize: '14px', fontWeight: 500, color: '#F8F9FB', fontFamily: "'Sora', sans-serif", maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                  >
                    {shortName(result.away)}
                  </span>
                  <img
                    src={result.awayCrest}
                    alt=""
                    style={{ width: '32px', height: '32px', objectFit: 'contain', filter: 'drop-shadow(0 0 4px rgba(255,255,255,0.3))' }}
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
