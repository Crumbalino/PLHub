// Feed failure detection. The point of these tests is that a feed can fail in
// three ways that all used to log as `success`, and the nastiest two are
// invisible to an <item> count:
//
//   unreachable — 404 or network error. Was `catch { return [] }`.
//   empty       — 200, well-formed XML, zero items. Looks like a quiet hour.
//   stale       — 200, many items, newest one months old. 90min sat here for
//                 ten months at 200 OK with 90 items.
//
// Two of these hit the network deliberately: the assertion is about what real
// publishers actually serve, and a fixture would only prove the fixture.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  fetchFeedWithDiagnostics,
  describeFeedFailure,
  FEED_STALE_AFTER_DAYS,
  FEEDS,
} from '../rss'

test('FEED_STALE_AFTER_DAYS is a named constant, not a literal', () => {
  assert.equal(FEED_STALE_AFTER_DAYS, 14)
})

test('unreachable feed is a failure, not an empty success', async () => {
  // Goal.com's configured URL, removed 7 Aug 2026. Every candidate 404s.
  const { posts, diagnostics } = await fetchFeedWithDiagnostics(
    'Broken Feed',
    'https://www.goal.com/feeds/en/news'
  )

  assert.equal(posts.length, 0)
  assert.equal(diagnostics.ok, false)
  assert.ok(
    diagnostics.failure?.startsWith('unreachable:'),
    `expected unreachable, got ${diagnostics.failure}`
  )
})

test('a host that does not resolve is a failure', async () => {
  const { diagnostics } = await fetchFeedWithDiagnostics(
    'Nonexistent',
    'https://feed.invalid.thefootballhub.test/rss.xml'
  )

  assert.equal(diagnostics.ok, false)
  assert.ok(diagnostics.failure?.startsWith('unreachable:'))
})

test('describeFeedFailure packs the detail into one greppable line', () => {
  const line = describeFeedFailure({
    name: '90min',
    url: 'https://www.90min.com/feed',
    ok: false,
    failure: 'stale: newest item 361d old, threshold 14d',
    rawItems: 90,
    keptItems: 0,
    newestPublishedAt: '2025-08-11T13:40:00.000Z',
    newestAgeDays: 361,
  })

  // No migration, so cron_logs.error_message has to carry everything.
  assert.match(line, /feed=90min/)
  assert.match(line, /reason=stale/)
  assert.match(line, /raw=90/)
  assert.match(line, /kept=0/)
  assert.match(line, /age_days=361/)
  assert.match(line, /url=https:\/\/www\.90min\.com\/feed/)
})

test('every configured feed is reachable, non-empty and inside the staleness threshold', async () => {
  // This is the regression guard for the whole item: if a feed dies, this fails
  // instead of the site quietly thinning out for months.
  for (const feed of FEEDS) {
    const { diagnostics } = await fetchFeedWithDiagnostics(feed.name, feed.url)
    assert.equal(
      diagnostics.ok,
      true,
      `${feed.name} is not ok: ${diagnostics.failure} (${describeFeedFailure(diagnostics)})`
    )
    assert.ok(diagnostics.rawItems > 0, `${feed.name} returned zero items`)
    assert.ok(
      (diagnostics.newestAgeDays ?? Infinity) <= FEED_STALE_AFTER_DAYS,
      `${feed.name} newest item is ${diagnostics.newestAgeDays}d old`
    )
  }
})

test('the removed 90min feed would now be caught as stale', async () => {
  // Documents the miss. If 90min ever starts publishing again this test fails,
  // which is the correct signal to reconsider it — not a broken test.
  const { diagnostics } = await fetchFeedWithDiagnostics(
    '90min',
    'https://www.90min.com/feed'
  )

  assert.equal(diagnostics.ok, false, 'expected 90min to still be frozen')
  assert.ok(
    diagnostics.failure?.startsWith('stale:'),
    `expected stale, got ${diagnostics.failure}`
  )
  assert.ok(diagnostics.rawItems > 0, 'the feed serves items — that is the trap')
})

test('a BST timezone is parsed, so Sky Sports is not exempt from staleness', async () => {
  // Sky serves `Fri, 07 Aug 2026 15:21:00 BST`. V8 cannot parse BST, so before
  // parseFeedDate every Sky item was undated and Sky could never be measured
  // stale — the blind spot this whole item exists to close.
  const { diagnostics } = await fetchFeedWithDiagnostics(
    'Sky Sports',
    'https://www.skysports.com/rss/12040'
  )

  assert.equal(diagnostics.ok, true)
  assert.notEqual(diagnostics.newestAgeDays, null, 'Sky must have a measurable age')
  assert.ok((diagnostics.newestAgeDays ?? 99) <= FEED_STALE_AFTER_DAYS)
})
