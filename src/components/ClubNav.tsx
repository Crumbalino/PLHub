'use client'

import { useRouter, usePathname } from 'next/navigation'
import { CLUBS } from '@/lib/clubs'

export default function ClubNav() {
  const router = useRouter()
  const pathname = usePathname()

  // Determine the current value based on pathname
  let currentValue = '/'
  for (const club of CLUBS) {
    if (pathname === `/clubs/${club.slug}`) {
      currentValue = `/clubs/${club.slug}`
      break
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    router.push(e.target.value)
  }

  return (
    <div className="border-b border-white/10 bg-transparent px-4 py-3">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-center gap-3 sm:flex-row sm:justify-between">
        {/* Dropdown selector */}
        <div className="relative">
          <select
            value={currentValue}
            onChange={handleChange}
            className="appearance-none rounded-lg border border-white/20 bg-transparent px-3 py-2 text-sm font-medium text-white transition-colors hover:border-white/40 focus:outline-none focus:ring-1 focus:ring-white/20"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='white' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 8px center',
              paddingRight: '28px',
            }}
          >
            <option value="/">All Clubs</option>
            {CLUBS.map((club) => (
              <option key={club.slug} value={`/clubs/${club.slug}`}>
                {club.name}
              </option>
            ))}
          </select>
        </div>

        {/* Right label */}
        <span className="text-xs text-white/40">
          20 clubs • Premier League 2024/25
        </span>
      </div>
    </div>
  )
}
