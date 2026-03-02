'use client'

import { useEffect, useState } from 'react'

interface AndFinallyData {
  has_content: boolean
  headline: string | null
  colour_line: string | null
}

interface AndFinallyProps {
  club?: string | null
}

export default function AndFinally({ club = null }: AndFinallyProps) {
  const [content, setContent] = useState<AndFinallyData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const url = new URL(
          '/api/snapshot',
          typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'
        )
        if (club) {
          url.searchParams.set('club', club)
        }

        const response = await fetch(url.toString())
        if (!response.ok) {
          throw new Error('Failed to fetch snapshot')
        }

        const data = await response.json()
        if (data.success && data.data?.modules?.and_finally) {
          setContent(data.data.modules.and_finally)
          setError(null)
        } else {
          throw new Error(data.error || 'Invalid response format')
        }
      } catch (err) {
        console.error('[AndFinally] Error fetching data:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
        setContent(null)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [club])

  // Don't render if no content or if has_content is false
  if (!isLoading && (!content || !content.has_content)) {
    return null
  }

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="pt-4 border-t border-dashed" style={{ borderColor: 'rgba(250, 245, 240, 0.06)' }}>
        <h2
          className="text-[11px] font-semibold uppercase tracking-[2px] mb-1"
          style={{ color: 'var(--plh-pink)' }}
        >
          And Finally
        </h2>
        <div className="space-y-2">
          <div
            className="h-5 rounded w-full animate-pulse"
            style={{ backgroundColor: 'rgba(250, 245, 240, 0.04)' }}
          />
          <div
            className="h-4 rounded w-3/4 animate-pulse"
            style={{ backgroundColor: 'rgba(250, 245, 240, 0.04)' }}
          />
        </div>
      </div>
    )
  }

  // Error state - don't render
  if (error || !content || !content.has_content) {
    return null
  }

  return (
    <div className="pt-4 border-t border-dashed" style={{ borderColor: 'rgba(250, 245, 240, 0.06)' }}>
      {/* Module header - PINK instead of teal */}
      <h2
        className="text-[11px] font-semibold uppercase tracking-[2px] mb-1"
        style={{ color: 'var(--plh-pink)' }}
      >
        And Finally
      </h2>

      {/* Headline */}
      {content.headline && (
        <h3
          className="text-[15px] font-semibold mb-2 leading-[1.4]"
          style={{ color: 'rgba(250, 245, 240, 0.9)', fontFamily: 'Sora, sans-serif' }}
        >
          {content.headline}
        </h3>
      )}

      {/* Colour line (the raised eyebrow) */}
      {content.colour_line && (
        <p
          className="text-[13px] italic"
          style={{ color: 'rgba(250, 245, 240, 0.5)' }}
        >
          {content.colour_line}
        </p>
      )}
    </div>
  )
}
