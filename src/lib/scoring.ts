// ============================================================
// PLHub Scoring
// Platform-agnostic — pure math, no UI dependencies
// ============================================================

import type { Post, HeatLabel } from './types'
import { SCORING } from './constants'

/**
 * The PLHub Index: a combined score (1-99) factoring recency, engagement, and source quality.
 * This is the primary "pulse" sort — what makes PLHub feel alive.
 *
 * - Recency: full marks if just posted, decays to zero over 25 hours
 * - Engagement: logarithmic scale of Reddit score / social signals
 * - Source weight: RSS news outlets weighted slightly higher than Reddit (original reporting)
 */
export function calculatePulseIndex(post: Post): number {
  const ageHours = (Date.now() - new Date(post.published_at).getTime()) / 36e5
  const recencyScore = Math.max(0, 100 - ageHours * 4) // decays over 25 hours
  const engagementScore = Math.min(100, Math.log10((post.score || 1) + 1) * 40)
  const sourceWeight = post.source === 'reddit' ? 1 : 1.3
  const index = Math.round((recencyScore * 0.4 + engagementScore * 0.6) * sourceWeight)
  return Math.min(99, Math.max(1, index))
}

/**
 * Calculate a logarithmic index score (0-100) for display.
 * Used for the visual score badge on cards.
 * Returns null if post has no meaningful score.
 */
export function calculateIndexScore(score: number, maxScore: number): number | null {
  if (!score || score <= 0 || !maxScore || maxScore <= 0) return null
  const logScore = Math.log(score + 1)
  const logMax = Math.log(maxScore + 1)
  return Math.max(1, Math.round((logScore / logMax) * 100))
}

/**
 * Calculate a heat label based on pulse index.
 */
export function calculateHeatLabel(pulseIndex: number): HeatLabel {
  if (pulseIndex >= 75) return 'Hot'
  if (pulseIndex >= 50) return 'Warm'
  if (pulseIndex >= 30) return 'Rising'
  return null
}

/**
 * "Hot" sort score: score / age^gravity.
 * Recent high-scoring posts rank highest.
 */
export function calculateHotScore(post: Post): number {
  const score = post.score || 0
  const publishedAt = new Date(post.published_at).getTime()
  const hoursAgo = Math.max(1, (Date.now() - publishedAt) / (1000 * 60 * 60))
  return score / Math.pow(hoursAgo, SCORING.hotGravity)
}

/**
 * Sort posts by the specified mode.
 * Returns a new array (does not mutate input).
 */
export function sortPosts(posts: Post[], mode: 'pulse' | 'hot' | 'new'): Post[] {
  const sorted = [...posts]

  switch (mode) {
    case 'hot':
      sorted.sort((a, b) => calculateHotScore(b) - calculateHotScore(a))
      break
    case 'new':
      sorted.sort(
        (a, b) =>
          new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
      )
      break
    case 'pulse':
    default:
      sorted.sort((a, b) => calculatePulseIndex(b) - calculatePulseIndex(a))
      break
  }

  return sorted
}

/**
 * Find the maximum score from an array of posts.
 */
export function getMaxScore(posts: Post[]): number {
  return Math.max(...posts.map(p => p.score ?? 0), 1)
}

/**
 * Get the colour for the pulse index badge.
 */
export function getIndexColor(index: number): string {
  if (index > 75) return '#FF4500'
  if (index >= 50) return '#F5C842'
  return '#FFFFFF'
}
