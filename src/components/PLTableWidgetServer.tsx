import PLTableWidget from './PLTableWidget'

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

interface PLTableWidgetServerProps {
  compact?: boolean
}

export default async function PLTableWidgetServer({ compact = false }: PLTableWidgetServerProps) {
  const table = await getPLStandings()

  return <PLTableWidget table={table} compact={compact} />
}
