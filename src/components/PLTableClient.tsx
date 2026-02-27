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
    <div className="rounded-xl bg-[#183538] border border-white/5 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06]">
        <span className="text-sm font-bold text-[#C4A23E]">Premier League</span>
        <span className="text-[10px] text-white/40">2024/25</span>
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-[20px_1fr_22px_22px_28px] gap-1.5 px-3 py-1.5 border-b border-white/[0.06]">
        <span className="text-[10px] text-white/30">#</span>
        <span className="text-[10px] text-white/30">Club</span>
        <span className="text-[10px] text-white/30 text-center">P</span>
        <span className="text-[10px] text-white/30 text-center">GD</span>
        <span className="text-[10px] text-white/30 text-center">Pts</span>
      </div>

      {/* Rows */}
      {visibleEntries.map((entry) => (
        <Link
          key={entry.position}
          href={`/?club=${toSlug(entry.name)}`}
          className="grid grid-cols-[20px_1fr_22px_22px_28px] gap-1.5 px-3 py-1.5 border-b border-white/[0.03] last:border-0 hover:bg-white/[0.04] transition-colors items-center border-l-2"
          style={{
            borderLeftColor: entry.position <= 4 ? '#22c55e' : entry.position >= 18 ? '#ef4444' : 'transparent',
          }}
        >
          <span className="text-xs tabular-nums font-semibold text-white">{entry.position}</span>
          <div className="flex items-center gap-1.5 min-w-0">
            <img src={entry.crest} alt="" className="w-4 h-4 object-contain shrink-0" />
            <span className="text-xs text-white truncate">{entry.name}</span>
          </div>
          <span className="text-xs text-white/50 tabular-nums text-center">{entry.played}</span>
          <span className="text-xs text-white/50 tabular-nums text-center">{entry.gd > 0 ? `+${entry.gd}` : entry.gd}</span>
          <span className="text-xs font-bold text-white tabular-nums text-center">{entry.pts}</span>
        </Link>
      ))}

      {/* Expand/collapse */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full py-2 text-center text-xs text-[#C4A23E] hover:text-[#d4b24e] transition-colors border-t border-white/5"
      >
        {expanded ? 'Show less' : 'Full table ↓'}
      </button>

      {/* Legend */}
      <div className="flex gap-3 px-3 py-1.5 border-t border-white/[0.06]">
        <span className="text-[10px] text-green-400/70">■ UCL</span>
        <span className="text-[10px] text-red-400/70">■ Relegation</span>
      </div>
    </div>
  )
}
