import Parser from 'rss-parser'
import { isGamblingContent } from './content-filter'
import { classifyClub } from './club-matcher'

const NON_PL_KEYWORDS = [
  'NFL', 'NBA', 'MLB', 'NHL', 'NASCAR', 'Formula 1', 'F1',
  'UFC', 'MMA', 'boxing', 'bout', 'trilogy fight', 'heavyweight', 'middleweight', 'undercard',
  'tennis', 'golf', 'cricket', 'rugby', 'Super Bowl', 'World Series', 'Stanley Cup',
  'La Liga', 'Serie A', 'Bundesliga', 'Ligue 1', 'MLS',
  'College football', 'March Madness',
  'Dolphins', 'Patriots', 'Cowboys', 'Lakers', 'Yankees', 'Packers', 'Chiefs',
  'NFL team', 'NBA team', 'American football',
  'Tua Tagovailoa', 'Patrick Mahomes', 'LeBron James', 'Katie Taylor',
  'Super League', 'IPL', 'NRL', 'AFL',
  'Olympics', 'Copa America', 'Tour de France', 'Wimbledon', 'US Open',
  'Ryder Cup', 'Six Nations', 'Almeria', 'Segunda Division',
  'Tom Brady', 'Raiders', 'AFC', 'NFC', 'touchdown', 'quarterback',
  'Celtic', 'Rangers', 'Scottish Premiership', 'Scottish Cup', 'Carabao Cup',
  'Plymouth', 'Championship', 'League One', 'League Two',
  'EFL', 'Wrexham', 'Sheffield Wednesday', 'Sheffield United', 'Sunderland',
  'Leeds', 'Burnley', 'Luton', 'Norwich', 'Coventry', 'Middlesbrough',
  'Stoke', 'Swansea', 'Hull', 'Millwall', 'Bristol City', 'QPR',
  'Watford', 'Blackburn', 'Preston', 'Derby', 'Portsmouth', 'Oxford United',
  'betting tips', 'free bets', 'accumulator', 'odds boost',
  'Conference League', 'Europa Conference',
  'NFL Draft', 'Jaguars', 'Broncos', 'Chargers', 'Bengals', 'Ravens',
  'Steelers', 'Browns', 'Texans', 'Colts', 'Titans', 'Bills', 'Jets',
  'Eagles', 'Commanders', 'Giants', 'Bears', 'Lions', 'Vikings',
  'Saints', 'Buccaneers', 'Falcons', 'Panthers', '49ers', 'Seahawks', 'Rams',
  'Cardinals',
  'darts', 'oche', 'PDC', 'NWSL',
  'Saudi Pro League', 'Al-Nassr', 'Al Nassr', 'Al-Hilal', 'Al-Fayha', 'Al-Ittihad',
  'WNBA', 'Eredivisie',
]

// Keywords that should ALWAYS cause filtering, even if a PL club is mentioned
const ALWAYS_BLOCK = [
  'darts', 'oche', 'pdc', 'betting tips', 'free bets', 'accumulator', 'odds boost',
  'boxing', 'bout', 'trilogy fight', 'undercard', 'ring walk', 'weigh-in',
  'nwsl', 'saudi pro league', 'al-nassr', 'al nassr', 'al-hilal', 'al-fayha',
]

function isPremierLeagueContent(title: string, description: string): boolean {
  const text = (title + ' ' + (description || '')).toLowerCase()

  // Always block these regardless of PL club mentions
  if (ALWAYS_BLOCK.some(kw => text.includes(kw))) return false

  // Check if any PL club is mentioned - if so, keep it
  const PL_CLUBS = [
    'arsenal', 'aston villa', 'bournemouth', 'brentford', 'brighton', 'chelsea',
    'crystal palace', 'everton', 'fulham', 'ipswich', 'leicester', 'liverpool',
    'man city', 'manchester city', 'man utd', 'manchester united', 'newcastle',
    'nottingham forest', 'forest', 'southampton', 'spurs', 'tottenham',
    'west ham', 'wolves', 'wolverhampton'
  ]

  const hasPLClub = PL_CLUBS.some(club => text.includes(club))

  // If a PL club is mentioned, keep the post regardless of other keywords
  if (hasPLClub) return true

  // Otherwise filter by non-PL keywords
  for (const keyword of NON_PL_KEYWORDS) {
    if (text.includes(keyword.toLowerCase())) return false
  }
  return true
}

// Seven feeds, all measured producing on 7 Aug 2026. Every URL here was curled
// on that date: 200, XML content type, items published inside 24 hours.
//
// Removals, same date:
//   Goal.com — every candidate URL 404s (/feeds/en/news, /feed, /feed/, /rss,
//     /rss.xml, /feeds/news.xml, /en/feeds/news) and the homepage <head> carries
//     no application/rss+xml link. It had written 0 rows, ever. The publisher is
//     alive; its feed is not. Re-add only with a URL that has been curled.
//   90min — the feed WORKS (200, 90 items). The content is the problem: its
//     newest item was published 11 Aug 2025 and the ingest was still inserting
//     those rows in Aug 2026, so year-old stories arrived stamped as fresh.
//     A frozen archive passes any <item>-count check. Do not re-add.
//
// Football365 was NOT removed: /premier-league/rss 404s, but /rss returns 200
// with 31 transfer items. URL corrected rather than dropped.
export const FEEDS = [
  {
    name: 'BBC Sport',
    url: 'https://feeds.bbci.co.uk/sport/football/rss.xml',
  },
  {
    name: 'Sky Sports',
    url: 'https://www.skysports.com/rss/12040',
  },
  {
    name: 'The Guardian',
    url: 'https://www.theguardian.com/football/rss',
  },
  {
    name: 'Football365',
    // Was /premier-league/rss — 404. This one is site-wide, not PL-only, so
    // isPremierLeagueContent() does more work here than on the old URL.
    url: 'https://www.football365.com/rss',
  },
  {
    name: 'The Independent',
    // Thin but live: 3 items on 7 Aug 2026, newest that afternoon, 514 rows
    // written. Kept deliberately — a low item count is not a dead feed.
    url: 'https://www.independent.co.uk/sport/football/premier-league/rss',
  },
  {
    name: 'ESPN FC',
    url: 'https://www.espn.com/espn/rss/soccer/news',
  },
  {
    name: 'FourFourTwo',
    url: 'https://www.fourfourtwo.com/feeds.xml',
  },
]

export interface FetchedRssPost {
  external_id: string
  title: string
  url: string
  content: string | null
  source: 'rss'
  /** Set by classifyClub(); null when fewer than two signals agree. */
  club_slug: string | null
  author: string | null
  score: number
  subreddit: string // repurposed as feed name for RSS items
  image_url: string | null
  published_at: string
}

function extractImageUrl(item: any): string | null {
  // Check 5 sources in order of preference

  // 1. media:thumbnail custom field
  if (item.mediaThumbnail?.$.url) {
    return item.mediaThumbnail.$.url
  }

  // 2. media:content
  if (item['media:content']?.$.url) {
    return item['media:content'].$.url
  }

  // 3. media:thumbnail array (if multiple exist)
  if (Array.isArray(item['media:thumbnail'])) {
    const thumb = item['media:thumbnail'].find((t: any) => t.$.url)
    if (thumb?.$.url) return thumb.$.url
  }

  // 4. enclosure with image type
  if (item.enclosure?.url && item.enclosure.type?.startsWith('image/')) {
    return item.enclosure.url
  }

  // 5. Regex extraction from content/contentEncoded
  const contentSource = item['content:encoded'] ?? item.content ?? ''
  if (contentSource) {
    const imgMatch = contentSource.match(/<img[^>]+src=["']([^"']+)["']/i)
    if (imgMatch?.[1]) {
      return imgMatch[1]
    }
  }

  return null
}

/**
 * A feed whose newest item is older than this is treated as a failure, not a
 * quiet success.
 *
 * 14 days clears an international break or a quiet fortnight without crying
 * wolf, and would have caught 90min in Sep 2025 instead of Aug 2026 — it sat at
 * 200 OK with 90 well-formed items the whole time, which is invisible to any
 * `<item>` count. Named constant, not a literal: the threshold is a judgement
 * and the next person changing it should see the reasoning.
 */
export const FEED_STALE_AFTER_DAYS = 14

export interface FeedDiagnostics {
  name: string
  url: string
  /** False if the feed is unreachable, empty, or stale. */
  ok: boolean
  /** Greppable reason, null when ok. Goes to cron_logs.error_message. */
  failure: string | null
  /** Items in the XML, before any filtering. */
  rawItems: number
  /** Items surviving the gambling and PL filters. */
  keptItems: number
  newestPublishedAt: string | null
  newestAgeDays: number | null
}

/**
 * Parse a feed date, tolerating the non-numeric timezone abbreviations real
 * publishers ship.
 *
 * Sky Sports serves `Fri, 07 Aug 2026 15:21:00 BST`. RFC-822 allows only UT/GMT,
 * the US military zones and numeric offsets, so V8 returns Invalid Date for BST
 * — every Sky item parsed as undated, and an undated feed can never be measured
 * stale. Sky was therefore exempt from staleness detection entirely, which is
 * the exact blind spot this item exists to close.
 *
 * Only offsets actually observed in the configured feeds are mapped. Anything
 * else stays unparsed and is skipped rather than guessed at.
 */
function parseFeedDate(raw: string): Date | null {
  const direct = new Date(raw)
  if (!Number.isNaN(direct.getTime())) return direct

  const OFFSETS: Record<string, string> = {
    BST: '+0100', // British Summer Time — Sky Sports
    GMT: '+0000',
  }
  const zone = raw.trim().split(/\s+/).pop() ?? ''
  const offset = OFFSETS[zone.toUpperCase()]
  if (!offset) return null

  const patched = new Date(raw.trim().replace(new RegExp(`${zone}$`, 'i'), offset))
  return Number.isNaN(patched.getTime()) ? null : patched
}

/** Newest publish date across items, from the feed's own dates only. */
function newestItemDate(items: { isoDate?: string; pubDate?: string }[]): Date | null {
  let newest: Date | null = null
  for (const item of items) {
    // NOT the mapped published_at — that defaults to now() when a feed omits
    // the date, which would make a stale feed look current.
    const raw = item.isoDate ?? item.pubDate
    if (!raw) continue
    const d = parseFeedDate(raw)
    if (!d) continue
    if (!newest || d > newest) newest = d
  }
  return newest
}

/** One line, greppable, for cron_logs.error_message. No migration needed. */
export function describeFeedFailure(d: FeedDiagnostics): string {
  return [
    `feed=${d.name}`,
    `reason=${d.failure}`,
    `raw=${d.rawItems}`,
    `kept=${d.keptItems}`,
    `newest=${d.newestPublishedAt ?? 'none'}`,
    `age_days=${d.newestAgeDays ?? 'n/a'}`,
    `url=${d.url}`,
  ].join(' ')
}

export async function fetchFeedWithDiagnostics(
  name: string,
  url: string
): Promise<{ posts: FetchedRssPost[]; diagnostics: FeedDiagnostics }> {
  const parser = new Parser({
    customFields: {
      item: [['media:thumbnail', 'mediaThumbnail'], ['media:content', 'mediaContent']],
    },
  })

  const base: FeedDiagnostics = {
    name,
    url,
    ok: false,
    failure: null,
    rawItems: 0,
    keptItems: 0,
    newestPublishedAt: null,
    newestAgeDays: null,
  }

  let feed: Awaited<ReturnType<Parser['parseURL']>>
  try {
    feed = await parser.parseURL(url)
  } catch (err) {
    // Was `return []`, which logged as a success. A 404 is a failure.
    const msg = err instanceof Error ? err.message : String(err)
    console.error(`[RSS] ${name} unreachable:`, msg)
    return { posts: [], diagnostics: { ...base, failure: `unreachable: ${msg}` } }
  }

  const items = feed.items ?? []
  const newest = newestItemDate(items)
  const ageDays =
    newest === null ? null : Math.floor((Date.now() - newest.getTime()) / 86_400_000)

  const withDates: FeedDiagnostics = {
    ...base,
    rawItems: items.length,
    newestPublishedAt: newest?.toISOString() ?? null,
    newestAgeDays: ageDays,
  }

  // 200 with zero items is the nastiest failure: well-formed, parses clean,
  // writes nothing, and looks identical to a quiet news day.
  if (items.length === 0) {
    console.error(`[RSS] ${name} returned 200 with zero items`)
    return { posts: [], diagnostics: { ...withDates, failure: 'empty: 200 with zero items' } }
  }

  if (ageDays !== null && ageDays > FEED_STALE_AFTER_DAYS) {
    console.error(`[RSS] ${name} is stale: newest item ${ageDays}d old`)
    return {
      posts: [],
      diagnostics: {
        ...withDates,
        failure: `stale: newest item ${ageDays}d old, threshold ${FEED_STALE_AFTER_DAYS}d`,
      },
    }
  }

  const posts = items
      .filter((item) => {
        const title = item.title ?? ''
        const description = item.contentSnippet ?? item.content ?? ''

        // Filter out gambling/betting content
        if (isGamblingContent(title, description)) return false

        // Filter for PL content
        return isPremierLeagueContent(title, description)
      })
      .map((item) => {
        const guid = item.guid ?? item.link ?? ''
        const imageUrl = extractImageUrl(item)
        const title = item.title ?? 'Untitled'
        const content = item.contentSnippet ?? item.content ?? null
        const link = item.link ?? ''

        return {
          external_id: guid,
          title,
          url: link,
          content,
          source: 'rss' as const,
          club_slug: classifyClub(title, content, link),
          author: item.creator ?? null,
          score: 0,
          subreddit: name,
          image_url: imageUrl,
          published_at: item.isoDate ?? item.pubDate ?? new Date().toISOString(),
        }
      })

  // Filtered down to nothing is NOT a failure: a fresh feed can legitimately
  // carry no Premier League transfer copy on a given run. Only unreachable,
  // empty or stale count. Conflating the two would page on a quiet news hour.
  return { posts, diagnostics: { ...withDates, ok: true, keptItems: posts.length } }
}

/** Posts only. Kept for callers that do not report health. */
async function fetchFeed(name: string, url: string): Promise<FetchedRssPost[]> {
  const { posts } = await fetchFeedWithDiagnostics(name, url)
  return posts
}

export async function fetchAllRssFeeds(): Promise<FetchedRssPost[]> {
  const results = await Promise.allSettled(
    FEEDS.map((feed) => fetchFeed(feed.name, feed.url))
  )

  const allPosts: FetchedRssPost[] = []
  const seen = new Set<string>()

  for (const result of results) {
    if (result.status === 'fulfilled') {
      for (const post of result.value) {
        if (!seen.has(post.external_id)) {
          seen.add(post.external_id)
          allPosts.push(post)
        }
      }
    }
  }

  return allPosts
}

// Keep named export for backwards compatibility
export const fetchBBCSportRss = () => fetchFeed('BBC Sport', FEEDS[0].url)

/**
 * Fetch a single RSS feed by index — used by the rotation cron.
 * Returns the feed name alongside the posts for logging.
 */
export async function fetchSingleFeed(
  index: number
): Promise<{ name: string; posts: FetchedRssPost[]; diagnostics: FeedDiagnostics }> {
  const feed = FEEDS[index % FEEDS.length]
  const { posts, diagnostics } = await fetchFeedWithDiagnostics(feed.name, feed.url)
  return { name: feed.name, posts, diagnostics }
}
