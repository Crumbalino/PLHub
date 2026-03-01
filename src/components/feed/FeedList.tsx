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
  const [headingPhase, setHeadingPhase] = useState(0) // For fade animation
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
  const title = isIndexSort ? 'Ranked by the PLHub Index' : 'Latest stories'
  const toggleText = isIndexSort ? 'or show latest' : 'or rank by Index'

  return (
    <>

      {/* Section Heading with inline sort toggle */}
      <div className="mb-6 mt-4 border-l-[3px] border-l-[var(--plh-teal)] pl-3">
        <div className={`flex items-center gap-2 transition-opacity duration-200 ${headingPhase === 1 ? 'opacity-0' : 'opacity-100'}`}>
          <h2 className="text-xl font-bold text-[var(--plh-text-100)]">
            {title}
          </h2>
          <button
            onClick={handleToggleSort}
            className="text-sm text-[var(--plh-teal)] hover:underline cursor-pointer transition-colors whitespace-nowrap"
          >
            {toggleText}
          </button>
          {isIndexSort && (
            <button
              onClick={() => setShowHowItWorks(!showHowItWorks)}
              className="text-xs text-[var(--plh-teal)] hover:underline cursor-pointer transition-colors ml-2"
            >
              • How this works
            </button>
          )}
        </div>

        {/* How it works explainer */}
        {isIndexSort && showHowItWorks && (
          <div className="mt-4 overflow-hidden animate-in fade-in-0 slide-in-from-top-2 duration-300">
            <div
              className="max-w-[600px] text-sm text-[var(--plh-text-75)] leading-relaxed p-4 rounded-lg border border-[var(--plh-border)]"
              style={{ background: 'color-mix(in srgb, var(--plh-text-100) 5%, transparent)' }}
            >
              Every story is scored 0–100 based on four things: how trusted the source is, how fresh the story is, how much people are talking about it, and how significant it actually is. No paid placement, no algorithms favouring advertisers. Just good stories, ranked fairly.
            </div>
          </div>
        )}
      </div>

      {/* Loading skeleton — shimmer effect */}
      {isLoading && (
        <div className="space-y-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="skeleton-shimmer rounded-xl border-l-4 border-[var(--plh-border)] overflow-hidden"
              style={{ animationDelay: `${i * 150}ms` }}
            >
              {/* Image placeholder */}
              {i < 2 && <div className="w-full h-[160px] sm:h-[200px]" style={{ background: 'rgba(var(--plh-text-base), 0.02)' }} />}
              {/* Text placeholders */}
              <div className="p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full" style={{ background: 'rgba(var(--plh-text-base), 0.05)' }} />
                  <div className="w-20 h-3 rounded" style={{ background: 'rgba(var(--plh-text-base), 0.05)' }} />
                </div>
                <div className="w-[85%] h-5 rounded" style={{ background: 'rgba(var(--plh-text-base), 0.05)' }} />
                <div className="w-[60%] h-5 rounded" style={{ background: 'rgba(var(--plh-text-base), 0.05)' }} />
                <div className="w-[40%] h-3 rounded mt-2" style={{ background: 'rgba(var(--plh-text-base), 0.05)' }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Feed — key on sortMode triggers re-animation on sort change */}
      {!isLoading && (
        <div className="space-y-6 animate-feed-enter" key={sortMode}>
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
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--plh-border)] py-16 text-center animate-fadeIn">
          <span className="text-4xl">⚽</span>
          <h3 className="mt-4 text-base font-semibold text-[var(--plh-text-100)]">No stories yet</h3>
          <p className="mt-2 max-w-sm text-sm text-[var(--plh-text-50)]">
            News will appear here once the cron jobs have fetched the latest posts.
          </p>
        </div>
      )}

      {/* Load More */}
      {!isLoading && hasMore && posts.length > 0 && (
        <div className="text-center mt-10 mb-4">
          <p className="text-xs text-[var(--plh-text-50)] mb-3">
            Showing {posts.length} stories
          </p>
          <button
            onClick={loadMore}
            disabled={isLoadingMore}
            className="load-more-btn bg-[var(--plh-card)] hover:bg-[var(--plh-elevated)] text-[var(--plh-text-100)] rounded-xl py-3.5 px-10 text-sm font-medium transition-all disabled:opacity-50"
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
