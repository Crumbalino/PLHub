import FixturesWidget from './FixturesWidget'

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

async function getNextFixtures(): Promise<Match[] | null> {
  try {
    const apiKey = process.env.FOOTBALL_DATA_API_KEY
    if (!apiKey) return null

    const res = await fetch(
      'https://api.football-data.org/v4/competitions/PL/matches?status=SCHEDULED',
      {
        headers: { 'X-Auth-Token': apiKey },
        next: { revalidate: 3600 },
      }
    )

    if (!res.ok) return null

    const data = await res.json()
    return data.matches?.slice(0, 8) ?? null
  } catch {
    return null
  }
}

interface FixturesWidgetServerProps {
  compact?: boolean
}

export default async function FixturesWidgetServer({ compact = false }: FixturesWidgetServerProps) {
  const matches = await getNextFixtures()

  return <FixturesWidget matches={matches} compact={compact} />
}
