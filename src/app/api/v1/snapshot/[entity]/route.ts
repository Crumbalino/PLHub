/**
 * GET /api/v1/snapshot/{entity} — the PAGE_SPEC §14 API contract.
 *
 * §1: the page is a client of this route, not a database consumer. The website
 * is client one; React Native is client two. Nothing here reads Supabase.
 *
 * Scope of this build (§17 step 1): the engine and the API *shape*, sourced
 * from the three adapters in `src/lib/sources` — FPL, pulselive and Reddit.
 * Tottenham only. Every key in §14 is present; the ones behind clustering
 * (`big_story`, `developing`, `around_the_league`) are empty by design, as are
 * the ones behind a source this build does not own:
 *
 *   table, numbers      football-data.org — needs a key, block 7/10
 *   confirmed           ingest pipeline, block 11
 *   worth_your_time     YouTube API + the creator whitelist, block 15
 *   signoff.line        human, daily, block 17
 *
 * §14: any key that is absent or empty does not render, so an empty key here
 * is a complete and honest answer rather than a placeholder.
 *
 * §15: this route never 500s. Every source failure degrades to a null or an
 * empty key and the rest of the payload still ships.
 */

import { NextRequest, NextResponse } from 'next/server'
import { CLUBS_BY_SLUG } from '@/lib/clubs'
import * as footballdata from '@/lib/sources/footballdata'
import * as fpl from '@/lib/sources/fpl'
import * as pulselive from '@/lib/sources/pulselive'
import { getFanPulse } from '@/lib/sources/reddit'

export const dynamic = 'force-dynamic'

/** §17 step 5 — ship Tottenham. One real page, used for a week. */
const SUPPORTED = new Set(['tottenham'])

/** FPL only carries the Premier League. */
const COMPETITION = 'Premier League'

interface SnapshotMatch {
  phase: fpl.Phase
  opponent: fpl.ClubRef | null
  home: boolean | null
  kickoff: string | null
  competition: string
  venue: string | null
  /** §18 open question 1 — no free API carries UK rights. Manual or absent. */
  broadcaster: string | null
  difficulty: number | null
  score?: { home: number | null; away: number | null }
  minute?: number | null
  xg?: pulselive.MatchXg | null
  scorers?: pulselive.Scorer[]
  red_cards?: pulselive.RedCard[]
  attendance?: number | null
}

/**
 * The §14 match object for the current phase.
 *
 * §3 is the point of the block: the same slot leads with a different thing
 * depending on where in the week we are. On Sunday evening nobody wants next
 * Saturday's referee; on Friday nobody wants last week's xG.
 */
async function buildMatch(
  bootstrap: fpl.FplBootstrap,
  fixtures: fpl.FplFixture[],
  team: fpl.FplTeam,
  phase: fpl.Phase,
  now: number
): Promise<SnapshotMatch | null> {
  const fixture = fpl.fixtureForPhase(fixtures, team.id, phase, now)
  if (!fixture) return null

  const home = fixture.team_h === team.id
  const opponentId = home ? fixture.team_a : fixture.team_h
  const opponentTeam = bootstrap.teams.find((t) => t.id === opponentId) ?? null

  const base: SnapshotMatch = {
    phase,
    opponent: opponentTeam ? fpl.teamRef(opponentTeam) : null,
    home,
    kickoff: fixture.kickoff_time,
    competition: COMPETITION,
    venue: null,
    broadcaster: null,
    difficulty: home ? fixture.team_h_difficulty : fixture.team_a_difficulty,
  }

  if (phase === 'LIVE') {
    return {
      ...base,
      score: { home: fixture.team_h_score, away: fixture.team_a_score },
      minute: fixture.minutes ?? null,
    }
  }

  if (phase === 'POST') {
    // xG is not a pulselive field; it is summed from FPL player data and
    // injected. See the note at the top of sources/pulselive.ts.
    const xg = await fpl.getMatchXg(fixture)
    const last = await pulselive.getLastMatch(team.pulse_id, xg)
    return {
      ...base,
      venue: last?.venue ?? null,
      score: { home: fixture.team_h_score, away: fixture.team_a_score },
      xg: last?.xg ?? xg,
      scorers: last?.scorers ?? [],
      red_cards: last?.redCards ?? [],
      attendance: last?.attendance ?? null,
    }
  }

  // PRE and BREAK both lead with the next match; BREAK renders it reduced,
  // which is the client's call on the same payload.
  const next = await pulselive.getNextMatch(team.pulse_id)
  return { ...base, venue: next?.ground?.name ?? null }
}

/**
 * §7.9 — the cross-pollination block. Same engine, opponent entity, four
 * fields. `story` needs clustering, so it stays empty in this build.
 */
function buildNextOpponent(
  bootstrap: fpl.FplBootstrap,
  fixtures: fpl.FplFixture[],
  team: fpl.FplTeam,
  phase: fpl.Phase,
  now: number
) {
  // §7.9 empty state: BREAK does not render this block.
  if (phase === 'BREAK') return null

  const next = fpl.nextFixture(fixtures, team.id, now)
  if (!next) return null

  const opponentId = next.team_h === team.id ? next.team_a : next.team_h
  const opponent = bootstrap.teams.find((t) => t.id === opponentId)
  if (!opponent) return null

  const ref = fpl.teamRef(opponent)
  return {
    slug: ref.slug,
    name: ref.name,
    badge: ref.badge,
    form: fpl.deriveForm(fixtures, opponent.id, now),
    missing: fpl
      .buildAvailability(bootstrap, opponent.id, now)
      .filter((r) => r.status === 'OUT' || r.status === 'SUSPENDED')
      .slice(0, 3),
    story: null,
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { entity: string } }
) {
  const entity = (params.entity ?? '').toLowerCase()

  if (!SUPPORTED.has(entity)) {
    return NextResponse.json(
      {
        error: 'Unsupported entity',
        detail: `This build ships ${[...SUPPORTED].join(', ')} only (PAGE_SPEC §17 step 5).`,
      },
      { status: 404 }
    )
  }

  const club = CLUBS_BY_SLUG[entity]
  const now = Date.now()

  try {
    const [bootstrap, fixtures] = await Promise.all([
      fpl.fetchBootstrap(),
      fpl.fetchFixtures(),
    ])

    const team = bootstrap ? fpl.findTeam(bootstrap, entity) : null

    // §15 error(page): partial render of whatever resolved, never a 500. With
    // no FPL data there is no phase and no match, but the entity, the badge and
    // Fan Pulse still ship.
    const phase: fpl.Phase =
      bootstrap && fixtures && team ? fpl.detectPhase(fixtures, team.id, now) : 'BREAK'

    const played =
      fixtures && team ? fpl.fixturesPlayed(fixtures, team.id, now) : 0

    // The two football-data reads hit one endpoint; the adapter's cache and
    // single-flight collapse them into a single upstream request.
    const [match, fanPulse, table, tableNumbers] = await Promise.all([
      bootstrap && fixtures && team
        ? buildMatch(bootstrap, fixtures, team, phase, now)
        : Promise.resolve(null),
      club?.subreddit ? getFanPulse(club.subreddit) : Promise.resolve(null),
      footballdata.getTable(entity),
      footballdata.getNumbers(entity),
    ])

    // §7.10 — the standings row carries everything but expected goals, which
    // the FPL adapter derives. Absent either way, the key stays empty and the
    // block does not render.
    const xg = bootstrap && team ? fpl.seasonXg(bootstrap, team.id) : null
    const numbers = tableNumbers
      ? { ...tableNumbers, ...(xg ?? {}) }
      : xg
        ? { ...xg }
        : {}

    // §7.5 is PRE-only. The name is all this build can prove: card averages and
    // the club record need accumulated fixture history, and the one interesting
    // fact is hand-written per official. Until those exist the client should
    // treat a name-only referee as not renderable.
    const refereeName =
      phase === 'PRE' && team ? await pulselive.getUpcomingReferee(team.pulse_id) : null

    const payload = {
      entity: {
        slug: entity,
        name: club?.name ?? entity,
        badge: club?.badgeUrl ?? null,
        accent: club?.primaryColor ?? null,
      },
      updated_at: new Date(now).toISOString(),
      phase,
      match,
      availability:
        bootstrap && team ? fpl.buildAvailability(bootstrap, team.id, now) : [],
      referee: refereeName
        ? { name: refereeName, cards_per_game: null, club_record: null, fact: null }
        : null,
      key_data: bootstrap && team ? fpl.buildKeyData(bootstrap, team.id, played) : [],

      // §7.7 — three above, the club, three below. football-data.org.
      table: table ?? { rows: [], highlight: entity },
      form: fixtures && team ? fpl.deriveForm(fixtures, team.id, now) : [],
      next_opponent:
        bootstrap && fixtures && team
          ? buildNextOpponent(bootstrap, fixtures, team, phase, now)
          : null,
      numbers,

      // Ingest pipeline, block 11.
      confirmed: [],

      // §12 clustering. Empty by design — §17 step 1.
      big_story: null,
      developing: [],
      around_the_league: [],

      // YouTube API + the §7.15 creator whitelist, block 15.
      worth_your_time: [],

      fan_pulse: fanPulse,

      // §7.17 always renders, but the line is human and the counts come from
      // clustering. Shape only, for now.
      signoff: { line: null, stats: { stories: 0, moving: 0 } },
    }

    return NextResponse.json(payload, {
      headers: {
        // Adapters cache in-process; this lets the edge absorb a burst without
        // letting the payload go stale enough to matter.
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    })
  } catch (err) {
    // Should be unreachable — every adapter fails soft — but §15 says never a
    // 500, and "should be unreachable" is not a guarantee.
    console.error('[snapshot] Error:', err)
    return NextResponse.json(
      {
        entity: {
          slug: entity,
          name: club?.name ?? entity,
          badge: club?.badgeUrl ?? null,
          accent: club?.primaryColor ?? null,
        },
        updated_at: new Date(now).toISOString(),
        phase: 'BREAK',
        match: null,
        availability: [],
        referee: null,
        key_data: [],
        table: { rows: [], highlight: entity },
        form: [],
        next_opponent: null,
        numbers: {},
        confirmed: [],
        big_story: null,
        developing: [],
        around_the_league: [],
        worth_your_time: [],
        fan_pulse: null,
        signoff: { line: null, stats: { stories: 0, moving: 0 } },
      },
      { status: 200 }
    )
  }
}
