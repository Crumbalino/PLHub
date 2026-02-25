import Parser from 'rss-parser'

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
    name: 'talkSPORT',
    url: 'https://talksport.com/feed/',
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

async function fetchFeed(name: string, url: string): Promise<FetchedRssPost[]> {
  const parser = new Parser({
    customFields: {
      item: [['media:thumbnail', 'mediaThumbnail']],
    },
  })

  try {
    const feed = await parser.parseURL(url)

    return (feed.items ?? []).map((item) => {
      const guid = item.guid ?? item.link ?? ''
      const imageUrl =
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (item as any).mediaThumbnail?.$.url ??
        item.enclosure?.url ??
        null

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
