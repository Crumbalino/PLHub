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

async function getNextFixtures(): Promise<Match[] | null> {
  try {
    const apiKey = process.env.FOOTBALL_DATA_API_KEY
    if (!apiKey) return null

    const res = await fetch(
      'https://api.football-data.org/v4/competitions/PL/matches?status=SCHEDULED',
      {
        headers: { 'X-Auth-Token': apiKey },
        next: { revalidate: 3600 }, // cache for 1 hour
      }
    )

    if (!res.ok) return null

    const data = await res.json()
    return data.matches?.slice(0, 8) ?? null
  } catch {
    return null
  }
}

export default async function NextFixtures() {
  const matches = await getNextFixtures()

  if (!matches) {
    return (
      <div className="rounded-xl border border-white/[0.08] px-4 py-6 text-center text-xs text-white/30">
        Fixtures unavailable — add API key to .env.local
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-white/[0.08] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06]">
        <span className="text-xs font-bold text-white uppercase tracking-wider">
          Fixtures
        </span>
        <span className="text-[10px] text-white/30">Next 8</span>
      </div>

      {/* Matches */}
      <div className="divide-y divide-white/[0.04]">
        {matches.map((match) => (
          <a
            key={match.id}
            href={`#`}
            className="block px-4 py-3 hover:bg-white/[0.03] transition-colors"
          >
            {/* Date/Time */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-white/30 uppercase tracking-widest">
                {formatMatchTime(match.utcDate)}
              </span>
              <span className="text-[10px] text-white/20">{formatKickoff(match.utcDate)}</span>
            </div>

            {/* Home Team */}
            <div className="flex items-center gap-2 mb-1">
              <img
                src={match.homeTeam.crest}
                alt=""
                className="w-3 h-3 object-contain shrink-0"
              />
              <span className="text-[11px] text-white truncate flex-1">
                {match.homeTeam.shortName ?? match.homeTeam.name}
              </span>
            </div>

            {/* Away Team */}
            <div className="flex items-center gap-2">
              <img
                src={match.awayTeam.crest}
                alt=""
                className="w-3 h-3 object-contain shrink-0"
              />
              <span className="text-[11px] text-white truncate flex-1">
                {match.awayTeam.shortName ?? match.awayTeam.name}
              </span>
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}
