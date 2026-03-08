'use client'

import { useState } from 'react'
import { useFeed } from '@/hooks/useFeed'
import StoryCard from './StoryCard'
import type { SortMode } from '@/lib/types'

interface FeedListProps {
  club?: string | null
}

export default function FeedList({ club = null }: FeedListProps) {
  const [showHowItWorks, setShowHowItWorks] = useState(false)
  const [headingPhase, setHeadingPhase] = useState(0)
  const {
    posts,
    isLoading,
    isLoadingMore,
    sortMode,
    setSortMode,
    loadMore,
    hasMore,
  } = useFeed({ club })

  const handleToggleSort = () => {
    setHeadingPhase(1)
    setTimeout(() => {
      setSortMode(sortMode === 'pulse' ? 'new' : 'pulse')
      setHeadingPhase(0)
    }, 100)
  }

  const isIndexSort = sortMode === 'pulse'
  const title = isIndexSort ? 'Ranked by the Hub Index' : 'Latest stories'
  const toggleText = isIndexSort ? 'or show latest' : 'or rank by Index'

  return (
    <>
      {/* Section Heading — stacks on mobile, inline on desktop */}
      <div className="mb-4 mt-2 border-l-[3px] border-l-[var(--plh-teal)] pl-3">
        <div className={`transition-opacity duration-200 ${headingPhase === 1 ? 'opacity-0' : 'opacity-100'}`}>
          <h2 className="text-lg sm:text-xl font-bold text-[var(--plh-text-100)] leading-tight">
            {title}
          </h2>
          <div className="flex items-center gap-3 mt-1">
            <button
              onClick={handleToggleSort}
              className="text-xs text-[var(--plh-teal)] hover:underline cursor-pointer transition-colors whitespace-nowrap"
            >
              {toggleText}
            </button>
            {isIndexSort && (
              <button
                onClick={() => setShowHowItWorks(!showHowItWorks)}
                className="text-xs text-[var(--plh-teal)] hover:underline cursor-pointer transition-colors"
              >
                • How this works
              </button>
            )}
          </div>
        </div>

        {/* How it works explainer */}
        {isIndexSort && showHowItWorks && (
          <div className="mt-3 overflow-hidden animate-in fade-in-0 slide-in-from-top-2 duration-300">
            <div
              className="text-xs sm:text-sm text-[var(--plh-text-75)] leading-relaxed p-3 sm:p-4 rounded-lg border border-[var(--plh-border)]"
              style={{ background: 'color-mix(in srgb, var(--plh-text-100) 5%, transparent)' }}
            >
              Every story is scored 0–100 based on four things: how trusted the source is, how fresh the story is, how much people are talking about it, and how significant it actually is. No paid placement, no algorithms favouring advertisers. Just good stories, ranked fairly.
            </div>
          </div>
        )}
      </div>

      {/* Loading skeleton */}
      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="skeleton-shimmer rounded-xl border-l-2 border-[var(--plh-border)] overflow-hidden"
              style={{ animationDelay: `${i * 150}ms` }}
            >
              {i < 2 && <div className="w-full h-[140px] sm:h-[200px]" style={{ background: 'rgba(var(--plh-text-base), 0.02)' }} />}
              <div className="p-4 sm:p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full" style={{ background: 'rgba(var(--plh-text-base), 0.05)' }} />
                  <div className="w-20 h-3 rounded" style={{ background: 'rgba(var(--plh-text-base), 0.05)' }} />
                </div>
                <div className="w-[85%] h-5 rounded" style={{ background: 'rgba(var(--plh-text-base), 0.05)' }} />
                <div className="w-[60%] h-5 rounded" style={{ background: 'rgba(var(--plh-text-base), 0.05)' }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Feed */}
      {!isLoading && (
        <div className="space-y-3 animate-feed-enter" key={sortMode}>
          {posts.map((post, idx) => (
            <StoryCard
              key={post.id}
              post={post}
              index={idx}
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && posts.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--plh-border)] py-12 sm:py-16 text-center animate-fadeIn">
          <span className="text-4xl">⚽</span>
          <h3 className="mt-4 text-base font-semibold text-[var(--plh-text-100)]">No stories yet</h3>
          <p className="mt-2 max-w-sm text-sm text-[var(--plh-text-50)] px-4">
            News will appear here once the cron jobs have fetched the latest posts.
          </p>
        </div>
      )}

      {/* Load More */}
      {!isLoading && hasMore && posts.length > 0 && (
        <div className="text-center mt-8 mb-4">
          <p className="text-xs text-[var(--plh-text-50)] mb-3">
            Showing {posts.length} stories
          </p>
          <button
            onClick={loadMore}
            disabled={isLoadingMore}
            className="load-more-btn bg-[var(--plh-card)] hover:bg-[var(--plh-elevated)] text-[var(--plh-text-100)] rounded-xl py-3 px-8 text-sm font-medium transition-all disabled:opacity-50"
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
