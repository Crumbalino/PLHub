// ============================================================
// PLHub Type Definitions
// Platform-agnostic — used by both Next.js web and React Native
// ============================================================

// --- Database Models ---

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
  source: 'reddit' | 'rss' | 'youtube'
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

export interface Digest {
  id: string
  club_slug: string | null
  digest_text: string
  story_ids: string[]
  generated_at: string
  date: string
}

// --- API Response Types ---

export interface SourceInfo {
  name: string
  logo: string | null
  color: string
}

/** A post enriched with all computed display data — ready to render */
export interface FeedPost {
  id: string
  title: string
  url: string
  previewBlurb: string | null
  summary: string | null
  source: 'reddit' | 'rss' | 'youtube'
  sourceInfo: SourceInfo
  clubs: ClubBadge[]
  isMatchReport: boolean
  imageUrl: string | null
  indexScore: number | null
  heatLabel: HeatLabel | null
  timeDisplay: string
  readTimeLabel: string
  publishedAt: string
}

export interface ClubBadge {
  slug: string
  shortName: string
  code: string
  badgeUrl: string
}

export type HeatLabel = 'Hot' | 'Warm' | 'Rising' | null

export interface FeedResponse {
  posts: FeedPost[]
  total: number
  page: number
  hasMore: boolean
}

export interface TrendingPost {
  id: string
  rank: number
  title: string
  indexScore: number | null
  clubs: ClubBadge[]
}

export interface TrendingResponse {
  posts: TrendingPost[]
}

export interface DigestResponse {
  digest: string
  generatedAt: string
  storyCount: number
  topStories: { id: string; title: string; club: string | null }[]
}

export type SortMode = 'pulse' | 'hot' | 'new'

// --- Raw API types (from external sources) ---

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
