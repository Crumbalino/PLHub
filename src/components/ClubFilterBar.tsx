'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

interface Club {
  id: number
  slug: string
  name: string
  shortName?: string
}

const CLUBS: Club[] = [
  { id: 3, slug: 'arsenal', name: 'Arsenal', shortName: 'ARS' },
  { id: 7, slug: 'aston-villa', name: 'Aston Villa', shortName: 'AVL' },
  { id: 94, slug: 'brentford', name: 'Brentford', shortName: 'BRE' },
  { id: 36, slug: 'brighton', name: 'Brighton', shortName: 'BHA' },
  { id: 91, slug: 'bournemouth', name: 'Bournemouth', shortName: 'BOU' },
  { id: 8, slug: 'chelsea', name: 'Chelsea', shortName: 'CHE' },
  { id: 31, slug: 'crystal-palace', name: 'Crystal Palace', shortName: 'CRY' },
  { id: 11, slug: 'everton', name: 'Everton', shortName: 'EVE' },
  { id: 54, slug: 'fulham', name: 'Fulham', shortName: 'FUL' },
  { id: 40, slug: 'ipswich', name: 'Ipswich', shortName: 'IPS' },
  { id: 13, slug: 'leicester', name: 'Leicester', shortName: 'LEI' },
  { id: 14, slug: 'liverpool', name: 'Liverpool', shortName: 'LIV' },
  { id: 43, slug: 'manchester-city', name: 'Man City', shortName: 'MCI' },
  { id: 1, slug: 'manchester-united', name: 'Man Utd', shortName: 'MUN' },
  { id: 4, slug: 'newcastle', name: 'Newcastle', shortName: 'NEW' },
  { id: 17, slug: 'nottingham-forest', name: 'Forest', shortName: 'NFO' },
  { id: 20, slug: 'southampton', name: 'Southampton', shortName: 'SOU' },
  { id: 6, slug: 'tottenham', name: 'Spurs', shortName: 'TOT' },
  { id: 21, slug: 'west-ham', name: 'West Ham', shortName: 'WHU' },
  { id: 39, slug: 'wolverhampton', name: 'Wolves', shortName: 'WOL' },
]

const clubMap = Object.fromEntries(CLUBS.map(c => [c.slug, c]))

export default function ClubFilterBar({ currentClub }: { currentClub?: string }) {
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const selectedClub = currentClub || null
  const isAllActive = !selectedClub

  const handleClubSelect = useCallback((slug: string) => {
    if (selectedClub === slug) {
      router.push('/')
    } else {
      router.push(`/?club=${slug}`)
    }
    setMobileOpen(false)
  }, [selectedClub, router])

  const handleClear = useCallback(() => {
    router.push('/')
  }, [router])

  const selectedClubData = selectedClub ? clubMap[selectedClub] : null

  return (
    <>
      {/* DESKTOP VERSION */}
      <div
        className="hidden md:block rounded-xl"
        style={{
          background: 'linear-gradient(160deg, #0A6E6E 0%, #004D50 50%, #003538 100%)',
          padding: '18px 24px 22px',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
          marginTop: '16px',
          marginBottom: '16px',
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

        {/* Badge Grid - 10 per row, 2 rows */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(10, 1fr)',
            gap: '12px 10px',
            alignItems: 'center',
            justifyItems: 'center',
            marginBottom: selectedClub ? '16px' : '0',
          }}
        >
          {CLUBS.map((club) => {
            const isSelected = selectedClub === club.slug
            const hasOtherSelected = !!selectedClub && selectedClub !== club.slug
            const opacity = isSelected ? 1 : hasOtherSelected ? 0.4 : 0.7

            return (
              <button
                key={club.slug}
                onClick={() => handleClubSelect(club.slug)}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  opacity: opacity,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  border: isSelected ? '2px solid #C4A23E' : '2px solid transparent',
                  backgroundColor: 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement
                  el.style.opacity = '1'
                  el.style.transform = 'scale(1.15)'
                  el.style.boxShadow = '0 0 12px rgba(196,162,62,0.4)'
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement
                  el.style.transform = 'scale(1)'
                  el.style.boxShadow = 'none'
                  el.style.opacity = opacity.toString()
                }}
                title={club.name}
              >
                <Image
                  src={`https://resources.premierleague.com/premierleague/badges/t${club.id}.png`}
                  alt={club.name}
                  width={36}
                  height={36}
                  unoptimized
                  className="w-full h-full object-contain"
                />
              </button>
            )
          })}
        </div>

        {/* Clear button - shown when filtered */}
        {selectedClub && (
          <div
            style={{
              textAlign: 'center',
              animation: 'fadeIn 0.3s ease',
            }}
          >
            <button
              onClick={handleClear}
              style={{
                color: '#C4A23E',
                fontSize: '12px',
                cursor: 'pointer',
                background: 'none',
                border: 'none',
                padding: 0,
                fontWeight: 500,
              }}
              className="hover:opacity-80 transition-opacity"
            >
              ✕ Clear
            </button>
          </div>
        )}
      </div>

      {/* MOBILE VERSION */}
      <div className="md:hidden">
        {/* Trigger */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="w-full rounded-xl transition-all"
          style={{
            background: 'linear-gradient(160deg, #0A6E6E 0%, #004D50 50%, #003538 100%)',
            padding: '12px 16px',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
            marginTop: '16px',
            marginBottom: mobileOpen ? '0' : '16px',
          }}
        >
          <div className="flex items-center justify-center gap-2">
            {isAllActive ? (
              <>
                <span className="text-lg">⚽</span>
                <span className="text-sm text-white">All clubs</span>
              </>
            ) : (
              <>
                <Image
                  src={`https://resources.premierleague.com/premierleague/badges/t${selectedClubData?.id}.png`}
                  alt={selectedClubData?.name || ''}
                  width={24}
                  height={24}
                  unoptimized
                  className="w-6 h-6"
                />
                <span className="text-sm text-white">{selectedClubData?.name}</span>
              </>
            )}
            <span
              className="text-white/60 ml-auto transition-transform"
              style={{
                transform: mobileOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              }}
            >
              ▼
            </span>
          </div>
        </button>

        {/* Dropdown */}
        {mobileOpen && (
          <div
            className="rounded-b-xl overflow-hidden"
            style={{
              background: 'linear-gradient(160deg, #0A6E6E 0%, #004D50 50%, #003538 100%)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderTop: 'none',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
              animation: 'scaleDown 0.25s ease-out',
              transformOrigin: 'top',
              marginBottom: '16px',
              padding: '16px',
            }}
          >
            <style>{`
              @keyframes scaleDown {
                from {
                  transform: scaleY(0);
                  opacity: 0;
                }
                to {
                  transform: scaleY(1);
                  opacity: 1;
                }
              }
              @keyframes fadeIn {
                from {
                  opacity: 0;
                }
                to {
                  opacity: 1;
                }
              }
            `}</style>

            {/* Badge Grid - 5 per row, 4 rows */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(5, 1fr)',
                gap: '12px',
              }}
            >
              {CLUBS.map((club) => {
                const isSelected = selectedClub === club.slug
                const hasOtherSelected = !!selectedClub && selectedClub !== club.slug
                const opacity = isSelected ? 1 : hasOtherSelected ? 0.4 : 0.7

                return (
                  <button
                    key={club.slug}
                    onClick={() => handleClubSelect(club.slug)}
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      opacity: opacity,
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      border: isSelected ? '2px solid #C4A23E' : '2px solid transparent',
                      backgroundColor: 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto',
                      padding: 0,
                    }}
                    onMouseEnter={(e) => {
                      const el = e.currentTarget as HTMLElement
                      el.style.opacity = '1'
                      el.style.transform = 'scale(1.15)'
                      el.style.boxShadow = '0 0 12px rgba(196,162,62,0.4)'
                    }}
                    onMouseLeave={(e) => {
                      const el = e.currentTarget as HTMLElement
                      el.style.transform = 'scale(1)'
                      el.style.boxShadow = 'none'
                      el.style.opacity = opacity.toString()
                    }}
                    title={club.name}
                  >
                    <Image
                      src={`https://resources.premierleague.com/premierleague/badges/t${club.id}.png`}
                      alt={club.name}
                      width={36}
                      height={36}
                      unoptimized
                      className="w-full h-full object-contain"
                    />
                  </button>
                )
              })}
            </div>

            {/* Clear button - shown when filtered */}
            {selectedClub && (
              <div
                style={{
                  textAlign: 'center',
                  marginTop: '16px',
                  animation: 'fadeIn 0.3s ease',
                }}
              >
                <button
                  onClick={handleClear}
                  style={{
                    color: '#C4A23E',
                    fontSize: '12px',
                    cursor: 'pointer',
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    fontWeight: 500,
                  }}
                  className="hover:opacity-80 transition-opacity"
                >
                  ✕ Clear
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}
