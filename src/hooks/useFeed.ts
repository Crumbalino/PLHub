// ============================================================
// useFeed Hook
// Manages feed state: fetching, sorting, pagination, club filter.
// All business logic lives in the API — this hook is just state + fetch.
// ============================================================

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { FeedPost, SortMode, FeedResponse } from '@/lib/types'

interface UseFeedOptions {
  initialSort?: SortMode
  sortMode?: SortMode
  club?: string | null
  limit?: number
  /**
   * First page, already fetched on the server.
   *
   * When supplied the hook starts with these posts and isLoading false, and
   * skips the fetch it would otherwise fire on mount. Without that skip the
   * server-rendered HTML is thrown away on hydration and re-requested, which
   * costs a request and shows a skeleton flash over content the user can
   * already see. Sort changes, club changes and load-more all still fetch.
   */
  initialPosts?: FeedPost[]
  initialHasMore?: boolean
}

interface UseFeedReturn {
  posts: FeedPost[]
  isLoading: boolean
  isLoadingMore: boolean
  error: string | null
  sortMode: SortMode
  setSortMode: (mode: SortMode) => void
  loadMore: () => void
  hasMore: boolean
  refresh: () => void
}

export function useFeed(options: UseFeedOptions = {}): UseFeedReturn {
  const {
    initialSort = 'pulse',
    club = null,
    limit = 20,
    initialPosts,
    initialHasMore,
  } = options

  const seeded = initialPosts !== undefined

  const [posts, setPosts] = useState<FeedPost[]>(initialPosts ?? [])
  const [sortMode, setSortModeState] = useState<SortMode>(initialSort)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(initialHasMore ?? true)
  // Seeded means the first page is already on screen, server-rendered.
  const [isLoading, setIsLoading] = useState(!seeded)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Track the current request to avoid race conditions
  const abortRef = useRef<AbortController | null>(null)
  // True until the mount effect has run once. Only used to skip the initial
  // refetch when the server already supplied page 1.
  const skipNextFetch = useRef(seeded)

  const fetchFeed = useCallback(
    async (pageNum: number, append: boolean = false) => {
      // Cancel any in-flight request
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      if (append) {
        setIsLoadingMore(true)
      } else {
        setIsLoading(true)
      }
      setError(null)

      try {
        const params = new URLSearchParams({
          sort: sortMode,
          page: String(pageNum),
          limit: String(limit),
        })
        if (club) params.set('club', club)

        const res = await fetch(`/api/feed?${params}`, {
          signal: controller.signal,
        })

        if (!res.ok) throw new Error(`Feed request failed: ${res.status}`)

        const data: FeedResponse = await res.json()

        if (append) {
          setPosts((prev: FeedPost[]) => [...prev, ...data.posts])
        } else {
          setPosts(data.posts)
        }

        setHasMore(data.hasMore)
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return
        console.error('[useFeed] Error:', err)
        setError(err instanceof Error ? err.message : 'Failed to load feed')
      } finally {
        setIsLoading(false)
        setIsLoadingMore(false)
      }
    },
    [sortMode, club, limit]
  )

  // Initial fetch and refetch when sort/club changes. When the server already
  // rendered page 1, the first run is skipped — see initialPosts.
  useEffect(() => {
    if (skipNextFetch.current) {
      skipNextFetch.current = false
      return
    }
    setPage(1)
    fetchFeed(1, false)
  }, [fetchFeed])

  const setSortMode = useCallback((mode: SortMode) => {
    setSortModeState(mode)
    setPage(1)
    // fetchFeed will be triggered by the useEffect above
  }, [])

  const loadMore = useCallback(() => {
    if (isLoadingMore || !hasMore) return
    const nextPage = page + 1
    setPage(nextPage)
    fetchFeed(nextPage, true)
  }, [page, isLoadingMore, hasMore, fetchFeed])

  const refresh = useCallback(() => {
    setPage(1)
    fetchFeed(1, false)
  }, [fetchFeed])

  // Cleanup on unmount
  useEffect(() => {
    return () => abortRef.current?.abort()
  }, [])

  return {
    posts,
    isLoading,
    isLoadingMore,
    error,
    sortMode,
    setSortMode,
    loadMore,
    hasMore,
    refresh,
  }
}
