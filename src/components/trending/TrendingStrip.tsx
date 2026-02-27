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
    <section className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <PulseIcon size={16} />
        <span className="text-sm font-bold text-white">Trending</span>
      </div>

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
              <span className="w-5 text-sm font-bold text-white/60">{post.rank}</span>
              <span className="text-green-400 text-xs font-bold">▲</span>
              <span className="text-sm text-white line-clamp-1 flex-1 group-hover:text-[#C4A23E] transition-colors">
                {post.title}
              </span>
              {post.indexScore && (
                <div
                  className={`flex items-center gap-1.5 shrink-0 rounded-full px-2.5 py-1 ${
                    isTop ? 'bg-[#C4A23E]/10' : 'bg-white/5'
                  }`}
                >
                  <PulseIcon
                    size={14}
                    className={isTop ? 'animate-trending-pulse' : ''}
                  />
                  <span className={`text-sm font-bold tabular-nums ${scoreOpacity}`}>
                    {post.indexScore}
                  </span>
                </div>
              )}
            </a>
          )
        })}
      </div>
    </section>
  )
}
