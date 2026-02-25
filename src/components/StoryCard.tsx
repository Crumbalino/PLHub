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

export default function StoryCard({ post, indexScore }: StoryCardProps) {
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
    <article id={`post-${post.id}`} onClick={handleExpand} className="flex flex-row gap-3 border-b-2 border-l-[3px] border-white/[0.08] bg-[#152B2E] p-3 transition-colors duration-150 hover:bg-white/5 sm:rounded-lg sm:border sm:border-white/8 cursor-pointer" style={{ borderLeftColor: sourceColor, borderBottomColor: expanded ? 'transparent' : '#F5C84226', boxShadow: `0 0 12px ${sourceColor}26` }}>
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

        {/* Image — left side, fixed size */}
        <div className="shrink-0 w-[80px] h-[64px] sm:w-[100px] sm:h-[72px] rounded overflow-hidden bg-[#152B2E]">
          {!imgError && post.image_url ? (
            <img
              src={post.image_url}
              alt=""
              className="w-full h-full object-cover"
              onError={() => setImgError(true)}
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: fallbackBg }}>
              <img
                src={`https://resources.premierleague.com/premierleague/badges/t${getClubCode(post.club_slug ?? '')}.svg`}
                alt=""
                className="w-10 h-10 object-contain"
              />
            </div>
          )}
        </div>

        {/* Content — right side */}
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          {/* Headline */}
          <h3 className="text-sm sm:text-base font-bold text-white leading-snug line-clamp-2">
            {decodeHtmlEntities(post.title)}
          </h3>

          {/* Expand button */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleExpand()
            }}
            className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[#F5C842]/30 hover:border-[#F5C842] hover:bg-[#F5C842]/10 transition-all duration-200 cursor-pointer group w-fit"
          >
            <span className="text-[#F5C842] text-[10px] font-bold uppercase tracking-wide">
              {expanded ? 'Close' : '▸ The Take'}
            </span>
          </button>

          {/* Summary — only shown when expanded */}
          {expanded && (
            <>
              {/* Full-width image in expanded state */}
              {post.image_url && !imgError && (
                <div className="w-full h-40 sm:h-48 rounded-lg overflow-hidden mb-3 animate-fadeIn">
                  <img src={post.image_url} alt="" className="w-full h-full object-cover" />
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
              {/* Timestamp */}
              <span className="text-[11px] text-white/30 shrink-0">· {getTimeDisplay(post)}</span>
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
