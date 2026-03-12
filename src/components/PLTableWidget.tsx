import { getStandingsTable } from '@/lib/api-football/standings'
import PLTableClient from './PLTableClient'

function parseForm(formStr: string): Array<'W' | 'D' | 'L'> {
  return Array.from(formStr)
    .filter((c): c is 'W' | 'D' | 'L' => c === 'W' || c === 'D' || c === 'L')
    .slice(0, 5)
}

export default async function PLTableWidget() {
  let entries: Array<{
    position: number
    name: string
    crest: string
    played: number
    gd: number
    pts: number
    form: Array<'W' | 'D' | 'L'>
  }> = []

  try {
    const standings = await getStandingsTable()
    entries = standings.map(s => ({
      position: s.rank,
      name: s.team.name,
      crest: s.team.logo,
      played: s.played,
      gd: s.goalsDiff,
      pts: s.points,
      form: s.form ? parseForm(s.form) : [],
    }))
  } catch (err) {
    console.error('[PLTableWidget] Failed to fetch standings:', err)
  }

  if (!entries.length) return null

  return <PLTableClient entries={entries} />
}
