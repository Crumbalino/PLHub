import { getNextMatchday, getFixtures } from '@/lib/api-football/fixtures'
import NextFixturesClient from './NextFixturesClient'

export default async function FixturesWidget() {
  let upcoming: Array<{
    id: number
    home: string
    homeCrest: string
    away: string
    awayCrest: string
    date: string
    status: string
    homeScore: number | null
    awayScore: number | null
  }> = []

  let recent: Array<{
    id: number
    home: string
    homeCrest: string
    away: string
    awayCrest: string
    homeScore: number
    awayScore: number
  }> = []

  try {
    const nextMatches = await getNextMatchday()
    upcoming = nextMatches.map(f => ({
      id: f.id,
      home: f.teams.home.name,
      homeCrest: f.teams.home.logo,
      away: f.teams.away.name,
      awayCrest: f.teams.away.logo,
      date: f.date,
      status: f.status.short,
      homeScore: f.goals.home,
      awayScore: f.goals.away,
    }))
  } catch (err) {
    console.error('[FixturesWidget] Failed to fetch upcoming fixtures:', err)
  }

  try {
    const today = new Date().toISOString().split('T')[0]
    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const pastFixtures = await getFixtures(twoWeeksAgo, today)
    recent = pastFixtures
      .filter(f => f.status.short === 'FT' && f.goals.home !== null && f.goals.away !== null)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 5)
      .map(f => ({
        id: f.id,
        home: f.teams.home.name,
        homeCrest: f.teams.home.logo,
        away: f.teams.away.name,
        awayCrest: f.teams.away.logo,
        homeScore: f.goals.home as number,
        awayScore: f.goals.away as number,
      }))
  } catch (err) {
    console.error('[FixturesWidget] Failed to fetch recent results:', err)
  }

  return <NextFixturesClient upcoming={upcoming} recent={recent} />
}
