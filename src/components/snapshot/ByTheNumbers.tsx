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
  const [heroIndex, setHeroIndex] = useState(0)
  const [swapping, setSwapping] = useState(false)

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

  const handleTileClick = (index: number) => {
    if (index !== heroIndex) {
      setSwapping(true)
      setTimeout(() => {
        setHeroIndex(index)
        setSwapping(false)
      }, 300) // Match animation duration
    }
  }

  const heroTile = data.tiles[heroIndex]
  const supportingTiles = data.tiles.filter((_, idx) => idx !== heroIndex)

  return (
    <div style={{ borderRadius: '10px', border: '1px solid rgba(250,245,240,0.06)', overflow: 'hidden', background: `radial-gradient(ellipse at top right, rgba(58,175,169,0.08), transparent 70%)` }}>
      {/* Header bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 16px',
          borderBottom: '1px solid rgba(250,245,240,0.06)',
        }}
      >
        <h2 style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '2px', color: '#3AAFA9', margin: 0, fontFamily: "'Sora', sans-serif" }}>
          By The Numbers
        </h2>
        <span style={{ fontSize: '10px', opacity: 0.4, margin: 0, fontFamily: "'Sora', sans-serif" }}>Matchday {data.matchday}</span>
      </div>

      {/* Hero tile and supporting grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px', backgroundColor: 'rgba(250,245,240,0.06)' }}>
        {/* Hero tile (left, spans 2 rows) */}
        <div
          style={{
            gridRow: '1 / 3',
            position: 'relative',
            cursor: 'pointer',
            padding: '20px',
            backgroundColor: 'rgba(58,175,169,0.08)',
            borderRadius: '8px',
            margin: '1px',
            transition: swapping ? 'all 300ms ease-out' : 'opacity 300ms ease-out',
            opacity: swapping ? 0 : 1,
            transform: swapping ? 'translateY(10px)' : 'translateY(0)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            boxShadow: '0 0 0 1px rgba(232,64,128,0)',
            animation: 'heroPulse 3s ease-in-out infinite',
          }}
          onClick={() => {}} // Hero tile is always visible
        >
          {/* Number */}
          <div
            style={{
              fontSize: '40px',
              fontWeight: 700,
              fontFamily: "'Consolas', 'Courier New', monospace",
              color: '#3AAFA9',
              lineHeight: 1,
              marginBottom: '8px',
              textAlign: 'center',
            }}
          >
            {heroTile.number}
          </div>

          {/* Label */}
          <div
            style={{
              fontSize: '12px',
              fontWeight: 500,
              color: 'rgba(250,245,240,0.7)',
              marginBottom: '6px',
              textAlign: 'center',
              fontFamily: "'Sora', sans-serif",
            }}
          >
            {heroTile.label}
          </div>

          {/* Context */}
          <div
            style={{
              fontSize: '11px',
              fontWeight: 400,
              color: 'rgba(250,245,240,0.5)',
              textAlign: 'center',
              fontFamily: "'Sora', sans-serif",
            }}
          >
            {heroTile.context}
          </div>
        </div>

        {/* Supporting tiles (right, 2 rows) */}
        {supportingTiles.map((tile, idx) => (
          <div
            key={idx}
            onClick={() => handleTileClick(data.tiles.indexOf(tile))}
            style={{
              padding: '16px',
              cursor: 'pointer',
              backgroundColor: 'transparent',
              transition: swapping ? 'all 300ms ease-out' : 'opacity 150ms ease-out',
              opacity: swapping ? 0.5 : 1,
              transform: swapping ? 'translateY(-8px)' : 'translateY(0)',
              borderRadius: '6px',
              margin: '1px',
            }}
            onMouseEnter={(e) => {
              if (!swapping) {
                (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(250,245,240,0.03)'
              }
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'
            }}
          >
            {/* Number */}
            <div
              style={{
                fontSize: '24px',
                fontWeight: 700,
                fontFamily: "'Consolas', 'Courier New', monospace",
                color: '#FAF5F0',
                lineHeight: 1,
                marginBottom: '4px',
                textAlign: 'center',
              }}
            >
              {tile.number}
            </div>

            {/* Label */}
            <div
              style={{
                fontSize: '11px',
                fontWeight: 400,
                color: 'rgba(250,245,240,0.6)',
                marginBottom: '4px',
                textAlign: 'center',
                fontFamily: "'Sora', sans-serif",
              }}
            >
              {tile.label}
            </div>

            {/* Context */}
            <div
              style={{
                fontSize: '10px',
                fontWeight: 400,
                color: 'rgba(250,245,240,0.4)',
                textAlign: 'center',
                fontFamily: "'Sora', sans-serif",
              }}
            >
              {tile.context}
            </div>
          </div>
        ))}
      </div>

      {/* Animations */}
      <style>{`
        @keyframes heroPulse {
          0%, 100% {
            box-shadow: 0 0 0 1px rgba(232,64,128,0.15);
          }
          50% {
            box-shadow: 0 0 0 2px rgba(232,64,128,0.3);
          }
        }

        @media (max-width: 640px) {
          .by-the-numbers-container {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  )
}
