import { Post } from '@/types'
import { calculateIndex } from './plhub-index'

export const getTimeDisplay = (post: Post): string => {
  const published = new Date(post.published_at)
  const now = new Date()
  const diffMins = Math.floor((now.getTime() - published.getTime()) / 60000)
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`
  if (diffMins < 2880) return 'Yesterday'
  return published.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export const getClubCode = (slug: string): string => {
  const clubCodes: Record<string, string> = {
    'arsenal': '3', 'aston-villa': '7', 'bournemouth': '91', 'brentford': '94',
    'brighton': '36', 'chelsea': '8', 'crystal-palace': '31', 'everton': '11',
    'fulham': '54', 'ipswich': '40', 'leicester': '13', 'liverpool': '14',
    'man-city': '43', 'man-united': '1', 'newcastle': '4',
    'nottingham-forest': '17', 'southampton': '20', 'tottenham': '6',
    'west-ham': '21', 'wolves': '39', 'wolverhampton': '39',
  }
  return clubCodes[slug] || slug
}

export const toIndex = (score: number): number | null => {
  if (!score || score <= 0) return null
  const logScore = Math.log(score + 1)
  const maxScore = Math.log(100 + 1)
  return Math.max(1, Math.round((logScore / maxScore) * 100))
}
