'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { CLUBS } from '@/lib/clubs'

export default function ClubNav() {
  const pathname = usePathname()

  return (
    <div className="sticky top-[57px] z-40 border-b border-[#222] bg-[#0a0a0a]/95 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex gap-2.5 overflow-x-auto py-4 scrollbar-hide">

          {/* All Clubs pill */}
          <Link
            href="/"
            className={`flex min-h-[44px] shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition-colors ${
              pathname === '/'
                ? 'bg-white text-black'
                : 'text-gray-300 hover:bg-[#222] hover:text-white'
            }`}
          >
            All Clubs
          </Link>

          {/* Club pills */}
          {CLUBS.map((club) => {
            const isActive = pathname === `/clubs/${club.slug}`
            return (
              <Link
                key={club.slug}
                href={`/clubs/${club.slug}`}
                className={`flex min-h-[44px] shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition-colors ${
                  isActive ? '' : 'text-gray-300 hover:bg-[#222] hover:text-white'
                }`}
                style={isActive ? { backgroundColor: club.primaryColor, color: '#fff' } : undefined}
                title={club.name}
              >
                {/* Badge in white circle container */}
                <span className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white">
                  <Image
                    src={club.badgeUrl}
                    alt={`${club.name} badge`}
                    width={20}
                    height={20}
                    unoptimized
                    className="object-contain"
                  />
                </span>
                <span>{club.shortName}</span>
              </Link>
            )
          })}

        </div>
      </div>
    </div>
  )
}
