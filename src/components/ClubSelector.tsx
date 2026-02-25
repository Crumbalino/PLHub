'use client'

import { CLUBS } from '@/lib/clubs'

interface ClubSelectorProps {
  currentSlug?: string
}

export default function ClubSelector({ currentSlug }: ClubSelectorProps) {
  return (
    <div className="sm:hidden w-full mb-4">
      <select
        onChange={(e) => { if (e.target.value) window.location.href = e.target.value }}
        value={currentSlug ? `/clubs/${currentSlug}` : '/'}
        className="w-full bg-[#152B2E] text-white border border-white/20 rounded-lg px-4 py-3 text-sm cursor-pointer focus:outline-none focus:border-[#F5C842]"
      >
        <option value="/">All Premier League</option>
        {CLUBS.map(club => (
          <option key={club.slug} value={`/clubs/${club.slug}`}>{club.name}</option>
        ))}
      </select>
    </div>
  )
}
