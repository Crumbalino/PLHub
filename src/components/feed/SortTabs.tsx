'use client'

import type { SortMode } from '@/lib/types'

interface SortTabsProps {
  current: SortMode
  onChange: (mode: SortMode) => void
}

const TABS: { key: SortMode; label: string }[] = [
  { key: 'pulse', label: 'Pulse' },
  { key: 'hot', label: 'Hot' },
  { key: 'new', label: 'New' },
]

export default function SortTabs({ current, onChange }: SortTabsProps) {
  return (
    <div className="flex items-center justify-center gap-8 border-b border-[var(--plh-border)]">
      {TABS.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={`pb-3 text-sm font-medium transition-all duration-200 relative ${
            current === key ? 'text-[var(--plh-text-100)]' : 'text-[var(--plh-text-50)] hover:text-[var(--plh-text-75)]'
          }`}
        >
          {label}
          {current === key && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--plh-pink)] rounded-full" />
          )}
        </button>
      ))}
    </div>
  )
}
