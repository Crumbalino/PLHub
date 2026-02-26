'use client'

interface Match {
  id: string
  homeTeam: {
    name: string
    shortName?: string
    crest: string
  }
  awayTeam: {
    name: string
    shortName?: string
    crest: string
  }
  utcDate: string
  status: string
}

interface FixturesWidgetProps {
  matches: Match[] | null
  compact?: boolean
}

const formatMatchTime = (utcDate: string): string => {
  const date = new Date(utcDate)
  const now = new Date()
  const diffHours = (date.getTime() - now.getTime()) / (1000 * 60 * 60)

  if (diffHours < 24) {
    const hours = Math.floor(diffHours)
    const mins = Math.floor((diffHours - hours) * 60)
    return `${hours}h ${mins}m`
  }

  if (diffHours < 48) {
    return 'Tomorrow'
  }

  return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
}

const formatKickoff = (utcDate: string): string => {
  const date = new Date(utcDate)
  return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: true })
}

export default function FixturesWidget({ matches, compact = false }: FixturesWidgetProps) {
  if (!matches) {
    return (
      <div className="rounded-xl bg-[#152B2E] px-4 py-6 text-center text-xs text-white/30 border border-white/5">
        Fixtures unavailable
      </div>
    )
  }

  const displayMatches = compact ? matches.slice(0, 3) : matches

  return (
    <div className="rounded-xl bg-[#152B2E] overflow-hidden border border-white/5">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <span className="text-sm font-bold text-[#C4A23E]">Fixtures</span>
        <span className="text-[10px] text-white/30">{compact ? 'Next 3' : 'Upcoming'}</span>
      </div>

      {/* Matches */}
      <div className="divide-y divide-white/5">
        {displayMatches.map((match) => (
          <a
            key={match.id}
            href="#"
            className="block px-4 py-3 hover:bg-white/[0.03] transition-colors"
          >
            {/* Date/Time */}
            <div className="flex items-center justify-between mb-2 text-[10px]">
              <span className="text-white/40 uppercase tracking-widest">
                {formatMatchTime(match.utcDate)}
              </span>
              <span className="text-white/30">{formatKickoff(match.utcDate)}</span>
            </div>

            {/* Match */}
            <div className="flex items-center gap-2">
              <img
                src={match.homeTeam.crest}
                alt=""
                className="w-4 h-4 object-contain shrink-0"
              />
              <span className="text-[11px] text-white/80 flex-1 truncate">
                {match.homeTeam.shortName ?? match.homeTeam.name}
              </span>
              <span className="text-[9px] text-white/30 shrink-0">vs</span>
              <span className="text-[11px] text-white/80 flex-1 truncate text-right">
                {match.awayTeam.shortName ?? match.awayTeam.name}
              </span>
              <img
                src={match.awayTeam.crest}
                alt=""
                className="w-4 h-4 object-contain shrink-0"
              />
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}
