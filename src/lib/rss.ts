import Parser from 'rss-parser'

const BBC_FOOTBALL_RSS = 'https://feeds.bbci.co.uk/sport/football/rss.xml'

export interface FetchedRssPost {
  external_id: string
  title: string
  url: string
  content: string | null
  source: 'rss'
  club_slug: null
  author: string | null
  score: number
  subreddit: null
  image_url: string | null
  published_at: string
}

export async function fetchBBCSportRss(): Promise<FetchedRssPost[]> {
  const parser = new Parser({
    customFields: {
      item: [['media:thumbnail', 'mediaThumbnail']],
    },
  })

  try {
    const feed = await parser.parseURL(BBC_FOOTBALL_RSS)

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
        subreddit: null,
        image_url: imageUrl,
        published_at: item.isoDate ?? item.pubDate ?? new Date().toISOString(),
      }
    })
  } catch (err) {
    console.error('Failed to fetch BBC Sport RSS:', err)
    return []
  }
}
