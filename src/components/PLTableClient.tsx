'use client'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'

interface TableEntry {
  position: number
  name: string
  crest: string
  played: number
  gd: number
  pts: number
  form?: Array<'W' | 'D' | 'L'>
}

const toSlug = (name: string) =>
  name
    .toLowerCase()
    .replace('manchester united', 'manchester-united')
    .replace('man united', 'man-united')
    .replace('manchester city', 'manchester-city')
    .replace('man city', 'man-city')
    .replace("nott'm forest", 'nottingham-forest')
    .replace('nottingham forest', 'nottingham-forest')
    .replace('tottenham hotspur', 'tottenham')
    .replace('tottenham', 'tottenham')
    .replace('newcastle united', 'newcastle')
    .replace('newcastle', 'newcastle')
    .replace('west ham united', 'west-ham')
    .replace('west ham', 'west-ham')
    .replace('aston villa', 'aston-villa')
    .replace('crystal palace', 'crystal-palace')
    .replace(' ', '-')
    .replace(/[^a-z0-9-]/g, '')

function FormDots({ form }: { form?: Array<'W' | 'D' | 'L'> }) {
  const [hovered, setHovered] = useState(false)

  const formArray = form && form.length > 0
    ? form.slice(0, 5).concat(Array(Math.max(0, 5 - form.length)).fill(undefined))
    : Array(5).fill(undefined)

  return (
    <div
      className="flex gap-[3px]"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {formArray.map((result, i) => {
        let bgColor = 'rgba(255,255,255,0.15)'
        let opacity = 1

        if (result === 'W') bgColor = '#3AAFA9'
        else if (result === 'D') bgColor = '#D4A843'
        else if (result === 'L') bgColor = '#E84080'
        else if (!result) opacity = 0.2

        return (
          <div
            key={i}
            style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              background: bgColor,
              opacity,
              transform: hovered ? 'scale(1.3)' : 'scale(1)',
              transition: 'transform 150ms ease-out',
            }}
          />
        )
      })}
    </div>
  )
}

function PtsCounter({ targetPts, rowIndex }: { targetPts: number; rowIndex: number }) {
  const [displayValue, setDisplayValue] = useState(0)
  const animationRef = useRef<number | null>(null)

  useEffect(() => {
    const startTime = performance.now()
    const DURATION = 600
    const STAGGER_DELAY = rowIndex * 60

    const startDelay = setTimeout(() => {
      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime
        const rawProgress = Math.min(elapsed / DURATION, 1)

        // Cubic ease-out: t = 1 - (1-t)^3
        const progress = 1 - Math.pow(1 - rawProgress, 3)

        const currentValue = Math.round(progress * targetPts)
        setDisplayValue(currentValue)

        if (rawProgress < 1) {
          animationRef.current = requestAnimationFrame(animate)
        }
      }

      animationRef.current = requestAnimationFrame(animate)
    }, STAGGER_DELAY)

    return () => {
      clearTimeout(startDelay)
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [targetPts, rowIndex])

  const isAnimating = displayValue < targetPts
  const color = isAnimating ? '#3AAFA9' : '#F8F9FB'

  return (
    <span
      style={{ fontSize: '14px', fontWeight: 700, textAlign: 'center', color, fontFamily: "'JetBrains Mono', 'Consolas', monospace" }}
    >
      {displayValue}
    </span>
  )
}

export default function PLTableClient({ entries }: { entries: TableEntry[] }) {
  const [expanded, setExpanded] = useState(false)
  const visibleEntries = expanded ? entries : entries.slice(0, 6)

  return (
    <div
      className="relative rounded-[10px]"
      style={{
        background: 'var(--plh-card)',
        border: '1px solid var(--plh-border)',
        boxShadow: 'var(--plh-shadow)',
        overflow: 'visible',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-2.5 rounded-t-[10px]"
        style={{ borderBottom: '1px solid var(--plh-border)' }}
      >
        <span style={{ fontSize: '16px', fontWeight: 700, color: '#F8F9FB', fontFamily: "'Sora', sans-serif" }}>
          Premier League
        </span>
        <span className="text-[10px] font-medium" style={{ color: '#F8F9FB', fontFamily: "'Sora', sans-serif" }}>
          2024/25
        </span>
      </div>

      {/* Column headers — # | Club | P | Pts */}
      <div
        className="grid items-center px-3 py-1.5"
        style={{
          gridTemplateColumns: '18px 1fr 24px 28px',
          gap: '6px',
          borderBottom: '1px solid var(--plh-border)',
        }}
      >
        <span style={{ fontSize: '11px', color: '#F8F9FB', fontFamily: "'Sora', sans-serif" }}>#</span>
        <span style={{ fontSize: '11px', color: '#F8F9FB', fontFamily: "'Sora', sans-serif" }}>Club</span>
        <span style={{ fontSize: '11px', textAlign: 'center', color: '#F8F9FB', fontFamily: "'Sora', sans-serif" }}>P</span>
        <span style={{ fontSize: '11px', textAlign: 'center', color: '#F8F9FB', fontFamily: "'Sora', sans-serif" }}>Pts</span>
      </div>

      {/* Rows */}
      {visibleEntries.map((entry, rowIndex) => (
        <Link
          key={entry.position}
          href={`/?club=${toSlug(entry.name)}`}
          className="grid items-center px-3 py-2.5 border-l-2"
          style={{
            gridTemplateColumns: '18px 1fr 24px 28px',
            gap: '6px',
            borderBottom: '1px solid color-mix(in srgb, var(--plh-text-100) 3%, transparent)',
            background: 'transparent',
            borderLeftColor:
              entry.position <= 3
                ? 'var(--plh-teal)'
                : entry.position >= 18
                ? '#ef4444'
                : 'transparent',
          }}
        >
          {/* Position */}
          <span
            style={{
              fontSize: '14px',
              fontWeight: 700,
              color: entry.position <= 3 ? 'var(--plh-teal)' : '#F8F9FB',
              fontFamily: "'JetBrains Mono', 'Consolas', monospace",
            }}
          >
            {entry.position}
          </span>

          {/* Badge + Name */}
          <div className="flex items-center gap-2 min-w-0">
            <img
              src={entry.crest}
              alt=""
              className="object-contain shrink-0"
              style={{ width: '32px', height: '32px', objectFit: 'contain', filter: 'drop-shadow(0 0 4px rgba(255,255,255,0.3))' }}
            />
            <span
              style={{ fontSize: '14px', fontWeight: 500, color: '#F8F9FB', fontFamily: "'Sora', sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
            >
              {entry.name}
            </span>
          </div>

          {/* Played */}
          <span
            style={{ fontSize: '14px', fontWeight: 700, textAlign: 'center', color: '#F8F9FB', fontFamily: "'JetBrains Mono', 'Consolas', monospace" }}
          >
            {entry.played}
          </span>

          {/* Points with Counter Animation */}
          <PtsCounter targetPts={entry.pts} rowIndex={rowIndex} />
        </Link>
      ))}

      {/* Expand */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full py-2 text-center text-[11px] transition-opacity rounded-b-[10px]"
        style={{
          borderTop: '1px solid var(--plh-border)',
          color: '#F8F9FB',
          fontFamily: "'Sora', sans-serif",
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = '0.8' }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = '1' }}
      >
        {expanded ? 'Show less ↑' : 'Full table ↓'}
      </button>

      {/* Legend */}
      <div
        className="flex gap-3 px-3 py-1.5"
        style={{ borderTop: '1px solid var(--plh-border)' }}
      >
        <span className="text-[10px]" style={{ color: '#F8F9FB', fontFamily: "'Sora', sans-serif" }}>■ UCL</span>
        <span className="text-[10px]" style={{ color: '#F8F9FB', fontFamily: "'Sora', sans-serif" }}>■ Relegation</span>
      </div>
    </div>
  )
}
