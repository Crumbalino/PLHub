/**
 * football-data.org source adapter — the league table (§7.7) and the numbers
 * (§7.10).
 *
 * Same split as the other adapters: pure transforms against hand-built rows,
 * then live tests that assert the upstream fields we parse still exist.
 *
 * The live tests tolerate a missing key. This is the one adapter with a
 * configuration dependency, and a test run without `FOOTBALL_DATA_API_KEY` set
 * should exercise the no-output path rather than fail — that path is a
 * requirement, not a fallback.
 */

import { test, describe, before } from 'node:test'
import assert from 'node:assert/strict'
import {
  fetchStandings,
  findRow,
  getFullTable,
  getNumbers,
  getTable,
  parseStandings,
  slugForTeam,
  tableWindow,
  toNumbers,
  toTableRow,
  type FdStandingRow,
  type TableRow,
} from '@/lib/sources/footballdata'
import { cacheClear } from '@/lib/sources/cache'

const LIVE_TIMEOUT = 30_000

// ---------------------------------------------------------------------------
// Builders
// ---------------------------------------------------------------------------

function upstream(over: Partial<FdStandingRow> = {}): FdStandingRow {
  return {
    position: 4,
    team: {
      id: 73,
      name: 'Tottenham Hotspur FC',
      shortName: 'Tottenham',
      tla: 'TOT',
      crest: 'https://crests.football-data.org/73.png',
    },
    playedGames: 5,
    won: 3,
    draw: 1,
    lost: 1,
    points: 10,
    goalsFor: 9,
    goalsAgainst: 4,
    goalDifference: 5,
    ...over,
  }
}

function row(position: number, slug: string | null, name = slug ?? 'Club'): TableRow {
  return {
    position,
    slug,
    name,
    played: 5,
    won: 1,
    drawn: 1,
    lost: 3,
    goals_for: 4,
    goals_against: 6,
    gd: -2,
    points: 4,
  }
}

/** A full 20-row table with Tottenham at a given position. */
function fullTable(tottenhamAt: number): TableRow[] {
  return Array.from({ length: 20 }, (_, i) => {
    const position = i + 1
    return position === tottenhamAt
      ? row(position, 'tottenham', 'Tottenham')
      : row(position, `club-${position}`, `Club ${position}`)
  })
}

// ---------------------------------------------------------------------------
// Slug resolution
// ---------------------------------------------------------------------------

describe('club slug resolution', () => {
  test('the three-letter code is the join', () => {
    assert.equal(slugForTeam({ id: 73, name: 'Tottenham Hotspur FC', tla: 'TOT' }), 'tottenham')
    assert.equal(slugForTeam({ id: 57, name: 'Arsenal FC', tla: 'ARS' }), 'arsenal')
  })

  test('a code the registry does not carry falls back to the name', () => {
    // football-data says NOT for Nottingham Forest; the registry says NFO.
    assert.equal(
      slugForTeam({ id: 351, name: 'Nottingham Forest FC', shortName: 'Nottingham', tla: 'NOT' }),
      'nottingham-forest'
    )
  })

  test('a club absent from the registry resolves to null, not a guess', () => {
    assert.equal(slugForTeam({ id: 1, name: 'Coventry City FC', shortName: 'Coventry', tla: 'COV' }), null)
  })

  test('a team with no code and no usable name is null', () => {
    assert.equal(slugForTeam({ id: 1, name: '' }), null)
  })
})

// ---------------------------------------------------------------------------
// Row mapping
// ---------------------------------------------------------------------------

describe('row mapping', () => {
  test('every column the brief asks for is carried through', () => {
    const mapped = toTableRow(upstream())
    assert.deepEqual(mapped, {
      position: 4,
      slug: 'tottenham',
      name: 'Tottenham',
      played: 5,
      won: 3,
      drawn: 1,
      lost: 1,
      goals_for: 9,
      goals_against: 4,
      gd: 5,
      points: 10,
    })
  })

  test('the short name is preferred — "Tottenham Hotspur FC" is not a label', () => {
    assert.equal(toTableRow(upstream()).name, 'Tottenham')
  })

  test('a club with no short name keeps its full name', () => {
    const mapped = toTableRow(upstream({ team: { id: 1, name: 'Some Club FC', tla: 'ZZZ' } }))
    assert.equal(mapped.name, 'Some Club FC')
  })

  test('a negative goal difference survives', () => {
    const mapped = toTableRow(upstream({ goalsFor: 2, goalsAgainst: 9, goalDifference: -7 }))
    assert.equal(mapped.gd, -7)
  })
})

describe('standings parsing', () => {
  test('only the TOTAL block is the league table', () => {
    const parsed = parseStandings({
      standings: [
        { type: 'HOME', table: [upstream({ position: 1 })] },
        { type: 'TOTAL', table: [upstream({ position: 4 })] },
        { type: 'AWAY', table: [upstream({ position: 9 })] },
      ],
    })
    assert.equal(parsed?.length, 1)
    assert.equal(parsed?.[0].position, 4)
  })

  test('rows come back in position order however they arrived', () => {
    const parsed = parseStandings({
      standings: [
        {
          type: 'TOTAL',
          table: [upstream({ position: 7 }), upstream({ position: 2 }), upstream({ position: 5 })],
        },
      ],
    })
    assert.deepEqual(parsed?.map((r) => r.position), [2, 5, 7])
  })

  test('no TOTAL block is null, not an empty table', () => {
    assert.equal(parseStandings({ standings: [{ type: 'HOME', table: [upstream()] }] }), null)
  })

  test('a malformed payload is null rather than a throw', () => {
    assert.equal(parseStandings({ standings: [] }), null)
    assert.equal(parseStandings({} as never), null)
  })
})

// ---------------------------------------------------------------------------
// §7.7 — three above, the club, three below
// ---------------------------------------------------------------------------

describe('§7.7 table window', () => {
  test('a mid-table club gets seven rows, centred', () => {
    const window = tableWindow(fullTable(10), 'tottenham')
    assert.equal(window.length, 7)
    assert.deepEqual(window.map((r) => r.position), [7, 8, 9, 10, 11, 12, 13])
    assert.equal(window[3].slug, 'tottenham')
  })

  test('the window is contiguous', () => {
    const positions = tableWindow(fullTable(12), 'tottenham').map((r) => r.position)
    for (let i = 1; i < positions.length; i++) {
      assert.equal(positions[i], positions[i - 1] + 1)
    }
  })

  /**
   * Clamped, not slid. First place has nothing above it, and padding the window
   * downwards to keep seven rows would imply a symmetry the table does not have.
   */
  test('top of the table clamps rather than sliding', () => {
    const window = tableWindow(fullTable(1), 'tottenham')
    assert.deepEqual(window.map((r) => r.position), [1, 2, 3, 4])
    assert.equal(window[0].slug, 'tottenham')
  })

  test('bottom of the table clamps too', () => {
    const window = tableWindow(fullTable(20), 'tottenham')
    assert.deepEqual(window.map((r) => r.position), [17, 18, 19, 20])
    assert.equal(window.at(-1)?.slug, 'tottenham')
  })

  test('second place gives two above', () => {
    assert.deepEqual(
      tableWindow(fullTable(2), 'tottenham').map((r) => r.position),
      [1, 2, 3, 4, 5]
    )
  })

  test('a club not in the table yields no window', () => {
    assert.deepEqual(tableWindow(fullTable(10), 'not-a-club'), [])
  })

  test('the window size is adjustable for other layouts', () => {
    assert.equal(tableWindow(fullTable(10), 'tottenham', 1, 1).length, 3)
  })
})

describe('row lookup', () => {
  test('finds the club', () => {
    assert.equal(findRow(fullTable(9), 'tottenham')?.position, 9)
  })

  test('an absent club is null', () => {
    assert.equal(findRow(fullTable(9), 'arsenal'), null)
  })
})

// ---------------------------------------------------------------------------
// §7.10 — the numbers
// ---------------------------------------------------------------------------

describe('§7.10 numbers', () => {
  test('carries position, points, goal difference and both goal columns', () => {
    assert.deepEqual(toNumbers(toTableRow(upstream())), {
      position: 4,
      points: 10,
      gd: 5,
      goals_for: 9,
      goals_against: 4,
    })
  })

  test('goal difference agrees with the goal columns', () => {
    const n = toNumbers(toTableRow(upstream()))
    assert.equal(n.gd, n.goals_for - n.goals_against)
  })
})

// ---------------------------------------------------------------------------
// LIVE — api.football-data.org
// ---------------------------------------------------------------------------

describe('live: football-data standings', { concurrency: false }, () => {
  let rows: TableRow[] | null = null
  let configured = false

  before(async () => {
    cacheClear()
    configured = Boolean(process.env.FOOTBALL_DATA_API_KEY?.trim())
    rows = await getFullTable()
    console.log(
      configured
        ? `[football-data] key set — ${rows?.length ?? 0} rows`
        : '[football-data] no key — exercising the no-output path'
    )
  }, { timeout: LIVE_TIMEOUT })

  /** The requirement: no key means no output, not an exception. */
  test('a missing key yields null rather than an error', { timeout: LIVE_TIMEOUT }, () => {
    if (configured) return
    assert.equal(rows, null)
  })

  test('the table has twenty clubs', { timeout: LIVE_TIMEOUT }, () => {
    if (!configured) return
    assert.ok(rows, 'football-data unreachable — table and numbers are dark')
    assert.equal(rows.length, 20)
  })

  /**
   * Positions are NOT unique and NOT contiguous.
   *
   * football-data shares a position between clubs level on points and goal
   * difference, so after one matchday the column reads 1, 2, 2, 4, 4, 6, 7, 7 —
   * measured live on 25 Aug 2026. Anything that treats position as an index, or
   * as a key, is wrong. §7.7's window is taken over rows, not positions.
   */
  test('positions ascend from 1 but may be shared', { timeout: LIVE_TIMEOUT }, () => {
    if (!configured || !rows) return
    assert.equal(rows[0].position, 1)
    assert.ok(rows.at(-1)!.position <= 20)
    for (let i = 1; i < rows.length; i++) {
      assert.ok(
        rows[i].position >= rows[i - 1].position,
        `position went backwards at row ${i}`
      )
    }
    const shared = rows.length - new Set(rows.map((r) => r.position)).size
    if (shared) console.log(`[football-data] ${shared} clubs share a position with another`)
  })

  test('every column the brief asks for is present and numeric', { timeout: LIVE_TIMEOUT }, () => {
    if (!configured || !rows) return
    for (const r of rows) {
      for (const field of [
        'position',
        'played',
        'won',
        'drawn',
        'lost',
        'goals_for',
        'goals_against',
        'gd',
        'points',
      ] as const) {
        assert.equal(typeof r[field], 'number', `${r.name}.${field}`)
      }
      assert.equal(typeof r.name, 'string')
    }
  })

  /** Arithmetic the upstream must satisfy, or we are reading the wrong fields. */
  test('the table is internally consistent', { timeout: LIVE_TIMEOUT }, () => {
    if (!configured || !rows) return
    for (const r of rows) {
      assert.equal(r.gd, r.goals_for - r.goals_against, `${r.name} goal difference`)
      assert.equal(r.played, r.won + r.drawn + r.lost, `${r.name} games played`)
      assert.equal(r.points, r.won * 3 + r.drawn, `${r.name} points`)
    }
  })

  test('points descend down the table', { timeout: LIVE_TIMEOUT }, () => {
    if (!configured || !rows) return
    for (let i = 1; i < rows.length; i++) {
      assert.ok(rows[i].points <= rows[i - 1].points, `position ${rows[i].position} out of order`)
    }
  })

  test('Tottenham resolve to their slug', { timeout: LIVE_TIMEOUT }, () => {
    if (!configured || !rows) return
    const us = rows.find((r) => r.slug === 'tottenham')
    assert.ok(us, 'the highlighted club must resolve, or the table cannot be windowed')
  })

  test('unresolved clubs are reported, not silently dropped', { timeout: LIVE_TIMEOUT }, () => {
    if (!configured || !rows) return
    const unresolved = rows.filter((r) => r.slug === null).map((r) => r.name)
    if (unresolved.length) {
      console.log(`[football-data] ${unresolved.length} clubs not in the registry: ${unresolved.join(', ')}`)
    }
    // A null slug is acceptable; a missing name is not — the row still renders.
    for (const r of rows) assert.ok(r.name.length > 0)
  })

  test('the standings payload is cached, not refetched', { timeout: LIVE_TIMEOUT }, async () => {
    if (!configured) return
    const a = await fetchStandings()
    const b = await fetchStandings()
    assert.equal(a, b, 'same object identity means one upstream request')
  })
})

describe('live: composed reads', { concurrency: false }, () => {
  test('getTable returns the §7.7 window', { timeout: LIVE_TIMEOUT }, async () => {
    const table = await getTable('tottenham')
    if (!table) return // no key, or upstream down
    assert.equal(table.highlight, 'tottenham')
    assert.ok(table.rows.length >= 4 && table.rows.length <= 7)
    assert.ok(table.rows.some((r) => r.slug === 'tottenham'))
  })

  test('getNumbers matches the club row', { timeout: LIVE_TIMEOUT }, async () => {
    const [numbers, rows] = await Promise.all([getNumbers('tottenham'), getFullTable()])
    if (!numbers || !rows) return
    const us = rows.find((r) => r.slug === 'tottenham')
    assert.ok(us)
    assert.equal(numbers.position, us.position)
    assert.equal(numbers.points, us.points)
  })

  test('a club not in the Premier League returns null', { timeout: LIVE_TIMEOUT }, async () => {
    assert.equal(await getTable('not-a-club'), null)
    assert.equal(await getNumbers('not-a-club'), null)
  })
})
