// ============================================================
// PLHub Source Detection
// Platform-agnostic — determines source info from post data
// ============================================================

import type { Post, SourceInfo } from './types'
import { SOURCE_COLORS, SOURCE_LOGOS } from './constants'

/**
 * Extract the domain from a URL, stripping 'www.' prefix.
 */
function extractDomain(url: string | null | undefined): string {
  if (!url) return ''
  try {
    return new URL(url).hostname.replace('www.', '')
  } catch {
    return ''
  }
}

/**
 * Domain → source name mapping.
 * Order matters: first match wins.
 */
const DOMAIN_MAP: [string, string][] = [
  ['bbc', 'BBC Sport'],
  ['sky', 'Sky Sports'],
  ['guardian', 'The Guardian'],
  ['athletic', 'The Athletic'],
  ['talksport', 'talkSPORT'],
  ['telegraph', 'The Telegraph'],
  ['mirror', 'Mirror'],
  ['thesun', 'The Sun'],
  ['goal.com', 'Goal'],
  ['90min', '90min'],
  ['football.london', 'football.london'],
  ['manchestereveningnews', 'Manchester Evening News'],
  ['liverpoolecho', 'Liverpool Echo'],
  ['chroniclelive', 'Chronicle Live'],
  ['fourfourtwo', 'FourFourTwo'],
  ['football365', 'Football365'],
  ['espn', 'ESPN FC'],
  ['independent', 'The Independent'],
  ['standard', 'Evening Standard'],
]

/**
 * Detect source info from a post.
 * Returns name, logo path (or null), and brand colour.
 */
export function getSourceInfo(post: Post): SourceInfo {
  // Reddit and YouTube are detected from post.source, not URL
  if (post.source === 'reddit') {
    return {
      name: 'Reddit',
      logo: SOURCE_LOGOS['Reddit'] ?? null,
      color: SOURCE_COLORS['Reddit'] ?? '#F97316',
    }
  }

  if (post.source === 'youtube') {
    return {
      name: 'YouTube',
      logo: null,
      color: SOURCE_COLORS['YouTube'] ?? '#E84080',
    }
  }

  // RSS posts — detect from URL domain
  const domain = extractDomain(post.url)

  for (const [keyword, name] of DOMAIN_MAP) {
    if (domain.includes(keyword)) {
      return {
        name,
        logo: SOURCE_LOGOS[name] ?? null,
        color: SOURCE_COLORS[name] ?? '#3AAFA9',
      }
    }
  }

  // Fallback: use the domain itself
  return {
    name: domain || 'News',
    logo: null,
    color: '#3AAFA9',
  }
}

/**
 * Get the left border colour for a story card.
 * Based on the source brand colour.
 */
export function getSourceBorderColor(post: Post): string {
  return getSourceInfo(post).color
}
