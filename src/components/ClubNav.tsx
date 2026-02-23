'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CLUBS } from '@/lib/clubs'

export default function ClubNav() {
  const pathname = usePathname()

  return (
    <div className="sticky top-[57px] z-40 border-b border-[#222] bg-[#0a0a0a]/95 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex gap-2 overflow-x-auto py-3 scrollbar-hide">
          <Link
            href="/"
            className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              pathname === '/'
                ? 'bg-white text-black'
                : 'text-gray-400 hover:bg-[#222] hover:text-white'
            }`}
          >
            All Clubs
          </Link>
          {CLUBS.map((club) => {
            const isActive = pathname === `/clubs/${club.slug}`
            return (
              <Link
                key={club.slug}
                href={`/clubs/${club.slug}`}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'text-black'
                    : 'text-gray-400 hover:bg-[#222] hover:text-white'
                }`}
                style={
                  isActive
                    ? { backgroundColor: club.primaryColor }
                    : undefined
                }
              >
                <span>{club.badgeEmoji}</span>
                <span>{club.name}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
