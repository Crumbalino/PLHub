'use client'

import { useState } from 'react'
import { Post } from '@/types'
import { CLUBS_BY_SLUG } from '@/lib/clubs'
import { decodeHtmlEntities, stripMarkdown } from '@/lib/utils'

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

const calculateReadTime = (post: Post): string => {
  const titleWords = post.title?.split(' ').length ?? 0
  const summaryWords = post.summary?.split(' ').length ?? 0
  const totalWords = titleWords + summaryWords
  const mins = Math.max(1, Math.ceil(totalWords / 200))
  return `~${mins} min read`
}

function getSourceBorderColor(post: Post): string {
  if (post.source === 'youtube') return '#FF0000'
  if (post.source === 'reddit') return '#FF4500'
  const sourceInfo = getSourceInfo(post)
  if (!sourceInfo) return '#C4A23E'
  return SOURCE_COLORS[sourceInfo.name] || '#C4A23E'
}

const getCTAText = (post: Post): string => {
  if (post.source === 'youtube') return 'Watch →'
  if (post.source === 'reddit') return 'Read thread →'
  return 'Read article →'
}

export default function StoryCard({ post, indexScore, featured = false }: StoryCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [imgError, setImgError] = useState(false)

  const sourceInfo = getSourceInfo(post)
  const sourceName = sourceInfo?.name ?? 'News'
  const hasValidImage = isValidImageUrl(post.image_url, post.source)
  const readTime = calculateReadTime(post)
  const borderColor = getSourceBorderColor(post)

  return (
    <article
      id={`post-${post.id}`}
      className="bg-[#152B2E] rounded-xl overflow-hidden border-l-4 hover:brightness-110 transition duration-200"
      style={{ borderLeftColor: borderColor }}
    >
      {/* IMAGE BLOCK */}
      {hasValidImage && !imgError && (
        <div className="relative w-full h-[180px] md:h-[220px]">
          <img
            src={post.image_url || ''}
            alt=""
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
            loading="lazy"
          />

          {/* Gradient overlay */}
          <div className="absolute bottom-0 left-0 right-0 h-[80px] bg-gradient-to-t from-[#0B1F21cc] to-transparent" />

          {/* Source badge on overlay */}
          <div className="absolute bottom-3 left-4 flex items-center gap-1.5">
            {sourceInfo?.src ? (
              <img
                src={sourceInfo.src}
                alt={sourceName}
                className="h-4 w-auto object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none'
                }}
              />
            ) : (
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: borderColor }} />
            )}
            <span className="text-xs font-medium text-white">{sourceName}</span>
          </div>

          {/* Timestamp */}
          <div className="absolute bottom-3 right-4 text-xs text-white/70">{getTimeDisplay(post)}</div>

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
        <div className="flex items-center gap-2 px-5 pt-4 pb-2 text-xs border-b border-white/5">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: borderColor }} />
          <span className="font-medium text-gray-300">{sourceName}</span>
          <div className="flex-1" />
          <span className="text-gray-500">{getTimeDisplay(post)}</span>
        </div>
      )}

      {/* CONTENT AREA */}
      <div className="px-5 pt-4 pb-5">
        {/* Headline */}
        <h3 className="text-xl font-semibold text-white leading-snug tracking-tight mb-3 line-clamp-3">
          {decodeHtmlEntities(post.title)}
        </h3>

        {/* Expand button (only if summary exists) */}
        {post.summary && (
          <div className="mb-3">
            <button
              onClick={() => setExpanded(!expanded)}
              className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-white cursor-pointer transition-colors select-none"
            >
              {expanded ? 'Less ▾' : 'More ▸'}
            </button>

            {expanded && (
              <div className="border-l-2 border-l-[#00555A] pl-4 py-2 mt-3 mb-3">
                <p className="text-base text-gray-200 leading-relaxed mb-3">
                  {stripMarkdown(decodeHtmlEntities(post.summary))}
                </p>
                <a
                  href={post.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-block text-sm font-semibold text-[#C4A23E] hover:underline"
                >
                  {getCTAText(post)}
                </a>
              </div>
            )}
          </div>
        )}

        {/* Footer row */}
        <div className="flex items-center justify-between pt-3 border-t border-white/5">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            {post.club_slug && (
              <>
                <img
                  src={`https://resources.premierleague.com/premierleague/badges/t${getClubCode(post.club_slug)}.svg`}
                  alt=""
                  className="w-[16px] h-[16px] object-contain"
                />
                <span>{CLUBS_BY_SLUG[post.club_slug]?.shortName}</span>
                <span>·</span>
              </>
            )}
            <span>{readTime}</span>
            {post.source === 'reddit' && post.score && (
              <>
                <span>·</span>
                <span>
                  ↑ {post.score > 1000 ? `${(post.score / 1000).toFixed(1)}k` : post.score}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </article>
  )
}
