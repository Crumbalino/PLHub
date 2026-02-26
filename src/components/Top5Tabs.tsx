'use client'

import { useState, useMemo } from 'react'
import { Post } from '@/types'
import { decodeHtmlEntities } from '@/lib/utils'
import { calculateIndex } from '@/lib/plhub-index'
import { getClubCode, getTimeDisplay, toIndex } from '@/lib/card-utils'

interface Top5TabsProps {
  posts: Post[]
}

export default function Top5Tabs({ posts }: Top5TabsProps) {
  const [activeTab, setActiveTab] = useState<'pulse' | 'hot' | 'new'>('pulse')

  const sortedPosts = useMemo(() => {
    const sorted = [...posts]

    if (activeTab === 'pulse') {
      sorted.sort((a, b) => calculateIndex(b) - calculateIndex(a))
    } else if (activeTab === 'hot') {
      sorted.sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    } else if (activeTab === 'new') {
      sorted.sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime())
    }

    return sorted.slice(0, 5)
  }, [posts, activeTab])

  return (
    <section className="mb-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-px flex-1 bg-white/5" />
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <span className="inline-block w-1 h-6 bg-[#C4A23E] rounded-full" />
            Trending
          </h2>
          <p className="text-base text-gray-400 mt-1">Most talked about right now</p>
        </div>
        <div className="h-px flex-1 bg-white/5" />
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-center gap-2 mb-4">
        {['Pulse', 'Hot', 'New'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab.toLowerCase() as 'pulse' | 'hot' | 'new')}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${
              activeTab === tab.toLowerCase()
                ? 'bg-[#00555A] text-white'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-white/[0.08] overflow-hidden">
        {sortedPosts.map((post, index) => {
          const indexScore = toIndex(post.score ?? 0)
          return (
            <a
              key={post.id}
              href={`#post-${post.id}`}
              className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.06] last:border-0 hover:bg-white/[0.03] transition-colors group"
            >
              {/* Rank */}
              <span className="shrink-0 font-black tabular-nums w-5 text-center text-2xl font-bold text-white">
                {index + 1}
              </span>
              {/* Thumbnail */}
              <div className="shrink-0 w-12 h-10 rounded overflow-hidden bg-[#152B2E]">
                {post.image_url && (
                  <img src={post.image_url} alt="" className="w-full h-full object-cover object-top" />
                )}
              </div>
              {/* Headline + meta */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold leading-snug line-clamp-2 group-hover:text-white/60 transition-colors text-base text-white">
                  {decodeHtmlEntities(post.title)}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {post.club_slug && (
                    <img
                      src={`https://resources.premierleague.com/premierleague/badges/t${getClubCode(post.club_slug)}.svg`}
                      alt=""
                      className="w-3 h-3 object-contain opacity-60"
                    />
                  )}
                  <span className="text-sm text-gray-400">{getTimeDisplay(post)}</span>
                </div>
              </div>
              {/* Score Badge */}
              {indexScore && (
                <div className="shrink-0 bg-[#00555A] text-white text-xs font-bold px-3 py-1 rounded-full">
                  ↑ {indexScore}
                </div>
              )}
            </a>
          )
        })}
      </div>
    </section>
  )
}
