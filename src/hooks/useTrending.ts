// ============================================================
// useTrending Hook
// Fetches and manages trending posts for the horizontal strip.
// ============================================================

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { TrendingPost, TrendingResponse } from '@/lib/types'

interface UseTrendingReturn {
  posts: TrendingPost[]
  isLoading: boolean
  error: string | null
  refresh: () => void
}

export function useTrending(count: number = 5): UseTrendingReturn {
  const [posts, setPosts] = useState<TrendingPost[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const fetchTrending = useCallback(async () => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/trending?count=${count}`, {
        signal: controller.signal,
      })

      if (!res.ok) throw new Error(`Trending request failed: ${res.status}`)

      const data: TrendingResponse = await res.json()
      setPosts(data.posts)
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      console.error('[useTrending] Error:', err)
      setError(err instanceof Error ? err.message : 'Failed to load trending')
    } finally {
      setIsLoading(false)
    }
  }, [count])

  useEffect(() => {
    fetchTrending()
    // Auto-refresh trending every 2 minutes
    const interval = setInterval(fetchTrending, 2 * 60 * 1000)
    return () => {
      clearInterval(interval)
      abortRef.current?.abort()
    }
  }, [fetchTrending])

  return { posts, isLoading, error, refresh: fetchTrending }
}
