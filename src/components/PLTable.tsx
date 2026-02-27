import PLTableClient from './PLTableClient'

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

async function getPLStandings(): Promise<StandingsEntry[] | null> {
  try {
    const apiKey = process.env.FOOTBALL_DATA_API_KEY
    if (!apiKey) return null

    const res = await fetch(
      'https://api.football-data.org/v4/competitions/PL/standings',
      {
        headers: { 'X-Auth-Token': apiKey },
        next: { revalidate: 3600 },
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
        Table unavailable
      </div>
    )
  }

  const serialized = table.map(e => ({
    position: e.position,
    name: e.team.shortName ?? e.team.name,
    crest: e.team.crest,
    played: e.playedGames,
    gd: e.goalDifference,
    pts: e.points,
  }))

  return <PLTableClient entries={serialized} />
}
