// ============================================================
// PLHub Post Transformer
// Converts raw DB Post → enriched FeedPost for the API response.
// All display data is pre-computed server-side so the UI
// receives ready-to-render objects with zero business logic.
// ============================================================

import type { Post, FeedPost, TrendingPost } from './types'
import { calculatePulseIndex, calculateHeatLabel } from './scoring'
import { getSourceInfo } from './sources'
import { detectAllClubs, toClubBadges } from './clubs'
import {
  getTimeDisplay,
  getReadTimeLabel,
  getPreviewBlurb,
  decodeHtmlEntities,
  isValidImageUrl,
  upgradeImageUrl,
} from './formatting'

/**
 * Transform a raw DB post into a fully enriched FeedPost.
 * Every field the UI needs is computed here — components just render props.
 */
export function transformPost(post: Post): FeedPost {
  const pulseIndex = calculatePulseIndex(post)
  const heatLabel = calculateHeatLabel(pulseIndex)
  const sourceInfo = getSourceInfo(post)
  const detectedSlugs = detectAllClubs(post.title, post.content, post.summary, post.club_slug)
  const clubs = toClubBadges(detectedSlugs)
  const title = decodeHtmlEntities(post.title)
  const imageUrl = isValidImageUrl(post.image_url, post.source)
    ? upgradeImageUrl(post.image_url)
    : null

  return {
    id: post.id,
    title,
    url: post.url,
    previewBlurb: getPreviewBlurb(post.content),
    summary: post.summary,
    source: post.source,
    sourceInfo,
    clubs,
    isMatchReport: /\b\d+[-–]\d+\b/.test(title) || /match report/i.test(title),
    imageUrl,
    indexScore: pulseIndex,
    heatLabel,
    timeDisplay: getTimeDisplay(post.published_at),
    readTimeLabel: getReadTimeLabel(post.summary),
    publishedAt: post.published_at,
  }
}

/**
 * Transform a batch of posts for the feed response.
 */
export function transformPosts(posts: Post[]): FeedPost[] {
  return posts.map(transformPost)
}

/**
 * Transform posts into the trending strip format.
 * Lighter weight — only the fields needed for the horizontal scroll.
 */
export function transformTrendingPosts(posts: Post[]): TrendingPost[] {
  return posts.map((post, index) => {
    const detectedSlugs = detectAllClubs(post.title, post.content, post.summary, post.club_slug)
    return {
      id: post.id,
      rank: index + 1,
      title: decodeHtmlEntities(post.title),
      indexScore: calculatePulseIndex(post),
      clubs: toClubBadges(detectedSlugs),
    }
  })
}
