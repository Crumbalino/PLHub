'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Post } from '@/types'
import { CLUBS_BY_SLUG } from '@/lib/clubs'
import { decodeHtmlEntities } from '@/lib/utils'
import { calculateIndex, getIndexColor } from '@/lib/plhub-index'
import JsonLd from './JsonLd'
import PulseBadge from './PulseBadge'

interface StoryCardProps {
  post: Post
  indexScore?: number | null
  featured?: boolean
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
    arsenal: '1',
    'aston-villa': '2',
    bournemouth: '3',
    brentford: '4',
    brighton: '6',
    chelsea: '8',
    'crystal-palace': '9',
    everton: '11',
    fulham: '13',
    ipswich: '40',
    leicester: '16',
    liverpool: '14',
    'manchester-city': '43',
    'manchester-united': '1',
    newcastle: '4',
    'nottingham-forest': '17',
    southampton: '20',
    tottenham: '6',
    'west-ham': '21',
    wolverhampton: '39',
  }
  return clubCodes[slug] || slug
}

const isValidImageUrl = (url: string | null | undefined, source: string): boolean => {
  if (!url) return false
  if (source === 'reddit') {
    const invalidReddits = ['self', 'default', 'nsfw', '']
    return !invalidReddits.includes(url)
  }
  return true
}

const calculateReadTime = (post: Post): string => {
  const titleWords = post.title?.split(' ').length ?? 0
  const summaryWords = post.summary?.split(' ').length ?? 0
  const totalWords = titleWords + summaryWords
  const mins = Math.max(1, Math.ceil(totalWords / 200))
  return `${mins} min read`
}

function getSourceBorderColor(post: Post): string {
  if (post.source === 'youtube') return '#FF0000'
  if (post.source === 'reddit') return '#FF4500'

  const sourceInfo = getSourceInfo(post)
  if (!sourceInfo) return '#00555A'

  switch (sourceInfo.name) {
    case 'BBC Sport': return '#FFD008'
    case 'Sky Sports': return '#0072BC'
    case 'The Guardian': return '#052962'
    case 'The Athletic': return '#D4442E'
    case 'talkSPORT': return '#E4002B'
    case 'Goal': return '#00A550'
    case '90min': return '#8B5CF6'
    case 'The Telegraph': return '#1D1D1B'
    case 'Mirror': return '#E00000'
    case 'The Sun': return '#C4122F'
    default: return '#C4A23E'
  }
}

const getCTAText = (post: Post): string => {
  if (post.source === 'youtube') return 'Watch on YouTube →'
  if (post.source === 'reddit') return 'Read thread →'
  return 'Read article →'
}

export default function StoryCard({ post, indexScore, featured = false }: StoryCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [summary, setSummary] = useState<string | null>(post.summary ?? null)
  const [loading, setLoading] = useState(false)
  const [imgError, setImgError] = useState(false)

  const club = post.club_slug ? CLUBS_BY_SLUG[post.club_slug] : null
  const sourceInfo = getSourceInfo(post)
  const sourceName = sourceInfo?.name ?? 'News'
  const ctaText = getCTAText(post)
  const borderColor = getSourceBorderColor(post)
  const hasValidImage = isValidImageUrl(post.image_url, post.source)
  const readTime = calculateReadTime(post)

  const handleExpand = async () => {
    if (summary) {
      setExpanded(!expanded)
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId: post.id,
          title: post.title,
          content: post.content,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setSummary(data.summary)
        setExpanded(true)
      } else {
        console.error('Failed to fetch summary')
        setLoading(false)
      }
    } catch (error) {
      console.error('Error fetching summary:', error)
      setLoading(false)
    }
  }

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: post.title,
    url: post.url,
    datePublished: post.published_at,
    author: post.author
      ? { '@type': 'Person', name: post.author }
      : undefined,
    publisher: {
      '@type': 'Organization',
      name: sourceName,
    },
  }

  return (
    <article
      id={`post-${post.id}`}
      className="rounded-xl bg-[#152B2E] border border-white/5 border-l-[3px] p-4 md:p-6 hover:translate-y-[-2px] hover:shadow-lg hover:shadow-black/20 active:scale-[0.98] transition-all duration-200 cursor-pointer"
      style={{ borderLeftColor: borderColor }}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'NewsArticle',
            headline: post.title,
            datePublished: post.published_at,
            dateModified: post.fetched_at,
            description: post.summary ?? post.title,
            url: post.url,
            publisher: {
              '@type': 'Organization',
              name: 'PLHub',
              url: 'https://plhub.co.uk',
            },
            sourceOrganization: {
              '@type': 'Organization',
              name: post.subreddit ?? 'PLHub',
            },
          }),
        }}
      />
      <JsonLd data={articleSchema} />

      {/* HEADER ROW: Club badge + club name + source logo + source name + timestamp */}
      <div className="flex items-center gap-3 mb-4">
        {/* Club badge (24x24) */}
        {post.club_slug && (
          <img
            src={`https://resources.premierleague.com/premierleague/badges/t${getClubCode(post.club_slug)}.svg`}
            alt=""
            className="w-6 h-6 object-contain shrink-0"
          />
        )}

        {/* Source logo or name (20x20) */}
        {(() => {
          const source = getSourceInfo(post)
          if (!source) return null
          return source.src ? (
            <img
              src={source.src}
              alt={source.name}
              className="h-5 w-auto max-w-[44px] object-contain opacity-70 shrink-0"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
          ) : (
            <span className="text-xs text-gray-400 truncate">{source.name}</span>
          )
        })()}

        {/* Source name (if logo exists) */}
        {sourceInfo?.src && (
          <span className="text-xs text-gray-400">{sourceName}</span>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Timestamp */}
        <span className="text-xs text-gray-400 shrink-0">{getTimeDisplay(post)}</span>
      </div>

      {/* IMAGE: 16:9 aspect ratio, 200px max-height on desktop, 160px on mobile */}
      {!expanded && hasValidImage && !imgError && (
        <div className="aspect-[16/9] overflow-hidden rounded-lg mb-4 bg-[#0B1F21] max-h-[160px] md:max-h-[200px] relative">
          <img
            src={post.image_url || ''}
            alt=""
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
            loading="lazy"
          />
          {post.source === 'youtube' && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          )}
        </div>
      )}

      {/* HEADLINE: Dominant element - text-base mobile, text-lg desktop */}
      <h3 className="text-base md:text-lg font-semibold text-white leading-snug mb-3 line-clamp-3">
        {decodeHtmlEntities(post.title)}
      </h3>

      {/* AI SUMMARY: Teal left border, if exists */}
      {!expanded && post.summary && (
        <div className="mb-4">
          <p className="text-sm text-gray-200 font-medium mb-2">The Secret Pundit's Take</p>
          <div className="border-l-2 border-l-[#00555A] pl-4">
            <p className="text-sm text-gray-300 leading-relaxed line-clamp-3">
              {decodeHtmlEntities(post.summary)}
            </p>
          </div>
        </div>
      )}

      {/* EXPANDED SUMMARY: Show when expanded */}
      {expanded && (
        <>
          {/* Full-width image in expanded state */}
          {hasValidImage && !imgError && (
            <div className="aspect-[16/9] overflow-hidden rounded-lg mb-4 bg-[#0B1F21]">
              <img
                src={post.image_url || ''}
                alt=""
                className="w-full h-full object-cover"
                onError={() => setImgError(true)}
              />
            </div>
          )}

          {loading ? (
            <div className="rounded-lg border-l-2 border-l-[#00555A] bg-[#1A3538] p-4 mb-4">
              <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3">
                AI Summary
              </div>
              <div className="text-sm text-white/30 italic">Generating summary...</div>
            </div>
          ) : summary ? (
            <div className="rounded-lg border-l-2 border-l-[#00555A] bg-[#1A3538] p-4 mb-4">
              <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3">
                AI Summary
              </div>
              <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                {decodeHtmlEntities(summary)}
              </p>
            </div>
          ) : null}
        </>
      )}

      {/* CTA: Read thread / Read article */}
      <a
        href={post.url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="inline-block text-sm font-medium text-[#C4A23E] hover:underline mb-4"
      >
        {ctaText}
      </a>

      {/* FOOTER ROW: Source credibility + upvote count (if Reddit) + reading time */}
      <div className="flex items-center gap-3 text-xs text-gray-500">
        {/* Source credibility indicator */}
        {['BBC Sport', 'Sky Sports', 'The Guardian', 'The Athletic'].includes(
          sourceName
        ) && (
          <span className="inline-block px-2 py-0.5 rounded-full bg-white/5 text-gray-400">
            Editorial
          </span>
        )}

        {post.source === 'reddit' && post.score && (
          <span>
            ↑ {post.score > 1000 ? `${(post.score / 1000).toFixed(1)}k` : post.score}{' '}
            upvotes
          </span>
        )}

        {/* Reading time with clock icon */}
        <span className="flex items-center gap-1">
          <span>⏱</span>
          <span>{readTime}</span>
        </span>
      </div>
    </article>
  )
}
