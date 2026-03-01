'use client'

import { useState } from 'react'
import Link from 'next/link'

interface TableEntry {
  position: number
  name: string
  crest: string
  played: number
  gd: number
  pts: number
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

export default function PLTableClient({ entries }: { entries: TableEntry[] }) {
  const [expanded, setExpanded] = useState(false)

  const visibleEntries = expanded ? entries : entries.slice(0, 6)

  return (
    <div
      className="rounded-[10px] overflow-hidden"
      style={{
        background: 'var(--plh-card)',
        border: '1px solid var(--plh-border)',
        boxShadow: 'var(--plh-shadow)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-2.5"
        style={{
          borderBottom: '1px solid var(--plh-border)',
        }}
      >
        <span className="text-sm font-bold" style={{ color: 'var(--plh-gold)' }}>Premier League</span>
        <span className="text-[10px]" style={{ color: 'var(--plh-text-40)' }}>2024/25</span>
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-[20px_1fr_22px_22px_28px] gap-1.5 px-3 py-1.5" style={{ borderBottom: '1px solid var(--plh-border)' }}>
        <span className="text-[10px]" style={{ color: 'var(--plh-text-40)' }}>#</span>
        <span className="text-[10px]" style={{ color: 'var(--plh-text-40)' }}>Club</span>
        <span className="text-[10px] text-center" style={{ color: 'var(--plh-text-40)' }}>P</span>
        <span className="text-[10px] text-center" style={{ color: 'var(--plh-text-40)' }}>GD</span>
        <span className="text-[10px] text-center" style={{ color: 'var(--plh-text-40)' }}>Pts</span>
      </div>

      {/* Rows */}
      {visibleEntries.map((entry) => (
        <Link
          key={entry.position}
          href={`/?club=${toSlug(entry.name)}`}
          className="grid grid-cols-[20px_1fr_22px_22px_28px] gap-1.5 px-3 py-1.5 last:border-0 transition-colors items-center border-l-2"
          style={{
            borderBottom: '1px solid color-mix(in srgb, var(--plh-text-100) 3%, transparent)',
            background: 'color-mix(in srgb, var(--plh-text-100) 0%, transparent)',
            borderLeftColor: entry.position <= 3 ? 'var(--plh-teal)' : entry.position >= 18 ? '#ef4444' : 'transparent',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'color-mix(in srgb, var(--plh-text-100) 4%, transparent)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'color-mix(in srgb, var(--plh-text-100) 0%, transparent)'
          }}
        >
          <span className="text-xs tabular-nums font-semibold" style={{ color: entry.position <= 3 ? 'var(--plh-teal)' : 'var(--plh-text-100)' }}>{entry.position}</span>
          <div className="flex items-center gap-1.5 min-w-0">
            <img src={entry.crest} alt="" className="w-4 h-4 object-contain shrink-0" />
            <span className="text-xs truncate" style={{ color: 'var(--plh-text-100)' }}>{entry.name}</span>
          </div>
          <span className="text-xs tabular-nums text-center" style={{ color: 'var(--plh-text-50)' }}>{entry.played}</span>
          <span className="text-xs tabular-nums text-center" style={{ color: 'var(--plh-text-50)' }}>{entry.gd > 0 ? `+${entry.gd}` : entry.gd}</span>
          <span className="text-xs font-bold tabular-nums text-center" style={{ color: 'var(--plh-text-100)' }}>{entry.pts}</span>
        </Link>
      ))}

      {/* Expand/collapse */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full py-2 text-center text-xs transition-colors"
        style={{
          borderTop: '1px solid var(--plh-border)',
          color: 'var(--plh-gold)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = '0.8'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = '1'
        }}
      >
        {expanded ? 'Show less' : 'Full table ↓'}
      </button>

      {/* Legend */}
      <div className="flex gap-3 px-3 py-1.5" style={{ borderTop: '1px solid var(--plh-border)' }}>
        <span className="text-[10px] text-green-400/70">■ UCL</span>
        <span className="text-[10px] text-red-400/70">■ Relegation</span>
      </div>
    </div>
  )
}
