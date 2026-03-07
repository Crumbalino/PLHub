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
        className="hidden md:block rounded-[12px] border border-[var(--plh-border)] overflow-hidden"
        style={{ background: 'var(--plh-card)' }}
      >
        {/* Header row */}
        <div
          className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--plh-border)]"
          style={{ background: 'color-mix(in srgb, var(--plh-teal) 6%, transparent)' }}
        >
          <span
            className="text-[11px] font-bold uppercase tracking-[1.5px]"
            style={{ color: 'var(--plh-teal)' }}
          >
            Filter by club
          </span>
          {selectedClub && (
            <button
              onClick={handleClear}
              className="text-[11px] font-medium transition-colors duration-150"
              style={{ color: 'rgba(250,245,240,0.5)' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--plh-pink)' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'rgba(250,245,240,0.5)' }}
            >
              Clear ✕
            </button>
          )}
        </div>

        {/* Badge Grid — 10 per row, 2 rows */}
        <div className="p-3">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(10, 1fr)',
            gap: '12px 10px',
            alignItems: 'center',
            justifyItems: 'center',
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
                  opacity: selectedClub && selectedClub !== club.slug ? 0.4 : 1,
                  transform: selectedClub === club.slug ? 'scale(1.15)' : 'scale(1)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  border: '2px solid transparent',
                  backgroundColor: 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                  filter: selectedClub === club.slug ? 'drop-shadow(0 0 4px var(--plh-teal))' : 'none',
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement
                  el.style.opacity = '1'
                  if (!isSelected) {
                    el.style.transform = 'scale(1.15)'
                  }
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement
                  el.style.transform = selectedClub === club.slug ? 'scale(1.15)' : 'scale(1)'
                  el.style.opacity = (selectedClub && selectedClub !== club.slug ? '0.4' : '1')
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
        </div>
      </div>

      {/* MOBILE VERSION — compact, subtle */}
      <div className="md:hidden mt-3 mb-3">
        {/* Trigger */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="w-full rounded-[10px] transition-all"
          style={{
            background: 'var(--plh-card)',
            padding: '10px 14px',
            border: '1px solid var(--plh-border)',
            borderRadius: mobileOpen ? '10px 10px 0 0' : '10px',
          }}
        >
          <div className="flex items-center gap-2">
            {isAllActive ? (
              <>
                <span className="text-base">⚽</span>
                <span className="text-sm" style={{ color: 'var(--plh-text-100)' }}>All clubs</span>
              </>
            ) : (
              <>
                <Image
                  src={`https://resources.premierleague.com/premierleague/badges/t${selectedClubData?.id}.png`}
                  alt={selectedClubData?.name || ''}
                  width={22}
                  height={22}
                  unoptimized
                  className="w-[22px] h-[22px]"
                />
                <span className="text-sm" style={{ color: 'var(--plh-text-100)' }}>{selectedClubData?.name}</span>
              </>
            )}
            <span
              className="ml-auto transition-transform text-xs"
              style={{
                color: 'var(--plh-text-40)',
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
            className="rounded-b-[10px] overflow-hidden"
            style={{
              background: 'var(--plh-card)',
              border: '1px solid var(--plh-border)',
              borderTop: 'none',
              animation: 'scaleDown 0.2s ease-out',
              transformOrigin: 'top',
              padding: '12px',
            }}
          >
            <style>{`
              @keyframes scaleDown {
                from { transform: scaleY(0); opacity: 0; }
                to { transform: scaleY(1); opacity: 1; }
              }
            `}</style>

            {/* Badge Grid - 5 per row, 4 rows */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(5, 1fr)',
                gap: '10px',
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
                      width: '38px',
                      height: '38px',
                      borderRadius: '50%',
                      opacity: opacity,
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      border: isSelected ? '2px solid var(--plh-gold)' : '2px solid transparent',
                      backgroundColor: 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto',
                      padding: 0,
                    }}
                    title={club.name}
                  >
                    <Image
                      src={`https://resources.premierleague.com/premierleague/badges/t${club.id}.png`}
                      alt={club.name}
                      width={34}
                      height={34}
                      unoptimized
                      className="w-full h-full object-contain"
                    />
                  </button>
                )
              })}
            </div>

            {/* Clear button */}
            {selectedClub && (
              <div style={{ textAlign: 'center', marginTop: '12px' }}>
                <button
                  onClick={handleClear}
                  style={{
                    color: 'var(--plh-gold)',
                    fontSize: '12px',
                    cursor: 'pointer',
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    fontWeight: 500,
                  }}
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
