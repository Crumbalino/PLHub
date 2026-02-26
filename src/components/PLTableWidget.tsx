'use client'

interface StandingsEntry {
  position: number
  team: {
    name: string
    shortName?: string
    crest: string
  }
  playedGames: number
  wins: number
  draws: number
  losses: number
  goalDifference: number
  points: number
}

interface PLTableWidgetProps {
  table: StandingsEntry[] | null
  compact?: boolean
}

export default function PLTableWidget({ table, compact = false }: PLTableWidgetProps) {
  if (!table) {
    return (
      <div className="rounded-xl bg-[#152B2E] px-4 py-6 text-center text-xs text-white/30 border border-white/5">
        Table unavailable
      </div>
    )
  }

  // For compact view on mobile/tablet, show top 6 and bottom 3
  const displayTable = compact ? [...table.slice(0, 6), ...table.slice(-3)] : table

  return (
    <div className="rounded-xl bg-[#152B2E] overflow-hidden border border-white/5">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <div>
          <span className="text-sm font-bold text-[#C4A23E]">Premier League</span>
          <span className="text-[10px] text-white/30 ml-2">2025/26</span>
        </div>
      </div>

      {/* Column headers */}
      {!compact && (
        <div className="grid grid-cols-[20px_1fr_20px_20px_20px_20px_28px] gap-1 px-4 py-2 border-b border-white/5 text-[10px] text-white/40">
          <span>#</span>
          <span>Team</span>
          <span className="text-center">P</span>
          <span className="text-center">W</span>
          <span className="text-center">D</span>
          <span className="text-center">L</span>
          <span className="text-center">Pts</span>
        </div>
      )}

      {/* Rows */}
      <div className="divide-y divide-white/5">
        {displayTable.map((entry) => (
          <a
            key={entry.position}
            href={`/clubs/${entry.team.name.toLowerCase().replace(/\s+/g, '-').replace('ú', 'u')}`}
            className="grid grid-cols-[20px_1fr_20px_20px_20px_20px_28px] gap-1 px-4 py-2 hover:bg-white/[0.03] transition-colors items-center text-xs"
          >
            <span
              className={`tabular-nums font-semibold ${
                entry.position <= 4
                  ? 'text-[#C4A23E]'
                  : entry.position === 5
                    ? 'text-orange-400'
                    : entry.position >= 18
                      ? 'text-red-400'
                      : 'text-white/40'
              }`}
            >
              {entry.position}
            </span>

            <div className="flex items-center gap-2 min-w-0">
              <img
                src={entry.team.crest}
                alt=""
                className="w-5 h-5 object-contain shrink-0"
              />
              <span className="text-white/80 truncate text-xs">
                {entry.team.shortName ?? entry.team.name}
              </span>
            </div>

            <span className="text-white/50 tabular-nums text-center">
              {entry.playedGames}
            </span>
            <span className="text-white/50 tabular-nums text-center">
              {entry.wins}
            </span>
            <span className="text-white/50 tabular-nums text-center">
              {entry.draws}
            </span>
            <span className="text-white/50 tabular-nums text-center">
              {entry.losses}
            </span>
            <span className="text-white font-bold tabular-nums text-center">
              {entry.points}
            </span>
          </a>
        ))}
      </div>

      {/* Legend */}
      {!compact && (
        <div className="flex gap-3 px-4 py-2 border-t border-white/5 text-[10px]">
          <span className="text-[#C4A23E]/70">■ UCL</span>
          <span className="text-orange-400/70">■ UEL</span>
          <span className="text-red-400/70">■ Relegation</span>
        </div>
      )}
    </div>
  )
}
