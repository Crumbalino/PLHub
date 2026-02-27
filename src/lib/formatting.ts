// ============================================================
// PLHub Formatting Utilities
// Platform-agnostic — pure string/date operations
// ============================================================

import type { Post } from './types'
import { FEED } from './constants'

/**
 * Decode HTML entities in a string.
 */
export function decodeHtmlEntities(text: string): string {
  if (!text) return ''
  return text
    .replace(/&#8216;/g, '\u2018')
    .replace(/&#8217;/g, '\u2019')
    .replace(/&#8220;/g, '\u201C')
    .replace(/&#8221;/g, '\u201D')
    .replace(/&#8211;/g, '\u2013')
    .replace(/&#8212;/g, '\u2014')
    .replace(/&#8230;/g, '\u2026')
    .replace(/&#39;/g, "'")
    .replace(/&#039;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&ndash;/g, '\u2013')
    .replace(/&mdash;/g, '\u2014')
    .replace(/&lsquo;/g, '\u2018')
    .replace(/&rsquo;/g, '\u2019')
    .replace(/&ldquo;/g, '\u201C')
    .replace(/&rdquo;/g, '\u201D')
    .replace(/&hellip;/g, '\u2026')
    .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
}

/**
 * Strip markdown formatting from text.
 */
export function stripMarkdown(text: string): string {
  if (!text) return ''
  return text
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    .replace(/#{1,6}\s?/g, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^>\s?/gm, '')
    .replace(/^[-*+]\s/gm, '')
    .replace(/^\d+\.\s/gm, '')
    .trim()
}

/**
 * Human-readable relative time display.
 * "Just now" → "2m ago" → "3h ago" → "Yesterday" → "26 Feb"
 */
export function getTimeDisplay(publishedAt: string): string {
  const published = new Date(publishedAt)
  const now = new Date()
  const diffMins = Math.floor((now.getTime() - published.getTime()) / 60000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`
  if (diffMins < 2880) return 'Yesterday'
  return published.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

/**
 * Estimated read time for the AI summary.
 */
export function getReadTimeLabel(summary: string | null): string {
  const wordCount = summary?.split(/\s+/).length ?? 0
  const mins = Math.max(1, Math.ceil(wordCount / 200))
  if (mins <= 1) return 'Quick read'
  return `${mins} min read`
}

/**
 * Extract a clean preview blurb from post content.
 * Used as the 2-line teaser before expansion.
 */
export function getPreviewBlurb(content: string | null): string | null {
  if (!content) return null
  const cleaned = content
    .replace(/<[^>]*>/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#*_~`>]/g, '')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/\s+/g, ' ')
    .trim()

  if (cleaned.length < FEED.previewBlurbMinChars) return null
  if (cleaned.length <= FEED.previewBlurbMaxChars) return cleaned

  const truncated = cleaned.substring(0, FEED.previewBlurbMaxChars)
  const lastSpace = truncated.lastIndexOf(' ')
  return truncated.substring(0, lastSpace) + '…'
}

/**
 * Format AI summary for display: decode entities, strip markdown,
 * then break into paragraphs every 2 sentences for readability.
 */
export function formatSummaryForDisplay(text: string): string {
  if (!text) return ''
  const cleaned = stripMarkdown(decodeHtmlEntities(text))
  const sentences = cleaned.split(/(?<=\.)\s+(?=[A-Z])/)
  const chunks: string[] = []
  for (let i = 0; i < sentences.length; i += 2) {
    chunks.push(sentences.slice(i, i + 2).join(' '))
  }
  return chunks.join('\n\n')
}

/**
 * Check if a post's image URL is valid and worth displaying.
 */
export function isValidImageUrl(url: string | null | undefined, source: string): boolean {
  if (!url) return false
  const invalidReddits = ['self', 'default', 'nsfw', '']
  if (source === 'reddit' && invalidReddits.includes(url)) return false
  if (source === 'reddit' && url.includes('external-preview')) return false
  return true
}

/**
 * Upgrade image URL to higher quality where possible.
 */
export function upgradeImageUrl(url: string | null | undefined): string | null {
  if (!url) return null

  let upgraded = url

  // BBC: replace small crops with larger ones
  if (upgraded.includes('bbc.co.uk') || upgraded.includes('bbci.co.uk')) {
    upgraded = upgraded.replace(/\/\d+x\d+\.(jpg|png|webp)/i, '/976x549.$1')
    upgraded = upgraded.replace(/\/\d+\/cpsprodpb/i, '/800/cpsprodpb')
  }

  // Sky Sports
  if (upgraded.includes('skysports.com') || upgraded.includes('skysports')) {
    upgraded = upgraded.replace(/width=\d+/i, 'width=800')
    upgraded = upgraded.replace(/height=\d+/i, 'height=450')
  }

  // Guardian
  if (upgraded.includes('guim.co.uk')) {
    upgraded = upgraded.replace(/width=\d+/i, 'width=800')
    upgraded = upgraded.replace(/\/\d+\.jpg/i, '/800.jpg')
  }

  // talkSPORT
  if (upgraded.includes('talksport.com') || upgraded.includes('talkSPORT')) {
    upgraded = upgraded.replace(/-\d+x\d+\.(jpg|png|webp)/i, '.$1')
  }

  // Generic WordPress: remove -WIDTHxHEIGHT
  upgraded = upgraded.replace(/-\d{2,4}x\d{2,4}\.(jpg|jpeg|png|webp)/i, '.$1')

  // Reddit previews
  if (upgraded.includes('thumbs.redd.it')) {
    upgraded = upgraded.replace('thumbs.redd.it', 'preview.redd.it')
  }
  if (upgraded.includes('preview.redd.it') && upgraded.includes('width=')) {
    upgraded = upgraded.replace(/width=\d+/i, 'width=800')
  }

  // Generic size params
  upgraded = upgraded.replace(/([?&])w=\d+/i, '$1w=800')
  upgraded = upgraded.replace(/([?&])width=\d+/i, '$1width=800')
  upgraded = upgraded.replace(/([?&])h=\d+/i, '$1h=450')
  upgraded = upgraded.replace(/([?&])quality=\d+/i, '$1quality=85')

  return upgraded
}
