/**
 * pulselive source adapter — match detail.
 *
 * This is the Premier League's own match API, the one premierleague.com runs
 * on. No key, no auth; it only requires an `Origin` header. Feeds PAGE_SPEC
 * blocks 2 and 5: the POST match block (§7.1–3) and the referee (§7.5).
 *
 * ON xG — pulselive publishes 200 per-match stats and expected goals is not
 * one of them (enumerated live, 25 Aug 2026). There is no free pulselive xG to
 * read. So xG is *injected* here rather than fetched: the caller derives it
 * from FPL player-level `expected_goals` (see `fpl.sumMatchXg`) and passes it
 * in. That keeps this module free of a dependency on the FPL module, and keeps
 * both independently testable.
 *
 * Same structure as the FPL adapter: fetchers are impure, cached and return
 * null on failure; transforms are pure.
 */

import { fetchJson } from './cache'

const API = 'https://footballapi.pulselive.com/football'

/**
 * The only thing standing between this endpoint and a 403. It is not a key and
 * it is not authentication — the API simply requires the header its own site
 * sends.
 */
const HEADERS = {
  Origin: 'https://www.premierleague.com',
  Referer: 'https://www.premierleague.com/',
}

/** The Premier League competition id. */
const PREMIER_LEAGUE = 1

/** Fixture lists move on results. */
const FIXTURES_TTL = 10 * 60 * 1000

/** A completed match never changes again. Hold it hard. */
const COMPLETED_MATCH_TTL = 24 * 60 * 60 * 1000

/** An upcoming match does change — officials get appointed 2–5 days out. */
const UPCOMING_MATCH_TTL = 30 * 60 * 1000

// ---------------------------------------------------------------------------
// Upstream types
// ---------------------------------------------------------------------------

export interface PulseTeamEntry {
  team: { id: number; name: string; shortName: string; altIds?: { opta?: string } }
  score?: number
}

export interface PulseClock {
  secs: number
  label: string
}

export interface PulseGoal {
  personId: number
  assistId?: number
  clock: PulseClock
  phase: string
  type: string
  description: string
}

export interface PulseEvent {
  type: string
  clock?: PulseClock
  personId?: number | null
  teamId?: number | null
  description?: string | null
}

export interface PulseOfficial {
  matchOfficialId: number
  /** Only the main referee carries `role: 'MAIN'`. Assistants have no role. */
  role?: string
  name: { display: string; first: string; last: string }
  id: number
}

export interface PulsePlayer {
  id: number
  name: { display: string; first: string; last: string }
  matchPosition?: string
}

export interface PulseTeamList {
  teamId: number
  lineup: PulsePlayer[]
  substitutes: PulsePlayer[]
}

export interface PulseFixture {
  id: number
  kickoff: { millis?: number; label?: string }
  teams: PulseTeamEntry[]
  ground?: { name: string; city: string }
  status: string
  outcome?: string
  attendance?: number
  goals?: PulseGoal[] | null
}

export interface PulseMatchDetail extends PulseFixture {
  matchOfficials?: PulseOfficial[]
  teamLists?: PulseTeamList[]
  events?: PulseEvent[]
}

interface PulsePage<T> {
  content: T[]
}

// ---------------------------------------------------------------------------
// Domain types
// ---------------------------------------------------------------------------

export interface Scorer {
  player: string
  /** Shirt-clock minute as the PL renders it, e.g. "12" or "45+2". */
  minute: string
  assist: string | null
  /** pulselive team id, so the caller can split home from away. */
  teamId: number | null
  /** Own goals and penalties are marked rather than silently listed as goals. */
  kind: 'GOAL' | 'PENALTY' | 'OWN_GOAL'
}

export interface RedCard {
  player: string
  minute: string
  teamId: number | null
}

export interface MatchSide {
  id: number
  name: string
  score: number | null
}

export interface MatchXg {
  home: number
  away: number
}

export interface LastMatch {
  matchId: number
  kickoff: string | null
  venue: string | null
  home: MatchSide
  away: MatchSide
  /** Null when no xG was supplied — the block renders without the line. */
  xg: MatchXg | null
  scorers: Scorer[]
  redCards: RedCard[]
  attendance: number | null
  officials: Official[]
  referee: string | null
}

export interface Official {
  name: string
  role: string | null
}

// ---------------------------------------------------------------------------
// Fetchers
// ---------------------------------------------------------------------------

/**
 * Fixtures for a club, newest first.
 *
 * `teamId` is the *pulselive* team id, which is not the FPL team id. FPL
 * publishes the mapping as `teams[].pulse_id`.
 *
 * Status codes: `C` completed, `U` upcoming, `L` live.
 */
export async function fetchTeamFixtures(
  pulseTeamId: number,
  statuses: string,
  pageSize = 5
): Promise<PulseFixture[] | null> {
  const url =
    `${API}/fixtures?comps=${PREMIER_LEAGUE}&teams=${pulseTeamId}` +
    `&pageSize=${pageSize}&sort=${statuses === 'C' ? 'desc' : 'asc'}&statuses=${statuses}`
  const page = await fetchJson<PulsePage<PulseFixture>>(url, {
    ttlMs: FIXTURES_TTL,
    headers: HEADERS,
  })
  return page?.content ?? null
}

/** Full match detail — team lists, officials, events, attendance. */
export function fetchMatch(
  matchId: number,
  completed = true
): Promise<PulseMatchDetail | null> {
  return fetchJson<PulseMatchDetail>(`${API}/fixtures/${matchId}`, {
    ttlMs: completed ? COMPLETED_MATCH_TTL : UPCOMING_MATCH_TTL,
    headers: HEADERS,
  })
}

// ---------------------------------------------------------------------------
// Transforms — pure
// ---------------------------------------------------------------------------

/**
 * personId → display name, from both starting XI and bench.
 *
 * Goals and cards reference players by id only; names live in `teamLists`.
 */
export function playerNames(detail: PulseMatchDetail): Map<number, string> {
  const names = new Map<number, string>()
  for (const list of detail.teamLists ?? []) {
    for (const p of [...(list.lineup ?? []), ...(list.substitutes ?? [])]) {
      if (p?.id != null && p.name?.display) names.set(p.id, p.name.display)
    }
  }
  return names
}

/** personId → pulselive team id, so a goal can be attributed to a side. */
export function playerTeams(detail: PulseMatchDetail): Map<number, number> {
  const teams = new Map<number, number>()
  for (const list of detail.teamLists ?? []) {
    for (const p of [...(list.lineup ?? []), ...(list.substitutes ?? [])]) {
      if (p?.id != null) teams.set(p.id, list.teamId)
    }
  }
  return teams
}

/** "12'00" → "12", "45+2'00" → "45+2". */
export function minuteLabel(clock?: PulseClock): string {
  const raw = clock?.label ?? ''
  const trimmed = raw.split("'")[0]
  if (trimmed) return trimmed
  return clock?.secs != null ? String(Math.floor(clock.secs / 60)) : ''
}

/** The main referee. Assistants and the fourth official carry no role. */
export function mainReferee(detail: PulseMatchDetail): string | null {
  const main = (detail.matchOfficials ?? []).find((o) => o.role === 'MAIN')
  return main?.name?.display ?? null
}

/** All officials, main first. */
export function officials(detail: PulseMatchDetail): Official[] {
  return (detail.matchOfficials ?? [])
    .filter((o) => o?.name?.display)
    .map((o) => ({ name: o.name.display, role: o.role ?? null }))
    .sort((a, b) => (a.role === 'MAIN' ? -1 : b.role === 'MAIN' ? 1 : 0))
}

/**
 * §7.2 — scorers with minute and assister.
 *
 * Goals come off the fixture list rather than match detail: the detail payload
 * returns `goals: null` and carries the same goals inside `events`, but only
 * the fixture-list form has `assistId`. Names are resolved from detail.
 */
export function parseScorers(
  fixture: PulseFixture,
  detail: PulseMatchDetail | null
): Scorer[] {
  const names = detail ? playerNames(detail) : new Map<number, string>()
  const teams = detail ? playerTeams(detail) : new Map<number, number>()

  return (fixture.goals ?? []).map((g) => {
    const kind: Scorer['kind'] =
      g.type === 'O' || g.description === 'O'
        ? 'OWN_GOAL'
        : g.type === 'P' || g.description === 'P'
          ? 'PENALTY'
          : 'GOAL'
    return {
      player: names.get(g.personId) ?? `#${g.personId}`,
      minute: minuteLabel(g.clock),
      assist: g.assistId != null ? (names.get(g.assistId) ?? null) : null,
      teamId: teams.get(g.personId) ?? null,
      kind,
    }
  })
}

/**
 * §7.2 — red cards. A dismissal is a booking event whose description is `R`
 * (straight red) or a second yellow.
 */
export function parseRedCards(detail: PulseMatchDetail): RedCard[] {
  const names = playerNames(detail)
  return (detail.events ?? [])
    .filter((e) => e.type === 'B' && /^(R|RC|Y2C?)$/i.test(e.description ?? ''))
    .map((e) => ({
      player: e.personId != null ? (names.get(e.personId) ?? `#${e.personId}`) : 'Unknown',
      minute: minuteLabel(e.clock),
      teamId: e.teamId ?? null,
    }))
}

/** Home side is always `teams[0]`, away `teams[1]`. */
export function sides(fixture: PulseFixture): { home: MatchSide; away: MatchSide } | null {
  const [h, a] = fixture.teams ?? []
  if (!h?.team || !a?.team) return null
  return {
    home: { id: h.team.id, name: h.team.name, score: h.score ?? null },
    away: { id: a.team.id, name: a.team.name, score: a.score ?? null },
  }
}

/**
 * §7.2 POST — the last match block.
 *
 * `xg` is supplied by the caller; see the note at the top of this file.
 */
export function buildLastMatch(
  fixture: PulseFixture,
  detail: PulseMatchDetail | null,
  xg: MatchXg | null = null
): LastMatch | null {
  const s = sides(fixture)
  if (!s) return null

  return {
    matchId: fixture.id,
    kickoff: fixture.kickoff?.millis
      ? new Date(fixture.kickoff.millis).toISOString()
      : null,
    venue: fixture.ground?.name ?? null,
    home: s.home,
    away: s.away,
    xg,
    scorers: parseScorers(fixture, detail),
    redCards: detail ? parseRedCards(detail) : [],
    attendance: fixture.attendance ?? detail?.attendance ?? null,
    officials: detail ? officials(detail) : [],
    referee: detail ? mainReferee(detail) : null,
  }
}

// ---------------------------------------------------------------------------
// Composed reads
// ---------------------------------------------------------------------------

/**
 * The club's most recent completed match, fully detailed.
 *
 * Pass `xg` from `fpl.getMatchXg` to populate the xG line; omit it and the
 * block renders without one rather than not at all.
 */
export async function getLastMatch(
  pulseTeamId: number,
  xg: MatchXg | null = null
): Promise<LastMatch | null> {
  const fixtures = await fetchTeamFixtures(pulseTeamId, 'C', 1)
  const fixture = fixtures?.[0]
  if (!fixture) return null
  const detail = await fetchMatch(fixture.id, true)
  return buildLastMatch(fixture, detail, xg)
}

/** The club's next scheduled match, if one is on the calendar. */
export async function getNextMatch(pulseTeamId: number): Promise<PulseMatchDetail | null> {
  const fixtures = await fetchTeamFixtures(pulseTeamId, 'U', 1)
  const fixture = fixtures?.[0]
  if (!fixture) return null
  return fetchMatch(fixture.id, false)
}

/**
 * §7.5 — the referee for the upcoming match.
 *
 * Null before the appointment, which typically lands 2–5 days out. The block's
 * empty state is a non-render, so null is a complete answer.
 */
export async function getUpcomingReferee(pulseTeamId: number): Promise<string | null> {
  const next = await getNextMatch(pulseTeamId)
  return next ? mainReferee(next) : null
}
