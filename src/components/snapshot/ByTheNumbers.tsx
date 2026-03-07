'use client'
import { useEffect, useState, useRef } from 'react'

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

// Strip verbose club suffixes AI tends to generate
function cleanLabel(label: string): string {
  return label
    .replace(/\bfc\b/gi, '')
    .replace(/\bunited\b/gi, 'Utd')
    .replace(/\bhotspur\b/gi, '')
    .replace(/\bcity\b(?=\s|$)/gi, (m, offset, str) => {
      const before = str.slice(0, offset).trim().toLowerCase()
      return ['manchester', 'man', 'leicester'].some(c => before.endsWith(c)) ? 'City' : m
    })
    .replace(/\balbion\b/gi, '')
    .replace(/\bwanderers\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

// Parse number string to float for count-up (handles "14", "67", "20:00", "+3")
function parseNumber(str: string): number | null {
  if (str.includes(':')) return null // time format — skip count-up
  const n = parseFloat(str.replace(/[^0-9.\-+]/g, ''))
  return isNaN(n) ? null : n
}

// Count-up hook
function useCountUp(target: string, active: boolean, duration = 800): string {
  const [display, setDisplay] = useState('0')
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    if (!active) return
    const parsed = parseNumber(target)
    if (parsed === null) {
      setDisplay(target)
      return
    }
    const prefix = target.startsWith('+') ? '+' : ''
    const start = Date.now()
    const tick = () => {
      const elapsed = Date.now() - start
      const progress = Math.min(elapsed / duration, 1)
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = Math.round(eased * parsed)
      setDisplay(`${prefix}${current}`)
      if (progress < 1) rafRef.current = requestAnimationFrame(tick)
      else setDisplay(target)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [target, active, duration])

  return display
}

// Intersection observer hook — fires once when element enters viewport
function useInView(ref: React.RefObject<Element>): boolean {
  const [inView, setInView] = useState(false)
  useEffect(() => {
    if (!ref.current) return
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setInView(true); obs.disconnect() }
    }, { threshold: 0.3 })
    obs.observe(ref.current)
    return () => obs.disconnect()
  }, [ref])
  return inView
}

// Hero tile with count-up
function HeroTile({ tile, swapping, inView }: {
  tile: Tile
  swapping: boolean
  inView: boolean
}) {
  const counted = useCountUp(tile.number, inView && !swapping)
  return (
    <div style={{
      padding: '32px 28px',
      background: 'var(--plh-elevated)',
      borderLeft: '3px solid var(--plh-pink)',
      borderRadius: '8px',
      margin: '10px',
      textAlign: 'center',
      animation: swapping ? 'slideOut 0.25s ease-out forwards' : 'slideUp 0.3s ease-out',
      boxShadow: '-2px 0 16px rgba(232,64,128,0.15)',
    }}>
      <div style={{
        fontSize: '72px',
        fontWeight: 800,
        lineHeight: 1,
        fontFamily: "'Consolas','Courier New',monospace",
        letterSpacing: '2px',
        color: tile.accent ? 'var(--plh-pink)' : 'var(--plh-text-100)',
        marginBottom: '10px',
        transition: 'color 0.3s',
      }}>
        {counted}
      </div>
      <div style={{
        fontSize: '15px',
        fontWeight: 500,
        color: 'rgba(250,245,240,0.65)',
        marginBottom: '8px',
        fontFamily: "'Sora', sans-serif",
      }}>
        {cleanLabel(tile.label)}
      </div>
      <div style={{
        fontSize: '12px',
        color: 'rgba(250,245,240,0.35)',
        lineHeight: 1.5,
        maxWidth: '400px',
        margin: '0 auto',
        fontFamily: "'Sora', sans-serif",
      }}>
        {tile.context}
      </div>
    </div>
  )
}

// Supporting tile with flip card + ripple
function SupportTile({ tile, onClick, inView }: {
  tile: Tile
  onClick: () => void
  inView: boolean
}) {
  const [flipped, setFlipped] = useState(false)
  const [ripple, setRipple] = useState<{ x: number; y: number; id: number } | null>(null)
  const counted = useCountUp(tile.number, inView, 600)

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Ripple
    const rect = e.currentTarget.getBoundingClientRect()
    setRipple({ x: e.clientX - rect.left, y: e.clientY - rect.top, id: Date.now() })
    setTimeout(() => setRipple(null), 600)
    onClick()
  }

  return (
    <div
      onClick={handleClick}
      onMouseEnter={() => setFlipped(true)}
      onMouseLeave={() => setFlipped(false)}
      style={{
        perspective: '600px',
        cursor: 'pointer',
        position: 'relative',
      }}
    >
      <div style={{
        position: 'relative',
        transformStyle: 'preserve-3d',
        transition: 'transform 0.45s cubic-bezier(0.23, 1, 0.32, 1)',
        transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        borderRadius: '10px',
        minHeight: '90px',
      }}>
        {/* Front */}
        <div style={{
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
          background: 'var(--plh-elevated)',
          border: '1px solid rgba(250,245,240,0.06)',
          borderRadius: '10px',
          padding: '20px 14px',
          textAlign: 'center',
          overflow: 'hidden',
          position: 'relative',
        }}>
          {ripple && (
            <span style={{
              position: 'absolute',
              left: ripple.x,
              top: ripple.y,
              width: 0,
              height: 0,
              borderRadius: '50%',
              background: 'rgba(232,64,128,0.35)',
              transform: 'translate(-50%,-50%)',
              animation: 'rippleOut 0.6s ease-out forwards',
              pointerEvents: 'none',
            }} />
          )}
          <div style={{
            fontSize: '28px',
            fontWeight: 800,
            lineHeight: 1,
            fontFamily: "'Consolas','Courier New',monospace",
            color: tile.accent ? 'var(--plh-pink)' : 'var(--plh-text-100)',
            marginBottom: '6px',
          }}>
            {counted}
          </div>
          <div style={{
            fontSize: '10px',
            fontWeight: 500,
            color: 'rgba(250,245,240,0.45)',
            lineHeight: 1.3,
            fontFamily: "'Sora', sans-serif",
          }}>
            {cleanLabel(tile.label)}
          </div>
        </div>

        {/* Back */}
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
          transform: 'rotateY(180deg)',
          background: 'color-mix(in srgb, var(--plh-pink) 12%, var(--plh-elevated))',
          border: '1px solid rgba(232,64,128,0.25)',
          borderRadius: '10px',
          padding: '14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <p style={{
            fontSize: '11px',
            lineHeight: 1.45,
            color: 'rgba(250,245,240,0.85)',
            fontFamily: "'Sora', sans-serif",
            textAlign: 'center',
            margin: 0,
          }}>
            {tile.context}
          </p>
        </div>
      </div>
    </div>
  )
}

export default function ByTheNumbers({ club = null }: ByTheNumbersProps) {
  const [data, setData] = useState<ByTheNumbersData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [heroIndex, setHeroIndex] = useState(0)
  const [swapping, setSwapping] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const inView = useInView(containerRef as React.RefObject<Element>)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const url = new URL('/api/snapshot', typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000')
        if (club) url.searchParams.set('club', club)
        const response = await fetch(url.toString())
        if (!response.ok) throw new Error('Failed to fetch snapshot')
        const responseData = await response.json()
        if (responseData.success && responseData.data?.modules?.by_the_numbers) {
          setData(responseData.data.modules.by_the_numbers)
        }
      } catch (err) {
        console.error('[ByTheNumbers] Error:', err)
        setData(null)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [club])

  const handleTileClick = (index: number) => {
    if (index === heroIndex || swapping) return
    setSwapping(true)
    setTimeout(() => {
      setHeroIndex(index)
      setSwapping(false)
    }, 280)
  }

  if (isLoading) return (
    <div style={{ borderRadius: '12px', border: '1px solid rgba(250,245,240,0.06)', background: 'var(--plh-card)', padding: '20px', opacity: 0.5 }}>
      <div style={{ height: '120px', background: 'rgba(250,245,240,0.04)', borderRadius: '8px', animation: 'pulse 2s infinite' }} />
    </div>
  )

  if (!data || !data.tiles?.length) return null

  const heroTile = data.tiles[heroIndex]
  const supportingTiles = data.tiles.filter((_, idx) => idx !== heroIndex)

  return (
    <div
      ref={containerRef}
      style={{
        borderRadius: '12px',
        border: '1px solid rgba(250,245,240,0.06)',
        overflow: 'hidden',
        background: 'var(--plh-card)',
      }}
    >
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(16px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes slideOut {
          from { transform: translateY(0); opacity: 1; }
          to { transform: translateY(-16px); opacity: 0; }
        }
        @keyframes rippleOut {
          to { width: 200px; height: 200px; opacity: 0; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>

      {/* Header */}
      <div style={{
        padding: '14px 20px',
        borderBottom: '1px solid rgba(250,245,240,0.06)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '2px', color: 'rgba(250,245,240,0.5)', fontFamily: "'Sora', sans-serif" }}>
          By The Numbers
        </div>
        <div style={{ fontSize: '10px', color: 'rgba(250,245,240,0.25)', letterSpacing: '1px', fontFamily: "'Consolas','Courier New',monospace" }}>
          MD {data.matchday}
        </div>
      </div>

      {/* Hero */}
      <HeroTile tile={heroTile} swapping={swapping} inView={inView} />

      {/* Supporting tiles */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        gap: '10px',
        padding: '0 10px 10px',
      }}>
        {supportingTiles.map((tile) => {
          const actualIndex = data.tiles.indexOf(tile)
          return (
            <SupportTile
              key={actualIndex}
              tile={tile}
              onClick={() => handleTileClick(actualIndex)}
              inView={inView}
            />
          )
        })}
      </div>
    </div>
  )
}
