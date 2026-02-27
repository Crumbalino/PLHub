import { RedditPost } from '@/types'
import { CLUBS, CLUBS_BY_SUBREDDIT } from './clubs'

const REDDIT_BASE = 'https://www.reddit.com'
const PL_SUBREDDIT = 'PremierLeague'

export interface FetchedRedditPost {
  external_id: string
  title: string
  url: string
  content: string | null
  source: 'reddit'
  club_slug: string | null
  author: string
  score: number
  subreddit: string
  image_url: string | null
  published_at: string
}

async function fetchSubreddit(subreddit: string): Promise<FetchedRedditPost[]> {
  const res = await fetch(
    `${REDDIT_BASE}/r/${subreddit}/hot.json?limit=25`,
    {
      headers: {
        'User-Agent': 'PLHub/1.0 (Premier League news aggregator)',
      },
      next: { revalidate: 0 },
    }
  )

  if (!res.ok) {
    console.error(`Failed to fetch r/${subreddit}: ${res.status}`)
    return []
  }

  const data = await res.json()
  const posts: RedditPost[] = data?.data?.children ?? []

  return posts
    .filter((p) => !p.data.stickied)
    .map((p) => {
      const sub = p.data.subreddit.toLowerCase()
      const clubSlug = CLUBS_BY_SUBREDDIT[sub] ?? null

      const imageUrl =
        p.data.preview?.images?.[0]?.source?.url?.replace(/&amp;/g, '&') ??
        (p.data.thumbnail?.startsWith('http') ? p.data.thumbnail : null)

      return {
        external_id: p.data.id,
        title: p.data.title,
        url: `${REDDIT_BASE}${p.data.permalink}`,
        content: p.data.selftext?.trim() || null,
        source: 'reddit' as const,
        club_slug: clubSlug,
        author: p.data.author,
        score: p.data.score,
        subreddit: p.data.subreddit,
        image_url: imageUrl,
        published_at: new Date(p.data.created_utc * 1000).toISOString(),
      }
    })
}

export async function fetchAllRedditPosts(): Promise<FetchedRedditPost[]> {
  const subreddits = [PL_SUBREDDIT, ...CLUBS.map((c) => c.subreddit)]

  const results = await Promise.allSettled(
    subreddits.map((sub) => fetchSubreddit(sub))
  )

  const allPosts: FetchedRedditPost[] = []
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
