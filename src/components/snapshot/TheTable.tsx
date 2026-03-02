'use client'

import { useEffect, useState } from 'react'

interface Standing {
  position: number
  club: string
  club_slug: string
  played: number
  won: number
  drawn: number
  lost: number
  gf: number
  ga: number
  gd: number
  points: number
  form: string
}

interface TheTableProps {
  club?: string | null
}

export default function TheTable({ club = null }: TheTableProps) {
  const [standings, setStandings] = useState<Standing[]>([])
  const [highlightedClub, setHighlightedClub] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const url = new URL(
          '/api/snapshot',
          typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'
        )
        if (club) {
          url.searchParams.set('club', club)
        }

        const response = await fetch(url.toString())
        if (!response.ok) {
          throw new Error('Failed to fetch snapshot')
        }

        const data = await response.json()
        if (data.success && data.data?.modules?.the_table) {
          const tableData = data.data.modules.the_table
          setStandings(tableData.standings || [])
          setHighlightedClub(tableData.highlighted_club)
          setError(null)
        } else {
          throw new Error('Invalid response format')
        }
      } catch (err) {
        console.error('[TheTable] Error fetching data:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
        setStandings([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [club])

  // Don't render if no data
  if (!isLoading && standings.length === 0) {
    return null
  }

  // Hide on desktop (≥1024px) since sidebar shows it
  const hideOnDesktop = 'hidden lg:hidden'

  // Loading skeleton
  if (isLoading) {
    return (
      <div className={hideOnDesktop}>
        <h2
          className="text-[11px] font-semibold uppercase tracking-[2px] mb-4"
          style={{ color: 'var(--plh-teal)' }}
        >
          The Table
        </h2>
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div
              key={`skeleton-${i}`}
              className="h-8 rounded animate-pulse"
              style={{ backgroundColor: 'rgba(250, 245, 240, 0.04)' }}
            />
          ))}
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return null
  }

  return (
    <div className={hideOnDesktop}>
      {/* Module header */}
      <h2
        className="text-[11px] font-semibold uppercase tracking-[2px] mb-3"
        style={{ color: 'var(--plh-teal)' }}
      >
        The Table
      </h2>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg" style={{ background: 'var(--plh-card)' }}>
        <table className="w-full text-[13px] border-collapse">
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(250, 245, 240, 0.08)' }}>
              <th className="text-left px-2 py-2 font-semibold" style={{ color: 'var(--plh-text-75)' }}>
                Pos
              </th>
              <th className="text-left px-2 py-2 font-semibold" style={{ color: 'var(--plh-text-75)' }}>
                Club
              </th>
              <th className="text-center px-1 py-2 font-semibold font-mono" style={{ color: 'var(--plh-text-75)' }}>
                P
              </th>
              <th className="text-center px-1 py-2 font-semibold font-mono" style={{ color: 'var(--plh-text-75)' }}>
                W
              </th>
              <th className="text-center px-1 py-2 font-semibold font-mono" style={{ color: 'var(--plh-text-75)' }}>
                D
              </th>
              <th className="text-center px-1 py-2 font-semibold font-mono" style={{ color: 'var(--plh-text-75)' }}>
                L
              </th>
              <th className="text-center px-1 py-2 font-semibold font-mono" style={{ color: 'var(--plh-text-75)' }}>
                GD
              </th>
              <th className="text-center px-2 py-2 font-semibold font-mono" style={{ color: 'var(--plh-text-75)' }}>
                Pts
              </th>
              {/* Form column only on larger screens */}
              <th className="hidden sm:table-cell text-center px-2 py-2 font-semibold" style={{ color: 'var(--plh-text-75)' }}>
                Form
              </th>
            </tr>
          </thead>
          <tbody>
            {standings.map((team) => {
              // Determine zone shading
              let bgColor = 'transparent'
              if (team.position <= 4) {
                bgColor = 'rgba(58, 175, 169, 0.04)' // teal for top 4
              } else if (team.position >= 18) {
                bgColor = 'rgba(232, 64, 128, 0.04)' // pink for bottom 3
              }

              // Highlight if this is the club page's club
              if (highlightedClub === team.club_slug) {
                bgColor = 'rgba(250, 245, 240, 0.06)'
              }

              return (
                <tr
                  key={team.club_slug}
                  style={{
                    backgroundColor: bgColor,
                    borderBottom: '1px solid rgba(250, 245, 240, 0.04)',
                  }}
                >
                  {/* Position */}
                  <td className="px-2 py-2 font-semibold" style={{ color: 'var(--plh-teal)' }}>
                    {team.position}
                  </td>

                  {/* Club name */}
                  <td className="px-2 py-2 text-left" style={{ color: 'rgba(250, 245, 240, 0.95)' }}>
                    {team.club}
                  </td>

                  {/* P, W, D, L, GD */}
                  <td className="text-center px-1 py-2 font-mono" style={{ color: 'rgba(250, 245, 240, 0.75)' }}>
                    {team.played}
                  </td>
                  <td className="text-center px-1 py-2 font-mono" style={{ color: 'rgba(250, 245, 240, 0.75)' }}>
                    {team.won}
                  </td>
                  <td className="text-center px-1 py-2 font-mono" style={{ color: 'rgba(250, 245, 240, 0.75)' }}>
                    {team.drawn}
                  </td>
                  <td className="text-center px-1 py-2 font-mono" style={{ color: 'rgba(250, 245, 240, 0.75)' }}>
                    {team.lost}
                  </td>
                  <td className="text-center px-1 py-2 font-mono" style={{ color: 'rgba(250, 245, 240, 0.75)' }}>
                    {team.gd >= 0 ? '+' : ''}{team.gd}
                  </td>

                  {/* Points (bold) */}
                  <td
                    className="text-center px-2 py-2 font-mono font-bold"
                    style={{ color: 'rgba(250, 245, 240, 0.95)' }}
                  >
                    {team.points}
                  </td>

                  {/* Form (desktop only) */}
                  <td className="hidden sm:table-cell text-center px-2 py-2">
                    <div className="flex justify-center gap-1">
                      {team.form.split('').map((result, i) => (
                        <span
                          key={i}
                          className="w-5 h-5 text-xs font-semibold flex items-center justify-center rounded"
                          style={{
                            color:
                              result === 'W'
                                ? 'var(--plh-teal)'
                                : result === 'D'
                                  ? 'rgba(250, 245, 240, 0.4)'
                                  : 'var(--plh-pink)',
                            backgroundColor:
                              result === 'W'
                                ? 'rgba(58, 175, 169, 0.15)'
                                : result === 'D'
                                  ? 'rgba(250, 245, 240, 0.05)'
                                  : 'rgba(232, 64, 128, 0.15)',
                          }}
                        >
                          {result}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
