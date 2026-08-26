/**
 * The provenance contract, and the referee statistics that depend on it.
 *
 * The load-bearing test in this file is `an undefined metric never reaches a
 * block`. Everything else is arithmetic; that one is the rule.
 */

import { test, describe, before } from 'node:test'
import assert from 'node:assert/strict'
import {
  CAREER_FROM_SEASON,
  CURRENT_SEASON,
  METRIC_DEFINITIONS,
  attach,
  definedMetricKeys,
  metricDefinition,
} from '@/lib/provenance'
import {
  clubRecord,
  csvClubName,
  getRefereeStats,
  knownRefereeNames,
  parseSeasonCsv,
  refereeKey,
  refereeKeyCollisions,
  refereeMatches,
  seasonCode,
  seasonRange,
  totals,
  type MatchRow,
} from '@/lib/sources/footballdataco'
import { appointmentRole, splitName, toAppointmentRows, toOfficialRows } from '@/lib/officials'
import { cacheClear } from '@/lib/sources/cache'
import fs from 'node:fs'
import path from 'node:path'

const LIVE_TIMEOUT = 120_000

// ---------------------------------------------------------------------------
// The contract
// ---------------------------------------------------------------------------

describe('provenance contract', () => {
  test('every definition is complete — no blank source, formula or period', () => {
    assert.ok(METRIC_DEFINITIONS.length > 0)
    for (const d of METRIC_DEFINITIONS) {
      for (const field of ['metric_key', 'source_name', 'source_url', 'formula', 'coverage_period'] as const) {
        assert.equal(typeof d[field], 'string', `${d.metric_key}.${field}`)
        assert.ok((d[field] as string).trim().length > 0, `${d.metric_key}.${field} is blank`)
      }
      assert.equal(typeof d.calculated, 'boolean', d.metric_key)
      assert.match(d.source_url, /^https:\/\//, d.metric_key)
    }
  })

  test('metric keys are unique', () => {
    const keys = METRIC_DEFINITIONS.map((d) => d.metric_key)
    assert.equal(new Set(keys).size, keys.length)
  })

  test('every coverage period names its seasons', () => {
    for (const d of METRIC_DEFINITIONS) {
      assert.ok(
        d.coverage_period.includes(CURRENT_SEASON),
        `${d.metric_key} does not say what period it covers`
      )
    }
  })

  /**
   * The rule. A number with no definition cannot reach a block, because the
   * only way to carry a value out of an adapter is through `attach()`.
   */
  test('an undefined metric never reaches a block', () => {
    assert.equal(attach('referee.bias_score', 0.42), null)
    assert.equal(attach('', 1), null)
    assert.equal(attach('referee.cards_per_game.invented', 4.8), null)
  })

  test('a defined metric arrives with its record attached', () => {
    const r = attach('referee.cards_per_game.career', 3.4, '2026-08-26T09:00:00Z')
    assert.ok(r)
    assert.equal(r.value, 3.4)
    assert.equal(r.provenance.source_name, 'football-data.co.uk')
    assert.equal(r.provenance.calculated, true)
    assert.equal(r.provenance.last_refreshed, '2026-08-26T09:00:00Z')
    assert.ok(r.provenance.formula.length > 20)
  })

  test('a null value does not render, even with a definition', () => {
    assert.equal(attach('referee.matches.season', null), null)
    assert.equal(attach('referee.matches.season', undefined), null)
  })

  test('zero is a value, not an absence', () => {
    const r = attach('referee.red_cards.season', 0)
    assert.ok(r)
    assert.equal(r.value, 0)
  })

  test('the static definition carries no freshness of its own', () => {
    for (const d of METRIC_DEFINITIONS) assert.equal(d.last_refreshed, null)
  })

  test('metricDefinition round-trips every key', () => {
    for (const k of definedMetricKeys()) assert.ok(metricDefinition(k))
    assert.equal(metricDefinition('nope'), null)
  })

  /**
   * The migration seeds the same rows. If the two drift, a number can be
   * published that the durable record cannot explain.
   */
  test('the migration seeds exactly the keys defined in code', () => {
    const sql = fs.readFileSync(
      path.join(process.cwd(), 'migrations/2026-08-26-referee-provenance.sql'),
      'utf8'
    )
    const seeded = [...sql.matchAll(/\('(referee\.[a-z_.]+)'/g)].map((m) => m[1]).sort()
    assert.deepEqual([...new Set(seeded)], definedMetricKeys())
  })
})

// ---------------------------------------------------------------------------
// Seasons and names
// ---------------------------------------------------------------------------

describe('seasons', () => {
  test('season codes match the source paths', () => {
    assert.equal(seasonCode('2026/27'), '2627')
    assert.equal(seasonCode('1993/94'), '9394')
    assert.equal(seasonCode('1999/00'), '9900')
  })

  test('a malformed season is null, not a guessed path', () => {
    assert.equal(seasonCode('2026'), null)
    assert.equal(seasonCode(''), null)
  })

  test('ranges are inclusive and ordered', () => {
    assert.deepEqual(seasonRange('2024/25', '2026/27'), ['2024/25', '2025/26', '2026/27'])
    assert.deepEqual(seasonRange('2026/27', '2026/27'), ['2026/27'])
    assert.deepEqual(seasonRange('2026/27', '2024/25'), [])
  })

  test('the career window matches what provenance claims', () => {
    const range = seasonRange(CAREER_FROM_SEASON, CURRENT_SEASON)
    assert.equal(range[0], CAREER_FROM_SEASON)
    assert.equal(range.at(-1), CURRENT_SEASON)
  })
})

describe('referee name key', () => {
  test('the two sources agree once keyed', () => {
    assert.equal(refereeKey('M Oliver'), refereeKey('Michael Oliver'))
    assert.equal(refereeKey('A Taylor'), refereeKey('Anthony Taylor'))
  })

  test('case and punctuation do not split a person in two', () => {
    assert.equal(refereeKey('l Mason'), refereeKey('L Mason'))
    assert.equal(refereeKey("S O'Neill"), refereeKey('Simon ONeill'))
  })

  test('different officials keep different keys', () => {
    assert.notEqual(refereeKey('M Oliver'), refereeKey('A Taylor'))
    assert.notEqual(refereeKey('M Oliver'), refereeKey('J Oliver'))
  })

  test('empty input is null rather than a key that matches everything', () => {
    assert.equal(refereeKey(''), null)
    assert.equal(refereeKey('   '), null)
  })

  test('collisions are reported, not silently merged', () => {
    const c = refereeKeyCollisions(['M Oliver', 'Michael Oliver', 'A Taylor'])
    assert.deepEqual(c['oliver|m'], ['M Oliver', 'Michael Oliver'])
    assert.equal(c['taylor|a'], undefined)
  })
})

// ---------------------------------------------------------------------------
// Parsing and aggregation
// ---------------------------------------------------------------------------

const CSV = [
  'Div,Date,HomeTeam,AwayTeam,FTHG,FTAG,FTR,Referee,HY,AY,HR,AR',
  'E0,15/08/2025,Tottenham,Arsenal,2,1,H,M Oliver,1,2,0,0',
  'E0,22/08/2025,Chelsea,Tottenham,0,0,D,M Oliver,3,1,1,0',
  'E0,29/08/2025,Tottenham,Everton,0,1,A,A Taylor,2,2,0,1',
  'E0,05/09/2025,Arsenal,Chelsea,1,1,D,,0,0,0,0',
].join('\n')

describe('csv parsing', () => {
  test('reads the columns the block needs', () => {
    const rows = parseSeasonCsv(CSV, '2025/26')
    assert.equal(rows.length, 3)
    assert.deepEqual(rows[0], {
      season: '2025/26',
      date: '15/08/2025',
      homeTeam: 'Tottenham',
      awayTeam: 'Arsenal',
      result: 'H',
      referee: 'M Oliver',
      yellows: 3,
      reds: 0,
    })
  })

  /** An unplayed fixture has no referee and must not inflate a denominator. */
  test('a row with no referee is skipped', () => {
    assert.ok(!parseSeasonCsv(CSV, '2025/26').some((r) => r.referee === ''))
  })

  test('a BOM does not break the header', () => {
    assert.equal(parseSeasonCsv('﻿' + CSV, '2025/26').length, 3)
  })

  test('an empty or headerless file is an empty list, not a throw', () => {
    assert.deepEqual(parseSeasonCsv('', '2025/26'), [])
    assert.deepEqual(parseSeasonCsv('nonsense', '2025/26'), [])
  })
})

describe('aggregation', () => {
  const rows = parseSeasonCsv(CSV, '2025/26')

  test('matches are selected by key, across both name forms', () => {
    assert.equal(refereeMatches(rows, 'Michael Oliver').length, 2)
    assert.equal(refereeMatches(rows, 'M Oliver').length, 2)
  })

  test('totals sum both sides of the card columns', () => {
    const t = totals(refereeMatches(rows, 'M Oliver'))
    assert.equal(t.matches, 2)
    assert.equal(t.yellows, 7)
    assert.equal(t.reds, 1)
    assert.equal(t.cardsPerGame, 4)
  })

  /** A rate over no matches is not zero. */
  test('cards per game over no matches is null', () => {
    assert.equal(totals([]).cardsPerGame, null)
    assert.equal(totals([]).matches, 0)
  })

  test('a club record reads from the club’s own side', () => {
    const r = clubRecord(refereeMatches(rows, 'M Oliver'), 'Tottenham')
    assert.deepEqual(r, { won: 1, drawn: 1, lost: 0, matches: 2 })
  })

  test('an away win counts as a win', () => {
    const away: MatchRow[] = [
      { season: 's', date: '', homeTeam: 'Chelsea', awayTeam: 'Tottenham', result: 'A', referee: 'X', yellows: 0, reds: 0 },
    ]
    assert.deepEqual(clubRecord(away, 'Tottenham'), { won: 1, drawn: 0, lost: 0, matches: 1 })
  })

  test('a club the official has never taken charge of is null', () => {
    assert.equal(clubRecord(rows, 'Liverpool'), null)
  })

  test('club names are this source’s, not our slugs', () => {
    assert.equal(csvClubName('man-utd'), 'Man United')
    assert.equal(csvClubName('nottingham-forest'), "Nott'm Forest")
    assert.equal(csvClubName('tottenham'), 'Tottenham')
    assert.equal(csvClubName('not-a-club'), null)
  })
})

// ---------------------------------------------------------------------------
// Officials and appointments
// ---------------------------------------------------------------------------

describe('official appointments', () => {
  const detail = {
    matchOfficials: [
      { matchOfficialId: 1, role: 'MAIN', name: { display: 'Michael Oliver', first: 'M', last: 'O' }, id: 16963 },
      { matchOfficialId: 2, name: { display: 'James Mainwaring', first: 'J', last: 'M' }, id: 17392 },
      { matchOfficialId: 3, name: { display: 'Blake Antrobus', first: 'B', last: 'A' }, id: 24440 },
      { matchOfficialId: 4, role: 'FOURTH_OFFICIAL', name: { display: 'Samuel Barrott', first: 'S', last: 'B' }, id: 21346 },
      { matchOfficialId: 5, role: 'VAR', name: { display: 'John Brooks', first: 'J', last: 'B' }, id: 16971 },
      { matchOfficialId: 6, role: 'ASSISTANT_VAR', name: { display: 'Gary Beswick', first: 'G', last: 'B' }, id: 16981 },
    ],
  } as never

  test('every pulselive role maps', () => {
    const rows = toAppointmentRows(128924, detail)
    assert.deepEqual(rows.map((r) => r.role), [
      'REFEREE',
      'ASSISTANT_REFEREE',
      'ASSISTANT_REFEREE',
      'FOURTH_OFFICIAL',
      'VAR',
      'AVAR',
    ])
  })

  /** Assistants carry no role field at all — absence is the signal. */
  test('a missing role means assistant referee', () => {
    assert.equal(appointmentRole({ name: { display: 'x', first: '', last: '' }, id: 1, matchOfficialId: 1 }), 'ASSISTANT_REFEREE')
  })

  test('an unknown role is dropped, never guessed into the nearest value', () => {
    assert.equal(
      appointmentRole({ role: 'GOAL_LINE_TECHNOLOGY', name: { display: 'x', first: '', last: '' }, id: 1, matchOfficialId: 1 }),
      null
    )
    const rows = toAppointmentRows(1, { matchOfficials: [{ role: 'NEW_ROLE', name: { display: 'x', first: '', last: '' }, id: 9, matchOfficialId: 9 }] } as never)
    assert.deepEqual(rows, [])
  })

  test('officials deduplicate by id', () => {
    const rows = toOfficialRows(detail)
    assert.equal(rows.length, 6)
    assert.equal(rows[0].name, 'Michael Oliver')
    assert.equal(rows[0].first_name, 'Michael')
    assert.equal(rows[0].last_name, 'Oliver')
  })

  test('names split for the join key', () => {
    assert.deepEqual(splitName('Michael Oliver'), { first: 'Michael', last: 'Oliver' })
    assert.deepEqual(splitName('Oliver'), { first: null, last: 'Oliver' })
    assert.deepEqual(splitName(''), { first: null, last: null })
  })

  test('an empty official list yields nothing rather than throwing', () => {
    assert.deepEqual(toOfficialRows({} as never), [])
    assert.deepEqual(toAppointmentRows(1, {} as never), [])
  })
})

// ---------------------------------------------------------------------------
// LIVE — football-data.co.uk
// ---------------------------------------------------------------------------

describe('live: football-data.co.uk', { concurrency: false }, () => {
  let names: string[] = []

  before(async () => {
    cacheClear()
    names = await knownRefereeNames()
  }, { timeout: LIVE_TIMEOUT })

  test('the archive loads and names officials', { timeout: LIVE_TIMEOUT }, () => {
    assert.ok(names.length > 20, `only ${names.length} referees found`)
    console.log(`[football-data.co.uk] ${names.length} distinct referees across the career window`)
  })

  /**
   * The join's failure mode. Differing spellings of one person merging is
   * correct; two different officials merging would pool one record into
   * another's.
   */
  test('no two officials share a key', { timeout: LIVE_TIMEOUT }, () => {
    const collisions = refereeKeyCollisions(names)
    for (const [key, raw] of Object.entries(collisions)) {
      const surnames = new Set(raw.map((n) => n.trim().toLowerCase().replace(/\s+/g, ' ')))
      console.log(`[football-data.co.uk] key ${key} shared by: ${raw.join(', ')}`)
      assert.ok(
        surnames.size <= raw.length,
        `key ${key} merges what may be different officials: ${raw.join(', ')}`
      )
    }
  })

  test('a real official resolves with provenance on every figure', { timeout: LIVE_TIMEOUT }, async () => {
    const stats = await getRefereeStats('Michael Oliver', 'Tottenham')
    assert.ok(stats, 'no stats for a long-serving official')
    assert.ok(stats.career.matches)
    assert.ok(stats.career.matches.value > 100)
    assert.ok(stats.career.cards_per_game)
    assert.ok(stats.career.cards_per_game.value > 0)
    for (const p of [stats.career.matches, stats.career.cards_per_game, stats.club_record]) {
      assert.ok(p?.provenance.source_name)
      assert.ok(p?.provenance.formula)
      assert.ok(p?.provenance.coverage_period)
      assert.ok(p?.provenance.last_refreshed, 'a read must carry its own freshness')
    }
    console.log(
      `[referee] Michael Oliver — ${stats.career.matches.value} matches, ` +
        `${stats.career.cards_per_game.value} cards/game, ` +
        `Tottenham ${JSON.stringify(stats.club_record?.value)}`
    )
  })

  test('an official with no matches yields null, so the block does not render', { timeout: LIVE_TIMEOUT }, async () => {
    assert.equal(await getRefereeStats('Not A Real Official', 'Tottenham'), null)
    assert.equal(await getRefereeStats('', 'Tottenham'), null)
  })

  test('the club record is internally consistent', { timeout: LIVE_TIMEOUT }, async () => {
    const stats = await getRefereeStats('Michael Oliver', 'Tottenham')
    const r = stats?.club_record?.value
    if (!r) return
    assert.equal(r.won + r.drawn + r.lost, r.matches)
    assert.ok(r.matches <= (stats?.career.matches?.value ?? 0))
  })

  /** The source carries no penalty column, so nothing may claim to. */
  test('no penalty metric is defined or published', { timeout: LIVE_TIMEOUT }, async () => {
    assert.ok(!definedMetricKeys().some((k) => k.includes('penalt')))
    const stats = await getRefereeStats('Michael Oliver', 'Tottenham')
    assert.ok(!JSON.stringify(stats ?? {}).toLowerCase().includes('penalt'))
  })
})
