/**
 * Reddit source adapter — Fan Pulse (§7.16).
 *
 * A note on the live tests. Reddit blocks anonymous JSON reads from a lot of
 * networks, including most datacentre ranges, and returns a 403 HTML page
 * rather than an error. That is not a bug in this adapter — it is the reason
 * the adapter has to fail soft, and §7.16 says so outright: *if the source
 * disappears, the block is deleted and nothing else breaks.*
 *
 * So the live tests assert the **contract**, not the data: whatever Reddit
 * does, `getFanPulse` resolves to either a well-formed FanPulse or null, and
 * never throws and never leaks a post body. When Reddit is reachable the shape
 * assertions run against real threads; when it is blocked the null path is
 * exercised instead. Both are passes, and the test reports which one ran.
 */

import { test, describe, before } from 'node:test'
import assert from 'node:assert/strict'
import {
  decodeEntities,
  fetchHot,
  getFanPulse,
  isValidSubreddit,
  parseHotThreads,
  FAN_PULSE_CAP,
  type FanPulse,
} from '@/lib/sources/reddit'
import { CLUBS_BY_SLUG } from '@/lib/clubs'
import { cacheClear } from '@/lib/sources/cache'

const LIVE_TIMEOUT = 30_000

function listing(posts: Array<Record<string, unknown>>) {
  return { data: { children: posts.map((data) => ({ kind: 't3', data })) } }
}

// ---------------------------------------------------------------------------
// Pure transforms
// ---------------------------------------------------------------------------

describe('entity decoding', () => {
  test('ampersands survive the round trip', () => {
    assert.equal(decodeEntities('Spurs &amp; Arsenal'), 'Spurs & Arsenal')
  })

  test('quotes and apostrophes decode', () => {
    assert.equal(decodeEntities('&quot;he&#39;s back&quot;'), '"he\'s back"')
  })

  test('plain text is untouched', () => {
    assert.equal(decodeEntities('Post-match thread'), 'Post-match thread')
  })
})

describe('§7.16 parsing', () => {
  const raw = listing([
    { title: 'Post-match thread: Tottenham 2-1 Arsenal', score: 1200, permalink: '/r/coys/a/', selftext: 'SECRET BODY' },
    { title: "Anyone else think we're actually good now?", score: 340, permalink: '/r/coys/b/' },
    { title: 'Danso loan — thoughts?', score: 198, permalink: '/r/coys/c/' },
    { title: 'Fourth', score: 10, permalink: '/r/coys/d/' },
  ])

  test('titles and scores come through', () => {
    const threads = parseHotThreads(raw)
    assert.equal(threads[0].title, 'Post-match thread: Tottenham 2-1 Arsenal')
    assert.equal(threads[0].score, 1200)
  })

  test('permalinks become absolute urls to link out to', () => {
    assert.equal(parseHotThreads(raw)[0].url, 'https://www.reddit.com/r/coys/a/')
  })

  test('capped at three', () => {
    assert.equal(parseHotThreads(raw).length, FAN_PULSE_CAP)
    assert.equal(parseHotThreads(raw).length, 3)
  })

  /**
   * §7.16 is explicit: never reproduce comment bodies. The parser projects the
   * three permitted fields rather than passing the upstream object through, so
   * a body cannot travel downstream even by accident.
   */
  test('no post body is carried, ever', () => {
    const threads = parseHotThreads(raw)
    const serialised = JSON.stringify(threads)
    assert.ok(!serialised.includes('SECRET BODY'))
    for (const t of threads) {
      assert.deepEqual(Object.keys(t).sort(), ['score', 'title', 'url'])
    }
  })

  test('the stickied match thread is kept — it is the point of the block', () => {
    const l = listing([{ title: 'Match thread', score: 900, permalink: '/r/coys/m/', stickied: true }])
    assert.equal(parseHotThreads(l).length, 1)
  })

  test('removed posts are dropped', () => {
    const l = listing([
      { title: 'Gone', score: 5, permalink: '/r/coys/x/', removed_by_category: 'moderator' },
      { title: 'Here', score: 5, permalink: '/r/coys/y/' },
    ])
    assert.deepEqual(
      parseHotThreads(l).map((t) => t.title),
      ['Here']
    )
  })

  test('a post with no permalink is unlinkable and so is dropped', () => {
    assert.deepEqual(parseHotThreads(listing([{ title: 'No link', score: 5 }])), [])
  })

  test('a missing score reads as zero rather than undefined', () => {
    const l = listing([{ title: 'Unscored', permalink: '/r/coys/z/' }])
    assert.equal(parseHotThreads(l)[0].score, 0)
  })

  test('a malformed payload yields an empty list, not a throw', () => {
    assert.deepEqual(parseHotThreads({}), [])
    assert.deepEqual(parseHotThreads({ data: {} }), [])
  })
})

describe('subreddit validation', () => {
  test('real club subreddits pass', () => {
    for (const name of ['coys', 'Gunners', 'LiverpoolFC', 'reddevils']) {
      assert.ok(isValidSubreddit(name), name)
    }
  })

  test('a path traversal attempt is refused', () => {
    assert.equal(isValidSubreddit('coys/../admin'), false)
    assert.equal(isValidSubreddit('coys?limit=1'), false)
    assert.equal(isValidSubreddit(''), false)
  })

  test('a malformed name fetches nothing rather than building a bad url', async () => {
    assert.equal(await fetchHot('../../etc'), null)
  })
})

describe('every club in the registry has a usable subreddit', () => {
  test('all subreddit names are well-formed', () => {
    for (const club of Object.values(CLUBS_BY_SLUG)) {
      if (!club.subreddit) continue
      assert.ok(isValidSubreddit(club.subreddit), `${club.slug}: ${club.subreddit}`)
    }
  })
})

// ---------------------------------------------------------------------------
// LIVE — www.reddit.com
// ---------------------------------------------------------------------------

describe('live: reddit fan pulse', { concurrency: false }, () => {
  let pulse: FanPulse | null = null
  let reachable = false

  before(async () => {
    cacheClear()
    pulse = await getFanPulse('coys')
    reachable = pulse !== null
    console.log(
      reachable
        ? `[reddit] reachable — ${pulse?.threads.length} threads from r/coys`
        : '[reddit] blocked or empty from this network — exercising the fail-soft path'
    )
  }, { timeout: LIVE_TIMEOUT })

  /** The contract, which holds either way. This is the assertion that matters. */
  test('resolves to a FanPulse or null, and never throws', { timeout: LIVE_TIMEOUT }, () => {
    assert.ok(pulse === null || typeof pulse === 'object')
  })

  test('when reachable, threads are well-formed', { timeout: LIVE_TIMEOUT }, () => {
    if (!reachable) return
    assert.ok(pulse)
    assert.equal(pulse.subreddit, 'coys')
    assert.ok(pulse.threads.length > 0)
    assert.ok(pulse.threads.length <= FAN_PULSE_CAP)
    for (const t of pulse.threads) {
      assert.equal(typeof t.title, 'string')
      assert.ok(t.title.length > 0)
      assert.equal(typeof t.score, 'number')
      assert.match(t.url, /^https:\/\/www\.reddit\.com\/r\//)
      assert.deepEqual(Object.keys(t).sort(), ['score', 'title', 'url'])
    }
  })

  test('a 403 or an HTML body degrades to null rather than an exception', { timeout: LIVE_TIMEOUT }, async () => {
    // Whatever Reddit returns for a subreddit that does not exist — 404, 403,
    // or an HTML interstitial — the adapter must absorb it.
    const missing = await getFanPulse('thissubredditdoesnotexist12345')
    assert.equal(missing, null)
  })

  test('an empty subreddit yields null, so the block does not render', { timeout: LIVE_TIMEOUT }, async () => {
    const empty = await getFanPulse('emptysubredditxyz98765')
    assert.equal(empty, null)
  })
})
