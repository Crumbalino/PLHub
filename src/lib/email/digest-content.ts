/**
 * Digest content generator.
 *
 * Fetches the top stories from the last 24 hours and structures them
 * for the breakfast digest email. Runs server-side only.
 */

import { supabase } from '@/lib/supabase'
import { filterPLContent, deduplicatePosts } from '@/lib/content-filter'
import { calculatePulseIndex, sortPosts } from '@/lib/scoring'
import { getSourceInfo } from '@/lib/sources'
import { decodeHtmlEntities, stripMarkdown, getPreviewBlurb } from '@/lib/formatting'

export interface DigestStory {
  id: string
  title: string
  blurb: string
  source: string
  sourceName: string
  url: string
  pulseIndex: number
  imageUrl: string | null
}

export interface DigestContent {
  date: string
  greeting: string
  topStory: DigestStory
  stories: DigestStory[]
  totalStoriesYesterday: number
}

/* ── Time-aware greeting ── */
function getGreeting(): string {
  const hour = new Date().getUTCHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

/* ── Date display ── */
function formatDigestDate(): string {
  return new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/* ── Generate digest content from last 24h posts ── */
export async function generateDigestContent(): Promise<DigestContent | null> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const { data, error } = await supabase
    .from('posts')
    .select('id, external_id, title, url, summary, content, source, club_slug, author, score, subreddit, image_url, fetched_at, published_at, clubs(*)')
    .gte('published_at', since)
    .order('score', { ascending: false })
    .limit(100)

  if (error || !data || data.length === 0) return null

  // Filter and deduplicate
  const posts = deduplicatePosts(filterPLContent(data as any[]))
  if (posts.length === 0) return null

  // Sort by pulse
  const sorted = sortPosts(posts as any[], 'pulse')

  // Transform to digest stories
  const toDigestStory = (post: any): DigestStory => {
    const sourceInfo = getSourceInfo(post)
    const blurb = post.summary
      ? stripMarkdown(decodeHtmlEntities(post.summary)).slice(0, 200) + (post.summary.length > 200 ? '…' : '')
      : getPreviewBlurb(post.content || '') || 'Read more on PLHub.'

    return {
      id: post.id,
      title: decodeHtmlEntities(post.title),
      blurb,
      source: post.source,
      sourceName: sourceInfo.name,
      url: post.url,
      pulseIndex: calculatePulseIndex(post),
      imageUrl: post.image_url || null,
    }
  }

  const stories = sorted.slice(0, 8).map(toDigestStory)
  const topStory = stories[0]
  const remaining = stories.slice(1)

  return {
    date: formatDigestDate(),
    greeting: getGreeting(),
    topStory,
    stories: remaining,
    totalStoriesYesterday: posts.length,
  }
}
