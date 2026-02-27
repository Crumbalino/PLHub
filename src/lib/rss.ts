import Parser from 'rss-parser'
import { isGamblingContent } from './content-filter'

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

const FEEDS = [
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
    name: 'Goal.com',
    url: 'https://www.goal.com/feeds/en/news',
  },
  {
    name: '90min',
    url: 'https://www.90min.com/feed',
  },
]

export interface FetchedRssPost {
  external_id: string
  title: string
  url: string
  content: string | null
  source: 'rss'
  club_slug: null
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

async function fetchFeed(name: string, url: string): Promise<FetchedRssPost[]> {
  const parser = new Parser({
    customFields: {
      item: [['media:thumbnail', 'mediaThumbnail'], ['media:content', 'mediaContent']],
    },
  })

  try {
    const feed = await parser.parseURL(url)

    return (feed.items ?? [])
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

        return {
          external_id: guid,
          title: item.title ?? 'Untitled',
          url: item.link ?? '',
          content: item.contentSnippet ?? item.content ?? null,
          source: 'rss' as const,
          club_slug: null,
          author: item.creator ?? null,
          score: 0,
          subreddit: name,
          image_url: imageUrl,
          published_at: item.isoDate ?? item.pubDate ?? new Date().toISOString(),
        }
      })
  } catch (err) {
    console.error(`Failed to fetch ${name} RSS:`, err)
    return []
  }
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
