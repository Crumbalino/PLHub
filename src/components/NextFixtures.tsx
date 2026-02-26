import NextFixturesClient from './NextFixturesClient'

interface Match {
  id: number
  homeTeam: { name: string; shortName?: string; crest: string }
  awayTeam: { name: string; shortName?: string; crest: string }
  utcDate: string
  status: string
  score?: {
    fullTime?: { home: number | null; away: number | null }
  }
}

async function getMatches(): Promise<{ upcoming: Match[]; recent: Match[] } | null> {
  try {
    const apiKey = process.env.FOOTBALL_DATA_API_KEY
    if (!apiKey) return null

    // Fetch scheduled + live matches
    const [upRes, recentRes] = await Promise.all([
      fetch('https://api.football-data.org/v4/competitions/PL/matches?status=SCHEDULED,LIVE,IN_PLAY,PAUSED', {
        headers: { 'X-Auth-Token': apiKey },
        next: { revalidate: 300 }, // 5 min for live score freshness
      }),
      fetch('https://api.football-data.org/v4/competitions/PL/matches?status=FINISHED&limit=5', {
        headers: { 'X-Auth-Token': apiKey },
        next: { revalidate: 3600 },
      }),
    ])

    if (!upRes.ok) return null

    const upData = await upRes.json()
    const recentData = recentRes.ok ? await recentRes.json() : { matches: [] }

    return {
      upcoming: (upData.matches ?? []).slice(0, 8),
      recent: (recentData.matches ?? []).slice(-5).reverse(),
    }
  } catch {
    return null
  }
}

export default async function NextFixtures() {
  const data = await getMatches()

  if (!data) {
    return (
      <div className="rounded-xl border border-white/[0.08] px-4 py-6 text-center text-xs text-white/30">
        Fixtures unavailable
      </div>
    )
  }

  const upcoming = data.upcoming.map(m => ({
    id: m.id,
    home: m.homeTeam.shortName ?? m.homeTeam.name,
    homeCrest: m.homeTeam.crest,
    away: m.awayTeam.shortName ?? m.awayTeam.name,
    awayCrest: m.awayTeam.crest,
    date: m.utcDate,
    status: m.status,
    homeScore: m.score?.fullTime?.home ?? null,
    awayScore: m.score?.fullTime?.away ?? null,
  }))

  const recent = data.recent.map(m => ({
    id: m.id,
    home: m.homeTeam.shortName ?? m.homeTeam.name,
    homeCrest: m.homeTeam.crest,
    away: m.awayTeam.shortName ?? m.awayTeam.name,
    awayCrest: m.awayTeam.crest,
    homeScore: m.score?.fullTime?.home ?? 0,
    awayScore: m.score?.fullTime?.away ?? 0,
  }))

  return <NextFixturesClient upcoming={upcoming} recent={recent} />
}
