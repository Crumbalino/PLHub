/**
 * The shared cache and fail-soft fetch that all three adapters sit on.
 *
 * Two properties are load-bearing and both are tested against a real socket:
 * an upstream is hit once per TTL however many callers ask, and no failure
 * mode ever throws.
 */

import { test, describe, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { cacheClear, cacheGet, cacheSet, cacheSize, fetchJson } from '@/lib/sources/cache'

const LIVE_TIMEOUT = 30_000
const FPL = 'https://fantasy.premierleague.com/api/bootstrap-static/'
const UA = { 'User-Agent': 'TheFootballHub/1.0 (+https://thefootballhub.uk)' }

describe('cache primitives', () => {
  beforeEach(() => cacheClear())

  test('a live entry reads back', () => {
    cacheSet('k', { a: 1 }, 1000, 0)
    assert.deepEqual(cacheGet('k', 500), { a: 1 })
  })

  test('an expired entry reads as a miss', () => {
    cacheSet('k', { a: 1 }, 1000, 0)
    assert.equal(cacheGet('k', 1001), undefined)
  })

  test('expiry is exclusive at the boundary', () => {
    cacheSet('k', 1, 1000, 0)
    assert.equal(cacheGet('k', 999), 1)
    assert.equal(cacheGet('k', 1000), undefined)
  })

  test('reading an expired entry evicts it', () => {
    cacheSet('k', 1, 1000, 0)
    cacheGet('k', 2000)
    assert.equal(cacheSize(), 0)
  })

  test('a cached falsy value is still a hit', () => {
    cacheSet('k', 0, 1000, 0)
    assert.equal(cacheGet('k', 0), 0)
  })

  test('an absent key is a miss', () => {
    assert.equal(cacheGet('nothing', 0), undefined)
  })
})

describe('live: fail-soft fetch', { concurrency: false }, () => {
  beforeEach(() => cacheClear())

  test('a real endpoint returns parsed JSON and warms the cache', { timeout: LIVE_TIMEOUT }, async () => {
    const body = await fetchJson<{ teams: unknown[] }>(FPL, { ttlMs: 60_000, headers: UA })
    assert.ok(body, 'FPL unreachable')
    assert.ok(Array.isArray(body.teams))
    assert.equal(cacheSize(), 1)
  })

  test('a second read is served from cache, not the network', { timeout: LIVE_TIMEOUT }, async () => {
    const first = await fetchJson<object>(FPL, { ttlMs: 60_000, headers: UA })
    assert.ok(first)
    const second = await fetchJson<object>(FPL, { ttlMs: 60_000, headers: UA })
    assert.equal(second, first, 'the same object identity means no second fetch')
  })

  /** The fan-out the snapshot route creates: four callers, one upstream hit. */
  test('concurrent callers collapse to a single request', { timeout: LIVE_TIMEOUT }, async () => {
    const results = await Promise.all(
      Array.from({ length: 4 }, () => fetchJson<object>(FPL, { ttlMs: 60_000, headers: UA }))
    )
    assert.ok(results[0])
    for (const r of results) assert.equal(r, results[0])
    assert.equal(cacheSize(), 1)
  })

  test('a 404 returns null rather than throwing', { timeout: LIVE_TIMEOUT }, async () => {
    const body = await fetchJson('https://fantasy.premierleague.com/api/nope/', { ttlMs: 1000, headers: UA })
    assert.equal(body, null)
  })

  test('a failure is not cached, so a blip is not an outage', { timeout: LIVE_TIMEOUT }, async () => {
    await fetchJson('https://fantasy.premierleague.com/api/nope/', { ttlMs: 60_000, headers: UA })
    assert.equal(cacheSize(), 0)
  })

  test('an unresolvable host returns null', { timeout: LIVE_TIMEOUT }, async () => {
    const body = await fetchJson('https://this-host-does-not-exist-4f3a.invalid/x', { ttlMs: 1000 })
    assert.equal(body, null)
  })

  test('a non-JSON body returns null rather than a parse error', { timeout: LIVE_TIMEOUT }, async () => {
    const body = await fetchJson('https://www.premierleague.com/', { ttlMs: 1000 })
    assert.equal(body, null)
  })

  test('a timeout aborts and returns null', { timeout: LIVE_TIMEOUT }, async () => {
    const body = await fetchJson(FPL, { ttlMs: 1000, headers: UA, timeoutMs: 1 })
    assert.equal(body, null)
  })
})
