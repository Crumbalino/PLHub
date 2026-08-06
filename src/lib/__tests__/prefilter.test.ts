import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { prefilter, partitionByPrefilter, PREFILTER_KEYWORDS } from '@/lib/prefilter'
import { SAMPLE_24 } from '@/lib/__fixtures__/sample-24'

const silent = () => {}

describe('prefilter', () => {
  test('keeps every claim-bearing article in the 24-item sample (8/8, no recall loss)', () => {
    const bearing = SAMPLE_24.filter((a) => a.yieldedClaims)
    assert.equal(bearing.length, 8, 'fixture should contain 8 claim-bearing articles')

    const missed = bearing.filter((a) => !prefilter(a.title, a.content).passes)
    assert.deepEqual(
      missed.map((a) => `#${a.n} ${a.title.trim()}`),
      [],
      'a dropped claim-bearing article is a silent data loss — recall must be 8/8',
    )
  })

  test('drops at least half the non-yielding articles', () => {
    const { kept, dropped } = partitionByPrefilter(SAMPLE_24, silent)
    assert.equal(kept.length + dropped.length, 24)
    assert.ok(
      dropped.length >= 12,
      `expected >=12 dropped for the measured 50% saving, got ${dropped.length}`,
    )
  })

  test('drops all three non-football articles (cricket, boxing, tennis)', () => {
    // #5 cricket, #7 boxing, #8 tennis — the relevance-filter leak in issue #21.
    for (const n of [5, 7, 8]) {
      const a = SAMPLE_24.find((x) => x.n === n)!
      assert.equal(prefilter(a.title, a.content).passes, false, `#${n} should be dropped: ${a.title}`)
    }
  })

  test('matches whole words only — "fee" must not match "feels"', () => {
    assert.equal(prefilter('x', 'this feels like the perfect location').passes, false)
    assert.equal(prefilter('x', 'the fee was agreed').passes, true)
  })

  test('is case-insensitive and reads the title as well as the content', () => {
    assert.equal(prefilter('TRANSFER news', null).passes, true)
    assert.equal(prefilter('nothing here', 'a BID was made').passes, true)
  })

  test('empty and null input do not throw and do not pass', () => {
    assert.equal(prefilter('', null).passes, false)
    assert.equal(prefilter('', '').passes, false)
  })

  test('reports which keywords matched, for the drop log', () => {
    const r = prefilter('Arsenal agree fee', 'a deal is close')
    assert.ok(r.matched.includes('fee'))
    assert.ok(r.matched.includes('deal'))
    assert.equal(prefilter('nothing relevant', 'at all').matched.length, 0)
  })

  test('partition logs a decision for every article — never drops silently', () => {
    const seen: string[] = []
    partitionByPrefilter(SAMPLE_24, ({ decision, title }) => seen.push(`${decision}:${title}`))
    assert.equal(seen.length, 24, 'every article must produce a log line')
    assert.ok(seen.some((s) => s.startsWith('drop:')), 'drops must be logged')
  })

  test('keyword list has no duplicates', () => {
    assert.equal(new Set(PREFILTER_KEYWORDS).size, PREFILTER_KEYWORDS.length)
  })
})
