'use client'

import { useEffect, useState } from 'react'
import GetCaughtUp from './GetCaughtUp'
import type { FeedPost } from '@/lib/types'

interface SnapshotData {
  success: boolean
  data?: {
    metadata: {
      generatedAt: string
      matchday: number
      postsCount: number
    }
    modules: {
      caughtUp: FeedPost[]
      transfers: FeedPost[]
      beyondBigSix: FeedPost[]
      andFinally: FeedPost | null
      quote: null
    }
  }
  error?: string
}

export default function SnapshotContent() {
  const [data, setData] = useState<SnapshotData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSnapshot = async () => {
      try {
        setIsLoading(true)
        const response = await fetch('/api/snapshot')
        const json = (await response.json()) as SnapshotData

        if (!response.ok || !json.success) {
          throw new Error(json.error || 'Failed to fetch snapshot')
        }

        setData(json)
        setError(null)
      } catch (err) {
        console.error('[SnapshotContent] Error fetching snapshot:', err)
        setError(err instanceof Error ? err.message : 'Failed to load snapshot')
        setData(null)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSnapshot()
  }, [])

  // Show loading state (handled by SnapshotShell placeholder)
  if (isLoading) {
    return null
  }

  // Show error if fetch failed
  if (error) {
    return (
      <div
        className="text-center py-8 text-[12px]"
        style={{ color: 'rgba(250, 245, 240, 0.3)' }}
      >
        Unable to load snapshot
      </div>
    )
  }

  // Render modules
  if (data?.data?.modules) {
    return <GetCaughtUp stories={data.data.modules.caughtUp} />
  }

  return null
}
