/**
 * football-data.co.uk source adapter — referee statistics.
 *
 * Feeds PAGE_SPEC §7.5, the referee block. Free, no key, CSV, back to 1993/94.
 *
 * ── WHAT THE ARCHIVE ACTUALLY CARRIES ────────────────────────────────────────
 *
 * Not the same columns throughout, and the difference is not cosmetic.
 * Measured across the whole archive on 26 August 2026:
 *
 *   1993/94 – 1999/00   Div, Date, HomeTeam, AwayTeam, FTHG, FTAG, FTR.
 *                       NO Referee column. NO card columns.
 *   2000/01 – 2026/27   Referee, HY, AY, HR, AR, plus much else.
 *
 * So the seven oldest seasons cannot attribute a match to an official at all.
 * They are still fetched and parsed — they are real match results — but they
 * contribute nothing to any referee metric, and no figure claims they do.
 *
 * Columns are detected per file rather than assumed, because "the archive goes
 * back to 1993" and "referee statistics go back to 1993" are different claims
 * and only the first is true.
 *
 * ── WHAT IT DOES NOT CARRY AT ALL ────────────────────────────────────────────
 *
 * Penalties. There is no penalty column in E0 in any season — checked across
 * the archive, not assumed. No penalty figure is computed and no penalty metric
 * exists. Approximating one from fouls or shots would be inventing a statistic
 * about a named official.
 *
 * ── THE NAME PROBLEM ─────────────────────────────────────────────────────────
 *
 * football-data.co.uk writes `M Oliver`. pulselive, which supplies the
 * appointment, writes `Michael Oliver`. `refereeKey()` normalises both to
 * `oliver|m` — surname plus first initial. Two different officials sharing a
 * surname and an initial would pool one record into the other's, which is what
 * the collision test watches for.
 *
 * ── FETCHING ─────────────────────────────────────────────────────────────────
 *
 * A completed season is immutable, so it is cached with no expiry and is never
 * fetched twice in a process. Requests are staggered and capped rather than
 * fired in parallel: this is a free static archive maintained by one person and
 * there is no reason to hammer it.
 *
 * Same shape as the other adapters: fetchers are impure, cached and return null
 * on failure; transforms are pure. Nothing throws, and one bad file never fails
 * the rest.
 */

import { cacheGet, fetchJson } from './cache'
import { CURRENT_SEASON, attach, type Provenanced } from '@/lib/provenance'

const BASE = 'https://www.football-data.co.uk/mmz4281'

/** Premier League. E1 is the Championship, which this build does not read. */
const DIVISION = 'E0'

/** The first season football-data.co.uk publishes for E0. */
export const ARCHIVE_FROM_SEASON = '1993/94'

/**
 * The current season is the only file that changes. Everything before it is
 * final, so it is held with no expiry — fetched once per process, never again.
 */
const CURRENT_SEASON_TTL = 6 * 60 * 60 * 1000
const COMPLETED_SEASON_TTL = Infinity

/** At most this many season files in flight at once. */
const MAX_CONCURRENT = 3

/** Minimum gap between request starts, milliseconds. */
const REQUEST_SPACING_MS = 120

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

/** The full archive, oldest first. 34 seasons: 1993/94 through 2026/27. */
export function archiveSeasons(): string[] {
  return seasonRange(ARCHIVE_FROM_SEASON, CURRENT_SEASON)
}

/**
 * A coverage period naming the seasons a figure is actually built from.
 *
 * This is what makes a career number honest. A figure drawn from 2000/01
 * onwards says so; one drawn from 2014/15 onwards says that instead; and if a
 * season file is missing, the span shrinks to what was really read.
 */
export function coveragePeriod(seasons: string[]): string | null {
  if (!seasons.length) return null
  const sorted = [...new Set(seasons)].sort()
  const first = sorted[0]
  const last = sorted[sorted.length - 1]
  return first === last
    ? `Premier League, ${first}`
    : `Premier League, ${first} to ${last}`
}

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------

/** Which of the columns we read a given season file actually has. */
export interface SeasonColumns {
  referee: boolean
  cards: boolean
  result: boolean
}

export interface MatchRow {
  season: string
  date: string
  /** ISO date, or null when the source date is unparseable. */
  iso: string | null
  homeTeam: string
  awayTeam: string
  /** H, A or D. Empty when the file has no FTR. */
  result: string
  /** Empty when the season has no Referee column. */
  referee: string
  /** Null when the season carries no card columns — not zero. */
  yellows: number | null
  reds: number | null
}

export interface SeasonLoad {
  season: string
  columns: SeasonColumns
  rows: MatchRow[]
}

const num = (v: string | undefined): number | null => {
  const t = (v ?? '').trim()
  if (!t) return null
  const n = Number.parseInt(t, 10)
  return Number.isFinite(n) ? n : null
}

/**
 * `14/08/93` and `15/08/2025` both appear in the archive. Two-digit years are
 * football seasons, so 90–99 is the 1900s and everything else the 2000s.
 */
export function parseCsvDate(value: string): string | null {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/.exec((value ?? '').trim())
  if (!m) return null
  const [, d, mo, y] = m
  const year = y.length === 4 ? Number(y) : Number(y) >= 90 ? 1900 + Number(y) : 2000 + Number(y)
  const day = Number(d)
  const month = Number(mo)
  if (month < 1 || month > 12 || day < 1 || day > 31) return null
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

/**
 * Parse an E0 CSV, detecting which columns this particular file has.
 *
 * Deliberately not a general CSV parser — the columns read here are never
 * quoted. A row with no teams is skipped: the oldest files are padded with
 * trailing empty lines, and counting them would inflate every denominator.
 */
export function parseSeasonCsv(csv: string, season: string): SeasonLoad {
  const empty: SeasonLoad = {
    season,
    columns: { referee: false, cards: false, result: false },
    rows: [],
  }

  const lines = (csv ?? '').split(/\r?\n/).filter((l) => l.trim())
  if (lines.length < 2) return empty

  // The files are served with a BOM.
  const header = lines[0].replace(/^﻿/, '').split(',').map((h) => h.trim())
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

  if (iHome === -1 || iAway === -1) return empty

  const columns: SeasonColumns = {
    referee: iRef !== -1,
    // Every card column must be present. A file with two of the four is not
    // one we can total honestly.
    cards: iHY !== -1 && iAY !== -1 && iHR !== -1 && iAR !== -1,
    result: iRes !== -1,
  }

  const rows: MatchRow[] = []
  for (const line of lines.slice(1)) {
    const cells = line.split(',')
    const homeTeam = (cells[iHome] ?? '').trim()
    const awayTeam = (cells[iAway] ?? '').trim()
    if (!homeTeam || !awayTeam) continue

    const date = iDate === -1 ? '' : (cells[iDate] ?? '').trim()
    const yellows = columns.cards ? (num(cells[iHY]) ?? 0) + (num(cells[iAY]) ?? 0) : null
    const reds = columns.cards ? (num(cells[iHR]) ?? 0) + (num(cells[iAR]) ?? 0) : null

    rows.push({
      season,
      date,
      iso: parseCsvDate(date),
      homeTeam,
      awayTeam,
      result: columns.result ? (cells[iRes] ?? '').trim() : '',
      referee: columns.referee ? (cells[iRef] ?? '').trim() : '',
      yellows,
      reds,
    })
  }

  return { season, columns, rows }
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
 * sharing a surname and a first initial, which would silently pool one person's
 * record into another's.
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
  /** Seasons the matches came from, for the coverage period. */
  seasons: string[]
  /** Matches whose season carried card columns. */
  matchesWithCards: number
  /** Null when no match in the set carries card data. */
  yellows: number | null
  reds: number | null
  cardsPerGame: number | null
  /** Seasons contributing card data, for the card metrics' coverage period. */
  cardSeasons: string[]
}

export interface ClubRecord {
  won: number
  drawn: number
  lost: number
  matches: number
}

/** Rows an official took charge of. Seasons with no Referee column yield none. */
export function refereeMatches(rows: MatchRow[], name: string): MatchRow[] {
  const key = refereeKey(name)
  if (!key) return []
  return rows.filter((r) => r.referee && refereeKey(r.referee) === key)
}

/**
 * Totals over a set of rows.
 *
 * Card figures are computed only over rows whose season actually carried card
 * columns. A 1990s match counts towards `matches` and not towards the card
 * rate, because treating a missing column as zero cards would quietly drag
 * every average down.
 */
export function totals(rows: MatchRow[]): RefereeTotals {
  const withCards = rows.filter((r) => r.yellows !== null && r.reds !== null)
  const yellows = withCards.reduce((n, r) => n + (r.yellows ?? 0), 0)
  const reds = withCards.reduce((n, r) => n + (r.reds ?? 0), 0)

  return {
    matches: rows.length,
    seasons: [...new Set(rows.map((r) => r.season))].sort(),
    matchesWithCards: withCards.length,
    yellows: withCards.length ? yellows : null,
    reds: withCards.length ? reds : null,
    cardsPerGame: withCards.length
      ? Math.round(((yellows + reds) / withCards.length) * 10) / 10
      : null,
    cardSeasons: [...new Set(withCards.map((r) => r.season))].sort(),
  }
}

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

/**
 * A club's record in matches refereed by an official.
 *
 * `csvName` is this source's name for the club — `Man City`, `Nott'm Forest` —
 * which is neither our slug nor FPL's name. `csvClubName()` maps them, and the
 * map lives here because it is this source's vocabulary, not ours.
 *
 * Rows with no result column are excluded rather than counted as anything.
 */
export function clubRecord(
  rows: MatchRow[],
  csvName: string
): { record: ClubRecord; seasons: string[] } | null {
  const played = rows.filter(
    (r) => r.result && (r.homeTeam === csvName || r.awayTeam === csvName)
  )
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

  return {
    record: { won, drawn, lost, matches: played.length },
    seasons: [...new Set(played.map((r) => r.season))].sort(),
  }
}

// ---------------------------------------------------------------------------
// Fetching — cached, staggered, one failure never fails the rest
// ---------------------------------------------------------------------------

export interface SeasonSkip {
  season: string
  reason: string
}

export interface ArchiveLoad {
  seasons: SeasonLoad[]
  skipped: SeasonSkip[]
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** The cache key for a season file. */
function seasonCacheKey(code: string): string {
  return `footballdataco:${code}:${DIVISION}`
}

/** True when this season is already in memory and will cost no request. */
export function isSeasonCached(season: string): boolean {
  const code = seasonCode(season)
  return code ? cacheGet<string>(seasonCacheKey(code)) !== undefined : false
}

/**
 * One season's results file.
 *
 * Returns a reason rather than a bare null so the backfill can report *why* a
 * season is missing instead of silently narrowing its own coverage.
 */
export async function fetchSeason(
  season: string
): Promise<{ load: SeasonLoad } | { skip: string }> {
  const code = seasonCode(season)
  if (!code) return { skip: 'unparseable season label' }

  const text = await fetchJson<string>(`${BASE}/${code}/${DIVISION}.csv`, {
    ttlMs: season === CURRENT_SEASON ? CURRENT_SEASON_TTL : COMPLETED_SEASON_TTL,
    key: seasonCacheKey(code),
    parse: 'text',
  })

  // fetchJson has already logged the status or transport error.
  if (text === null) return { skip: 'unreachable, non-2xx, or timed out' }
  if (!text.trim()) return { skip: 'empty file' }

  const load = parseSeasonCsv(text, season)
  if (!load.rows.length) return { skip: 'no parseable rows — header shape not recognised' }
  return { load }
}

/**
 * Fetch many seasons politely.
 *
 * `MAX_CONCURRENT` in flight, `REQUEST_SPACING_MS` between starts. A season
 * that fails is recorded and skipped; the backfill continues. A season already
 * in memory costs neither a request nor the delay, so the warm path — which is
 * every snapshot after the first — runs at memory speed.
 */
export async function fetchSeasons(seasons: string[]): Promise<ArchiveLoad> {
  const out: ArchiveLoad = { seasons: [], skipped: [] }
  const queue = [...seasons]

  const worker = async () => {
    for (;;) {
      const season = queue.shift()
      if (!season) return
      // Politeness is owed for a request, not for a memory read. Without this
      // the warm path pays the full stagger on every call — 1.5s added to a
      // snapshot that needed no network at all.
      const wasCached = isSeasonCached(season)
      try {
        const result = await fetchSeason(season)
        if ('skip' in result) {
          console.error(`[football-data.co.uk] skipped ${season}: ${result.skip}`)
          out.skipped.push({ season, reason: result.skip })
        } else {
          out.seasons.push(result.load)
        }
      } catch (err) {
        const reason = err instanceof Error ? err.message : 'unknown error'
        console.error(`[football-data.co.uk] skipped ${season}: ${reason}`)
        out.skipped.push({ season, reason })
      }
      if (!wasCached) await sleep(REQUEST_SPACING_MS)
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(MAX_CONCURRENT, seasons.length) }, worker)
  )

  out.seasons.sort((a, b) => a.season.localeCompare(b.season))
  out.skipped.sort((a, b) => a.season.localeCompare(b.season))
  return out
}

/** The whole archive. */
export async function fetchArchive(): Promise<ArchiveLoad> {
  return fetchSeasons(archiveSeasons())
}

/** Every row across a load, flattened. */
export function allRows(load: ArchiveLoad): MatchRow[] {
  return load.seasons.flatMap((s) => s.rows)
}

// ---------------------------------------------------------------------------
// Composed reads
// ---------------------------------------------------------------------------

export interface RefereeScope {
  matches: Provenanced<number> | null
  yellows: Provenanced<number> | null
  reds: Provenanced<number> | null
  cards_per_game: Provenanced<number> | null
}

export interface RefereeStats {
  name: string
  season: RefereeScope
  career: RefereeScope
  club_record: Provenanced<ClubRecord> | null
}

/**
 * Re-state a figure's coverage period to the seasons that actually produced it.
 *
 * The static definition carries the intended span; this narrows it to the truth
 * for one read. It touches only the copy `attach()` returns — the definition
 * itself is never mutated, and no metric is published that has no definition.
 */
function withCoverage<T>(
  p: Provenanced<T> | null,
  seasons: string[]
): Provenanced<T> | null {
  if (!p) return null
  const period = coveragePeriod(seasons)
  if (!period) return null
  return { ...p, provenance: { ...p.provenance, coverage_period: period } }
}

/**
 * §7.5 statistics for one official, optionally against one club.
 *
 * Every figure goes through `attach()`, so a metric with no definition is
 * dropped here rather than rendered, and then through `withCoverage()`, so the
 * period it claims is the period it has. Null everywhere is a complete answer:
 * the block does not render.
 */
export async function getRefereeStats(
  name: string,
  clubCsvName?: string | null,
  now: number = Date.now()
): Promise<RefereeStats | null> {
  if (!name?.trim()) return null

  const archive = await fetchArchive()
  const rows = allRows(archive)
  if (!rows.length) return null

  const mine = refereeMatches(rows, name)
  if (!mine.length) return null

  const refreshed = new Date(now).toISOString()
  const seasonRows = mine.filter((r) => r.season === CURRENT_SEASON)
  const s = totals(seasonRows)
  const c = totals(mine)
  const record = clubCsvName ? clubRecord(mine, clubCsvName) : null

  const scope = (t: RefereeTotals, suffix: 'season' | 'career'): RefereeScope => ({
    matches: withCoverage(
      attach(`referee.matches.${suffix}`, t.matches || null, refreshed),
      t.seasons
    ),
    yellows: withCoverage(
      attach(`referee.yellow_cards.${suffix}`, t.yellows, refreshed),
      t.cardSeasons
    ),
    reds: withCoverage(
      attach(`referee.red_cards.${suffix}`, t.reds, refreshed),
      t.cardSeasons
    ),
    cards_per_game: withCoverage(
      attach(`referee.cards_per_game.${suffix}`, t.cardsPerGame, refreshed),
      t.cardSeasons
    ),
  })

  return {
    name,
    season: scope(s, 'season'),
    career: scope(c, 'career'),
    club_record: withCoverage(
      attach('referee.club_record.career', record?.record ?? null, refreshed),
      record?.seasons ?? []
    ),
  }
}

/** Every referee name the archive carries. */
export async function knownRefereeNames(): Promise<string[]> {
  const rows = allRows(await fetchArchive())
  return [...new Set(rows.map((r) => r.referee).filter(Boolean))].sort()
}

// ---------------------------------------------------------------------------
// Backfill report
// ---------------------------------------------------------------------------

export interface BackfillReport {
  seasonsRequested: number
  seasonsFetched: string[]
  seasonsSkipped: SeasonSkip[]
  /** Fetched, but carrying no Referee column — no referee metric can use them. */
  seasonsWithoutReferee: string[]
  seasonsWithoutCards: string[]
  totalMatches: number
  matchesWithReferee: number
  matchesWithCards: number
  distinctOfficials: number
  earliestDate: string | null
  latestDate: string | null
  refereeCoverage: string | null
  cardCoverage: string | null
}

/** What the backfill actually got. Run it, do not assume it. */
export async function backfillReport(): Promise<BackfillReport> {
  const requested = archiveSeasons()
  const archive = await fetchSeasons(requested)
  const rows = allRows(archive)

  const withReferee = rows.filter((r) => r.referee)
  const withCards = rows.filter((r) => r.yellows !== null)
  const dates = rows.map((r) => r.iso).filter((d): d is string => Boolean(d)).sort()

  return {
    seasonsRequested: requested.length,
    seasonsFetched: archive.seasons.map((s) => s.season),
    seasonsSkipped: archive.skipped,
    seasonsWithoutReferee: archive.seasons.filter((s) => !s.columns.referee).map((s) => s.season),
    seasonsWithoutCards: archive.seasons.filter((s) => !s.columns.cards).map((s) => s.season),
    totalMatches: rows.length,
    matchesWithReferee: withReferee.length,
    matchesWithCards: withCards.length,
    distinctOfficials: new Set(
      withReferee.map((r) => refereeKey(r.referee)).filter(Boolean)
    ).size,
    earliestDate: dates[0] ?? null,
    latestDate: dates[dates.length - 1] ?? null,
    refereeCoverage: coveragePeriod([...new Set(withReferee.map((r) => r.season))]),
    cardCoverage: coveragePeriod([...new Set(withCards.map((r) => r.season))]),
  }
}
