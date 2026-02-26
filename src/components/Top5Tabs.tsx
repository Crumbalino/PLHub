'use client'

import { Post } from '@/types'
import { decodeHtmlEntities } from '@/lib/utils'
import { getClubCode, getTimeDisplay, toIndex } from '@/lib/card-utils'

interface Top5TabsProps {
  posts: Post[]
}

export default function Top5Tabs({ posts }: Top5TabsProps) {
  // Simple sort by score descending, then slice to 5
  const sortedPosts = [...posts]
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, 5)

  return (
    <section className="mb-8">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-white inline-flex items-center justify-center gap-2">
          <div className="w-1 h-6 bg-[#C4A23E] rounded-full"></div>
          Trending
        </h2>
      </div>

      <div className="rounded-xl border border-white/[0.08] overflow-hidden">
        {sortedPosts.map((post, index) => {
          const indexScore = toIndex(post.score ?? 0)
          const isNew = (Date.now() - new Date(post.published_at).getTime()) < 3 * 60 * 60 * 1000
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
                  {isNew && (
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full uppercase tracking-wide">New</span>
                  )}
                </div>
              </div>
              {/* Score Badge */}
              {indexScore && (
                <div className="shrink-0 bg-[#00555A]/90 backdrop-blur-sm text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5">
                  <svg width="14" height="14" viewBox="0 0 32 32" fill="none">
                    <path d="M4 16h7l2.5-7 5 14 2.5-7H28" stroke="#C4A23E" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span className="text-white">{indexScore}</span>
                </div>
              )}
            </a>
          )
        })}
      </div>
    </section>
  )
}
