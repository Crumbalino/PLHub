'use client'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'

// ── Brand tokens (inline — CSS vars are not injected) ──
const CARD    = '#112238'
const BORDER  = 'rgba(250,245,240,0.06)'
const SHADOW  = '0 2px 6px rgba(0,0,0,0.2), 0 1px 2px rgba(0,0,0,0.1)'
const TEAL    = '#3AAFA9'
const PINK    = '#E84080'
const WHITE   = '#F8F9FB'
const ROW_SEP = 'rgba(250,245,240,0.04)'

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

const getBadgeScale = (name: string): string => {
  const lowerName = name.toLowerCase()
  if (lowerName.includes('tottenham') || lowerName.includes('spurs')) return '1.3'
  if (lowerName.includes('crystal palace')) return '1.25'
  if (lowerName.includes('nottingham') || lowerName.includes('forest')) return '1.2'
  if (lowerName.includes('leeds')) return '1.15'
  return '1'
}

function FormDots({ form, hoveredRow, rowIndex }: { form?: Array<'W' | 'D' | 'L'>; hoveredRow: number | null; rowIndex: number }) {
  const isRowHovered = hoveredRow === rowIndex

  const formArray = form && form.length > 0
    ? form.slice(0, 5).concat(Array(Math.max(0, 5 - form.length)).fill(undefined))
    : Array(5).fill(undefined)

  return (
    <div
      className="flex gap-[3px]"
      style={{
        transform: isRowHovered ? 'scale(1.3)' : 'scale(1)',
        transition: 'transform 150ms ease',
      }}
    >
      {formArray.map((result, i) => {
        let bgColor = 'rgba(255,255,255,0.15)'
        if (result === 'W') bgColor = TEAL
        else if (result === 'D') bgColor = '#D4A843'
        else if (result === 'L') bgColor = PINK

        return (
          <div
            key={i}
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: bgColor,
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
      if (animationRef.current !== null) cancelAnimationFrame(animationRef.current)
    }
  }, [targetPts, rowIndex])

  const isAnimating = displayValue < targetPts
  const color = isAnimating ? TEAL : WHITE

  return (
    <span style={{ fontSize: '14px', fontWeight: 700, textAlign: 'center', color, fontFamily: "'JetBrains Mono', 'Consolas', monospace" }}>
      {displayValue}
    </span>
  )
}

export default function PLTableClient({ entries }: { entries: TableEntry[] }) {
  const [expanded, setExpanded] = useState(false)
  const [hoveredRow, setHoveredRow] = useState<number | null>(null)
  const visibleEntries = expanded ? entries : entries.slice(0, 6)

  return (
    <div
      className="relative rounded-[10px]"
      style={{
        background: CARD,
        border: `1px solid ${BORDER}`,
        boxShadow: SHADOW,
        overflow: 'visible',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-2.5 rounded-t-[10px]"
        style={{ borderBottom: `1px solid ${BORDER}` }}
      >
        <span style={{ fontSize: '16px', fontWeight: 700, color: WHITE, fontFamily: "'Sora', sans-serif" }}>
          Premier League
        </span>
        <span style={{ fontSize: '12px', fontWeight: 500, color: WHITE, fontFamily: "'Sora', sans-serif" }}>
          2024/25
        </span>
      </div>

      {/* Rows */}
      {visibleEntries.map((entry, rowIndex) => (
        <Link
          key={entry.position}
          href={`/?club=${toSlug(entry.name)}`}
          className="grid items-center px-3 py-2.5 border-l-2"
          style={{
            gridTemplateColumns: '24px 42px 1fr 44px 24px 28px',
            gap: '12px',
            borderBottom: `1px solid ${ROW_SEP}`,
            background: 'transparent',
            borderLeftColor:
              entry.position <= 4
                ? TEAL
                : entry.position >= 18
                ? PINK
                : 'transparent',
          }}
          onMouseEnter={() => setHoveredRow(rowIndex)}
          onMouseLeave={() => setHoveredRow(null)}
        >
          {/* Position */}
          <span
            style={{
              fontSize: '14px',
              fontWeight: 700,
              textAlign: 'center',
              color: entry.position <= 4 ? TEAL : WHITE,
              fontFamily: "'JetBrains Mono', 'Consolas', monospace",
            }}
          >
            {entry.position}
          </span>

          {/* Badge */}
          <img
            src={entry.crest}
            alt=""
            className="object-contain shrink-0"
            style={{ width: '42px', height: '42px', objectFit: 'contain', filter: 'drop-shadow(0 0 4px rgba(255,255,255,0.3))', transform: `scale(${getBadgeScale(entry.name)})` }}
          />

          {/* Form Dots */}
          <div className="flex justify-center">
            <FormDots form={entry.form} hoveredRow={hoveredRow} rowIndex={rowIndex} />
          </div>

          {/* Played */}
          <span style={{ fontSize: '14px', fontWeight: 700, textAlign: 'center', color: WHITE, fontFamily: "'JetBrains Mono', 'Consolas', monospace" }}>
            {entry.played}
          </span>

          {/* Points */}
          <PtsCounter targetPts={entry.pts} rowIndex={rowIndex} />
        </Link>
      ))}

      {/* Expand */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full py-2 text-center transition-opacity rounded-b-[10px]"
        style={{
          borderTop: `1px solid ${BORDER}`,
          color: WHITE,
          fontFamily: "'Sora', sans-serif",
          fontSize: '13px',
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = '0.8' }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = '1' }}
      >
        {expanded ? 'Show less ↑' : 'Full table ↓'}
      </button>

      {/* Legend */}
      <div
        className="flex gap-3 px-3 py-1.5"
        style={{ borderTop: `1px solid ${BORDER}` }}
      >
        <span style={{ fontSize: '12px', color: TEAL, fontFamily: "'Sora', sans-serif" }}>■ UCL</span>
        <span style={{ fontSize: '12px', color: PINK, fontFamily: "'Sora', sans-serif" }}>■ Relegation</span>
      </div>
    </div>
  )
}
