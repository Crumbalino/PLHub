'use client'

import { useTrending } from '@/hooks/useTrending'
import PulseIcon from '../feed/PulseIcon'

export default function TrendingStrip() {
  const { posts, isLoading } = useTrending(5)

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="skeleton-shimmer h-10 rounded-lg"
            style={{ animationDelay: `${i * 100}ms` }}
          />
        ))}
      </div>
    )
  }

  if (posts.length === 0) return null

  return (
    <section className="mb-8 border-l-3 border-l-[#C4A23E] pl-3">
      <h2 className="text-xl font-bold text-white mb-4">Trending</h2>

      <div className="flex flex-col gap-2">
        {posts.map((post, idx) => {
          const isTop = idx === 0
          const scoreOpacity =
            idx === 0 ? 'text-white' : idx <= 2 ? 'text-white/80' : 'text-white/55'

          return (
            <a
              key={post.id}
              href={`#post-${post.id}`}
              className="trending-item flex items-center gap-3 rounded-lg bg-white/5 px-3 py-2.5 hover:bg-white/10 transition-colors group animate-card-enter"
              style={{ animationDelay: `${idx * 80}ms` }}
            >
              <span className="w-5 text-sm font-bold text-[#C4A23E]">{post.rank}</span>
              <span className="text-green-400 text-xs font-bold">▲</span>
              <span className="text-sm text-gray-100 line-clamp-1 flex-1 group-hover:text-[#C4A23E] transition-colors">
                {post.title}
              </span>
              {post.indexScore && (
                <div className="bg-[#00777A] text-white px-2 py-0.5 rounded-md text-sm font-medium flex items-center gap-1.5 shrink-0 tabular-nums">
                  <PulseIcon
                    size={14}
                    color="white"
                    className={isTop ? 'animate-trending-pulse' : ''}
                  />
                  <span>{post.indexScore}</span>
                </div>
              )}
            </a>
          )
        })}
      </div>
    </section>
  )
}
