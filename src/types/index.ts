export interface Club {
  slug: string
  name: string
  shortName: string
  subreddit: string
  primaryColor: string
  secondaryColor: string
  badgeEmoji: string
  badgeUrl: string
}

export interface Post {
  id: string
  external_id: string
  title: string
  url: string
  content: string | null
  summary: string | null
  source: 'reddit' | 'rss'
  club_slug: string | null
  author: string | null
  score: number
  previous_score?: number
  num_comments?: number
  subreddit: string | null
  image_url: string | null
  fetched_at: string
  published_at: string
  clubs?: Club
}

export interface RedditPost {
  data: {
    id: string
    title: string
    url: string
    selftext: string
    author: string
    score: number
    subreddit: string
    permalink: string
    thumbnail: string
    stickied: boolean
    preview?: {
      images?: Array<{
        source: {
          url: string
        }
      }>
    }
    created_utc: number
  }
}

export interface RssItem {
  guid?: string
  title?: string
  link?: string
  contentSnippet?: string
  content?: string
  isoDate?: string
  pubDate?: string
  enclosure?: {
    url?: string
  }
}
