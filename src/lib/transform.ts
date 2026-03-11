// ============================================================
// PLHub Post Transformer
// Converts raw DB Post → enriched FeedPost for the API response.
// All display data is pre-computed server-side so the UI
// receives ready-to-render objects with zero business logic.
// ============================================================

import type { Post, FeedPost, TrendingPost } from './types'
import { calculatePLHubIndex, calculateHeatLabel, getIndexComponents } from './scoring'
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
  const pulseIndex = calculatePLHubIndex(post)
  const heatLabel = calculateHeatLabel(pulseIndex)
  const components = getIndexComponents(post)
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
    summaryHook: (post as any).summary_hook || null,
    generated_headline: (post as any).generated_headline || null,
    card_type: (post as any).card_type || null,
    card_data: null,
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
    scoreCredibility: components.credibility,
    scoreRecency: components.recency,
    scoreEngagement: components.engagement,
    scoreSignificance: components.significance,
    scoreMultiSource: components.multiSource,
  }
}

/**
 * Transform a batch of posts for the feed response.
 */
export function transformPosts(posts: Post[]): FeedPost[] {
  const transformed = posts.map(transformPost)

  // Rescale index scores so the batch always spreads 35–95
  // Best story of the day = 95, weakest = 35, rest proportional
  const scores = transformed.map(p => p.indexScore ?? 0).filter(s => s > 0)
  if (scores.length < 2) return transformed
  const min = Math.min(...scores)
  const max = Math.max(...scores)
  if (max === min) return transformed

  return transformed.map(p => ({
    ...p,
    indexScore: p.indexScore != null
      ? Math.round(35 + ((p.indexScore - min) / (max - min)) * 60)
      : p.indexScore,
  }))
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
      indexScore: calculatePLHubIndex(post),
      clubs: toClubBadges(detectedSlugs),
    }
  })
}
