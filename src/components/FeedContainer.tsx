'use client'

import { useState } from 'react'
import { Post } from '@/types'
import StoryCard from './StoryCard'

interface FeedContainerProps {
  initialPosts: Post[]
  totalCount: number
  sort?: string
  club?: string
}

export default function FeedContainer({
  initialPosts,
  totalCount,
  sort = 'index',
  club,
}: FeedContainerProps) {
  const [posts, setPosts] = useState(initialPosts)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)

  const loadMore = async () => {
    setLoading(true)
    try {
      const nextPage = page + 1
      const params = new URLSearchParams({
        page: String(nextPage),
        sort: sort || 'index',
      })
      if (club) {
        params.set('club', club)
      }

      const res = await fetch(`/api/posts?${params}`)
      const data = await res.json()

      setPosts((prev) => [...prev, ...data.posts])
      setPage(nextPage)
    } catch (error) {
      console.error('Failed to load more posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const hasMore = posts.length < totalCount

  return (
    <>
      <div className="flex flex-col gap-y-6">
        {posts.map((post) => (
          <StoryCard key={post.id} post={post} />
        ))}
      </div>

      {hasMore && (
        <div className="mt-12 flex flex-col items-center gap-4">
          <button
            onClick={loadMore}
            disabled={loading}
            className="rounded-xl bg-[#152B2E] px-6 py-3 text-white font-medium hover:bg-[#1A3235] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Loading...' : 'Load more stories'}
          </button>
          <span className="text-sm text-gray-400">
            Showing {posts.length} of {totalCount} stories
          </span>
        </div>
      )}
    </>
  )
}
