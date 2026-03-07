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

const formatDateHeader = (utcDate: string): string => {
  const date = new Date(utcDate)
  return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }).toUpperCase()
}

const formatKickoff = (utcDate: string): string => {
  return new Date(utcDate).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

const ROW: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr auto 1fr',
  alignItems: 'center',
  gap: '8px',
  padding: '10px 12px',
  borderBottom: '1px solid rgba(255,255,255,0.05)',
}

const TIME: React.CSSProperties = {
  textAlign: 'center',
  fontFamily: "'JetBrains Mono', 'Consolas', monospace",
  fontSize: '14px',
  fontWeight: 700,
  color: '#F8F9FB',
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

  const grouped = visibleFixtures.reduce((acc, match) => {
    const isLive = ['LIVE', 'IN_PLAY', 'PAUSED'].includes(match.status)
    const key = isLive ? '__LIVE__' : formatDateHeader(match.date)
    if (!acc[key]) acc[key] = []
    acc[key].push(match)
    return acc
  }, {} as Record<string, FixtureEntry[]>)

  const toggleScore = (id: number) => {
    setRevealedScores(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      setAnyRevealed(true)
      return next
    })
  }

  return (
    <div style={{ background: 'var(--plh-card)', border: '1px solid var(--plh-border)', borderRadius: '10px', boxShadow: 'var(--plh-shadow)' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid var(--plh-border)' }}>
        <span style={{ fontFamily: "'Sora', sans-serif", fontSize: '16px', fontWeight: 700, color: '#F8F9FB' }}>Fixtures</span>
        <span style={{ fontFamily: "'Sora', sans-serif", fontSize: '13px', color: '#F8F9FB' }}>Coming up</span>
      </div>

      {/* Fixture rows */}
      {Object.entries(grouped).map(([dateKey, matches]) => (
        <div key={dateKey}>
          <div style={{ padding: '8px 12px 4px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <span style={{ fontFamily: "'Sora', sans-serif", fontSize: '13px', fontWeight: 600, letterSpacing: '1.5px', color: '#F8F9FB' }}>
              {dateKey === '__LIVE__' ? <span style={{ color: 'var(--plh-pink)', fontWeight: 700 }}>● LIVE</span> : dateKey}
            </span>
          </div>
          {matches.map(match => {
            const isLive = ['LIVE', 'IN_PLAY', 'PAUSED'].includes(match.status)
            return (
              <div key={match.id} style={ROW}>
                <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
                  <img src={match.homeCrest} alt={match.home} style={{ width: '42px', height: '42px', objectFit: 'contain', flexShrink: 0, filter: 'drop-shadow(0 0 5px rgba(255,255,255,0.25))' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <span style={{ ...TIME, color: isLive ? 'var(--plh-pink)' : '#F8F9FB' }}>
                    {isLive && match.homeScore !== null ? `${match.homeScore}–${match.awayScore}` : formatKickoff(match.date)}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                  <img src={match.awayCrest} alt={match.away} style={{ width: '42px', height: '42px', objectFit: 'contain', flexShrink: 0, filter: 'drop-shadow(0 0 5px rgba(255,255,255,0.25))' }} />
                </div>
              </div>
            )
          })}
        </div>
      ))}

      {/* See all */}
      {upcoming.length > 3 && (
        <button
          onClick={() => setExpanded(!expanded)}
          style={{ width: '100%', padding: '10px', textAlign: 'center', fontFamily: "'Sora', sans-serif", fontSize: '13px', color: '#F8F9FB', background: 'none', border: 'none', borderTop: '1px solid var(--plh-border)', cursor: 'pointer' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#F8F9FB')}
          onMouseLeave={e => (e.currentTarget.style.color = '#F8F9FB')}
        >
          {expanded ? 'Show less ↑' : 'See all ↓'}
        </button>
      )}

      {/* Results */}
      {recent.length > 0 && (
        <>
          <div style={{ padding: '12px 16px 4px', borderTop: '1px solid var(--plh-border)' }}>
            <span style={{ fontFamily: "'Sora', sans-serif", fontSize: '16px', fontWeight: 700, color: '#F8F9FB' }}>Results</span>
            {!anyRevealed && (
              <div style={{ fontFamily: "'Sora', sans-serif", fontSize: '11px', color: '#F8F9FB', marginTop: '2px' }}>tap score to reveal</div>
            )}
          </div>
          {recent.slice(0, 3).map(result => (
            <div key={result.id} style={ROW}>
              <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
                <img src={result.homeCrest} alt={result.home} style={{ width: '42px', height: '42px', objectFit: 'contain', flexShrink: 0, filter: 'drop-shadow(0 0 5px rgba(255,255,255,0.25))' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <div
                  style={{ position: 'relative', width: '44px', height: '22px', cursor: 'pointer' }}
                  onClick={() => toggleScore(result.id)}
                >
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'rgba(13,27,42,0.95)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '3px',
                    opacity: revealedScores.has(result.id) ? 0 : 1,
                    transition: 'opacity 0.2s ease',
                  }} />
                  <span style={{
                    ...TIME,
                    color: '#F8F9FB',
                    opacity: revealedScores.has(result.id) ? 1 : 0,
                    transition: 'opacity 0.2s ease 0.1s',
                  }}>
                    {result.homeScore}–{result.awayScore}
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                <img src={result.awayCrest} alt={result.away} style={{ width: '42px', height: '42px', objectFit: 'contain', flexShrink: 0, filter: 'drop-shadow(0 0 5px rgba(255,255,255,0.25))' }} />
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  )
}
