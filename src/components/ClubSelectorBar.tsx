'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { CLUBS } from '@/lib/clubs'

interface ClubSelectorBarProps {
  currentSlug?: string
}

export default function ClubSelectorBar({ currentSlug }: ClubSelectorBarProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Scroll to active pill on mount
    const activeButton = scrollContainerRef.current?.querySelector('[data-active="true"]')
    if (activeButton && scrollContainerRef.current) {
      const container = scrollContainerRef.current
      const button = activeButton as HTMLElement
      const containerWidth = container.offsetWidth
      const buttonLeft = button.offsetLeft
      const buttonWidth = button.offsetWidth

      // Center the active pill in the visible area
      container.scrollLeft = buttonLeft - containerWidth / 2 + buttonWidth / 2
    }
  }, [currentSlug])

  const isAllActive = !currentSlug

  return (
    <div className="sticky top-16 z-40 bg-[#0A1A1B]/95 backdrop-blur-sm border-b border-white/5 py-2">
      <div className="max-w-[1400px] mx-auto px-4">
        <div
          ref={scrollContainerRef}
          className="flex gap-2 overflow-x-auto scrollbar-hide scroll-smooth"
          style={{ scrollBehavior: 'smooth' }}
        >
          {/* All Clubs Pill */}
          <Link
            href="/"
            data-active={isAllActive}
            className={`flex-shrink-0 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
              isAllActive
                ? 'bg-white/10 text-white border-b-2 border-[#C4A23E]'
                : 'bg-transparent text-gray-400 hover:bg-white/5'
            }`}
          >
            All
          </Link>

          {/* Club Pills */}
          {CLUBS.map((club) => {
            const isActive = currentSlug === club.slug
            return (
              <Link
                key={club.slug}
                href={`/?club=${club.slug}`}
                data-active={isActive}
                className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-white/10 text-white border-b-2 border-[#C4A23E]'
                    : 'bg-transparent text-gray-400 hover:bg-white/5'
                }`}
              >
                <div className="w-5 h-5 flex-shrink-0">
                  <Image
                    src={club.badgeUrl}
                    alt={club.name}
                    width={20}
                    height={20}
                    unoptimized
                    className="w-full h-full object-contain"
                  />
                </div>
                {/* Text hidden on mobile via CSS, visible on larger screens */}
                <span className="hidden sm:inline">{club.shortName || club.name.split(' ')[0]}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
