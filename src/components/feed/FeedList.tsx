'use client'

import { useFeed } from '@/hooks/useFeed'
import { useExpandCard } from '@/hooks/useExpandCard'
import StoryCard from './StoryCard'
import SortTabs from './SortTabs'
import type { SortMode } from '@/lib/types'

interface FeedListProps {
  club?: string | null
}

const SORT_HEADINGS: Record<SortMode, { title: string; sub: string }> = {
  pulse: {
    title: 'Ranked by the PLHub Index',
    sub: 'Stories ranked by source credibility, recency, and community engagement — not paid placement, ever.',
  },
  hot: {
    title: "What's heating up",
    sub: 'Rising fast right now',
  },
  new: {
    title: 'Latest stories',
    sub: 'Fresh off the press',
  },
}

export default function FeedList({ club = null }: FeedListProps) {
  const {
    posts,
    isLoading,
    isLoadingMore,
    sortMode,
    setSortMode,
    loadMore,
    hasMore,
  } = useFeed({ club })

  const { isExpanded, toggle } = useExpandCard()

  const heading = SORT_HEADINGS[sortMode]

  return (
    <>
      {/* Sort Tabs */}
      <SortTabs current={sortMode} onChange={setSortMode} />

      {/* Section Heading */}
      <div className="mb-6 mt-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <div className="w-1 h-6 bg-[#C4A23E] rounded-full" />
          {heading.title}
        </h2>
        <p className="text-sm text-white/60 mt-1 ml-3">{heading.sub}</p>
      </div>

      {/* Loading skeleton — shimmer effect */}
      {isLoading && (
        <div className="space-y-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="skeleton-shimmer rounded-xl border-l-4 border-white/5 overflow-hidden"
              style={{ animationDelay: `${i * 150}ms` }}
            >
              {/* Image placeholder */}
              {i < 2 && <div className="w-full h-[160px] sm:h-[200px] bg-white/[0.02]" />}
              {/* Text placeholders */}
              <div className="p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-white/5" />
                  <div className="w-20 h-3 rounded bg-white/5" />
                </div>
                <div className="w-[85%] h-5 rounded bg-white/5" />
                <div className="w-[60%] h-5 rounded bg-white/5" />
                <div className="w-[40%] h-3 rounded bg-white/5 mt-2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Feed — key on sortMode triggers re-animation on sort change */}
      {!isLoading && (
        <div className="space-y-5 animate-feed-enter" key={sortMode}>
          {posts.map((post, idx) => (
            <StoryCard
              key={post.id}
              post={post}
              index={idx}
              isExpanded={isExpanded(post.id)}
              onToggleExpand={() => toggle(post.id)}
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && posts.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/10 py-16 text-center animate-fadeIn">
          <span className="text-4xl">⚽</span>
          <h3 className="mt-4 text-base font-semibold text-white">No stories yet</h3>
          <p className="mt-2 max-w-sm text-sm text-white/60">
            News will appear here once the cron jobs have fetched the latest posts.
          </p>
        </div>
      )}

      {/* Load More */}
      {!isLoading && hasMore && posts.length > 0 && (
        <div className="text-center mt-10 mb-4">
          <p className="text-xs text-white/30 mb-3">
            Showing {posts.length} stories
          </p>
          <button
            onClick={loadMore}
            disabled={isLoadingMore}
            className="load-more-btn bg-[#152B2E] hover:bg-[#1A3235] text-white rounded-xl py-3.5 px-10 text-sm font-medium transition-all disabled:opacity-50"
          >
            {isLoadingMore ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Loading
              </span>
            ) : (
              'Load more stories'
            )}
          </button>
        </div>
      )}
    </>
  )
}
