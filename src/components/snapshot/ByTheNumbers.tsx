'use client'

import { useEffect, useState } from 'react'

interface Tile {
  number: string
  label: string
  context: string
  accent: boolean
}

interface ByTheNumbersData {
  tiles: Tile[]
  matchday: number
}

interface ByTheNumbersProps {
  club?: string | null
}

export default function ByTheNumbers({ club = null }: ByTheNumbersProps) {
  const [data, setData] = useState<ByTheNumbersData | null>(null)
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

        const responseData = await response.json()
        if (responseData.success && responseData.data?.modules?.by_the_numbers) {
          setData(responseData.data.modules.by_the_numbers)
          setError(null)
        } else {
          throw new Error(responseData.error || 'Invalid response format')
        }
      } catch (err) {
        console.error('[ByTheNumbers] Error fetching data:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
        setData(null)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [club])

  // Don't render if no data
  if (!isLoading && !data) {
    return null
  }

  // Loading skeleton
  if (isLoading) {
    return (
      <div style={{ borderRadius: '8px', border: '1px solid rgba(250,245,240,0.06)', overflow: 'hidden' }}>
        {/* Header bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 20px',
            borderBottom: '1px solid rgba(250,245,240,0.06)',
          }}
        >
          <h2 style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '2px', color: '#3AAFA9', margin: 0 }}>
            By The Numbers
          </h2>
          <span style={{ fontSize: '11px', opacity: 0.5, margin: 0 }}>Matchday —</span>
        </div>

        {/* Grid skeleton */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1px',
            backgroundColor: 'rgba(250,245,240,0.06)',
          }}
        >
          {[0, 1, 2, 3].map((i) => (
            <div
              key={`skeleton-${i}`}
              style={{
                padding: '20px',
                backgroundColor: 'rgba(250,245,240,0.02)',
                animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
              }}
            >
              <div style={{ height: '32px', backgroundColor: 'rgba(250,245,240,0.04)', borderRadius: '4px', marginBottom: '8px' }} />
              <div style={{ height: '13px', backgroundColor: 'rgba(250,245,240,0.04)', borderRadius: '4px', marginBottom: '8px', width: '70%' }} />
              <div style={{ height: '11px', backgroundColor: 'rgba(250,245,240,0.04)', borderRadius: '4px', width: '90%' }} />
            </div>
          ))}
        </div>

        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}</style>
      </div>
    )
  }

  // Error state - don't render
  if (error || !data || !data.tiles || data.tiles.length === 0) {
    return null
  }

  return (
    <div style={{ borderRadius: '8px', border: '1px solid rgba(250,245,240,0.06)', overflow: 'hidden', background: `radial-gradient(ellipse at top right, rgba(58,175,169,0.08), transparent 70%)` }}>
      {/* Header bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 20px',
          borderBottom: '1px solid rgba(250,245,240,0.06)',
        }}
      >
        <h2 style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '2px', color: '#3AAFA9', margin: 0 }}>
          By The Numbers
        </h2>
        <span style={{ fontSize: '11px', opacity: 0.5, margin: 0 }}>Matchday {data.matchday}</span>
      </div>

      {/* Tile grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '1px',
          backgroundColor: 'rgba(250,245,240,0.06)',
        }}
      >
        {data.tiles.map((tile, index) => (
          <div
            key={index}
            style={{
              padding: '20px',
              backgroundColor: tile.accent ? 'rgba(58,175,169,0.08)' : 'transparent',
            }}
          >
            {/* Number (hero element) */}
            <div
              style={{
                fontSize: '32px',
                fontWeight: 700,
                fontFamily: 'Sora, sans-serif',
                color: tile.accent ? '#3AAFA9' : '#FAF5F0',
                lineHeight: 1,
                marginBottom: '4px',
              }}
            >
              {tile.number}
            </div>

            {/* Label */}
            <div
              style={{
                fontSize: '13px',
                fontWeight: 400,
                color: 'rgba(250,245,240,0.7)',
                marginBottom: '8px',
              }}
            >
              {tile.label}
            </div>

            {/* Context */}
            <div
              style={{
                fontSize: '11px',
                fontWeight: 400,
                color: 'rgba(250,245,240,0.5)',
              }}
            >
              {tile.context}
            </div>
          </div>
        ))}
      </div>

      {/* Responsive media query using style tag */}
      <style>{`
        @media (max-width: 640px) {
          .by-the-numbers-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  )
}
