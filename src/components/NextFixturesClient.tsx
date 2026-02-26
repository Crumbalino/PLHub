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
    <div className="rounded-xl bg-[#183538] border border-white/5 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06]">
        <span className="text-sm font-bold text-[#C4A23E]">Fixtures</span>
        <span className="text-[10px] text-white/40">Next {upcoming.length}</span>
      </div>

      {/* Matches */}
      <div className="divide-y divide-white/[0.04]">
        {visibleFixtures.map((match) => {
          const isLive = ['LIVE', 'IN_PLAY', 'PAUSED'].includes(match.status)
          return (
            <div key={match.id} className="px-3 py-2.5 hover:bg-white/[0.03] transition-colors">
              {/* Date/Time */}
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] text-white/40 uppercase tracking-widest">
                  {isLive ? (
                    <span className="text-green-400 font-bold animate-pulse">● LIVE</span>
                  ) : (
                    formatMatchTime(match.date)
                  )}
                </span>
                <span className="text-[10px] text-white/30">{formatKickoff(match.date)}</span>
              </div>

              {/* Teams */}
              <div className="flex items-center gap-2 justify-between">
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  <img src={match.homeCrest} alt="" className="w-4 h-4 object-contain shrink-0" />
                  <span className="text-xs text-white truncate">{match.home}</span>
                </div>

                {isLive && match.homeScore !== null ? (
                  <span className="text-sm font-bold text-green-400 tabular-nums shrink-0 mx-1">
                    {match.homeScore} - {match.awayScore}
                  </span>
                ) : (
                  <span className="text-[10px] text-white/20 shrink-0 mx-1">vs</span>
                )}

                <div className="flex items-center gap-1.5 flex-1 justify-end min-w-0">
                  <span className="text-xs text-white truncate">{match.away}</span>
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
          className="w-full py-2 text-center text-xs text-[#C4A23E] hover:text-[#d4b24e] transition-colors border-t border-white/5"
        >
          {expanded ? 'Show less' : `All fixtures ↓`}
        </button>
      )}

      {/* Recent Results */}
      {recent.length > 0 && (
        <>
          <div className="border-t border-white/5 px-3 py-2">
            <span className="text-xs font-bold text-[#C4A23E]">Results</span>
          </div>
          <div className="divide-y divide-white/[0.03]">
            {recent.slice(0, 3).map((result) => (
              <div key={result.id} className="flex items-center gap-2 px-3 py-1.5 justify-between">
                <div className="flex items-center gap-1 flex-1 min-w-0">
                  <img src={result.homeCrest} alt="" className="w-3 h-3 object-contain shrink-0" />
                  <span className="text-[11px] text-white truncate">{result.home}</span>
                </div>
                <span className="text-xs font-bold text-white tabular-nums shrink-0">
                  {result.homeScore} - {result.awayScore}
                </span>
                <div className="flex items-center gap-1 flex-1 justify-end min-w-0">
                  <span className="text-[11px] text-white truncate">{result.away}</span>
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
