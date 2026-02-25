import { Post } from '@/types'

export function calculateIndex(post: Post): number {
  const ageHours = (Date.now() - new Date(post.published_at).getTime()) / 36e5
  const recencyScore = Math.max(0, 100 - (ageHours * 4)) // decays over 25 hours
  const engagementScore = Math.min(100, Math.log10((post.score || 1) + 1) * 40)
  const sourceWeight = post.source === 'reddit' ? 1 : 1.3 // news outlets weighted slightly higher
  const index = Math.round((recencyScore * 0.4 + engagementScore * 0.6) * sourceWeight)
  return Math.min(99, Math.max(1, index))
}

export function getIndexColor(index: number): string {
  if (index > 75) return '#FF4500' // Reddit orange
  if (index >= 50) return '#F5C842' // PLHub gold
  return '#FFFFFF' // Opacity handled by text-white/50
}
