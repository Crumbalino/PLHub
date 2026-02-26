'use client'

import { useEffect, useState } from 'react'
import { CLUBS } from '@/lib/clubs'

interface ClubSelectorProps {
  currentSlug?: string
}

export default function ClubSelector({ currentSlug }: ClubSelectorProps) {
  const [selectedSlug, setSelectedSlug] = useState<string>(currentSlug ?? '')
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    // Load persisted club preference from localStorage
    const saved = localStorage.getItem('preferredClub')
    if (saved) {
      setSelectedSlug(saved)
    } else if (currentSlug) {
      setSelectedSlug(currentSlug)
    }
  }, [currentSlug])

  const handleChange = (slug: string) => {
    setSelectedSlug(slug)
    localStorage.setItem('preferredClub', slug)
    if (slug === '') {
      window.location.href = '/'
    } else {
      window.location.href = `/clubs/${slug}`
    }
  }

  if (!isClient) return null

  return (
    <div className="sm:hidden w-full mb-4">
      <select
        onChange={(e) => handleChange(e.target.value)}
        value={selectedSlug}
        className="w-full bg-[#152B2E] text-white border border-white/20 rounded-lg px-4 py-3 text-sm cursor-pointer focus:outline-none focus:border-[#F5C842]"
      >
        <option value="">All Premier League</option>
        {CLUBS.map(club => (
          <option key={club.slug} value={club.slug}>{club.name}</option>
        ))}
      </select>
    </div>
  )
}
