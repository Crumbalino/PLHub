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
    <section className="mb-8 pl-3" style={{ borderLeft: '3px solid var(--plh-gold)' }}>
      <h2 className="text-xl font-bold text-[var(--plh-text-100)] mb-4">Trending</h2>

      <div className="flex flex-col gap-2">
        {posts.map((post, idx) => {
          const isTop = idx === 0

          return (
            <a
              key={post.id}
              href={`#post-${post.id}`}
              className="trending-item flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors group animate-card-enter"
              style={{
                background: 'color-mix(in srgb, var(--plh-text-100) 5%, transparent)',
                animationDelay: `${idx * 80}ms`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'color-mix(in srgb, var(--plh-text-100) 10%, transparent)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'color-mix(in srgb, var(--plh-text-100) 5%, transparent)'
              }}
            >
              <span className="w-5 text-sm font-bold" style={{ color: 'var(--plh-gold)' }}>{post.rank}</span>
              <span style={{ color: 'var(--plh-gold)', fontSize: '12px', fontWeight: 'bold' }}>▲</span>
              <span className="text-sm text-[var(--plh-text-100)] line-clamp-1 flex-1 transition-colors" style={{ cursor: 'pointer' }}>
                {post.title}
              </span>
              {post.indexScore && (
                <div className="px-2 py-0.5 rounded-md text-sm font-medium flex items-center gap-1.5 shrink-0 tabular-nums" style={{
                  background: 'color-mix(in srgb, var(--plh-gold) 12%, transparent)',
                  color: 'var(--plh-gold)',
                }}>
                  <PulseIcon
                    size={14}
                    color="var(--plh-gold)"
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
