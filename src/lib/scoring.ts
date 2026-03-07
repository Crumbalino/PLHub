// ============================================================
// PLHub Index: Four-Pillar Scoring System (0-100)
// Platform-agnostic — pure math, no UI dependencies
// ============================================================
//
// The PLHub Index combines four equally weighted pillars (0-25 each):
// 1. SOURCE CREDIBILITY: Trust in the publication/author
// 2. RECENCY: How fresh is the story (decays over time)
// 3. ENGAGEMENT: Community interest (upvotes, comments)
// 4. SIGNIFICANCE: Editorial importance (set by AI)
//
// Final score = credibility + live_recency + engagement + significance
// ============================================================

import type { Post, HeatLabel } from './types'

/**
 * Source credibility mapping (0-25 points)
 */
function getSourceCredibility(source: string, subreddit: string | null, upvoteRatio?: number, url?: string): number {
  if (source === 'rss') {
    const sourceMap: Record<string, number> = {
      'bbc': 25,
      'guardian': 24,
      'athletic': 24,
      'sky': 22,
      'espn': 18,
      'talksport': 14,
      'telegraph': 16,
      'mirror': 12,
      'thesun': 10,
      'goal': 14,
      '90min': 13,
    }

    // subreddit is null for RSS posts — fall back to URL domain
    const lowerSource = (subreddit ?? url ?? '').toLowerCase()
    for (const [key, score] of Object.entries(sourceMap)) {
      if (lowerSource.includes(key)) {
        return score
      }
    }
    return 10
  }

  // Reddit: base 8, plus bonus for upvote ratio (0-6 bonus, max 14)
  if (source === 'reddit') {
    if (upvoteRatio !== undefined && upvoteRatio > 0) {
      // Upvote ratio bonus: high ratio (>0.8) gets more points
      const ratio = Math.min(1, upvoteRatio)
      const bonus = Math.round((ratio - 0.5) * 12) // 0.5 ratio = 0 bonus, 1.0 ratio = 6 bonus
      return Math.min(14, 8 + Math.max(0, bonus))
    }
    return 8
  }

  // YouTube and other sources
  return 10
}

/**
 * Recency score (0-25 points, calculated fresh on each request)
 */
export function calculateRecencyScore(publishedAtStr: string): number {
  const ageHours = (Date.now() - new Date(publishedAtStr).getTime()) / (1000 * 60 * 60)

  if (ageHours <= 1) return 25
  if (ageHours <= 3) return 20
  if (ageHours <= 6) return 15
  if (ageHours <= 12) return 10
  if (ageHours <= 24) return 5
  return 1
}

/**
 * Engagement score (0-25 points)
 * Reddit: logarithmic scale of upvotes + comments
 * RSS: flat 12 (we can't measure engagement yet)
 */
function getEngagementScore(post: Post): number {
  if (post.source === 'reddit') {
    const totalEngagement = (post.score ?? 0) + (post.num_comments ?? 0) + 1
    const score = Math.round(Math.log10(totalEngagement) * 10)
    return Math.min(25, Math.max(0, score))
  }

  // RSS posts: flat engagement score
  if (post.source === 'rss') {
    return 12
  }

  // YouTube and other sources
  return 12
}

/**
 * Calculate the complete PLHub Index (0-100)
 * Credibility + live recency + engagement + significance + multiSource bonus
 */
export function calculatePLHubIndex(post: Post): number {
  const credibility = getSourceCredibility(post.source, post.subreddit, (post as any).upvote_ratio, post.url)
  const recency = calculateRecencyScore(post.published_at)
  const engagement = getEngagementScore(post)
  const significance = (post as any).score_significance ?? 12

  const sourceCount = (post as any).source_count ?? 1
  const multiSourceBonus = sourceCount >= 3 ? 8 : sourceCount >= 2 ? 4 : 0

  return Math.min(100, credibility + recency + engagement + significance + multiSourceBonus)
}

/**
 * Get component scores for display in tooltips
 */
export interface IndexComponents {
  credibility: number
  recency: number
  engagement: number
  significance: number
  multiSource: number
  total: number
}

export function getIndexComponents(post: Post): IndexComponents {
  const credibility = getSourceCredibility(post.source, post.subreddit, (post as any).upvote_ratio, post.url)
  const recency = calculateRecencyScore(post.published_at)
  const engagement = getEngagementScore(post)
  const significance = (post as any).score_significance ?? 12

  const sourceCount = (post as any).source_count ?? 1
  const multiSource = sourceCount >= 3 ? 8 : sourceCount >= 2 ? 4 : 0

  return {
    credibility,
    recency,
    engagement,
    significance,
    multiSource,
    total: credibility + recency + engagement + significance + multiSource,
  }
}

/**
 * Calculate a heat label based on index score
 */
export function calculateHeatLabel(indexScore: number): HeatLabel {
  if (indexScore >= 75) return 'Hot'
  if (indexScore >= 50) return 'Warm'
  if (indexScore >= 30) return 'Rising'
  return null
}

/**
 * Get the colour for the pulse index badge
 */
export function getIndexColor(index: number): string {
  if (index >= 75) return '#FF4500'
  if (index >= 50) return '#F5C842'
  return '#FFFFFF'
}

/**
 * Sort posts by the specified mode
 */
export function sortPosts(posts: Post[], mode: 'pulse' | 'hot' | 'new'): Post[] {
  const sorted = [...posts]

  switch (mode) {
    case 'hot':
      // Hot: recent high-engagement posts
      sorted.sort((a, b) => {
        const aScore = (a.score ?? 0) / Math.pow(Math.max(1, (Date.now() - new Date(a.published_at).getTime()) / (1000 * 60 * 60)), 1.5)
        const bScore = (b.score ?? 0) / Math.pow(Math.max(1, (Date.now() - new Date(b.published_at).getTime()) / (1000 * 60 * 60)), 1.5)
        return bScore - aScore
      })
      break
    case 'new':
      sorted.sort(
        (a, b) =>
          new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
      )
      break
    case 'pulse':
    default:
      sorted.sort((a, b) => calculatePLHubIndex(b) - calculatePLHubIndex(a))
      break
  }

  return sorted
}

/**
 * Get the maximum index score from an array of posts
 */
export function getMaxScore(posts: Post[]): number {
  return Math.max(...posts.map(p => calculatePLHubIndex(p)), 1)
}
