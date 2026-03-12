'use client'
import { useState } from 'react'

// ── Brand tokens (inline — CSS vars are not injected) ──
const CARD   = '#112238'
const BORDER = 'rgba(250,245,240,0.06)'
const SHADOW = '0 2px 6px rgba(0,0,0,0.2), 0 1px 2px rgba(0,0,0,0.1)'
const TEAL   = '#3AAFA9'
const PINK   = '#E84080'
const WHITE  = '#F8F9FB'

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

const getBadgeScale = (clubName: string): string => {
  const lowerName = clubName.toLowerCase()
  if (lowerName.includes('tottenham') || lowerName.includes('spurs')) return '1.3'
  if (lowerName.includes('crystal palace')) return '1.25'
  if (lowerName.includes('nottingham') || lowerName.includes('forest')) return '1.2'
  if (lowerName.includes('leeds')) return '1.15'
  return '1'
}

const ROW: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr auto 1fr',
  alignItems: 'center',
  gap: '8px',
  padding: '10px 12px',
  borderBottom: `1px solid rgba(255,255,255,0.05)`,
}

const TIME: React.CSSProperties = {
  textAlign: 'center',
  fontFamily: "'JetBrains Mono', 'Consolas', monospace",
  fontSize: '14px',
  fontWeight: 700,
  color: WHITE,
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
  const [activeTab, setActiveTab] = useState<'upcoming' | 'results'>('upcoming')

  const visibleFixtures = expanded ? upcoming : upcoming.slice(0, 3)

  const grouped = visibleFixtures.reduce((acc, match) => {
    const isLive = ['LIVE', 'IN_PLAY', 'PAUSED', '1H', '2H', 'HT'].includes(match.status)
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
    <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: '10px', boxShadow: SHADOW }}>

      {/* Header + Tab toggle */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: `1px solid ${BORDER}` }}>
        <span style={{ fontFamily: "'Sora', sans-serif", fontSize: '16px', fontWeight: 700, color: WHITE }}>Fixtures & Results</span>
        <div style={{ display: 'flex', gap: '4px' }}>
          {(['upcoming', 'results'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                fontFamily: "'Sora', sans-serif",
                fontSize: '11px',
                fontWeight: 600,
                padding: '3px 8px',
                borderRadius: '4px',
                cursor: 'pointer',
                border: 'none',
                background: activeTab === tab ? TEAL : 'rgba(255,255,255,0.07)',
                color: activeTab === tab ? '#0D1B2A' : WHITE,
                transition: 'all 0.15s ease',
              }}
            >
              {tab === 'upcoming' ? 'Upcoming' : 'Results'}
            </button>
          ))}
        </div>
      </div>

      {/* Upcoming Fixtures */}
      {activeTab === 'upcoming' && (
        <>
          {Object.entries(grouped).map(([dateKey, matches]) => (
            <div key={dateKey}>
              <div style={{ padding: '8px 12px 4px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', fontWeight: 700, letterSpacing: '1.5px', color: dateKey === '__LIVE__' ? PINK : TEAL }}>
                  {dateKey === '__LIVE__' ? '● LIVE' : dateKey}
                </span>
              </div>
              {matches.map(match => {
                const isLive = ['LIVE', 'IN_PLAY', 'PAUSED', '1H', '2H', 'HT'].includes(match.status)
                return (
                  <div key={match.id} style={ROW}>
                    <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
                      <img src={match.homeCrest} alt={match.home} style={{ width: '42px', height: '42px', objectFit: 'contain', flexShrink: 0, filter: 'drop-shadow(0 0 5px rgba(255,255,255,0.25))', transform: `scale(${getBadgeScale(match.home)})` }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      <span style={{ ...TIME, color: isLive ? PINK : WHITE, animation: isLive ? 'pulse 1.5s infinite' : 'none' }}>
                        {isLive && match.homeScore !== null ? `${match.homeScore}–${match.awayScore}` : formatKickoff(match.date)}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                      <img src={match.awayCrest} alt={match.away} style={{ width: '42px', height: '42px', objectFit: 'contain', flexShrink: 0, filter: 'drop-shadow(0 0 5px rgba(255,255,255,0.25))', transform: `scale(${getBadgeScale(match.away)})` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          ))}

          {upcoming.length > 3 && (
            <button
              onClick={() => setExpanded(!expanded)}
              style={{ width: '100%', padding: '10px', textAlign: 'center', fontFamily: "'Sora', sans-serif", fontSize: '13px', color: WHITE, background: 'none', border: 'none', borderTop: `1px solid ${BORDER}`, cursor: 'pointer' }}
            >
              {expanded ? 'Show less ↑' : 'See all ↓'}
            </button>
          )}
        </>
      )}

      {/* Results */}
      {activeTab === 'results' && recent.length > 0 && (
        <>
          {!anyRevealed && (
            <div style={{ fontFamily: "'Sora', sans-serif", fontSize: '11px', color: 'rgba(248,249,251,0.5)', padding: '8px 16px 0', textAlign: 'center' }}>
              tap score to reveal
            </div>
          )}
          {recent.map(result => (
            <div key={result.id} style={ROW}>
              <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
                <img src={result.homeCrest} alt={result.home} style={{ width: '42px', height: '42px', objectFit: 'contain', flexShrink: 0, filter: 'drop-shadow(0 0 5px rgba(255,255,255,0.25))', transform: `scale(${getBadgeScale(result.home)})` }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <div
                  style={{ position: 'relative', width: '44px', height: '22px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
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
                    color: WHITE,
                    opacity: revealedScores.has(result.id) ? 1 : 0,
                    transition: 'opacity 0.2s ease 0.1s',
                  }}>
                    {result.homeScore}–{result.awayScore}
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                <img src={result.awayCrest} alt={result.away} style={{ width: '42px', height: '42px', objectFit: 'contain', flexShrink: 0, filter: 'drop-shadow(0 0 5px rgba(255,255,255,0.25))', transform: `scale(${getBadgeScale(result.away)})` }} />
              </div>
            </div>
          ))}
        </>
      )}

      {activeTab === 'results' && recent.length === 0 && (
        <div style={{ padding: '24px', textAlign: 'center', color: 'rgba(248,249,251,0.4)', fontFamily: "'Sora', sans-serif", fontSize: '13px' }}>
          No recent results
        </div>
      )}
    </div>
  )
}
