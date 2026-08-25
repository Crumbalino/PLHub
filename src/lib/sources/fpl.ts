/**
 * FPL source adapter — `bootstrap-static` and `fixtures`.
 *
 * Feeds PAGE_SPEC blocks 1/3/4/6/8/9: the match block and its phase (§3),
 * availability (§7.4), key data (§7.6), form (§7.8) and the fixture list every
 * other block hangs off.
 *
 * No key, no quota, no auth. Two endpoints carry all of it.
 *
 * Structure: every export is either a *fetcher* (impure, cached, returns null
 * on any failure) or a *transform* (pure — data in, data out, `now` injected,
 * no clock and no network). The transforms are where the rules live, so the
 * rules are testable without a socket.
 */

import { CLUBS } from '@/lib/clubs'
import { fetchJson } from './cache'

const API = 'https://fantasy.premierleague.com/api'

/**
 * FPL 403s a bare fetch from some hosts. A plain identifying UA is enough;
 * this is a public read of a public endpoint at one request per TTL.
 */
const HEADERS = {
  'User-Agent': 'TheFootballHub/1.0 (+https://thefootballhub.uk)',
}

/** bootstrap-static is squad + status data. It moves when a club files news. */
const BOOTSTRAP_TTL = 15 * 60 * 1000

/** Fixtures move on kick-off, goals and full time. Short, but not a poll. */
const FIXTURES_TTL = 5 * 60 * 1000

/** Historic gameweek data is immutable once checked. Hold it. */
const LIVE_TTL = 10 * 60 * 1000

// ---------------------------------------------------------------------------
// Upstream types — only the fields we consume, named as FPL names them.
// ---------------------------------------------------------------------------

export interface FplTeam {
  id: number
  code: number
  name: string
  short_name: string
  pulse_id: number
}

export interface FplElement {
  id: number
  code: number
  team: number
  /** 1=GK, 2=DEF, 3=MID, 4=FWD. */
  element_type: number
  web_name: string
  first_name: string
  second_name: string
  /** a=available, d=doubtful, i=injured, s=suspended, u=unavailable. */
  status: string
  news: string
  news_added: string | null
  chance_of_playing_next_round: number | null
  goals_scored: number
  assists: number
  yellow_cards: number
  minutes: number
  /** Season expected goals, as a decimal string. */
  expected_goals: string
  /** Expected goals conceded by this player's team while he was on the pitch. */
  expected_goals_conceded: string
}

export interface FplEvent {
  id: number
  is_current: boolean
  is_next: boolean
  is_previous: boolean
  finished: boolean
}

export interface FplBootstrap {
  teams: FplTeam[]
  elements: FplElement[]
  events: FplEvent[]
}

export interface FplFixture {
  id: number
  code: number
  event: number | null
  kickoff_time: string | null
  started: boolean | null
  finished: boolean
  /**
   * True at full time. `finished` only flips once FPL has checked bonus points,
   * which can lag by days — see `isFinished`.
   */
  finished_provisional: boolean
  minutes: number
  team_h: number
  team_a: number
  team_h_score: number | null
  team_a_score: number | null
  team_h_difficulty: number
  team_a_difficulty: number
}

export interface FplLiveElement {
  id: number
  stats: { expected_goals: string }
  explain: Array<{ fixture: number }>
}

export interface FplEventLive {
  elements: FplLiveElement[]
}

// ---------------------------------------------------------------------------
// Domain types
// ---------------------------------------------------------------------------

/** PAGE_SPEC §3. */
export type Phase = 'LIVE' | 'POST' | 'PRE' | 'BREAK'

/** PAGE_SPEC §7.4. */
export type AvailabilityStatus = 'SUSPENDED' | 'OUT' | 'DOUBTFUL' | 'UNAVAILABLE' | 'BACK'

export interface AvailabilityRow {
  player: string
  photo: string
  status: AvailabilityStatus
  /** The club's own wording, verbatim. Never rewritten — §7.4. */
  detail: string
  chance: number | null
}

export interface KeyDatum {
  label: string
  value: string
  detail: string
}

export interface ClubRef {
  slug: string | null
  name: string
  badge: string
}

export type FormLetter = 'W' | 'D' | 'L'

// ---------------------------------------------------------------------------
// Constants that encode a rule
// ---------------------------------------------------------------------------

/**
 * Nominal match length used to place full time: 45 + 45 + ~15 stoppage + HT.
 *
 * FPL publishes `kickoff_time` but no full-time timestamp, and §3 measures the
 * POST window from full time. 115 minutes is the honest approximation; the
 * error is minutes at the edge of a 48h window.
 */
const MATCH_DURATION_MS = 115 * 60 * 1000

/** §3: POST runs from full time to FT+48h. */
const POST_WINDOW_MS = 48 * 60 * 60 * 1000

/** §3: BREAK is no fixture within 10 days. */
const BREAK_HORIZON_MS = 10 * 24 * 60 * 60 * 1000

/** FPL `element_type` for a goalkeeper. See `seasonXg`. */
const GOALKEEPER = 1

/**
 * Upper bound on how long a fixture may be considered LIVE.
 *
 * Needed because `finished` is not a full-time signal: it flips when FPL checks
 * bonus points, which lags. Measured live on 25 Aug 2026, every gameweek-1
 * fixture still read `started: true, finished: false` three days after full
 * time. `isFinished` handles that via `finished_provisional`, and this is the
 * backstop for the case where both flags lag.
 */
const LIVE_CEILING_MS = 3 * 60 * 60 * 1000

/**
 * §7.4 status letter → display word.
 * `u` is UNAVAILABLE, but a completed transfer is excluded entirely rather
 * than listed as unavailable — the player is not injured, he is gone.
 */
const STATUS_WORD: Record<string, AvailabilityStatus> = {
  s: 'SUSPENDED',
  i: 'OUT',
  d: 'DOUBTFUL',
  u: 'UNAVAILABLE',
}

/** §7.4 display order. */
const STATUS_ORDER: AvailabilityStatus[] = [
  'SUSPENDED',
  'OUT',
  'DOUBTFUL',
  'UNAVAILABLE',
  'BACK',
]

/** How fresh `news_added` must be for an available player to read as BACK. */
const BACK_WINDOW_MS = 7 * 24 * 60 * 60 * 1000

/** Departure wording FPL uses in `news` for a completed transfer (§7.4, §7.11). */
const TRANSFER_NEWS = /\bhas (joined|left|signed for)\b|\bon loan (to|at)\b|\btransferred to\b/i

/**
 * §7.6 "one booking away": four yellows before the 19th fixture, five before
 * the 32nd.
 *
 * NOTE FOR REVIEW — this is the spec's wording implemented literally. The
 * Premier League's actual disciplinary thresholds are 5 yellows before match 19
 * (one-match ban) and 10 before match 32 (two-match ban), which would make
 * "one booking away" 4 and 9 rather than 4 and 5. The spec is canonical here so
 * it is what ships; if the 9 is intended, this table is the only edit.
 */
export const BOOKING_THRESHOLDS: Array<{ beforeFixture: number; yellows: number }> = [
  { beforeFixture: 19, yellows: 4 },
  { beforeFixture: 32, yellows: 5 },
]

/** Official player headshot, §10 step 3. */
const PHOTO = (code: number) =>
  `https://resources.premierleague.com/premierleague/photos/players/250x250/p${code}.png`

/** Official club badge, §10 step 4. */
const BADGE = (code: number) =>
  `https://resources.premierleague.com/premierleague/badges/t${code}.png`

/**
 * FPL team code → club slug, derived from the existing club registry by the
 * badge code already encoded in each `badgeUrl`. Built once, read-only.
 */
const SLUG_BY_TEAM_CODE: Record<number, string> = (() => {
  const map: Record<number, string> = {}
  for (const club of CLUBS) {
    const code = /\/t(\d+)\.(?:png|svg)$/.exec(club.badgeUrl)?.[1]
    if (code) map[Number(code)] = club.slug
  }
  return map
})()

// ---------------------------------------------------------------------------
// Fetchers — impure, cached, null on failure
// ---------------------------------------------------------------------------

export function fetchBootstrap(): Promise<FplBootstrap | null> {
  return fetchJson<FplBootstrap>(`${API}/bootstrap-static/`, {
    ttlMs: BOOTSTRAP_TTL,
    headers: HEADERS,
  })
}

export function fetchFixtures(): Promise<FplFixture[] | null> {
  return fetchJson<FplFixture[]>(`${API}/fixtures/`, {
    ttlMs: FIXTURES_TTL,
    headers: HEADERS,
  })
}

export function fetchEventLive(gameweek: number): Promise<FplEventLive | null> {
  return fetchJson<FplEventLive>(`${API}/event/${gameweek}/live/`, {
    ttlMs: LIVE_TTL,
    headers: HEADERS,
  })
}

// ---------------------------------------------------------------------------
// Transforms — pure
// ---------------------------------------------------------------------------

/** Resolve a club slug to its FPL team. Tolerates FPL's short names ("Spurs"). */
export function findTeam(bootstrap: FplBootstrap, slug: string): FplTeam | null {
  const byCode = bootstrap.teams.find((t) => SLUG_BY_TEAM_CODE[t.code] === slug)
  if (byCode) return byCode
  const norm = slug.replace(/-/g, ' ').toLowerCase()
  return (
    bootstrap.teams.find(
      (t) => t.name.toLowerCase() === norm || t.short_name.toLowerCase() === slug.toLowerCase()
    ) ?? null
  )
}

/** An FPL team as the §14 club reference shape. */
export function teamRef(team: FplTeam): ClubRef {
  const slug = SLUG_BY_TEAM_CODE[team.code] ?? null
  const club = slug ? CLUBS.find((c) => c.slug === slug) : undefined
  return {
    slug,
    name: club?.name ?? team.name,
    badge: club?.badgeUrl ?? BADGE(team.code),
  }
}

/**
 * Full time has been reached.
 *
 * `finished_provisional` flips at the whistle; `finished` waits for the bonus
 * point check and can lag by days. Either one means the match is over.
 */
export function isFinished(fixture: FplFixture): boolean {
  return Boolean(fixture.finished || fixture.finished_provisional)
}

/** Epoch ms of kick-off, or null for an unscheduled fixture. */
export function kickoffMs(fixture: FplFixture): number | null {
  if (!fixture.kickoff_time) return null
  const ms = Date.parse(fixture.kickoff_time)
  return Number.isNaN(ms) ? null : ms
}

/** Approximate full time — see MATCH_DURATION_MS. */
export function fullTimeMs(fixture: FplFixture): number | null {
  const ko = kickoffMs(fixture)
  return ko === null ? null : ko + MATCH_DURATION_MS
}

/** Every fixture involving a team, chronological, unscheduled ones dropped. */
export function clubFixtures(fixtures: FplFixture[], teamId: number): FplFixture[] {
  return fixtures
    .filter((f) => (f.team_h === teamId || f.team_a === teamId) && f.kickoff_time)
    .sort((a, b) => (kickoffMs(a) ?? 0) - (kickoffMs(b) ?? 0))
}

/** The fixture currently in progress, if any. */
export function liveFixture(
  fixtures: FplFixture[],
  teamId: number,
  now: number
): FplFixture | null {
  return (
    clubFixtures(fixtures, teamId).find((f) => {
      const ko = kickoffMs(f)
      if (ko === null || ko > now) return false
      if (isFinished(f)) return false
      return now - ko <= LIVE_CEILING_MS
    }) ?? null
  )
}

/** Most recent completed fixture. */
export function lastFixture(
  fixtures: FplFixture[],
  teamId: number,
  now: number
): FplFixture | null {
  const played = clubFixtures(fixtures, teamId).filter(
    (f) => isFinished(f) && (kickoffMs(f) ?? Infinity) <= now
  )
  return played.length ? played[played.length - 1] : null
}

/** Next fixture yet to kick off. */
export function nextFixture(
  fixtures: FplFixture[],
  teamId: number,
  now: number
): FplFixture | null {
  return (
    clubFixtures(fixtures, teamId).find(
      (f) => !isFinished(f) && (kickoffMs(f) ?? 0) > now
    ) ?? null
  )
}

/**
 * PAGE_SPEC §3 — phase detection. Pure date maths over the fixture list.
 *
 * LIVE  kick-off passed, match not finished
 * POST  full time to FT+48h
 * PRE   FT+48h to next kick-off
 * BREAK no fixture within 10 days
 */
export function detectPhase(fixtures: FplFixture[], teamId: number, now: number): Phase {
  if (liveFixture(fixtures, teamId, now)) return 'LIVE'

  const last = lastFixture(fixtures, teamId, now)
  if (last) {
    const ft = fullTimeMs(last)
    if (ft !== null && now >= ft && now < ft + POST_WINDOW_MS) return 'POST'
  }

  const next = nextFixture(fixtures, teamId, now)
  if (!next) return 'BREAK'

  const ko = kickoffMs(next)
  if (ko === null || ko - now > BREAK_HORIZON_MS) return 'BREAK'
  return 'PRE'
}

/** The fixture the match block should lead with for a phase. */
export function fixtureForPhase(
  fixtures: FplFixture[],
  teamId: number,
  phase: Phase,
  now: number
): FplFixture | null {
  if (phase === 'LIVE') return liveFixture(fixtures, teamId, now)
  if (phase === 'POST') return lastFixture(fixtures, teamId, now)
  return nextFixture(fixtures, teamId, now)
}

/**
 * PAGE_SPEC §7.8 — last five results, most recent first.
 * Letters, never colour alone; the caller renders the letter.
 */
export function deriveForm(
  fixtures: FplFixture[],
  teamId: number,
  now: number,
  limit = 5
): FormLetter[] {
  return clubFixtures(fixtures, teamId)
    .filter(
      (f) =>
        isFinished(f) &&
        (kickoffMs(f) ?? Infinity) <= now &&
        f.team_h_score !== null &&
        f.team_a_score !== null
    )
    .slice(-limit)
    .reverse()
    .map((f) => {
      const home = f.team_h === teamId
      const scored = (home ? f.team_h_score : f.team_a_score) as number
      const conceded = (home ? f.team_a_score : f.team_h_score) as number
      if (scored > conceded) return 'W'
      if (scored < conceded) return 'L'
      return 'D'
    })
}

/** Completed fixtures played, used by the booking-threshold table. */
export function fixturesPlayed(fixtures: FplFixture[], teamId: number, now: number): number {
  return clubFixtures(fixtures, teamId).filter(
    (f) => isFinished(f) && (kickoffMs(f) ?? Infinity) <= now
  ).length
}

/** Squad members of a team. */
export function squad(bootstrap: FplBootstrap, teamId: number): FplElement[] {
  return bootstrap.elements.filter((e) => e.team === teamId)
}

/** A completed transfer, which §7.4 excludes from availability. */
export function isDeparted(element: FplElement): boolean {
  return element.status === 'u' && TRANSFER_NEWS.test(element.news ?? '')
}

/**
 * PAGE_SPEC §7.4 — availability.
 *
 * `news` is the club's own wording and is passed through verbatim. Do not
 * rewrite it here or anywhere downstream.
 */
export function buildAvailability(
  bootstrap: FplBootstrap,
  teamId: number,
  now: number,
  cap = 8
): AvailabilityRow[] {
  const rows: AvailabilityRow[] = []

  for (const el of squad(bootstrap, teamId)) {
    let status: AvailabilityStatus | null = STATUS_WORD[el.status] ?? null

    if (el.status === 'u' && isDeparted(el)) continue

    if (!status && el.status === 'a') {
      // Available, but recently newsworthy — returned to training. §7.4 BACK.
      const added = el.news_added ? Date.parse(el.news_added) : NaN
      const fresh = !Number.isNaN(added) && now - added <= BACK_WINDOW_MS
      if (fresh && (el.news ?? '').trim()) status = 'BACK'
    }

    if (!status) continue

    rows.push({
      player: el.web_name,
      photo: PHOTO(el.code),
      status,
      detail: (el.news ?? '').trim(),
      chance: el.chance_of_playing_next_round,
    })
  }

  rows.sort((a, b) => {
    const byStatus = STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status)
    return byStatus !== 0 ? byStatus : a.player.localeCompare(b.player)
  })

  return rows.slice(0, cap)
}

/**
 * §7.6 — the yellow-card count that puts a player one booking from a ban,
 * given how many league fixtures the club has played. Null once no threshold
 * remains in the season.
 */
export function bookingThreshold(played: number): number | null {
  for (const t of BOOKING_THRESHOLDS) {
    if (played < t.beforeFixture) return t.yellows
  }
  return null
}

/**
 * §7.6 "one booking away" — the distinctive one. Pure calculation over free
 * data that nobody else surfaces.
 */
export function playersOneBookingAway(
  bootstrap: FplBootstrap,
  teamId: number,
  played: number
): string[] {
  const threshold = bookingThreshold(played)
  if (threshold === null) return []
  return squad(bootstrap, teamId)
    .filter((e) => e.yellow_cards === threshold && !isDeparted(e))
    .sort((a, b) => a.web_name.localeCompare(b.web_name))
    .map((e) => e.web_name)
}

/**
 * PAGE_SPEC §7.6 — key data. Four compact cards, no tables.
 *
 * IN FORM is deliberately absent: it renders the Hub Rating, and §11 says the
 * block does not render until the rating is built. Never ship a placeholder.
 *
 * A stat with no value yet (nobody has scored) is omitted rather than shown as
 * zero — §22 of the layout rules, nothing renders that the data cannot feed.
 */
export function buildKeyData(
  bootstrap: FplBootstrap,
  teamId: number,
  played: number
): KeyDatum[] {
  const players = squad(bootstrap, teamId).filter((e) => !isDeparted(e))
  const data: KeyDatum[] = []

  const best = (pick: (e: FplElement) => number): FplElement | null => {
    const ranked = [...players].sort((a, b) => pick(b) - pick(a))
    const top = ranked[0]
    return top && pick(top) > 0 ? top : null
  }

  const scorer = best((e) => e.goals_scored)
  if (scorer) {
    data.push({
      label: 'TOP SCORER',
      value: scorer.web_name,
      detail: String(scorer.goals_scored),
    })
  }

  const assister = best((e) => e.assists)
  if (assister) {
    data.push({
      label: 'MOST ASSISTS',
      value: assister.web_name,
      detail: String(assister.assists),
    })
  }

  const booking = playersOneBookingAway(bootstrap, teamId, played)
  if (booking.length) {
    data.push({
      label: 'ONE BOOKING AWAY',
      value: booking.join(', '),
      detail: `${bookingThreshold(played)} yellows`,
    })
  }

  return data
}

/**
 * Per-match expected goals for both sides, summed from each club's players.
 *
 * pulselive publishes 200 match stats and expected goals is not among them
 * (verified live, 25 Aug 2026), so the only free per-match xG is FPL's own
 * player-level `expected_goals` for the gameweek. Summing a club's players
 * gives the team figure.
 *
 * `explain[].fixture` is checked so a double gameweek attributes each player's
 * xG to the right match rather than double-counting.
 */
export function sumMatchXg(
  live: FplEventLive,
  bootstrap: FplBootstrap,
  fixture: FplFixture
): { home: number; away: number } | null {
  const teamOf = new Map(bootstrap.elements.map((e) => [e.id, e.team]))
  let home = 0
  let away = 0
  let seen = false

  for (const el of live.elements) {
    if (!el.explain?.some((x) => x.fixture === fixture.id)) continue
    const team = teamOf.get(el.id)
    if (team !== fixture.team_h && team !== fixture.team_a) continue
    const xg = Number.parseFloat(el.stats?.expected_goals ?? '0')
    if (Number.isNaN(xg)) continue
    seen = true
    if (team === fixture.team_h) home += xg
    else away += xg
  }

  if (!seen) return null
  return { home: Math.round(home * 100) / 100, away: Math.round(away * 100) / 100 }
}

/**
 * Season expected goals for and against a club, for PAGE_SPEC §7.10.
 *
 * BOTH SIDES COME OUT OF ONE `bootstrap-static` READ, and the two halves are
 * not equally exact. Worth knowing which is which before trusting a figure.
 *
 * **xG for is exact.** Every chance belongs to exactly one player, so summing
 * the squad's `expected_goals` reconstructs the team total precisely. Checked
 * against the per-fixture figures `sumMatchXg` derives from the gameweek-live
 * endpoint on 25 Aug 2026: Tottenham 0.57 and Brentford 3.91 both agreed to the
 * penny.
 *
 * **xG against is an approximation, roughly 1% low.** `expected_goals_conceded`
 * is per player and accrues while he is on the pitch, so summing a whole squad
 * multiplies it — 42.59 for a club that had conceded 3.91. Goalkeepers are the
 * usable subset: exactly one is on the pitch at a time, so their sum tracks the
 * team. Same measurement: 3.87 against a true 3.91, and 0.57 against a true
 * 0.57. The gap is stoppage-time chances falling outside the recorded minutes,
 * and it undercounts slightly. An outfield player who goes in goal after a red
 * card is missed entirely.
 *
 * The exact alternative is summing `sumMatchXg` over every played fixture,
 * which costs one gameweek-live request per matchday — up to 38 on a cold
 * cache, for a block §7.10 calls the slowest-moving on the page and puts below
 * the fold. Not worth 38 requests. If §7.10 ever moves somewhere prominent,
 * that is the upgrade path.
 */
export function seasonXg(
  bootstrap: FplBootstrap,
  teamId: number
): { xg_for: number; xg_against: number } | null {
  const players = squad(bootstrap, teamId)
  if (!players.length) return null

  const round = (n: number) => Math.round(n * 100) / 100
  const sum = (list: FplElement[], pick: (e: FplElement) => string) =>
    list.reduce((total, e) => {
      const value = Number.parseFloat(pick(e) ?? '0')
      return Number.isNaN(value) ? total : total + value
    }, 0)

  const keepers = players.filter((e) => e.element_type === GOALKEEPER)

  return {
    xg_for: round(sum(players, (e) => e.expected_goals)),
    xg_against: round(sum(keepers, (e) => e.expected_goals_conceded)),
  }
}

// ---------------------------------------------------------------------------
// Composed reads — fetch + transform, null on any failure
// ---------------------------------------------------------------------------

/** Every fixture for a club slug, chronological. */
export async function getClubFixtures(slug: string): Promise<FplFixture[] | null> {
  const [bootstrap, fixtures] = await Promise.all([fetchBootstrap(), fetchFixtures()])
  if (!bootstrap || !fixtures) return null
  const team = findTeam(bootstrap, slug)
  if (!team) return null
  return clubFixtures(fixtures, team.id)
}

/** §3 phase for a club slug. */
export async function getPhase(slug: string, now = Date.now()): Promise<Phase | null> {
  const [bootstrap, fixtures] = await Promise.all([fetchBootstrap(), fetchFixtures()])
  if (!bootstrap || !fixtures) return null
  const team = findTeam(bootstrap, slug)
  if (!team) return null
  return detectPhase(fixtures, team.id, now)
}

/** §7.4 availability for a club slug. */
export async function getAvailability(
  slug: string,
  now = Date.now()
): Promise<AvailabilityRow[] | null> {
  const bootstrap = await fetchBootstrap()
  if (!bootstrap) return null
  const team = findTeam(bootstrap, slug)
  if (!team) return null
  return buildAvailability(bootstrap, team.id, now)
}

/** §7.6 key data for a club slug. */
export async function getKeyData(slug: string, now = Date.now()): Promise<KeyDatum[] | null> {
  const [bootstrap, fixtures] = await Promise.all([fetchBootstrap(), fetchFixtures()])
  if (!bootstrap || !fixtures) return null
  const team = findTeam(bootstrap, slug)
  if (!team) return null
  return buildKeyData(bootstrap, team.id, fixturesPlayed(fixtures, team.id, now))
}

/** §7.8 form for a club slug. */
export async function getForm(slug: string, now = Date.now()): Promise<FormLetter[] | null> {
  const [bootstrap, fixtures] = await Promise.all([fetchBootstrap(), fetchFixtures()])
  if (!bootstrap || !fixtures) return null
  const team = findTeam(bootstrap, slug)
  if (!team) return null
  return deriveForm(fixtures, team.id, now)
}

/** Per-match xG for a completed fixture. Null when the gameweek has no data. */
export async function getMatchXg(
  fixture: FplFixture
): Promise<{ home: number; away: number } | null> {
  if (fixture.event === null) return null
  const [bootstrap, live] = await Promise.all([fetchBootstrap(), fetchEventLive(fixture.event)])
  if (!bootstrap || !live) return null
  return sumMatchXg(live, bootstrap, fixture)
}
