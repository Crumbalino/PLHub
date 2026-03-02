'use client'

import { useEffect, useState } from 'react'

interface QuoteData {
  has_quote: boolean
  quote: string | null
  attribution: string | null
  club: string | null
  context: string | null
}

interface TheQuoteProps {
  club?: string | null
}

export default function TheQuote({ club = null }: TheQuoteProps) {
  const [quoteData, setQuoteData] = useState<QuoteData | null>(null)
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
        if (data.success && data.data?.modules?.the_quote) {
          setQuoteData(data.data.modules.the_quote)
          setError(null)
        } else {
          throw new Error(data.error || 'Invalid response format')
        }
      } catch (err) {
        console.error('[TheQuote] Error fetching data:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
        setQuoteData(null)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [club])

  // Don't render if no quote or if quote is false
  if (!isLoading && (!quoteData || !quoteData.has_quote)) {
    return null
  }

  // Loading skeleton
  if (isLoading) {
    return (
      <div>
        <h2
          className="text-[11px] font-semibold uppercase tracking-[2px] mb-4"
          style={{ color: 'var(--plh-teal)' }}
        >
          The Quote
        </h2>
        <div
          className="pl-4 py-4 border-l-2 space-y-2 animate-pulse"
          style={{ borderColor: 'var(--plh-teal)' }}
        >
          <div
            className="h-8 rounded w-3/4"
            style={{ backgroundColor: 'rgba(250, 245, 240, 0.04)' }}
          />
          <div
            className="h-4 rounded w-1/2"
            style={{ backgroundColor: 'rgba(250, 245, 240, 0.04)' }}
          />
        </div>
      </div>
    )
  }

  // Error state - don't render
  if (error || !quoteData || !quoteData.has_quote) {
    return null
  }

  return (
    <div>
      {/* Module header */}
      <h2
        className="text-[11px] font-semibold uppercase tracking-[2px] mb-4"
        style={{ color: 'var(--plh-teal)' }}
      >
        The Quote
      </h2>

      {/* Quote block with left border accent */}
      <div
        className="pl-4 py-4 border-l-2"
        style={{ borderColor: 'var(--plh-teal)' }}
      >
        {/* Quote text */}
        {quoteData.quote && (
          <p
            className="text-lg sm:text-xl font-light italic leading-[1.5] mb-3"
            style={{ color: 'rgba(250, 245, 240, 0.9)', fontFamily: 'Sora, sans-serif' }}
          >
            "{quoteData.quote}"
          </p>
        )}

        {/* Attribution */}
        {quoteData.attribution && (
          <p
            className="text-[12px] mb-2"
            style={{ color: 'rgba(250, 245, 240, 0.5)' }}
          >
            — {quoteData.attribution}
            {quoteData.club && `, ${quoteData.club}`}
          </p>
        )}

        {/* Context line */}
        {quoteData.context && (
          <p
            className="text-[11px]"
            style={{ color: 'rgba(250, 245, 240, 0.35)' }}
          >
            {quoteData.context}
          </p>
        )}
      </div>
    </div>
  )
}
