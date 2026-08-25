/**
 * GET /api/v1/snapshot/{entity} — the §14 contract.
 *
 * The route handler is invoked directly rather than over HTTP, so the test
 * needs no dev server, but everything below it is real: FPL, pulselive and
 * Reddit are all hit live through the adapters.
 *
 * What is asserted is the *contract*, not the content. §14 is a shape promise
 * to two clients (the website and, later, React Native). A key that silently
 * changes name or type breaks both, and no amount of correct football data
 * makes up for it.
 */

import { test, describe, before } from 'node:test'
import assert from 'node:assert/strict'
import { GET } from '@/app/api/v1/snapshot/[entity]/route'
import { cacheClear } from '@/lib/sources/cache'

const LIVE_TIMEOUT = 60_000

/** §14 top-level keys, exactly. */
const CONTRACT_KEYS = [
  'entity',
  'updated_at',
  'phase',
  'match',
  'availability',
  'referee',
  'key_data',
  'table',
  'form',
  'next_opponent',
  'numbers',
  'confirmed',
  'big_story',
  'developing',
  'around_the_league',
  'worth_your_time',
  'fan_pulse',
  'signoff',
].sort()

type Payload = Record<string, unknown>

const request = (entity: string) =>
  GET(new Request(`https://thefootballhub.uk/api/v1/snapshot/${entity}`) as never, {
    params: { entity },
  })

describe('live: snapshot route', { concurrency: false }, () => {
  let res: Response
  let body: Payload

  before(async () => {
    cacheClear()
    res = await request('tottenham')
    body = (await res.json()) as Payload
  }, { timeout: LIVE_TIMEOUT })

  test('responds 200', { timeout: LIVE_TIMEOUT }, () => {
    assert.equal(res.status, 200)
  })

  test('carries exactly the §14 keys — no more, no fewer', { timeout: LIVE_TIMEOUT }, () => {
    assert.deepEqual(Object.keys(body).sort(), CONTRACT_KEYS)
  })

  test('entity is the club, with badge and accent', { timeout: LIVE_TIMEOUT }, () => {
    const entity = body.entity as Payload
    assert.equal(entity.slug, 'tottenham')
    assert.equal(entity.name, 'Tottenham')
    assert.match(String(entity.badge), /^https:\/\/resources\.premierleague\.com\//)
    assert.equal(entity.accent, '#132257')
  })

  test('updated_at is an ISO instant', { timeout: LIVE_TIMEOUT }, () => {
    assert.match(String(body.updated_at), /^\d{4}-\d{2}-\d{2}T[\d:.]+Z$/)
    assert.ok(!Number.isNaN(Date.parse(String(body.updated_at))))
  })

  test('phase is one of the four in §3', { timeout: LIVE_TIMEOUT }, () => {
    assert.ok(['LIVE', 'POST', 'PRE', 'BREAK'].includes(String(body.phase)))
    console.log(`[snapshot] phase is ${body.phase}`)
  })

  test('the match block agrees with the phase', { timeout: LIVE_TIMEOUT }, () => {
    const match = body.match as Payload | null
    if (!match) return // §22: a block with no data does not render
    assert.equal(match.phase, body.phase)
    assert.equal(match.competition, 'Premier League')

    const opponent = match.opponent as Payload | null
    assert.ok(opponent, 'a fixture always has an opponent')
    assert.equal(typeof opponent.name, 'string')
    assert.match(String(opponent.badge), /^https:\/\/resources\.premierleague\.com\//)
    assert.equal(typeof match.home, 'boolean')

    if (body.phase === 'POST') {
      assert.ok('scorers' in match, 'POST must carry scorers')
      assert.ok('attendance' in match)
      assert.ok('xg' in match)
      assert.ok(Array.isArray(match.scorers))
    }
    if (body.phase === 'PRE' || body.phase === 'BREAK') {
      assert.ok(match.kickoff, 'the next match must carry a kick-off')
      assert.ok(Date.parse(String(match.kickoff)) > 0)
    }
  })

  test('§18 is honest — broadcaster is null until it is entered by hand', { timeout: LIVE_TIMEOUT }, () => {
    const match = body.match as Payload | null
    if (match) assert.equal(match.broadcaster, null)
  })

  test('availability obeys §7.4 — capped, worded, ordered', { timeout: LIVE_TIMEOUT }, () => {
    const rows = body.availability as Array<Payload>
    assert.ok(Array.isArray(rows))
    assert.ok(rows.length <= 8)
    const order = ['SUSPENDED', 'OUT', 'DOUBTFUL', 'UNAVAILABLE', 'BACK']
    let last = -1
    for (const r of rows) {
      const idx = order.indexOf(String(r.status))
      assert.ok(idx >= 0, `unmapped status: ${r.status}`)
      assert.ok(idx >= last, 'rows are out of §7.4 order')
      last = idx
      assert.equal(typeof r.player, 'string')
      assert.match(String(r.photo), /^https:\/\/resources\.premierleague\.com\//)
      assert.ok('detail' in r && 'chance' in r)
    }
    console.log(`[snapshot] ${rows.length} availability rows`)
  })

  test('key_data is label/value/detail cards with no placeholders', { timeout: LIVE_TIMEOUT }, () => {
    const data = body.key_data as Array<Payload>
    assert.ok(Array.isArray(data))
    assert.ok(data.length <= 4, '§7.6 caps at four cards')
    for (const d of data) {
      assert.deepEqual(Object.keys(d).sort(), ['detail', 'label', 'value'])
      assert.ok(String(d.value).length > 0)
    }
    // §11: no Hub Rating exists yet, so IN FORM must not have been rendered.
    assert.ok(!data.some((d) => d.label === 'IN FORM'))
  })

  test('form is up to five W/D/L letters', { timeout: LIVE_TIMEOUT }, () => {
    const form = body.form as string[]
    assert.ok(Array.isArray(form))
    assert.ok(form.length <= 5)
    for (const letter of form) assert.match(letter, /^[WDL]$/)
  })

  test('referee is a name or null — never a placeholder rating', { timeout: LIVE_TIMEOUT }, () => {
    const ref = body.referee as Payload | null
    if (ref === null) return
    assert.equal(typeof ref.name, 'string')
    // §7.5 stats need accumulated history this build does not have.
    assert.equal(ref.cards_per_game, null)
    assert.equal(ref.club_record, null)
    assert.equal(ref.fact, null)
  })

  test('fan_pulse is titles and scores only, or null', { timeout: LIVE_TIMEOUT }, () => {
    const pulse = body.fan_pulse as Payload | null
    if (pulse === null) {
      console.log('[snapshot] fan_pulse null — Reddit unreachable from this network')
      return
    }
    assert.equal(pulse.subreddit, 'coys')
    const threads = pulse.threads as Array<Payload>
    assert.ok(threads.length <= 3)
    for (const t of threads) {
      assert.deepEqual(Object.keys(t).sort(), ['score', 'title', 'url'])
    }
  })

  test('next_opponent carries form and missing players, but no story', { timeout: LIVE_TIMEOUT }, () => {
    const next = body.next_opponent as Payload | null
    if (next === null) return
    assert.equal(typeof next.slug, 'string')
    assert.ok(Array.isArray(next.form))
    assert.ok(Array.isArray(next.missing))
    assert.equal(next.story, null, 'the story needs clustering')
  })

  // -------------------------------------------------------------------------
  // The keys this build deliberately leaves empty
  // -------------------------------------------------------------------------

  test('clustering-dependent keys are present and empty', { timeout: LIVE_TIMEOUT }, () => {
    assert.equal(body.big_story, null)
    assert.deepEqual(body.developing, [])
    assert.deepEqual(body.around_the_league, [])
  })

  test('keys behind a source this build does not own are empty', { timeout: LIVE_TIMEOUT }, () => {
    assert.deepEqual(body.confirmed, [])
    assert.deepEqual(body.worth_your_time, [])
  })

  // -------------------------------------------------------------------------
  // §7.7 table and §7.10 numbers — football-data.org
  // -------------------------------------------------------------------------

  test('table is the §7.7 window with the club highlighted', { timeout: LIVE_TIMEOUT }, () => {
    const table = body.table as { rows: Array<Payload>; highlight: string }
    assert.equal(table.highlight, 'tottenham')
    assert.ok(Array.isArray(table.rows))

    if (!table.rows.length) {
      console.log('[snapshot] table empty — no key, or football-data unreachable')
      return
    }

    // Three above, the club, three below — clamped at the ends of the table.
    assert.ok(table.rows.length <= 7, '§7.7 is at most seven rows')
    const us = table.rows.findIndex((r) => r.slug === 'tottenham')
    assert.ok(us >= 0, 'the highlighted club must be inside its own window')
    assert.ok(us <= 3, 'at most three rows above the club')
    assert.ok(table.rows.length - us - 1 <= 3, 'at most three rows below the club')

    // Positions ascend, but they are not contiguous: football-data shares a
    // position between clubs level on points and goal difference, so the column
    // can read 15, 16, 16, 18. The window is three rows either side, not three
    // positions either side.
    const positions = table.rows.map((r) => Number(r.position))
    for (let i = 1; i < positions.length; i++) {
      assert.ok(positions[i] >= positions[i - 1], 'window must be in table order')
    }

    for (const row of table.rows) {
      for (const field of [
        'position',
        'name',
        'played',
        'won',
        'drawn',
        'lost',
        'goals_for',
        'goals_against',
        'gd',
        'points',
      ] as const) {
        assert.ok(field in row, `table row is missing ${field}`)
      }
      assert.equal(typeof row.name, 'string')
      // gd must agree with the goal columns, or the source is being misread.
      assert.equal(row.gd, Number(row.goals_for) - Number(row.goals_against))
    }
    console.log(
      `[snapshot] table rows ${positions[0]}–${positions[positions.length - 1]}, ` +
        `Tottenham at ${table.rows[us].position}`
    )
  })

  test('numbers carries §7.10 and agrees with the table row', { timeout: LIVE_TIMEOUT }, () => {
    const numbers = body.numbers as Payload
    const table = body.table as { rows: Array<Payload>; highlight: string }
    const us = table.rows.find((r) => r.slug === 'tottenham')

    if (!Object.keys(numbers).length) {
      console.log('[snapshot] numbers empty — no key, or football-data unreachable')
      return
    }

    if (us) {
      // The two keys are read from the same standings row; they must not drift.
      assert.equal(numbers.position, us.position)
      assert.equal(numbers.points, us.points)
      assert.equal(numbers.gd, us.gd)
      assert.equal(numbers.goals_for, us.goals_for)
      assert.equal(numbers.goals_against, us.goals_against)
    }

    for (const field of ['xg_for', 'xg_against'] as const) {
      if (field in numbers) {
        assert.equal(typeof numbers[field], 'number')
        assert.ok((numbers[field] as number) >= 0, `${field} cannot be negative`)
      }
    }
    console.log(
      `[snapshot] numbers — ${numbers.position} / ${numbers.points}pts / ` +
        `xG ${numbers.xg_for}–${numbers.xg_against}`
    )
  })

  test('signoff carries its shape with a null human line', { timeout: LIVE_TIMEOUT }, () => {
    const signoff = body.signoff as Payload
    assert.equal(signoff.line, null)
    assert.deepEqual(signoff.stats, { stories: 0, moving: 0 })
  })

  test('the response is cacheable at the edge', { timeout: LIVE_TIMEOUT }, () => {
    assert.match(res.headers.get('cache-control') ?? '', /s-maxage=\d+/)
  })
})

describe('live: entity gating', () => {
  test('an unsupported club 404s with a reason', { timeout: LIVE_TIMEOUT }, async () => {
    const res = await request('arsenal')
    assert.equal(res.status, 404)
    const body = (await res.json()) as Payload
    assert.match(String(body.detail), /tottenham/)
  })

  test('an unknown slug 404s rather than 500s', { timeout: LIVE_TIMEOUT }, async () => {
    assert.equal((await request('not-a-club')).status, 404)
  })

  test('a path-shaped entity is refused', { timeout: LIVE_TIMEOUT }, async () => {
    assert.equal((await request('../../etc/passwd')).status, 404)
  })

  test('entity matching is case-insensitive', { timeout: LIVE_TIMEOUT }, async () => {
    assert.equal((await request('Tottenham')).status, 200)
  })
})
