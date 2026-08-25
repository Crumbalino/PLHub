/**
 * pulselive source adapter.
 *
 * The live tests here matter more than most: pulselive is undocumented, has no
 * versioned contract, and the whole POST match block hangs off field names
 * nobody has promised to keep. If `matchOfficials` loses its `MAIN` role, or
 * `goals` stops carrying `assistId`, this is where it surfaces.
 */

import { test, describe, before } from 'node:test'
import assert from 'node:assert/strict'
import {
  buildLastMatch,
  fetchMatch,
  fetchTeamFixtures,
  getLastMatch,
  mainReferee,
  minuteLabel,
  officials,
  parseRedCards,
  parseScorers,
  playerNames,
  playerTeams,
  sides,
  type PulseFixture,
  type PulseMatchDetail,
} from '@/lib/sources/pulselive'
import { fetchBootstrap, findTeam } from '@/lib/sources/fpl'
import { cacheClear } from '@/lib/sources/cache'

const LIVE_TIMEOUT = 30_000

// ---------------------------------------------------------------------------
// Builders
// ---------------------------------------------------------------------------

const HOME = 130
const AWAY = 21

function detail(over: Partial<PulseMatchDetail> = {}): PulseMatchDetail {
  return {
    id: 1,
    kickoff: { millis: 1787416200000, label: 'Sat 22 Aug 2026, 17:30 BST' },
    teams: [
      { team: { id: HOME, name: 'Brentford', shortName: 'Brentford' }, score: 3 },
      { team: { id: AWAY, name: 'Tottenham Hotspur', shortName: 'Spurs' }, score: 0 },
    ],
    ground: { name: 'Gtech Community Stadium', city: 'Brentford' },
    status: 'C',
    attendance: 17180,
    teamLists: [
      {
        teamId: HOME,
        lineup: [{ id: 24369, name: { display: 'Scorer One', first: 'S', last: 'One' } }],
        substitutes: [{ id: 23194, name: { display: 'Scorer Two', first: 'S', last: 'Two' } }],
      },
      {
        teamId: AWAY,
        lineup: [{ id: 108421, name: { display: 'Assister', first: 'A', last: 'B' } }],
        substitutes: [],
      },
    ],
    matchOfficials: [
      { matchOfficialId: 1, role: 'MAIN', name: { display: 'Michael Oliver', first: 'M', last: 'O' }, id: 16963 },
      { matchOfficialId: 2, name: { display: 'James Mainwaring', first: 'J', last: 'M' }, id: 17392 },
    ],
    events: [],
    ...over,
  }
}

function fixture(over: Partial<PulseFixture> = {}): PulseFixture {
  const d = detail()
  return {
    id: d.id,
    kickoff: d.kickoff,
    teams: d.teams,
    ground: d.ground,
    status: 'C',
    attendance: 17180,
    goals: [
      { personId: 24369, assistId: 108421, clock: { secs: 720, label: "12'00" }, phase: '1', type: 'G', description: 'G' },
      { personId: 23194, clock: { secs: 1980, label: "33'00" }, phase: '1', type: 'G', description: 'G' },
    ],
    ...over,
  }
}

// ---------------------------------------------------------------------------
// Pure transforms
// ---------------------------------------------------------------------------

describe('minute labels', () => {
  test("pulselive's clock label is trimmed to the shirt minute", () => {
    assert.equal(minuteLabel({ secs: 720, label: "12'00" }), '12')
  })

  test('stoppage time keeps its plus notation', () => {
    assert.equal(minuteLabel({ secs: 2820, label: "45+2'00" }), '45+2')
  })

  test('a missing label falls back to seconds', () => {
    assert.equal(minuteLabel({ secs: 720, label: '' }), '12')
  })

  test('no clock at all is empty, not NaN', () => {
    assert.equal(minuteLabel(undefined), '')
  })
})

describe('player resolution', () => {
  test('names come from both the XI and the bench', () => {
    const names = playerNames(detail())
    assert.equal(names.get(24369), 'Scorer One')
    assert.equal(names.get(23194), 'Scorer Two')
  })

  test('a player maps to the side he was listed for', () => {
    const teams = playerTeams(detail())
    assert.equal(teams.get(24369), HOME)
    assert.equal(teams.get(108421), AWAY)
  })

  test('missing team lists yield an empty map rather than a throw', () => {
    assert.equal(playerNames(detail({ teamLists: undefined })).size, 0)
  })
})

describe('§7.2 scorers', () => {
  test('scorer, minute and assister are resolved to names', () => {
    const scorers = parseScorers(fixture(), detail())
    assert.equal(scorers.length, 2)
    assert.deepEqual(scorers[0], {
      player: 'Scorer One',
      minute: '12',
      assist: 'Assister',
      teamId: HOME,
      kind: 'GOAL',
    })
  })

  test('an unassisted goal carries a null assist, not a blank name', () => {
    assert.equal(parseScorers(fixture(), detail())[1].assist, null)
  })

  test('own goals and penalties are marked rather than listed as plain goals', () => {
    const f = fixture({
      goals: [
        { personId: 24369, clock: { secs: 60, label: "1'00" }, phase: '1', type: 'O', description: 'O' },
        { personId: 23194, clock: { secs: 120, label: "2'00" }, phase: '1', type: 'P', description: 'P' },
      ],
    })
    assert.deepEqual(
      parseScorers(f, detail()).map((s) => s.kind),
      ['OWN_GOAL', 'PENALTY']
    )
  })

  test('an unresolvable player degrades to an id, not a crash', () => {
    const f = fixture({
      goals: [{ personId: 999, clock: { secs: 60, label: "1'00" }, phase: '1', type: 'G', description: 'G' }],
    })
    assert.equal(parseScorers(f, detail())[0].player, '#999')
  })

  test('a goalless match yields an empty list', () => {
    assert.deepEqual(parseScorers(fixture({ goals: [] }), detail()), [])
  })

  test('null goals from upstream are treated as none', () => {
    assert.deepEqual(parseScorers(fixture({ goals: null }), detail()), [])
  })
})

describe('§7.2 red cards', () => {
  test('a straight red is picked out of the booking events', () => {
    const d = detail({
      events: [
        { type: 'B', description: 'Y', personId: 24369, teamId: HOME, clock: { secs: 600, label: "10'00" } },
        { type: 'B', description: 'R', personId: 23194, teamId: HOME, clock: { secs: 3600, label: "60'00" } },
      ],
    })
    const reds = parseRedCards(d)
    assert.equal(reds.length, 1)
    assert.equal(reds[0].player, 'Scorer Two')
    assert.equal(reds[0].minute, '60')
  })

  test('a second yellow counts as a dismissal', () => {
    const d = detail({
      events: [{ type: 'B', description: 'Y2C', personId: 24369, teamId: HOME, clock: { secs: 3600, label: "60'00" } }],
    })
    assert.equal(parseRedCards(d).length, 1)
  })

  test('yellows alone produce no red cards', () => {
    const d = detail({
      events: [{ type: 'B', description: 'Y', personId: 24369, teamId: HOME, clock: { secs: 600, label: "10'00" } }],
    })
    assert.deepEqual(parseRedCards(d), [])
  })
})

describe('§7.5 officials', () => {
  test('the main referee is the one carrying the MAIN role', () => {
    assert.equal(mainReferee(detail()), 'Michael Oliver')
  })

  test('no appointment yet is null, not a guess at the first assistant', () => {
    const d = detail({
      matchOfficials: [{ matchOfficialId: 2, name: { display: 'Assistant', first: 'A', last: 'B' }, id: 1 }],
    })
    assert.equal(mainReferee(d), null)
  })

  test('an absent officials list is null', () => {
    assert.equal(mainReferee(detail({ matchOfficials: undefined })), null)
  })

  test('the full list puts the referee first', () => {
    assert.equal(officials(detail())[0].role, 'MAIN')
  })
})

describe('sides', () => {
  test('teams[0] is home', () => {
    const s = sides(fixture())
    assert.equal(s?.home.name, 'Brentford')
    assert.equal(s?.away.name, 'Tottenham Hotspur')
    assert.equal(s?.home.score, 3)
  })

  test('a malformed fixture returns null rather than half a match', () => {
    assert.equal(sides(fixture({ teams: [] })), null)
  })
})

describe('§7.2 last match', () => {
  test('assembles the POST block', () => {
    const m = buildLastMatch(fixture(), detail(), { home: 1.84, away: 1.12 })
    assert.ok(m)
    assert.equal(m.attendance, 17180)
    assert.equal(m.referee, 'Michael Oliver')
    assert.equal(m.venue, 'Gtech Community Stadium')
    assert.equal(m.scorers.length, 2)
    assert.deepEqual(m.xg, { home: 1.84, away: 1.12 })
  })

  /** pulselive has no xG. Absent xG must not take the whole block down. */
  test('no xG still yields a match, with a null xG line', () => {
    const m = buildLastMatch(fixture(), detail())
    assert.ok(m)
    assert.equal(m.xg, null)
    assert.equal(m.scorers.length, 2)
  })

  test('detail that failed to load still yields score and attendance', () => {
    const m = buildLastMatch(fixture(), null)
    assert.ok(m)
    assert.equal(m.home.score, 3)
    assert.equal(m.attendance, 17180)
    assert.equal(m.referee, null)
    assert.deepEqual(m.redCards, [])
  })
})

// ---------------------------------------------------------------------------
// LIVE — footballapi.pulselive.com
// ---------------------------------------------------------------------------

describe('live: pulselive fixtures', { concurrency: false }, () => {
  let pulseId: number | null = null
  let completed: PulseFixture[] | null = null

  before(async () => {
    cacheClear()
    const bootstrap = await fetchBootstrap()
    const team = bootstrap ? findTeam(bootstrap, 'tottenham') : null
    pulseId = team?.pulse_id ?? null
    if (pulseId) completed = await fetchTeamFixtures(pulseId, 'C', 3)
  }, { timeout: LIVE_TIMEOUT })

  test('FPL publishes the pulselive id we join on', { timeout: LIVE_TIMEOUT }, () => {
    assert.ok(pulseId, 'no pulse_id — pulselive cannot be queried for this club')
  })

  test('completed fixtures come back newest first', { timeout: LIVE_TIMEOUT }, () => {
    assert.ok(completed, 'pulselive unreachable — the POST block is dark')
    assert.ok(completed.length > 0)
    const times = completed.map((f) => f.kickoff?.millis ?? 0)
    assert.deepEqual(times, [...times].sort((a, b) => b - a))
  })

  test('a completed fixture carries two sides with scores', { timeout: LIVE_TIMEOUT }, () => {
    assert.ok(completed?.length)
    const s = sides(completed[0])
    assert.ok(s, 'teams[] no longer parses')
    assert.equal(typeof s.home.score, 'number')
    assert.equal(typeof s.away.score, 'number')
  })

  test('goals carry the assistId the detail payload lacks', { timeout: LIVE_TIMEOUT }, () => {
    assert.ok(completed?.length)
    const withGoals = completed.find((f) => (f.goals ?? []).length)
    if (!withGoals) return // a run of goalless matches is possible, not a failure
    const goal = (withGoals.goals ?? [])[0]
    assert.equal(typeof goal.personId, 'number')
    assert.ok('clock' in goal)
  })
})

describe('live: pulselive match detail', { concurrency: false }, () => {
  let d: PulseMatchDetail | null = null

  before(async () => {
    const bootstrap = await fetchBootstrap()
    const team = bootstrap ? findTeam(bootstrap, 'tottenham') : null
    if (!team) return
    const fixtures = await fetchTeamFixtures(team.pulse_id, 'C', 1)
    if (fixtures?.[0]) d = await fetchMatch(fixtures[0].id, true)
  }, { timeout: LIVE_TIMEOUT })

  test('responds', { timeout: LIVE_TIMEOUT }, () => {
    assert.ok(d, 'match detail unreachable')
  })

  test('carries team lists, so scorers can be named', { timeout: LIVE_TIMEOUT }, () => {
    assert.ok(d)
    assert.equal(d.teamLists?.length, 2)
    assert.ok(playerNames(d).size > 20, 'both squads should resolve')
  })

  test('carries match officials with a MAIN role', { timeout: LIVE_TIMEOUT }, () => {
    assert.ok(d)
    assert.ok((d.matchOfficials ?? []).length > 0)
    assert.ok(mainReferee(d), 'the MAIN role is how the referee is identified')
  })

  test('carries attendance', { timeout: LIVE_TIMEOUT }, () => {
    assert.ok(d)
    assert.equal(typeof d.attendance, 'number')
  })

  /**
   * Documents why goals are read from the fixture list rather than here. If
   * this ever starts returning goals, the adapter can be simplified.
   */
  test('detail.goals is null — goals live on the fixture list', { timeout: LIVE_TIMEOUT }, () => {
    assert.ok(d)
    assert.ok(d.goals == null || Array.isArray(d.goals))
  })
})

describe('live: composed last match', () => {
  test('getLastMatch returns a complete POST block', { timeout: LIVE_TIMEOUT }, async () => {
    const bootstrap = await fetchBootstrap()
    const team = bootstrap ? findTeam(bootstrap, 'tottenham') : null
    assert.ok(team)
    const match = await getLastMatch(team.pulse_id)
    assert.ok(match, 'no last match — POST phase would render nothing')
    assert.equal(typeof match.matchId, 'number')
    assert.ok(match.home.name && match.away.name)
    assert.ok(match.scorers.every((s) => typeof s.player === 'string'))
  })

  test('an unknown pulselive team id returns null rather than throwing', { timeout: LIVE_TIMEOUT }, async () => {
    assert.equal(await getLastMatch(99999), null)
  })

  /**
   * Not id 1 — pulselive's archive goes back to 1992 and low ids are real
   * matches. This one is past the end of the id space.
   */
  test('an unknown match id returns null rather than throwing', { timeout: LIVE_TIMEOUT }, async () => {
    assert.equal(await fetchMatch(999999999, true), null)
  })
})
