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

  if (isLoading) {
    return (
      <div style={{ borderRadius: '12px', border: '1px solid rgba(250,245,240,0.06)', overflow: 'hidden', background: '#0D1B2A' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(250,245,240,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '2px', color: 'rgba(250,245,240,0.5)', fontFamily: "'Sora', sans-serif" }}>By The Numbers</div>
          <div style={{ fontSize: '10px', color: 'rgba(250,245,240,0.25)', fontFamily: "'Consolas', 'Courier New', monospace" }}>—</div>
        </div>
        <div style={{ padding: '20px', animation: 'pulse 2s infinite' }}>
          <div style={{ height: '60px', background: 'rgba(250,245,240,0.04)', borderRadius: '8px', marginBottom: '12px' }} />
          <div style={{ height: '20px', background: 'rgba(250,245,240,0.04)', borderRadius: '6px', marginBottom: '8px', width: '60%' }} />
        </div>
      </div>
    )
  }

  if (!data || !data.tiles || data.tiles.length === 0) {
    return null
  }

  const heroTile = data.tiles[heroIndex]
  const supportingTiles = data.tiles.filter((_, idx) => idx !== heroIndex)

  const handleTileClick = (index: number) => {
    if (index !== heroIndex && !swapping) {
      setSwapping(true)
      setTimeout(() => {
        setHeroIndex(index)
        setSwapping(false)
      }, 500)
    }
  }

  return (
    <div style={{ borderRadius: '12px', border: '1px solid rgba(250,245,240,0.06)', overflow: 'hidden', background: '#0D1B2A' }}>
      <style>{`
        @keyframes borderPulse {
          0%, 100% {
            border-left-color: #E84080;
            box-shadow: -2px 0 0 transparent;
          }
          50% {
            border-left-color: #E84080;
            box-shadow: -2px 0 12px rgba(232,64,128,0.25);
          }
        }

        @keyframes pinkFlash {
          0% { background-color: rgba(232,64,128,0.12); }
          100% { background-color: #112238; }
        }

        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        @keyframes slideOut {
          from { transform: translateY(0); opacity: 1; }
          to { transform: translateY(-20px); opacity: 0; }
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        @media (max-width: 480px) {
          .hero-number { font-size: 56px !important; }
          .support-grid { grid-template-columns: 1fr !important; }
          .support-tile {
            display: flex !important;
            align-items: center !important;
            gap: 14px !important;
            text-align: left !important;
            padding: 14px 18px !important;
          }
          .support-number { margin-bottom: 0 !important; font-size: 24px !important; }
        }
      `}</style>

      {/* Module header */}
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid rgba(250,245,240,0.06)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '2px', color: 'rgba(250,245,240,0.5)', fontFamily: "'Sora', sans-serif" }}>
          <span style={{ color: '#3AAFA9', marginRight: '8px' }}>📈</span>By The Numbers
        </div>
        <div style={{ fontSize: '10px', color: 'rgba(250,245,240,0.25)', letterSpacing: '1px', fontFamily: "'Consolas', 'Courier New', monospace" }}>
          MATCHDAY {data.matchday}
        </div>
      </div>

      {/* Hero tile — FULL WIDTH */}
      <div
        style={{
          padding: '32px 28px',
          background: '#112238',
          border: '1px solid rgba(250,245,240,0.06)',
          borderLeft: '3px solid #E84080',
          borderRadius: '0',
          margin: '10px',
          textAlign: 'center',
          animation: swapping ? 'slideOut 0.25s ease-out forwards' : 'slideUp 0.3s ease-out, borderPulse 3s ease-in-out infinite 0.5s',
        }}
      >
        <div
          className="hero-number"
          style={{
            fontSize: '72px',
            fontWeight: 800,
            lineHeight: 1,
            fontFamily: "'Consolas', 'Courier New', monospace",
            letterSpacing: '2px',
            color: heroTile.accent ? '#E84080' : '#FAF5F0',
            marginBottom: '10px',
          }}
        >
          {heroTile.number}
        </div>
        <div
          style={{
            fontSize: '15px',
            fontWeight: 500,
            color: 'rgba(250,245,240,0.65)',
            marginBottom: '8px',
            fontFamily: "'Sora', sans-serif",
          }}
        >
          {heroTile.label}
        </div>
        <div
          style={{
            fontSize: '12px',
            color: 'rgba(250,245,240,0.35)',
            lineHeight: 1.5,
            maxWidth: '400px',
            margin: '0 auto',
            fontFamily: "'Sora', sans-serif",
          }}
        >
          {heroTile.context}
        </div>
      </div>

      {/* Supporting tiles — 3 COLUMNS */}
      <div
        className="support-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '10px',
          padding: '10px',
        }}
      >
        {supportingTiles.map((tile, idx) => {
          const actualIndex = data.tiles.indexOf(tile)
          return (
            <div
              key={actualIndex}
              className="support-tile"
              onClick={() => handleTileClick(actualIndex)}
              style={{
                background: '#112238',
                border: '1px solid rgba(250,245,240,0.06)',
                borderRadius: '10px',
                padding: '20px 14px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'border-color 0.3s, background 0.3s, transform 0.2s',
              }}
              onMouseEnter={(e) => {
                if (!swapping) {
                  (e.currentTarget as HTMLElement).style.background = '#162D45'
                  ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(250,245,240,0.12)'
                }
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = '#112238'
                ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(250,245,240,0.06)'
              }}
            >
              <div
                className="support-number"
                style={{
                  fontSize: '28px',
                  fontWeight: 800,
                  lineHeight: 1,
                  fontFamily: "'Consolas', 'Courier New', monospace",
                  letterSpacing: '1px',
                  color: '#FAF5F0',
                  marginBottom: '6px',
                }}
              >
                {tile.number}
              </div>
              <div
                style={{
                  fontSize: '10px',
                  fontWeight: 500,
                  color: 'rgba(250,245,240,0.45)',
                  lineHeight: 1.3,
                  fontFamily: "'Sora', sans-serif",
                }}
              >
                {tile.label}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
