/**
 * football-data.org source adapter — the league table.
 *
 * Feeds PAGE_SPEC blocks 7 (§7.7 Table) and 10 (§7.10 The Numbers). One
 * endpoint carries both: the standings row for a club is the whole of §7.10
 * except expected goals, which the FPL adapter derives.
 *
 * THIS IS THE ONE ADAPTER THAT NEEDS A KEY. `FOOTBALL_DATA_API_KEY` is already
 * set in the environment. Where the other three adapters degrade only when an
 * upstream is down, this one also degrades when the key is absent — and it does
 * so silently and completely: no output, no partial table, no thrown error. A
 * missing key means blocks 7 and 10 do not render, which §15 already covers.
 *
 * Same shape as the other adapters: fetchers are impure, cached and return null
 * on failure; transforms are pure.
 *
 * Free tier is 10 requests/minute. The standings only move when a match
 * finishes, so the TTL is long and one cold read serves both blocks.
 */

import { CLUB_CODES } from '@/lib/clubs'
import { fetchJson } from './cache'

const API = 'https://api.football-data.org/v4'

/** Premier League. The numeric id 2021 addresses the same competition. */
const COMPETITION = 'PL'

/** Standings change only at full time. */
const STANDINGS_TTL = 30 * 60 * 1000

/**
 * Read the key per call, never at module scope.
 *
 * At module scope an unset variable is captured as undefined for the lifetime
 * of the process, so the first cold start decides the answer forever — the same
 * trap the cron handlers document for CRON_SECRET.
 */
function apiKey(): string | null {
  const key = process.env.FOOTBALL_DATA_API_KEY
  return key && key.trim() ? key.trim() : null
}

// ---------------------------------------------------------------------------
// Upstream types
// ---------------------------------------------------------------------------

export interface FdTeam {
  id: number
  name: string
  shortName?: string
  tla?: string
  crest?: string
}

export interface FdStandingRow {
  position: number
  team: FdTeam
  playedGames: number
  won: number
  draw: number
  lost: number
  points: number
  goalsFor: number
  goalsAgainst: number
  goalDifference: number
}

interface FdStandingsBlock {
  /** TOTAL, HOME or AWAY. Only TOTAL is the league table. */
  type: string
  table: FdStandingRow[]
}

export interface FdStandings {
  competition?: { id: number; code: string; name: string }
  season?: { currentMatchday: number | null }
  standings: FdStandingsBlock[]
}

// ---------------------------------------------------------------------------
// Domain types
// ---------------------------------------------------------------------------

/** A league table row, in the §14 payload's naming. */
export interface TableRow {
  position: number
  /** Null when the club is not in the local registry — the name still renders. */
  slug: string | null
  name: string
  played: number
  won: number
  drawn: number
  lost: number
  goals_for: number
  goals_against: number
  gd: number
  points: number
}

/** §7.10, minus expected goals. */
export interface TableNumbers {
  position: number
  points: number
  gd: number
  goals_for: number
  goals_against: number
}

// ---------------------------------------------------------------------------
// Transforms — pure
// ---------------------------------------------------------------------------

/** slug → three-letter code, inverted from the club registry once. */
const SLUG_BY_TLA: Record<string, string> = (() => {
  const map: Record<string, string> = {}
  for (const [slug, code] of Object.entries(CLUB_CODES)) map[code] = slug
  return map
})()

/**
 * football-data's three-letter abbreviation → our club slug.
 *
 * The join is by code rather than name because the names disagree in every
 * direction ("Tottenham Hotspur FC" against our "Tottenham"). Codes disagree
 * occasionally too — football-data says NOT for Nottingham Forest where the
 * registry says NFO — so a name fallback backs it up.
 *
 * A null slug is not a failure. It means the club is absent from the local
 * registry; the row still renders, it just has nothing to link to.
 */
export function slugForTeam(team: FdTeam): string | null {
  const byTla = team.tla ? SLUG_BY_TLA[team.tla] : undefined
  if (byTla) return byTla

  const name = (team.shortName ?? team.name ?? '').toLowerCase().trim()
  if (name.length < 4) return null

  for (const slug of Object.keys(CLUB_CODES)) {
    const plain = slug.replace(/-/g, ' ')
    // Either direction: upstream is sometimes longer than our slug
    // ("Tottenham Hotspur FC" against "tottenham") and sometimes shorter
    // ("Nottingham" against "nottingham-forest").
    if (name.includes(plain) || plain.includes(name)) return slug
  }
  return null
}

/** One upstream row in the payload's naming. */
export function toTableRow(row: FdStandingRow): TableRow {
  return {
    position: row.position,
    slug: slugForTeam(row.team),
    name: row.team.shortName ?? row.team.name,
    played: row.playedGames,
    won: row.won,
    drawn: row.draw,
    lost: row.lost,
    goals_for: row.goalsFor,
    goals_against: row.goalsAgainst,
    gd: row.goalDifference,
    points: row.points,
  }
}

/**
 * The full table, in position order.
 *
 * Only the TOTAL block is the league table — HOME and AWAY are separate splits
 * of the same competition and would silently produce a wrong table.
 */
export function parseStandings(payload: FdStandings): TableRow[] | null {
  const total = payload?.standings?.find((s) => s.type === 'TOTAL')
  if (!total?.table?.length) return null
  return total.table
    .map(toTableRow)
    .sort((a, b) => a.position - b.position)
}

/** Locate a club's row. */
export function findRow(rows: TableRow[], slug: string): TableRow | null {
  return rows.find((r) => r.slug === slug) ?? null
}

/**
 * §7.7 — three above, the club, three below.
 *
 * The window is clamped rather than slid, which is the spec read literally: a
 * club sitting first or last gets a shorter window rather than a seven-row one
 * padded in the only direction available. Better a short true window than a
 * centred one that implies rows that aren't there.
 */
export function tableWindow(
  rows: TableRow[],
  slug: string,
  above = 3,
  below = 3
): TableRow[] {
  const index = rows.findIndex((r) => r.slug === slug)
  if (index === -1) return []
  return rows.slice(Math.max(0, index - above), index + below + 1)
}

/** §7.10, minus expected goals. */
export function toNumbers(row: TableRow): TableNumbers {
  return {
    position: row.position,
    points: row.points,
    gd: row.gd,
    goals_for: row.goals_for,
    goals_against: row.goals_against,
  }
}

// ---------------------------------------------------------------------------
// Fetchers
// ---------------------------------------------------------------------------

/**
 * The Premier League standings.
 *
 * Returns null with no request attempted when the key is absent — an
 * unauthenticated call would 403 and log a failure that looks like an outage
 * rather than a configuration gap.
 */
export function fetchStandings(): Promise<FdStandings | null> {
  const key = apiKey()
  if (!key) {
    console.error('[sources] FOOTBALL_DATA_API_KEY is not set — no table, no numbers')
    return Promise.resolve(null)
  }
  return fetchJson<FdStandings>(`${API}/competitions/${COMPETITION}/standings`, {
    ttlMs: STANDINGS_TTL,
    headers: { 'X-Auth-Token': key },
    // The cache key must not carry the key itself.
    key: `footballdata:standings:${COMPETITION}`,
  })
}

// ---------------------------------------------------------------------------
// Composed reads
// ---------------------------------------------------------------------------

/** The full table in position order. */
export async function getFullTable(): Promise<TableRow[] | null> {
  const payload = await fetchStandings()
  if (!payload) return null
  return parseStandings(payload)
}

/**
 * §7.7 — the club's window of the table, plus the slug to highlight.
 *
 * Null when there is no table or the club is not in it, so the block does not
 * render rather than rendering a table with nobody highlighted.
 */
export async function getTable(
  slug: string
): Promise<{ rows: TableRow[]; highlight: string } | null> {
  const rows = await getFullTable()
  if (!rows) return null
  const window = tableWindow(rows, slug)
  if (!window.length) return null
  return { rows: window, highlight: slug }
}

/** §7.10 — position, points, goal difference, goals scored, goals conceded. */
export async function getNumbers(slug: string): Promise<TableNumbers | null> {
  const rows = await getFullTable()
  if (!rows) return null
  const row = findRow(rows, slug)
  return row ? toNumbers(row) : null
}
