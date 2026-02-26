'use client'

import { useState } from 'react'
import { Post } from '@/types'
import { CLUBS_BY_SLUG } from '@/lib/clubs'
import { decodeHtmlEntities, stripMarkdown, upgradeImageUrl, formatSummaryForDisplay } from '@/lib/utils'

// Detect ALL clubs from post text (not just the first match)
const CLUB_PATTERNS: [RegExp, string][] = [
  [/\barsenal\b/i, 'arsenal'],
  [/\baston villa\b/i, 'aston-villa'],
  [/\bbournemouth\b/i, 'bournemouth'],
  [/\bbrentford\b/i, 'brentford'],
  [/\bbrighton\b/i, 'brighton'],
  [/\bchelsea\b/i, 'chelsea'],
  [/\bcrystal palace\b/i, 'crystal-palace'],
  [/\beverton\b/i, 'everton'],
  [/\bfulham\b/i, 'fulham'],
  [/\bipswich\b/i, 'ipswich'],
  [/\bleicester\b/i, 'leicester'],
  [/\bliverpool\b/i, 'liverpool'],
  [/\bman(?:chester)?\s*city\b/i, 'man-city'],
  [/\bman(?:chester)?\s*(?:utd|united)\b/i, 'man-united'],
  [/\bnewcastle\b/i, 'newcastle'],
  [/\bnott(?:ingham)?\s*forest\b/i, 'nottingham-forest'],
  [/\bsouthampton\b/i, 'southampton'],
  [/\b(?:spurs|tottenham)\b/i, 'tottenham'],
  [/\bwest ham\b/i, 'west-ham'],
  [/\bwolv(?:es|erhampton)\b/i, 'wolves'],
]

function detectAllClubs(post: Post): string[] {
  const text = ((post.title || '') + ' ' + (post.summary || '') + ' ' + (post.content || '')).toLowerCase()
  const found: string[] = []
  for (const [pattern, slug] of CLUB_PATTERNS) {
    if (pattern.test(text) && !found.includes(slug)) {
      found.push(slug)
    }
  }
  return found
}

interface StoryCardProps {
  post: Post
  indexScore?: number | null
  featured?: boolean
}

const SOURCE_COLORS: Record<string, string> = {
  'BBC Sport': '#FFD008',
  'Sky Sports': '#0072BC',
  'The Guardian': '#052962',
  'The Athletic': '#D4442E',
  'talkSPORT': '#E4002B',
  'Goal': '#00A550',
  '90min': '#8B5CF6',
  'The Telegraph': '#1D1D1B',
  'Mirror': '#E00000',
  'The Sun': '#C4122F',
  'Reddit': '#FF4500',
  'YouTube': '#FF0000',
}

const getSourceInfo = (post: Post): { src: string | null; name: string } | null => {
  const domain = post.url
    ? (() => {
        try {
          return new URL(post.url).hostname.replace('www.', '')
        } catch {
          return ''
        }
      })()
    : ''
  if (post.source === 'reddit') return { src: '/sources/reddit.png', name: 'Reddit' }
  if (post.source === 'youtube') return { src: null, name: 'YouTube' }
  if (domain.includes('bbc')) return { src: '/sources/bbc.png', name: 'BBC Sport' }
  if (domain.includes('sky')) return { src: '/sources/skysports.png', name: 'Sky Sports' }
  if (domain.includes('guardian')) return { src: '/sources/guardian.png', name: 'The Guardian' }
  if (domain.includes('talksport')) return { src: '/sources/talksport.png', name: 'talkSPORT' }
  if (domain.includes('goal')) return { src: '/sources/goal.png', name: 'Goal' }
  if (domain.includes('90min')) return { src: '/sources/90min.png', name: '90min' }
  if (domain.includes('athletic')) return { src: null, name: 'The Athletic' }
  if (domain.includes('telegraph')) return { src: null, name: 'The Telegraph' }
  if (domain.includes('mirror')) return { src: null, name: 'Mirror' }
  if (domain.includes('sun')) return { src: null, name: 'The Sun' }
  return { src: null, name: domain || 'News' }
}

const getTimeDisplay = (post: Post): string => {
  const published = new Date(post.published_at)
  const now = new Date()
  const diffMins = Math.floor((now.getTime() - published.getTime()) / 60000)
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`
  if (diffMins < 2880) return 'Yesterday'
  return published.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

const getClubCode = (slug: string): string => {
  const clubCodes: Record<string, string> = {
    arsenal: '3',
    'aston-villa': '7',
    bournemouth: '91',
    brentford: '94',
    brighton: '36',
    chelsea: '8',
    'crystal-palace': '31',
    everton: '11',
    fulham: '54',
    ipswich: '40',
    leicester: '13',
    liverpool: '14',
    'man-city': '43',
    'man-united': '1',
    newcastle: '4',
    'nottingham-forest': '17',
    southampton: '20',
    tottenham: '6',
    'west-ham': '21',
    wolves: '39',
    wolverhampton: '39',
  }
  return clubCodes[slug] || slug
}

const isValidImageUrl = (url: string | null | undefined, source: string): boolean => {
  if (!url) return false
  const invalidReddits = ['self', 'default', 'nsfw', '']
  if (source === 'reddit' && invalidReddits.includes(url)) return false
  if (source === 'reddit' && url.includes('external-preview')) return false
  return true
}

const getReadTimeLabel = (post: Post): string => {
  const summaryWords = post.summary?.split(' ').length ?? 0
  const mins = Math.max(1, Math.ceil(summaryWords / 200))
  if (mins <= 1) return 'Quick read'
  return `${mins} min read`
}

function getSourceBorderColor(post: Post): string {
  if (post.source === 'youtube') return '#FF0000'
  if (post.source === 'reddit') return '#FF4500'
  const sourceInfo = getSourceInfo(post)
  if (!sourceInfo) return '#C4A23E'
  return SOURCE_COLORS[sourceInfo.name] || '#C4A23E'
}

// Extract a clean preview blurb from content
function getPreviewBlurb(post: Post): string | null {
  // Don't show blurb if we have a summary — the expand handles that
  const raw = post.content || ''
  if (!raw) return null
  const cleaned = raw
    .replace(/<[^>]*>/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#*_~`>]/g, '')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  if (cleaned.length < 30) return null
  if (cleaned.length <= 140) return cleaned
  const truncated = cleaned.substring(0, 140)
  const lastSpace = truncated.lastIndexOf(' ')
  return truncated.substring(0, lastSpace) + '…'
}

export default function StoryCard({ post, indexScore, featured = false }: StoryCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [imgError, setImgError] = useState(false)

  const sourceInfo = getSourceInfo(post)
  const sourceName = sourceInfo?.name ?? 'News'
  const sourceLogo = sourceInfo?.src ?? null
  const hasValidImage = isValidImageUrl(post.image_url, post.source)
  const readTimeLabel = getReadTimeLabel(post)
  const borderColor = getSourceBorderColor(post)
  const previewBlurb = getPreviewBlurb(post)

  // Multi-club detection
  const detectedClubs = post.club_slug ? [post.club_slug, ...detectAllClubs(post).filter(s => s !== post.club_slug)] : detectAllClubs(post)
  const uniqueClubs = Array.from(new Set(detectedClubs))
  const isMatchReport = uniqueClubs.length === 2

  return (
    <article
      id={`post-${post.id}`}
      className={`bg-[#183538] rounded-xl overflow-hidden border-l-4 transition-all duration-500 ${
        expanded ? 'animate-card-glow' : ''
      }`}
      style={{
        borderLeftColor: borderColor,
      }}
    >
      {/* IMAGE BLOCK */}
      {hasValidImage && !imgError && (
        <div className="relative w-full h-[160px] md:h-[220px]">
          <img
            src={(upgradeImageUrl(post.image_url) as string) || ''}
            alt=""
            className="w-full h-full object-cover object-top"
            onError={() => setImgError(true)}
            loading="lazy"
            decoding="async"
            sizes="(max-width: 768px) 100vw, 600px"
          />

          {/* Gradient overlay */}
          <div className="absolute bottom-0 left-0 right-0 h-[80px] bg-gradient-to-t from-[#0B1F21cc] to-transparent" />

          {/* Source badge + name on overlay */}
          <div className="absolute bottom-3 left-4 flex items-center gap-2 z-10">
            {sourceLogo ? (
              <img
                src={sourceLogo}
                alt=""
                className="w-5 h-5 rounded-full object-cover bg-white/10 shrink-0"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
              />
            ) : (
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: borderColor }}
              />
            )}
            <span className="text-sm font-medium text-white drop-shadow-md">{sourceName}</span>
          </div>

          {/* Timestamp */}
          <div className="absolute bottom-3 right-4 text-sm text-white/70">{getTimeDisplay(post)}</div>

          {/* Score badge — gold icon + white number */}
          {indexScore && (
            <div
              className={`absolute top-3 right-3 bg-[#00555A] text-white text-sm font-bold px-2.5 py-1.5 rounded-md flex items-center gap-1.5 z-10 shadow-lg tabular-nums ${expanded ? 'animate-badge-pulse' : ''}`}
              style={{ animationDelay: expanded ? '200ms' : '0ms' }}
            >
              <svg width="14" height="14" viewBox="0 0 32 32" fill="none">
                <path d="M4 16h7l2.5-7 5 14 2.5-7H28" stroke="#C4A23E" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="text-white">{indexScore}</span>
            </div>
          )}

          {/* YouTube play button overlay */}
          {post.source === 'youtube' && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-14 h-14 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
                <span className="text-2xl text-white">▶</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Text-only header if no image */}
      {!hasValidImage && (
        <div className="flex items-center gap-2 px-5 pt-4 pb-2">
          {sourceLogo ? (
            <img
              src={sourceLogo}
              alt=""
              className="w-5 h-5 rounded-full object-cover bg-white/10 shrink-0"
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
            />
          ) : (
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: borderColor }}
            />
          )}
          <span className="text-xs font-medium text-white/70">{sourceName}</span>
          <span className="flex-1"></span>
          {indexScore && (
            <div className="bg-[#00555A] text-white text-sm font-bold px-2.5 py-1.5 rounded-md flex items-center gap-1.5 shadow-sm tabular-nums mr-2">
              <svg width="12" height="12" viewBox="0 0 32 32" fill="none">
                <path d="M4 16h7l2.5-7 5 14 2.5-7H28" stroke="#C4A23E" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="text-white">{indexScore}</span>
            </div>
          )}
          <span className="text-xs text-white/50">{getTimeDisplay(post)}</span>
        </div>
      )}

      {/* CONTENT AREA */}
      <div className="px-4 md:px-5 pt-4 pb-5">
        {/* Headline */}
        <h3 className="text-xl md:text-2xl font-bold text-white leading-tight tracking-tight mb-2 line-clamp-3">
          {decodeHtmlEntities(post.title)}
        </h3>

        {/* Preview blurb — 2 lines of context before expand */}
        {previewBlurb && !expanded && (
          <p className="text-sm text-white/60 leading-relaxed line-clamp-2 mb-3">
            {previewBlurb}
          </p>
        )}

        {/* Expand button (only if summary exists) */}
        {post.summary && (
          <div className="mb-3">
            <div className="text-center mt-2">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setExpanded(!expanded)
                }}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#C4A23E] hover:text-[#d4b24e] transition-all duration-200 cursor-pointer select-none group"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 32 32"
                  fill="none"
                  className={`transition-all duration-300 ${expanded ? 'animate-badge-pulse' : 'group-hover:scale-110'}`}
                >
                  <path d="M4 16h7l2.5-7 5 14 2.5-7H28" stroke="#C4A23E" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {expanded ? 'Less' : 'Get the summary'}
              </button>
            </div>

            <div
              className="overflow-hidden transition-all ease-out"
              style={{
                maxHeight: expanded ? '800px' : '0px',
                opacity: expanded ? 1 : 0,
                transitionDuration: expanded ? '600ms' : '300ms',
                transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              <div className={expanded ? 'animate-summary-reveal' : ''} style={{ animationDelay: '150ms' }}>
                <div className="border-l-2 border-l-[#C4A23E] pl-4 py-3 mb-3 mt-3 bg-white/[0.03] rounded-r-lg">
                  {/* Summary text — white, larger, high line-height for readability */}
                  <div className="summary-text text-[15px] text-white leading-[2.1] tracking-wide whitespace-pre-line">
                    {formatSummaryForDisplay(post.summary || '')}
                  </div>

                  {/* Reading time + .SP sign-off */}
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-xs text-white/50">{readTimeLabel}</span>
                    <span className="text-xs text-white/30 select-none font-mono">.SP</span>
                  </div>

                  {/* Source link — secondary, muted */}
                  <a
                    href={post.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-block mt-3 text-xs text-white/40 hover:text-white/70 transition-colors"
                  >
                    {post.source === 'youtube' ? 'Watch on YouTube ↗' :
                     post.source === 'reddit' ? 'View original thread ↗' : 'Read full article ↗'}
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer row — clubs */}
        <div className="flex items-center gap-2 pt-3 border-t border-white/5">
          {uniqueClubs.length > 0 && (
            <div className="flex items-center gap-1.5">
              {uniqueClubs.slice(0, 4).map((slug, idx) => (
                <div key={slug} className="flex items-center gap-1">
                  {idx === 1 && isMatchReport && (
                    <span className="text-[10px] text-white/30 mx-0.5">vs</span>
                  )}
                  {idx > 0 && !isMatchReport && (
                    <span className="text-[10px] text-white/20 mx-0.5">·</span>
                  )}
                  <img
                    src={`https://resources.premierleague.com/premierleague/badges/t${getClubCode(slug)}.png`}
                    alt=""
                    className="w-5 h-5 object-contain"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = 'none'
                    }}
                  />
                  <span className="text-xs text-white/70">{CLUBS_BY_SLUG[slug]?.shortName}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </article>
  )
}
