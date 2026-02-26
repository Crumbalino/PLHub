'use client'

import { useState, useCallback, useMemo } from 'react'
import { Post } from '@/types'
import StoryCard from './StoryCard'

type SortMode = 'pulse' | 'hot' | 'new'

function calculateHotScore(post: Post): number {
  const score = post.score || 0
  const publishedAt = new Date(post.published_at).getTime()
  const hoursAgo = Math.max(1, (Date.now() - publishedAt) / (1000 * 60 * 60))
  return score / Math.pow(hoursAgo, 1.5)
}

export default function FeedContainer({
  initialPosts,
  totalCount,
}: {
  initialPosts: Post[]
  totalCount: number
}) {
  const [posts, setPosts] = useState(initialPosts)
  const [sort, setSort] = useState<SortMode>('pulse')
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)

  const sortedPosts = useMemo(() => {
    const sorted = [...posts]
    switch (sort) {
      case 'hot':
        sorted.sort((a, b) => calculateHotScore(b) - calculateHotScore(a))
        break
      case 'new':
        sorted.sort(
          (a, b) =>
            new Date(b.published_at).getTime() -
            new Date(a.published_at).getTime()
        )
        break
      case 'pulse':
      default:
        sorted.sort((a, b) => (b.score || 0) - (a.score || 0))
        break
    }
    return sorted
  }, [posts, sort])

  const handleSortChange = useCallback(
    (newSort: SortMode) => {
      if (newSort === sort) return
      setIsTransitioning(true)
      setTimeout(() => {
        setSort(newSort)
        setTimeout(() => setIsTransitioning(false), 50)
      }, 200)
    },
    [sort]
  )

  const loadMore = async () => {
    setLoading(true)
    const nextPage = page + 1
    try {
      const res = await fetch(`/api/posts?page=${nextPage}`)
      const data = await res.json()
      if (data.posts?.length) {
        setPosts((prev) => [...prev, ...data.posts])
        setPage(nextPage)
      }
    } catch (e) {
      console.error('Load more failed:', e)
    }
    setLoading(false)
  }

  const sortLabels: { key: SortMode; label: string }[] = [
    { key: 'pulse', label: 'Pulse' },
    { key: 'hot', label: 'Hot' },
    { key: 'new', label: 'New' },
  ]

  const headingText =
    sort === 'hot'
      ? "What's heating up"
      : sort === 'new'
        ? 'Latest stories'
        : 'Ranked by the PLHub Index'
  const subText =
    sort === 'hot'
      ? 'Rising fast right now'
      : sort === 'new'
        ? 'Fresh off the press'
        : 'Stories ranked by source credibility, recency, and community engagement — not paid placement, ever.'

  return (
    <>
      {/* Sort Pills */}
      <div className="flex items-center justify-center gap-2 mb-6">
        {sortLabels.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => handleSortChange(key)}
            className={`min-h-[44px] px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
              sort === key
                ? 'bg-white text-[#0B1F21] font-semibold shadow-md'
                : 'text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Section Heading */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <div className="w-1 h-6 bg-[#C4A23E] rounded-full"></div>
          {headingText}
        </h2>
        <p className="text-sm text-gray-400 mt-1 ml-3">{subText}</p>
      </div>

      {/* Feed with transition */}
      <div
        className={`space-y-5 transition-opacity transition-transform duration-200 ${
          isTransitioning ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'
        }`}
        style={{
          transition: 'opacity 200ms ease, transform 200ms ease',
        }}
      >
        {sortedPosts.map((post) => (
          <StoryCard key={post.id} post={post} />
        ))}
      </div>

      {/* Load More */}
      {posts.length < totalCount && (
        <div className="text-center mt-8">
          <p className="text-xs text-gray-500 mb-3">
            Showing {sortedPosts.length} of {totalCount} stories
          </p>
          <button
            onClick={loadMore}
            disabled={loading}
            className="bg-[#152B2E] hover:bg-[#1A3235] text-white rounded-xl py-3 px-8 text-sm font-medium transition-colors disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Load more stories'}
          </button>
        </div>
      )}
    </>
  )
}
