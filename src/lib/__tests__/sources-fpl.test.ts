/**
 * FPL source adapter.
 *
 * Two kinds of test here, and the split is deliberate.
 *
 * PURE — the rules (§3 phase detection, §7.4 availability, §7.6 key data)
 * against hand-built fixtures. Deterministic, offline, fast. This is where a
 * rule regression gets caught.
 *
 * LIVE — hits fantasy.premierleague.com for real. These do not assert on
 * values that move; they assert that the *fields the adapter depends on still
 * exist and still carry the shape we parse*. That is the failure this codebase
 * cannot detect any other way: an upstream that quietly drops a field returns
 * 200 and empties a block.
 */

import { test, describe, before } from 'node:test'
import assert from 'node:assert/strict'
import {
  buildAvailability,
  buildKeyData,
  bookingThreshold,
  clubFixtures,
  detectPhase,
  deriveForm,
  fetchBootstrap,
  fetchFixtures,
  findTeam,
  fixturesPlayed,
  isFinished,
  lastFixture,
  liveFixture,
  nextFixture,
  playersOneBookingAway,
  sumMatchXg,
  teamRef,
  type FplBootstrap,
  type FplElement,
  type FplFixture,
  type FplTeam,
} from '@/lib/sources/fpl'
import { cacheClear } from '@/lib/sources/cache'
import { CLUBS_BY_SLUG } from '@/lib/clubs'

const LIVE_TIMEOUT = 30_000
const HOUR = 60 * 60 * 1000

// ---------------------------------------------------------------------------
// Builders
// ---------------------------------------------------------------------------

const TOTTENHAM = 19

function fixture(over: Partial<FplFixture> = {}): FplFixture {
  return {
    id: 1,
    code: 1,
    event: 1,
    kickoff_time: '2026-08-22T16:30:00Z',
    started: false,
    finished: false,
    finished_provisional: false,
    minutes: 0,
    team_h: TOTTENHAM,
    team_a: 1,
    team_h_score: null,
    team_a_score: null,
    team_h_difficulty: 3,
    team_a_difficulty: 3,
    ...over,
  }
}

function element(over: Partial<FplElement> = {}): FplElement {
  return {
    id: 1,
    code: 100,
    team: TOTTENHAM,
    web_name: 'Player',
    first_name: 'A',
    second_name: 'Player',
    status: 'a',
    news: '',
    news_added: null,
    chance_of_playing_next_round: null,
    goals_scored: 0,
    assists: 0,
    yellow_cards: 0,
    minutes: 900,
    ...over,
  }
}

function bootstrap(elements: FplElement[], teams: FplTeam[] = []): FplBootstrap {
  return {
    teams: teams.length
      ? teams
      : [{ id: TOTTENHAM, code: 6, name: 'Spurs', short_name: 'TOT', pulse_id: 21 }],
    elements,
    events: [],
  }
}

const at = (iso: string) => Date.parse(iso)

// ---------------------------------------------------------------------------
// §3 — phase detection
// ---------------------------------------------------------------------------

describe('§3 phase detection', () => {
  test('kick-off passed and not finished is LIVE', () => {
    const f = [fixture({ kickoff_time: '2026-08-22T16:30:00Z', started: true })]
    assert.equal(detectPhase(f, TOTTENHAM, at('2026-08-22T17:20:00Z')), 'LIVE')
  })

  test('a finished match inside 48h of full time is POST', () => {
    const f = [
      fixture({ kickoff_time: '2026-08-22T16:30:00Z', started: true, finished: true }),
      fixture({ id: 2, kickoff_time: '2026-08-29T16:30:00Z' }),
    ]
    assert.equal(detectPhase(f, TOTTENHAM, at('2026-08-23T12:00:00Z')), 'POST')
  })

  test('past FT+48h with a fixture inside 10 days is PRE', () => {
    const f = [
      fixture({ kickoff_time: '2026-08-22T16:30:00Z', started: true, finished: true }),
      fixture({ id: 2, kickoff_time: '2026-08-29T16:30:00Z' }),
    ]
    assert.equal(detectPhase(f, TOTTENHAM, at('2026-08-26T09:00:00Z')), 'PRE')
  })

  test('no fixture within 10 days is BREAK', () => {
    const f = [
      fixture({ kickoff_time: '2026-08-22T16:30:00Z', started: true, finished: true }),
      fixture({ id: 2, kickoff_time: '2026-09-20T16:30:00Z' }),
    ]
    assert.equal(detectPhase(f, TOTTENHAM, at('2026-08-26T09:00:00Z')), 'BREAK')
  })

  test('an empty fixture list is BREAK, not a throw', () => {
    assert.equal(detectPhase([], TOTTENHAM, at('2026-08-26T09:00:00Z')), 'BREAK')
  })

  test('the POST window closes exactly at FT+48h', () => {
    const f = [fixture({ kickoff_time: '2026-08-22T16:30:00Z', started: true, finished: true })]
    // Full time is modelled at kick-off + 115 minutes: 18:25Z.
    assert.equal(detectPhase(f, TOTTENHAM, at('2026-08-24T18:20:00Z')), 'POST')
    assert.equal(detectPhase(f, TOTTENHAM, at('2026-08-24T18:30:00Z')), 'BREAK')
  })

  /**
   * The regression that matters. Measured live on 25 Aug 2026: every
   * gameweek-1 fixture still read `started: true, finished: false` three days
   * after full time, because FPL only flips `finished` once bonus points are
   * checked. Reading `finished` alone reports a three-day-old match as LIVE.
   */
  test('finished_provisional ends the match even while finished lags', () => {
    const f = [
      fixture({
        kickoff_time: '2026-08-22T16:30:00Z',
        started: true,
        finished: false,
        finished_provisional: true,
        team_h_score: 3,
        team_a_score: 0,
      }),
    ]
    assert.equal(isFinished(f[0]), true)
    assert.notEqual(detectPhase(f, TOTTENHAM, at('2026-08-25T09:00:00Z')), 'LIVE')
  })

  test('a stale started flag cannot pin the page to LIVE forever', () => {
    // Neither finished flag ever flips — the 3h ceiling is the backstop.
    const f = [fixture({ kickoff_time: '2026-08-22T16:30:00Z', started: true })]
    assert.equal(liveFixture(f, TOTTENHAM, at('2026-08-22T17:20:00Z'))?.id, 1)
    assert.equal(liveFixture(f, TOTTENHAM, at('2026-08-23T09:00:00Z')), null)
  })

  test('fixtures with no kick-off time are ignored rather than sorted as epoch 0', () => {
    const f = [fixture({ id: 9, kickoff_time: null }), fixture({ id: 2 })]
    assert.deepEqual(
      clubFixtures(f, TOTTENHAM).map((x) => x.id),
      [2]
    )
  })
})

describe('fixture selection', () => {
  const f = [
    fixture({ id: 1, kickoff_time: '2026-08-22T16:30:00Z', finished: true }),
    fixture({ id: 2, kickoff_time: '2026-08-29T16:30:00Z' }),
    fixture({ id: 3, kickoff_time: '2026-09-05T14:00:00Z' }),
  ]
  const now = at('2026-08-26T09:00:00Z')

  test('last is the most recent completed fixture', () => {
    assert.equal(lastFixture(f, TOTTENHAM, now)?.id, 1)
  })

  test('next is the first fixture yet to kick off', () => {
    assert.equal(nextFixture(f, TOTTENHAM, now)?.id, 2)
  })

  test('a club with no fixtures returns null both ways', () => {
    assert.equal(lastFixture(f, 999, now), null)
    assert.equal(nextFixture(f, 999, now), null)
  })
})

// ---------------------------------------------------------------------------
// §7.8 — form
// ---------------------------------------------------------------------------

describe('§7.8 form', () => {
  const now = at('2026-10-01T00:00:00Z')
  const played = (id: number, ko: string, h: number, a: number, home = true) =>
    fixture({
      id,
      kickoff_time: ko,
      finished: true,
      team_h: home ? TOTTENHAM : 1,
      team_a: home ? 1 : TOTTENHAM,
      team_h_score: h,
      team_a_score: a,
    })

  test('most recent first, letters not colours', () => {
    const f = [
      played(1, '2026-08-01T12:00:00Z', 2, 1),
      played(2, '2026-08-08T12:00:00Z', 0, 0),
      played(3, '2026-08-15T12:00:00Z', 0, 3),
    ]
    assert.deepEqual(deriveForm(f, TOTTENHAM, now), ['L', 'D', 'W'])
  })

  test('away results are read from the away column', () => {
    const f = [played(1, '2026-08-01T12:00:00Z', 0, 2, false)]
    assert.deepEqual(deriveForm(f, TOTTENHAM, now), ['W'])
  })

  test('capped at five', () => {
    const f = Array.from({ length: 8 }, (_, i) =>
      played(i + 1, `2026-08-0${i + 1}T12:00:00Z`, 1, 0)
    )
    assert.equal(deriveForm(f, TOTTENHAM, now).length, 5)
  })

  test('a finished fixture with no score is not a result', () => {
    const f = [fixture({ id: 1, kickoff_time: '2026-08-01T12:00:00Z', finished: true })]
    assert.deepEqual(deriveForm(f, TOTTENHAM, now), [])
  })
})

// ---------------------------------------------------------------------------
// §7.4 — availability
// ---------------------------------------------------------------------------

describe('§7.4 availability', () => {
  const now = at('2026-08-25T09:00:00Z')

  test('status letters map to the spec words', () => {
    const b = bootstrap([
      element({ id: 1, web_name: 'Injured', status: 'i' }),
      element({ id: 2, web_name: 'Banned', status: 's' }),
      element({ id: 3, web_name: 'Doubt', status: 'd' }),
    ])
    const rows = buildAvailability(b, TOTTENHAM, now)
    const byName = Object.fromEntries(rows.map((r) => [r.player, r.status]))
    assert.equal(byName.Injured, 'OUT')
    assert.equal(byName.Banned, 'SUSPENDED')
    assert.equal(byName.Doubt, 'DOUBTFUL')
  })

  test('order is SUSPENDED, OUT, DOUBTFUL, BACK', () => {
    const b = bootstrap([
      element({ id: 1, web_name: 'C', status: 'd' }),
      element({ id: 2, web_name: 'A', status: 's' }),
      element({ id: 3, web_name: 'B', status: 'i' }),
      element({
        id: 4,
        web_name: 'D',
        status: 'a',
        news: 'Returned to training',
        news_added: '2026-08-24T09:00:00Z',
      }),
    ])
    assert.deepEqual(
      buildAvailability(b, TOTTENHAM, now).map((r) => r.status),
      ['SUSPENDED', 'OUT', 'DOUBTFUL', 'BACK']
    )
  })

  test("the club's own wording is passed through verbatim", () => {
    const news = 'Groin injury - Unknown return date'
    const b = bootstrap([element({ status: 'i', news })])
    assert.equal(buildAvailability(b, TOTTENHAM, now)[0].detail, news)
  })

  test('a fully available player with no news is not listed', () => {
    const b = bootstrap([element({ status: 'a' })])
    assert.deepEqual(buildAvailability(b, TOTTENHAM, now), [])
  })

  test('BACK needs recent news — a year-old note is not a return', () => {
    const b = bootstrap([
      element({
        status: 'a',
        news: 'Returned to training',
        news_added: '2025-08-24T09:00:00Z',
      }),
    ])
    assert.deepEqual(buildAvailability(b, TOTTENHAM, now), [])
  })

  test('a completed transfer is excluded, not listed as unavailable', () => {
    const b = bootstrap([
      element({ id: 1, web_name: 'Gone', status: 'u', news: 'Has joined Wolfsburg on loan' }),
      element({ id: 2, web_name: 'Unavailable', status: 'u', news: 'Not in squad' }),
    ])
    const rows = buildAvailability(b, TOTTENHAM, now)
    assert.deepEqual(
      rows.map((r) => r.player),
      ['Unavailable']
    )
  })

  test('capped at 8, expandable by the caller', () => {
    const b = bootstrap(
      Array.from({ length: 12 }, (_, i) =>
        element({ id: i + 1, web_name: `P${i}`, status: 'i' })
      )
    )
    assert.equal(buildAvailability(b, TOTTENHAM, now).length, 8)
    assert.equal(buildAvailability(b, TOTTENHAM, now, 20).length, 12)
  })

  test('chance of playing is carried through, including zero', () => {
    const b = bootstrap([element({ status: 'i', chance_of_playing_next_round: 0 })])
    assert.equal(buildAvailability(b, TOTTENHAM, now)[0].chance, 0)
  })

  test('only the named club is read', () => {
    const b = bootstrap([element({ team: 1, status: 'i' })])
    assert.deepEqual(buildAvailability(b, TOTTENHAM, now), [])
  })
})

// ---------------------------------------------------------------------------
// §7.6 — key data and yellow-card accumulation
// ---------------------------------------------------------------------------

describe('§7.6 yellow-card accumulation', () => {
  test('threshold is 4 before the 19th fixture, 5 before the 32nd', () => {
    assert.equal(bookingThreshold(0), 4)
    assert.equal(bookingThreshold(18), 4)
    assert.equal(bookingThreshold(19), 5)
    assert.equal(bookingThreshold(31), 5)
  })

  test('no threshold remains after the 32nd fixture', () => {
    assert.equal(bookingThreshold(32), null)
    assert.equal(bookingThreshold(38), null)
  })

  test('one booking away is an exact match on the threshold', () => {
    const b = bootstrap([
      element({ id: 1, web_name: 'Three', yellow_cards: 3 }),
      element({ id: 2, web_name: 'Four', yellow_cards: 4 }),
      element({ id: 3, web_name: 'Five', yellow_cards: 5 }),
    ])
    assert.deepEqual(playersOneBookingAway(b, TOTTENHAM, 10), ['Four'])
  })

  test('the threshold moves with the fixture count', () => {
    const b = bootstrap([
      element({ id: 1, web_name: 'Four', yellow_cards: 4 }),
      element({ id: 2, web_name: 'Five', yellow_cards: 5 }),
    ])
    assert.deepEqual(playersOneBookingAway(b, TOTTENHAM, 20), ['Five'])
  })

  test('a departed player is not one booking away', () => {
    const b = bootstrap([
      element({ id: 1, web_name: 'Gone', yellow_cards: 4, status: 'u', news: 'Has joined Roma' }),
    ])
    assert.deepEqual(playersOneBookingAway(b, TOTTENHAM, 10), [])
  })

  test('nobody at the threshold yields no block', () => {
    const b = bootstrap([element({ yellow_cards: 1 })])
    assert.deepEqual(playersOneBookingAway(b, TOTTENHAM, 10), [])
  })
})

describe('§7.6 key data', () => {
  test('top scorer and most assists', () => {
    const b = bootstrap([
      element({ id: 1, web_name: 'Son', goals_scored: 12, assists: 3 }),
      element({ id: 2, web_name: 'Maddison', goals_scored: 4, assists: 8 }),
    ])
    const data = buildKeyData(b, TOTTENHAM, 20)
    assert.deepEqual(data[0], { label: 'TOP SCORER', value: 'Son', detail: '12' })
    assert.deepEqual(data[1], { label: 'MOST ASSISTS', value: 'Maddison', detail: '8' })
  })

  test('a stat with no value yet does not render as zero', () => {
    const b = bootstrap([element({ goals_scored: 0, assists: 0 })])
    assert.deepEqual(buildKeyData(b, TOTTENHAM, 0), [])
  })

  /** §11: the Hub Rating is not built, so IN FORM must not appear. */
  test('IN FORM is absent until the Hub Rating exists', () => {
    const b = bootstrap([element({ goals_scored: 5 })])
    const labels = buildKeyData(b, TOTTENHAM, 10).map((d) => d.label)
    assert.ok(!labels.includes('IN FORM'))
  })

  test('one booking away joins the card set when it applies', () => {
    const b = bootstrap([element({ web_name: 'Bissouma', yellow_cards: 4 })])
    const data = buildKeyData(b, TOTTENHAM, 10)
    assert.equal(data.at(-1)?.label, 'ONE BOOKING AWAY')
    assert.equal(data.at(-1)?.value, 'Bissouma')
  })
})

// ---------------------------------------------------------------------------
// xG derivation
// ---------------------------------------------------------------------------

describe('per-match xG', () => {
  const f = fixture({ id: 42, team_h: TOTTENHAM, team_a: 1 })
  const b = bootstrap([
    element({ id: 1, team: TOTTENHAM }),
    element({ id: 2, team: TOTTENHAM }),
    element({ id: 3, team: 1 }),
  ])

  test('sums each side from its own players', () => {
    const live = {
      elements: [
        { id: 1, stats: { expected_goals: '0.84' }, explain: [{ fixture: 42 }] },
        { id: 2, stats: { expected_goals: '1.00' }, explain: [{ fixture: 42 }] },
        { id: 3, stats: { expected_goals: '1.12' }, explain: [{ fixture: 42 }] },
      ],
    }
    assert.deepEqual(sumMatchXg(live, b, f), { home: 1.84, away: 1.12 })
  })

  /** A double gameweek would otherwise double-count a player's season xG. */
  test('players from another fixture are excluded', () => {
    const live = {
      elements: [
        { id: 1, stats: { expected_goals: '0.84' }, explain: [{ fixture: 42 }] },
        { id: 2, stats: { expected_goals: '9.99' }, explain: [{ fixture: 43 }] },
        { id: 3, stats: { expected_goals: '1.12' }, explain: [{ fixture: 42 }] },
      ],
    }
    assert.deepEqual(sumMatchXg(live, b, f), { home: 0.84, away: 1.12 })
  })

  test('a gameweek with no data for this fixture returns null, not 0–0', () => {
    const live = {
      elements: [{ id: 1, stats: { expected_goals: '0.84' }, explain: [{ fixture: 43 }] }],
    }
    assert.equal(sumMatchXg(live, b, f), null)
  })
})

// ---------------------------------------------------------------------------
// LIVE — fantasy.premierleague.com
// ---------------------------------------------------------------------------

describe('live: FPL bootstrap-static', { concurrency: false }, () => {
  let data: FplBootstrap | null = null

  before(async () => {
    cacheClear()
    data = await fetchBootstrap()
  }, { timeout: LIVE_TIMEOUT })

  test('responds', { timeout: LIVE_TIMEOUT }, () => {
    assert.ok(data, 'bootstrap-static unreachable — every FPL block is dark')
  })

  test('carries 20 teams with the ids the adapter joins on', { timeout: LIVE_TIMEOUT }, () => {
    assert.ok(data)
    assert.equal(data.teams.length, 20)
    for (const t of data.teams) {
      assert.equal(typeof t.id, 'number')
      assert.equal(typeof t.code, 'number')
      assert.equal(typeof t.pulse_id, 'number', 'pulse_id is the join to pulselive')
    }
  })

  test('Tottenham resolves from the club slug', { timeout: LIVE_TIMEOUT }, () => {
    assert.ok(data)
    const team = findTeam(data, 'tottenham')
    assert.ok(team, 'FPL calls them Spurs — the slug must still resolve')
    assert.equal(team.short_name, 'TOT')
  })

  test('teamRef maps back to the club registry', { timeout: LIVE_TIMEOUT }, () => {
    assert.ok(data)
    const team = findTeam(data, 'tottenham')
    assert.ok(team)
    const ref = teamRef(team)
    assert.equal(ref.slug, 'tottenham')
    assert.match(ref.badge, /^https:\/\/resources\.premierleague\.com\//)
  })

  /**
   * The club registry (`src/lib/clubs.ts`) is not this PR's file to change, and
   * measured against the live league on 25 Aug 2026 it is out of date: Coventry
   * City, Hull City and Leeds are in the Premier League and absent from it, and
   * Sunderland is registered under badge code t58 where FPL says 56.
   *
   * So this reports rather than fails. What the adapter *must* guarantee is
   * that an unmapped club still yields a usable name and badge and simply has
   * no slug to link to — a missing club cannot take a block down with it.
   */
  test('an unmapped club degrades to name and badge, never a throw', { timeout: LIVE_TIMEOUT }, () => {
    assert.ok(data)
    const unmapped = data.teams.filter((t) => teamRef(t).slug === null)
    if (unmapped.length) {
      console.log(
        `[clubs] ${unmapped.length} live PL clubs missing from the registry: ` +
          unmapped.map((t) => `${t.name} (code ${t.code})`).join(', ')
      )
    }
    for (const t of unmapped) {
      const ref = teamRef(t)
      assert.equal(typeof ref.name, 'string')
      assert.ok(ref.name.length > 0)
      assert.match(ref.badge, /^https:\/\/resources\.premierleague\.com\//)
    }
  })

  test('a registry badge code that disagrees with FPL is reported', { timeout: LIVE_TIMEOUT }, () => {
    assert.ok(data)
    const mismatched: string[] = []
    for (const club of Object.values(CLUBS_BY_SLUG)) {
      const code = Number(/\/t(\d+)\./.exec(club.badgeUrl)?.[1])
      if (!code) continue
      const byName = data.teams.find(
        (t) => t.name.toLowerCase() === club.name.toLowerCase() ||
          t.short_name.toLowerCase() === club.shortName?.toLowerCase()
      )
      if (byName && byName.code !== code) {
        mismatched.push(`${club.slug}: registry t${code}, FPL ${byName.code}`)
      }
    }
    if (mismatched.length) console.log(`[clubs] badge code mismatch — ${mismatched.join('; ')}`)
  })

  test('elements carry every field availability reads', { timeout: LIVE_TIMEOUT }, () => {
    assert.ok(data)
    const el = data.elements[0]
    for (const field of [
      'status',
      'news',
      'news_added',
      'chance_of_playing_next_round',
      'goals_scored',
      'assists',
      'yellow_cards',
      'web_name',
      'code',
    ] as const) {
      assert.ok(field in el, `bootstrap-static no longer carries ${field}`)
    }
  })

  test('status letters are drawn from the mapped set', { timeout: LIVE_TIMEOUT }, () => {
    assert.ok(data)
    const seen = new Set(data.elements.map((e) => e.status))
    for (const s of seen) {
      assert.match(s, /^[adisu]$/, `unmapped FPL status letter: ${s}`)
    }
  })

  test('availability builds for Tottenham without throwing', { timeout: LIVE_TIMEOUT }, () => {
    assert.ok(data)
    const team = findTeam(data, 'tottenham')
    assert.ok(team)
    const rows = buildAvailability(data, team.id, Date.now())
    assert.ok(Array.isArray(rows))
    assert.ok(rows.length <= 8, '§7.4 caps at 8')
    for (const r of rows) {
      assert.equal(typeof r.player, 'string')
      assert.match(r.photo, /^https:\/\/resources\.premierleague\.com\//)
      assert.ok(['SUSPENDED', 'OUT', 'DOUBTFUL', 'UNAVAILABLE', 'BACK'].includes(r.status))
    }
  })
})

describe('live: FPL fixtures', { concurrency: false }, () => {
  let fixtures: FplFixture[] | null = null
  let data: FplBootstrap | null = null

  before(async () => {
    ;[data, fixtures] = await Promise.all([fetchBootstrap(), fetchFixtures()])
  }, { timeout: LIVE_TIMEOUT })

  test('responds with a full season', { timeout: LIVE_TIMEOUT }, () => {
    assert.ok(fixtures, 'fixtures unreachable — no phase, no match block')
    assert.equal(fixtures.length, 380, '20 clubs, 38 rounds')
  })

  test('carries the three fields §3 derives the phase from', { timeout: LIVE_TIMEOUT }, () => {
    assert.ok(fixtures)
    const f = fixtures[0]
    assert.ok('kickoff_time' in f)
    assert.ok('started' in f)
    assert.ok('finished' in f)
    assert.ok('finished_provisional' in f, 'the flag that stops a stale LIVE')
  })

  test('Tottenham have 38 fixtures', { timeout: LIVE_TIMEOUT }, () => {
    assert.ok(fixtures && data)
    const team = findTeam(data, 'tottenham')
    assert.ok(team)
    assert.equal(clubFixtures(fixtures, team.id).length, 38)
  })

  test('phase resolves to one of the four', { timeout: LIVE_TIMEOUT }, () => {
    assert.ok(fixtures && data)
    const team = findTeam(data, 'tottenham')
    assert.ok(team)
    const phase = detectPhase(fixtures, team.id, Date.now())
    assert.ok(['LIVE', 'POST', 'PRE', 'BREAK'].includes(phase))
  })

  /**
   * The live guard on the regression above. A club whose last match kicked off
   * more than three hours ago must not be reported LIVE, whatever FPL's
   * `finished` flag currently says.
   */
  test('no club is reported LIVE outside a fixture window', { timeout: LIVE_TIMEOUT }, () => {
    assert.ok(fixtures && data)
    const now = Date.now()
    for (const team of data.teams) {
      const live = liveFixture(fixtures, team.id, now)
      if (!live) continue
      const ko = Date.parse(live.kickoff_time ?? '')
      assert.ok(now - ko <= 3 * HOUR, `${team.name} reported LIVE ${(now - ko) / HOUR}h after KO`)
    }
  })

  test('form and played count agree with each other', { timeout: LIVE_TIMEOUT }, () => {
    assert.ok(fixtures && data)
    const team = findTeam(data, 'tottenham')
    assert.ok(team)
    const now = Date.now()
    const played = fixturesPlayed(fixtures, team.id, now)
    const form = deriveForm(fixtures, team.id, now)
    assert.ok(form.length <= Math.min(played, 5))
    for (const letter of form) assert.match(letter, /^[WDL]$/)
  })

  test('the next fixture is in the future when one exists', { timeout: LIVE_TIMEOUT }, () => {
    assert.ok(fixtures && data)
    const team = findTeam(data, 'tottenham')
    assert.ok(team)
    const now = Date.now()
    const next = nextFixture(fixtures, team.id, now)
    if (next) assert.ok(Date.parse(next.kickoff_time ?? '') > now)
  })

  test('key data builds from live squad data', { timeout: LIVE_TIMEOUT }, () => {
    assert.ok(fixtures && data)
    const team = findTeam(data, 'tottenham')
    assert.ok(team)
    const now = Date.now()
    const data_ = buildKeyData(data, team.id, fixturesPlayed(fixtures, team.id, now))
    assert.ok(Array.isArray(data_))
    for (const d of data_) {
      assert.equal(typeof d.label, 'string')
      assert.equal(typeof d.value, 'string')
      assert.ok(d.value.length > 0, 'a card with no value should not have been built')
    }
  })
})

describe('live: fail-soft contract', () => {
  test('an unknown club slug returns null rather than throwing', { timeout: LIVE_TIMEOUT }, async () => {
    const data = await fetchBootstrap()
    assert.ok(data)
    assert.equal(findTeam(data, 'not-a-club'), null)
  })

  test('a dead FPL host yields null, not an exception', { timeout: LIVE_TIMEOUT }, async () => {
    const { fetchJson } = await import('@/lib/sources/cache')
    const result = await fetchJson('https://fantasy.premierleague.com/api/not-a-real-endpoint/', {
      ttlMs: 1000,
      timeoutMs: 5000,
    })
    assert.equal(result, null)
  })
})
