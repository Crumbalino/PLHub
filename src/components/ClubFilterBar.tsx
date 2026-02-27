'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'

interface Club {
  id: number
  slug: string
  name: string
}

const CLUBS: Club[] = [
  { id: 3, slug: 'arsenal', name: 'Arsenal' },
  { id: 7, slug: 'aston-villa', name: 'Aston Villa' },
  { id: 94, slug: 'brentford', name: 'Brentford' },
  { id: 36, slug: 'brighton', name: 'Brighton' },
  { id: 91, slug: 'bournemouth', name: 'Bournemouth' },
  { id: 8, slug: 'chelsea', name: 'Chelsea' },
  { id: 31, slug: 'crystal-palace', name: 'Crystal Palace' },
  { id: 11, slug: 'everton', name: 'Everton' },
  { id: 54, slug: 'fulham', name: 'Fulham' },
  { id: 40, slug: 'ipswich', name: 'Ipswich' },
  { id: 13, slug: 'leicester', name: 'Leicester' },
  { id: 14, slug: 'liverpool', name: 'Liverpool' },
  { id: 43, slug: 'manchester-city', name: 'Man City' },
  { id: 1, slug: 'manchester-united', name: 'Man Utd' },
  { id: 4, slug: 'newcastle', name: 'Newcastle' },
  { id: 17, slug: 'nottingham-forest', name: 'Forest' },
  { id: 20, slug: 'southampton', name: 'Southampton' },
  { id: 6, slug: 'tottenham', name: 'Spurs' },
  { id: 21, slug: 'west-ham', name: 'West Ham' },
  { id: 39, slug: 'wolverhampton', name: 'Wolves' },
]

export default function ClubFilterBar({ currentClub }: { currentClub?: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const selectedClub = currentClub || searchParams.get('club') || null

  const handleClubClick = (slug: string) => {
    if (selectedClub === slug) {
      router.push('/')
    } else {
      router.push(`/?club=${slug}`)
    }
  }

  const handleAllClick = () => {
    router.push('/')
  }

  const isAllActive = !selectedClub

  return (
    <div
      className="rounded-xl mb-5 overflow-hidden"
      style={{
        background: 'linear-gradient(160deg, #0A6E6E 0%, #004D50 50%, #003538 100%)',
        padding: '18px 20px 22px',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
      }}
    >
      {/* Label */}
      <div
        className="text-center mb-4"
        style={{
          color: 'rgba(196,162,62,0.8)',
          fontSize: '10px',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '3px',
        }}
      >
        Filter By
      </div>

      {/* Badge Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(10, 1fr)',
          gap: '10px 8px',
          alignItems: 'center',
          justifyItems: 'center',
        }}
      >
        {/* All Button */}
        <button
          onClick={handleAllClick}
          style={{
            width: '34px',
            height: '34px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255,255,255,0.1)',
            border: isAllActive ? '2px solid #C4A23E' : '2px solid transparent',
            opacity: isAllActive ? 1 : 0.75,
            cursor: 'pointer',
            transition: 'all 200ms ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: 'bold',
            color: '#C4A23E',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '1'
            e.currentTarget.style.transform = 'scale(1.15)'
            e.currentTarget.style.boxShadow = '0 0 12px rgba(196,162,62,0.4)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)'
            e.currentTarget.style.boxShadow = 'none'
            e.currentTarget.style.opacity = isAllActive ? '1' : '0.75'
          }}
          title="Show all clubs"
        >
          All
        </button>

        {/* Club Badges */}
        {CLUBS.map((club) => {
          const isSelected = selectedClub === club.slug
          const baseOpacity = isSelected ? 1 : selectedClub ? 0.5 : 0.75

          return (
            <button
              key={club.slug}
              onClick={() => handleClubClick(club.slug)}
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                opacity: baseOpacity,
                cursor: 'pointer',
                transition: 'all 200ms ease',
                border: isSelected ? '2px solid #C4A23E' : '2px solid transparent',
                padding: '2px',
                background: 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '1'
                e.currentTarget.style.transform = 'scale(1.15)'
                e.currentTarget.style.boxShadow = '0 0 12px rgba(196,162,62,0.4)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)'
                e.currentTarget.style.boxShadow = 'none'
                e.currentTarget.style.opacity = baseOpacity.toString()
              }}
              title={club.name}
            >
              <Image
                src={`https://resources.premierleague.com/premierleague/badges/t${club.id}.png`}
                alt={club.name}
                width={30}
                height={30}
                unoptimized
                className="w-full h-full object-contain"
              />
            </button>
          )
        })}
      </div>
    </div>
  )
}
