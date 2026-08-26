/**
 * football-data.co.uk source adapter — referee statistics.
 *
 * Feeds PAGE_SPEC §7.5, the referee block. Free, no key, CSV, back to 1993/94.
 * The E0 file carries `Referee`, `HY`, `AY`, `HR`, `AR` and `FTR` per match,
 * which is everything the block needs and nothing it does not.
 *
 * WHAT THIS SOURCE DOES NOT CARRY: penalties. There is no penalty column in
 * E0, in either the current season or any archived one — checked, not assumed.
 * So no penalty figure is computed. The brief said "penalties where the source
 * carries them"; it does not carry them, and approximating one from fouls or
 * shots would be inventing a statistic about a named official.
 *
 * THE NAME PROBLEM. football-data.co.uk writes `M Oliver`. pulselive, which
 * supplies the appointment, writes `Michael Oliver`. Neither is wrong and
 * neither is a key, so `refereeKey()` normalises both to `oliver|m` — surname
 * plus first initial. That is the join, and it is the most likely thing here to
 * break: two officials sharing a surname and an initial would collide. None do
 * on the current list, and `refereeKeyCollisions()` exists so a test can say so
 * rather than a reader finding out.
 *
 * Same shape as the other adapters: fetchers are impure, cached and return null
 * on failure; transforms are pure. Nothing throws.
 */

import { fetchJson } from './cache'
import {
  CAREER_FROM_SEASON,
  CURRENT_SEASON,
  attach,
  type Provenanced,
} from '@/lib/provenance'

const BASE = 'https://www.football-data.co.uk/mmz4281'

/** Premier League. E1 is the Championship, which this build does not read. */
const DIVISION = 'E0'

/**
 * A completed season never changes. The current one changes at most twice a
 * week, and the block sits below the fold.
 */
const SEASON_TTL = 6 * 60 * 60 * 1000
const ARCHIVE_TTL = 7 * 24 * 60 * 60 * 1000

// ---------------------------------------------------------------------------
// Seasons
// ---------------------------------------------------------------------------

/** '2026/27' → '2627', the form football-data.co.uk uses in its paths. */
export function seasonCode(season: string): string | null {
  const m = /^(\d{4})\/(\d{2})$/.exec(season)
  if (!m) return null
  return m[1].slice(2) + m[2]
}

/** Every season from `from` to `to` inclusive, oldest first. */
export function seasonRange(from: string, to: string): string[] {
  const start = Number(from.slice(0, 4))
  const end = Number(to.slice(0, 4))
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return []
  const out: string[] = []
  for (let y = start; y <= end; y++) {
    out.push(`${y}/${String((y + 1) % 100).padStart(2, '0')}`)
  }
  return out
}

/** The seasons a career figure covers. Stated by the provenance record too. */
export function careerSeasons(): string[] {
  return seasonRange(CAREER_FROM_SEASON, CURRENT_SEASON)
}

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------

export interface MatchRow {
  season: string
  date: string
  homeTeam: string
  awayTeam: string
  /** H, A or D. */
  result: string
  referee: string
  yellows: number
  reds: number
}

const num = (v: string | undefined): number => {
  const n = Number.parseInt((v ?? '').trim(), 10)
  return Number.isFinite(n) ? n : 0
}

/**
 * Parse an E0 CSV.
 *
 * Deliberately not a general CSV parser. These files have no quoted fields in
 * the columns read here, and a row is skipped rather than guessed at if it is
 * short or has no referee — a blank referee is a fixture that has not been
 * played, and counting it would inflate every denominator.
 */
export function parseSeasonCsv(csv: string, season: string): MatchRow[] {
  const lines = csv.split(/\r?\n/).filter((l) => l.trim())
  if (lines.length < 2) return []

  // The file is served with a BOM.
  const header = lines[0].replace(/^﻿/, '').split(',')
  const at = (name: string) => header.indexOf(name)
  const iDate = at('Date')
  const iHome = at('HomeTeam')
  const iAway = at('AwayTeam')
  const iRes = at('FTR')
  const iRef = at('Referee')
  const iHY = at('HY')
  const iAY = at('AY')
  const iHR = at('HR')
  const iAR = at('AR')

  if (iRef === -1 || iHome === -1 || iAway === -1) return []

  const rows: MatchRow[] = []
  for (const line of lines.slice(1)) {
    const cells = line.split(',')
    const referee = (cells[iRef] ?? '').trim()
    if (!referee) continue
    rows.push({
      season,
      date: (cells[iDate] ?? '').trim(),
      homeTeam: (cells[iHome] ?? '').trim(),
      awayTeam: (cells[iAway] ?? '').trim(),
      result: (cells[iRes] ?? '').trim(),
      referee,
      yellows: num(cells[iHY]) + num(cells[iAY]),
      reds: num(cells[iHR]) + num(cells[iAR]),
    })
  }
  return rows
}

/**
 * A comparable key for an official's name.
 *
 * `M Oliver`, `Michael Oliver` and `MICHAEL OLIVER` all key to `oliver|m`.
 * Accents are folded and punctuation dropped so `O'Neill` and `ONeill` agree.
 */
export function refereeKey(name: string): string | null {
  const cleaned = (name ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z\s-]/g, '')
    .trim()
    .toLowerCase()
  if (!cleaned) return null
  const parts = cleaned.split(/\s+/).filter(Boolean)
  if (!parts.length) return null
  if (parts.length === 1) return `${parts[0]}|`
  const last = parts[parts.length - 1]
  const initial = parts[0][0]
  return `${last}|${initial}`
}

/**
 * Raw names that share a key.
 *
 * Two spellings of one person is the expected, harmless case and the reason the
 * key exists — the archive contains both `L Mason` and `l Mason`, a typo at
 * source, and they must merge. A genuine collision is two *different* officials
 * sharing a surname and a first initial, which would silently pool one
 * person's record into another's. None exist on the current list; the test
 * exists so that stays true.
 */
export function refereeKeyCollisions(names: string[]): Record<string, string[]> {
  const byKey: Record<string, Set<string>> = {}
  for (const n of names) {
    const k = refereeKey(n)
    if (!k) continue
    ;(byKey[k] ??= new Set()).add(n)
  }
  const out: Record<string, string[]> = {}
  for (const [k, set] of Object.entries(byKey)) {
    if (set.size > 1) out[k] = [...set].sort()
  }
  return out
}

// ---------------------------------------------------------------------------
// Aggregation — pure
// ---------------------------------------------------------------------------

export interface RefereeTotals {
  matches: number
  yellows: number
  reds: number
  /** Null below one match — a per-game rate over no games is not zero. */
  cardsPerGame: number | null
}

export interface ClubRecord {
  won: number
  drawn: number
  lost: number
  matches: number
}

/** Rows an official took charge of. */
export function refereeMatches(rows: MatchRow[], name: string): MatchRow[] {
  const key = refereeKey(name)
  if (!key) return []
  return rows.filter((r) => refereeKey(r.referee) === key)
}

/** Totals over a set of rows. */
export function totals(rows: MatchRow[]): RefereeTotals {
  const matches = rows.length
  const yellows = rows.reduce((n, r) => n + r.yellows, 0)
  const reds = rows.reduce((n, r) => n + r.reds, 0)
  return {
    matches,
    yellows,
    reds,
    cardsPerGame: matches > 0 ? Math.round(((yellows + reds) / matches) * 10) / 10 : null,
  }
}

/**
 * A club's record in matches refereed by an official.
 *
 * `csvName` is this source's name for the club — `Man City`, `Nott'm Forest` —
 * which is neither our slug nor FPL's name. `csvClubName()` above maps them,
 * and the map lives here because it is this source's vocabulary, not ours.
 */
export const CSV_CLUB_NAMES: Record<string, string> = {
  arsenal: 'Arsenal',
  'aston-villa': 'Aston Villa',
  bournemouth: 'Bournemouth',
  brentford: 'Brentford',
  brighton: 'Brighton',
  chelsea: 'Chelsea',
  coventry: 'Coventry',
  'crystal-palace': 'Crystal Palace',
  everton: 'Everton',
  fulham: 'Fulham',
  hull: 'Hull',
  ipswich: 'Ipswich',
  leeds: 'Leeds',
  liverpool: 'Liverpool',
  'man-city': 'Man City',
  'man-utd': 'Man United',
  newcastle: 'Newcastle',
  'nottingham-forest': "Nott'm Forest",
  sunderland: 'Sunderland',
  tottenham: 'Tottenham',
}

/** This source's name for a club, or null if it has never named them. */
export function csvClubName(slug: string): string | null {
  return CSV_CLUB_NAMES[slug] ?? null
}

export function clubRecord(rows: MatchRow[], csvName: string): ClubRecord | null {
  const played = rows.filter((r) => r.homeTeam === csvName || r.awayTeam === csvName)
  if (!played.length) return null
  let won = 0
  let drawn = 0
  let lost = 0
  for (const r of played) {
    const home = r.homeTeam === csvName
    if (r.result === 'D') drawn++
    else if ((r.result === 'H' && home) || (r.result === 'A' && !home)) won++
    else lost++
  }
  return { won, drawn, lost, matches: played.length }
}

// ---------------------------------------------------------------------------
// Fetchers
// ---------------------------------------------------------------------------

/**
 * One season's results file.
 *
 * `fetchJson` is reused for its cache, single-flight and fail-soft behaviour;
 * the body is CSV, so it is read as text via a parse override.
 */
export async function fetchSeason(season: string): Promise<MatchRow[] | null> {
  const code = seasonCode(season)
  if (!code) return null
  const url = `${BASE}/${code}/${DIVISION}.csv`
  const text = await fetchJson<string>(url, {
    ttlMs: season === CURRENT_SEASON ? SEASON_TTL : ARCHIVE_TTL,
    key: `footballdataco:${code}:${DIVISION}`,
    parse: 'text',
  })
  if (text === null) return null
  return parseSeasonCsv(text, season)
}

/** Several seasons, oldest first. A season that fails is skipped, not fatal. */
export async function fetchSeasons(seasons: string[]): Promise<MatchRow[]> {
  const loaded = await Promise.all(seasons.map((s) => fetchSeason(s)))
  return loaded.filter((r): r is MatchRow[] => r !== null).flat()
}

// ---------------------------------------------------------------------------
// Composed reads
// ---------------------------------------------------------------------------

/** Every statistic the block may show, each carrying its own provenance. */
export interface RefereeStats {
  name: string
  season: {
    matches: Provenanced<number> | null
    yellows: Provenanced<number> | null
    reds: Provenanced<number> | null
    cards_per_game: Provenanced<number> | null
  }
  career: {
    matches: Provenanced<number> | null
    yellows: Provenanced<number> | null
    reds: Provenanced<number> | null
    cards_per_game: Provenanced<number> | null
  }
  club_record: Provenanced<ClubRecord> | null
}

/**
 * §7.5 statistics for one official, optionally against one club.
 *
 * Every figure goes through `attach()`, so a metric with no definition is
 * dropped here rather than rendered. Null everywhere is a complete answer: the
 * block does not render.
 */
export async function getRefereeStats(
  name: string,
  clubCsvName?: string | null,
  now: number = Date.now()
): Promise<RefereeStats | null> {
  if (!name?.trim()) return null

  const seasons = careerSeasons()
  const all = await fetchSeasons(seasons)
  if (!all.length) return null

  const mine = refereeMatches(all, name)
  if (!mine.length) return null

  const refreshed = new Date(now).toISOString()
  const seasonRows = mine.filter((r) => r.season === CURRENT_SEASON)
  const s = totals(seasonRows)
  const c = totals(mine)
  const record = clubCsvName ? clubRecord(mine, clubCsvName) : null

  return {
    name,
    season: {
      matches: attach('referee.matches.season', s.matches || null, refreshed),
      yellows: attach('referee.yellow_cards.season', s.matches ? s.yellows : null, refreshed),
      reds: attach('referee.red_cards.season', s.matches ? s.reds : null, refreshed),
      cards_per_game: attach('referee.cards_per_game.season', s.cardsPerGame, refreshed),
    },
    career: {
      matches: attach('referee.matches.career', c.matches || null, refreshed),
      yellows: attach('referee.yellow_cards.career', c.matches ? c.yellows : null, refreshed),
      reds: attach('referee.red_cards.career', c.matches ? c.reds : null, refreshed),
      cards_per_game: attach('referee.cards_per_game.career', c.cardsPerGame, refreshed),
    },
    club_record: attach('referee.club_record.career', record, refreshed),
  }
}

/** Every referee name the loaded seasons carry. Used by the collision test. */
export async function knownRefereeNames(seasons = careerSeasons()): Promise<string[]> {
  const rows = await fetchSeasons(seasons)
  return [...new Set(rows.map((r) => r.referee))].sort()
}
