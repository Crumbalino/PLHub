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

const getSourceInfo = (post: Post): { src: string | null, name: string } | null => {
  const domain = post.url ? (() => { try { return new URL(post.url).hostname.replace('www.', '') } catch { return '' } })() : ''
  if (post.source === 'reddit') return { src: '/sources/reddit.png', name: 'Reddit' }
  if (domain.includes('bbc')) return { src: '/sources/bbc.png', name: 'BBC Sport' }
  if (domain.includes('sky')) return { src: '/sources/skysports.png', name: 'Sky Sports' }
  if (domain.includes('guardian')) return { src: '/sources/guardian.png', name: 'The Guardian' }
  if (domain.includes('talksport')) return { src: '/sources/talksport.png', name: 'talkSPORT' }
  if (domain.includes('goal')) return { src: '/sources/goal.png', name: 'Goal' }
  if (domain.includes('90min')) return { src: '/sources/90min.png', name: '90min' }
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
    'arsenal': '1', 'aston-villa': '2', 'bournemouth': '3', 'brentford': '4',
    'brighton': '6', 'chelsea': '8', 'crystal-palace': '9', 'everton': '11',
    'fulham': '13', 'ipswich': '40', 'leicester': '16', 'liverpool': '14',
    'manchester-city': '43', 'manchester-united': '1', 'newcastle': '4',
    'nottingham-forest': '17', 'southampton': '20', 'tottenham': '6',
    'west-ham': '21', 'wolverhampton': '39',
  }
  return clubCodes[slug] || slug
}

const CLUB_FALLBACK_COLORS: Record<string, string> = {
  'arsenal': '#8B2635',
  'aston-villa': '#2D1F5E',
  'bournemouth': '#8B2635',
  'brentford': '#8B2635',
  'brighton': '#1E3A5F',
  'chelsea': '#1E3A5F',
  'crystal-palace': '#1E3A5F',
  'everton': '#1E3A5F',
  'fulham': '#4A3728',
  'ipswich': '#1E3A5F',
  'leicester': '#1E3A5F',
  'liverpool': '#8B2635',
  'manchester-city': '#1A4A4F',
  'manchester-united': '#8B2635',
  'newcastle': '#2A2A2A',
  'nottingham-forest': '#8B2635',
  'southampton': '#8B2635',
  'tottenham': '#2A3A4A',
  'west-ham': '#2D1F3D',
  'wolverhampton': '#4A3728',
}

const getEngagementLabel = (post: Post): string => {
  if (post.source === 'reddit') {
    if (post.num_comments && post.num_comments > 0) {
      return `${post.num_comments} comments`
    }
    if (post.score && post.score > 100) return 'Active thread'
  }
  // For articles, estimate read time from title length as proxy
  const words = post.title?.split(' ').length ?? 0
  const readMins = Math.max(1, Math.ceil(words / 200))
  return `${readMins} min read`
}

type CredibilityTier = 'trusted' | 'community'

const TRUSTED_SOURCES = new Set(['BBC Sport', 'Sky Sports', 'The Guardian'])

function getCredibilityTier(post: Post): CredibilityTier {
  if (
    post.source === 'rss' &&
    post.subreddit &&
    TRUSTED_SOURCES.has(post.subreddit)
  ) {
    return 'trusted'
  }
  return 'community'
}

function getSourceColor(post: Post): string {
  const sourceInfo = getSourceInfo(post)
  if (!sourceInfo) return '#F5C842'
  if (sourceInfo.name === 'Reddit') return '#FF4500'
  if (sourceInfo.name === 'BBC Sport') return '#FFD008'
  if (sourceInfo.name === 'Sky Sports') return '#0072BC'
  if (sourceInfo.name === 'The Guardian') return '#FFFFFF'
  if (sourceInfo.name === 'talkSPORT') return '#E4002B'
  if (sourceInfo.name === 'Goal') return '#00A550'
  if (sourceInfo.name === '90min') return '#FFFFFF'
  return '#F5C842'
}

function getCTAText(post: Post): string {
  return post.source === 'reddit' ? 'View thread →' : 'Read article →'
}

export default function StoryCard({ post, indexScore, featured = false }: StoryCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [summary, setSummary] = useState<string | null>(post.summary ?? null)
  const [loading, setLoading] = useState(false)
  const [imgError, setImgError] = useState(false)

  const club = post.club_slug ? CLUBS_BY_SLUG[post.club_slug] : null
  const sourceInfo = getSourceInfo(post)
  const sourceName = sourceInfo?.name ?? 'News'
  const sourceColor = getSourceColor(post)
  const ctaText = getCTAText(post)

  // Calculate delta for trending indicator
  const delta = (post.score ?? 0) - (post.previous_score ?? post.score ?? 0)
  const deltaColor = delta > 5 ? 'text-green-400' : delta < -5 ? 'text-red-400/70' : null
  const deltaIndicator = delta > 5 ? '↑' : delta < -5 ? '↓' : null

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

  const fallbackBg = CLUB_FALLBACK_COLORS[post.club_slug ?? ''] ?? '#1A3538'

  return (
    <article id={`post-${post.id}`} onClick={handleExpand} className={`${featured ? 'flex flex-col' : 'flex flex-row gap-3'} border-b-2 border-l-[3px] border-white/[0.08] bg-[#152B2E] p-3 transition-colors duration-150 hover:bg-white/5 sm:rounded-lg sm:border sm:border-white/8 cursor-pointer`} style={{ borderLeftColor: sourceColor, borderBottomColor: expanded ? 'transparent' : '#F5C84226', boxShadow: `0 0 12px ${sourceColor}26` }}>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "NewsArticle",
          "headline": post.title,
          "datePublished": post.published_at,
          "dateModified": post.fetched_at,
          "description": post.summary ?? post.title,
          "url": post.url,
          "publisher": {
            "@type": "Organization",
            "name": "PLHub",
            "url": "https://plhub.co.uk"
          },
          "sourceOrganization": {
            "@type": "Organization",
            "name": post.subreddit ?? "PLHub"
          }
        })}} />
        <JsonLd data={articleSchema} />

        {/* Image — featured or thumbnail */}
        {featured ? (
          // Featured card: full-width image at top
          !expanded && post.image_url && !imgError && (
            <div className="w-full h-48 rounded-lg overflow-hidden mb-3 bg-[#152B2E]">
              <img
                src={post.image_url}
                alt=""
                className="w-full h-full object-cover object-top"
                onError={() => setImgError(true)}
                loading="lazy"
              />
            </div>
          )
        ) : (
          // Regular card: side thumbnail, hidden when expanded
          !expanded && (
            <div className="shrink-0 w-[88px] h-[66px] rounded-lg overflow-hidden bg-[#152B2E]">
              {!imgError && post.image_url ? (
                <img
                  src={post.image_url}
                  alt=""
                  className="w-full h-full object-cover object-top"
                  onError={() => setImgError(true)}
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: fallbackBg }}>
                  <img
                    src={`https://resources.premierleague.com/premierleague/badges/t${getClubCode(post.club_slug ?? '')}.svg`}
                    alt=""
                    className="w-10 h-10 object-contain"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />
                </div>
              )}
            </div>
          )
        )}

        {/* Content — right side or below image if featured */}
        <div className={`flex min-w-0 flex-1 flex-col gap-2 ${featured ? 'w-full' : ''}`}>
          {/* Headline */}
          <h3 className={`${featured ? 'text-base' : 'text-sm sm:text-base'} font-bold text-white leading-snug line-clamp-2`}>
            {decodeHtmlEntities(post.title)}
          </h3>

          {/* Summary teaser — shown when collapsed if summary exists */}
          {!expanded && post.summary && (
            <p className="text-xs text-white/50 leading-snug line-clamp-1">
              {post.summary.split('.')[0]}.
            </p>
          )}

          {/* Expand button */}
          {post.summary || expanded ? (
            // Button when summary exists or is expanded
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleExpand()
              }}
              className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#F5C842]/40 hover:border-[#F5C842] hover:bg-[#F5C842]/10 transition-all duration-200 w-fit"
            >
              <span className="text-[#F5C842] text-[11px] font-bold tracking-wide">
                {expanded ? '✕ Close' : '▸ The Take'}
              </span>
            </button>
          ) : (
            // Dimmed button when no summary (will fetch on demand)
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleExpand()
              }}
              className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-white/10 hover:border-[#F5C842]/40 transition-all duration-200 w-fit"
            >
              <span className="text-white/30 text-[11px]">▸ The Take</span>
            </button>
          )}

          {/* Summary — only shown when expanded */}
          {expanded && (
            <>
              {/* Full-width image in expanded state */}
              {post.image_url && !imgError && (
                <div className="w-full h-40 sm:h-48 rounded-lg overflow-hidden mb-3 animate-fadeIn">
                  <img src={post.image_url} alt="" className="w-full h-full object-cover object-top" />
                </div>
              )}

              {loading ? (
                <div className="mt-2 rounded-xl border-l-[3px] border-[#F5C842] bg-[#1A3538] overflow-hidden animate-fadeIn">
                  <div className="px-4 py-3">
                    <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3">
                      The PLHub Take
                    </div>
                    <div className="text-[15px] text-white/30 italic leading-relaxed">Getting the take...</div>
                  </div>
                </div>
              ) : summary ? (
                <div className="mt-2 rounded-xl border-l-[3px] border-[#F5C842] bg-[#1A3538] overflow-hidden animate-fadeIn">
                  <div className="px-4 py-3">
                    <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3">
                      The PLHub Take
                    </div>
                    {summary.split('. ').filter(s => s.trim().length > 0).map((sentence, i) => (
                      <p key={i} className="text-[15px] text-white leading-relaxed mb-2.5 last:mb-0">
                        {sentence.trim()}{!sentence.trim().endsWith('.') ? '.' : ''}
                      </p>
                    ))}
                    <div className="flex justify-end mt-3">
                      <a
                        href={post.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-white text-xs font-bold hover:underline"
                      >
                        ...read more →
                      </a>
                    </div>
                  </div>
                </div>
              ) : null}
            </>
          )}

          {/* Meta row: left side (badge + source + time), right side (Pulse) */}
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-1.5 min-w-0">
              {/* Club badge */}
              {post.club_slug && (
                <img
                  src={`https://resources.premierleague.com/premierleague/badges/t${getClubCode(post.club_slug)}.svg`}
                  alt=""
                  className="w-4 h-4 object-contain shrink-0"
                />
              )}
              {/* Source logo or name */}
              {(() => {
                const source = getSourceInfo(post)
                if (!source) return null
                return source.src ? (
                  <img src={source.src} alt={source.name} className="h-3.5 w-auto max-w-[44px] object-contain opacity-70 shrink-0" />
                ) : (
                  <span className="text-[11px] text-white/40 truncate">{source.name}</span>
                )
              })()}
              {/* Engagement metric */}
              <span className="text-[11px] text-white/30 shrink-0">· {getEngagementLabel(post)}</span>
              {/* Timestamp in smaller text */}
              <span className="text-[10px] text-white/20 shrink-0">{getTimeDisplay(post)}</span>
              {/* Activity indicator for active Reddit threads */}
              {post.source === 'reddit' && post.num_comments && post.num_comments > 50 && (
                <span className="text-[10px] text-green-400/60 shrink-0">● active</span>
              )}
            </div>
            {/* Pulse score - right aligned */}
            {!expanded && (
              <div className="shrink-0 ml-2">
                <PulseBadge score={indexScore} size="sm" />
              </div>
            )}
          </div>
        </div>
      </article>
    )
}
