interface StandingsEntry {
  position: number
  team: {
    name: string
    shortName?: string
    crest: string
  }
  playedGames: number
  goalDifference: number
  points: number
}

const toSlug = (name: string) =>
  name
    .toLowerCase()
    .replace('manchester united', 'manchester-united')
    .replace('manchester city', 'manchester-city')
    .replace('nottingham forest', 'nottingham-forest')
    .replace('tottenham hotspur', 'tottenham')
    .replace('newcastle united', 'newcastle')
    .replace('west ham united', 'west-ham')
    .replace('aston villa', 'aston-villa')
    .replace('crystal palace', 'crystal-palace')
    .replace(' ', '-')
    .replace(/[^a-z0-9-]/g, '')

async function getPLStandings(): Promise<StandingsEntry[] | null> {
  try {
    const apiKey = process.env.FOOTBALL_DATA_API_KEY
    if (!apiKey) return null

    const res = await fetch(
      'https://api.football-data.org/v4/competitions/PL/standings',
      {
        headers: { 'X-Auth-Token': apiKey },
        next: { revalidate: 3600 }, // cache for 1 hour
      }
    )

    if (!res.ok) return null

    const data = await res.json()
    return data.standings?.[0]?.table ?? null
  } catch {
    return null
  }
}

export default async function PLTable() {
  const table = await getPLStandings()

  if (!table) {
    return (
      <div className="rounded-xl border border-white/[0.08] px-4 py-6 text-center text-xs text-white/30">
        Table unavailable — add API key to .env.local
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-white/[0.08] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06]">
        <span className="text-xs font-bold text-white uppercase tracking-wider">
          Table
        </span>
        <span className="text-[10px] text-white/30">PL · 2024/25</span>
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-[20px_1fr_24px_24px_24px_30px] gap-2 px-4 py-1.5 border-b border-white/[0.06]">
        <span className="text-[10px] text-white/20">#</span>
        <span className="text-[10px] text-white/20">Club</span>
        <span className="text-[10px] text-white/20 text-center">P</span>
        <span className="text-[10px] text-white/20 text-center">GD</span>
        <span className="text-[10px] text-white/20 text-center">Pts</span>
      </div>

      {/* Rows */}
      {table.map((entry) => (
        <a
          key={entry.position}
          href={`/clubs/${toSlug(entry.team.name)}`}
          className="grid grid-cols-[20px_1fr_24px_24px_24px_30px] gap-2 px-4 py-2 border-b border-white/[0.04] last:border-0 hover:bg-white/[0.03] transition-colors items-center"
        >
          <span
            className={`text-xs tabular-nums ${
              entry.position <= 4
                ? 'text-[#F5C842] font-bold'
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
              className="w-4 h-4 object-contain shrink-0"
            />
            <span className="text-xs text-white truncate">
              {entry.team.shortName ?? entry.team.name}
            </span>
          </div>

          <span className="text-xs text-white/50 tabular-nums text-center">
            {entry.playedGames}
          </span>
          <span className="text-xs text-white/50 tabular-nums text-center">
            {entry.goalDifference > 0 ? `+${entry.goalDifference}` : entry.goalDifference}
          </span>
          <span className="text-xs font-bold text-white tabular-nums text-center">
            {entry.points}
          </span>
        </a>
      ))}

      {/* Legend */}
      <div className="flex gap-3 px-4 py-2 border-t border-white/[0.06]">
        <span className="text-[10px] text-[#F5C842]/70">■ UCL</span>
        <span className="text-[10px] text-orange-400/70">■ UEL</span>
        <span className="text-[10px] text-red-400/70">■ Relegation</span>
      </div>
    </div>
  )
}
