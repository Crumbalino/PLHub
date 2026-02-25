import Image from 'next/image'
import { CLUBS } from '@/lib/clubs'

interface Match {
  id: number
  status: 'TIMED' | 'LIVE' | 'IN_PLAY' | 'PAUSED' | 'FINISHED' | 'POSTPONED'
  utcDate: string
  homeTeam: { name: string }
  awayTeam: { name: string }
  score: {
    fullTime: { home: number | null; away: number | null }
    halfTime: { home: number | null; away: number | null }
  }
}

interface ApiResponse {
  matches: Match[]
}

function getClubByTeamName(teamName: string) {
  return CLUBS.find(club =>
    club.name.toLowerCase() === teamName.toLowerCase()
  )
}

function formatTime(utcDate: string): string {
  const date = new Date(utcDate)
  return date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

export default async function MatchTicker() {
  const apiKey = process.env.FOOTBALL_DATA_API_KEY ?? ''

  if (!apiKey) {
    return null
  }

  try {
    const today = new Date().toISOString().split('T')[0]
    const response = await fetch(
      `https://api.football-data.org/v4/competitions/PL/matches?dateFrom=${today}&dateTo=${today}`,
      {
        headers: { 'X-Auth-Token': apiKey },
        next: { revalidate: 300 }, // Cache for 5 minutes
      }
    )

    if (!response.ok) {
      return null
    }

    const data: ApiResponse = await response.json()

    if (!data.matches || data.matches.length === 0) {
      return null
    }

    return (
      <div className="border-b border-white/[0.06] bg-[#071619] px-4 py-2 overflow-x-auto scrollbar-hide">
        <div className="flex gap-0 min-w-min">
          {data.matches.map((match) => {
            const homeClub = getClubByTeamName(match.homeTeam.name)
            const awayClub = getClubByTeamName(match.awayTeam.name)
            const isFinished = match.status === 'FINISHED'
            const isLive = match.status === 'IN_PLAY' || match.status === 'LIVE'
            const isTimed = match.status === 'TIMED'

            const homeScore = match.score.fullTime.home
            const awayScore = match.score.fullTime.away

            return (
              <div
                key={match.id}
                className="inline-flex items-center gap-1.5 px-3 text-xs text-white border-r border-white/10 last:border-0 whitespace-nowrap"
              >
                {/* Home team badge */}
                {homeClub ? (
                  <div className="flex h-4 w-4 items-center justify-center overflow-hidden rounded-full bg-white/10 shrink-0">
                    <Image
                      src={homeClub.badgeUrl}
                      alt={homeClub.name}
                      width={16}
                      height={16}
                      unoptimized
                      className="object-contain"
                    />
                  </div>
                ) : (
                  <span className="w-4 text-center shrink-0">
                    {match.homeTeam.name.substring(0, 1)}
                  </span>
                )}

                {/* Score or time */}
                {isFinished || homeScore !== null ? (
                  <>
                    <span className="font-semibold">{homeScore}</span>
                    <span className="text-white/40">—</span>
                    <span className="font-semibold">{awayScore}</span>
                  </>
                ) : isLive ? (
                  <>
                    <span className="relative flex h-1.5 w-1.5 shrink-0">
                      <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-red-500" />
                    </span>
                    <span className="text-red-500 font-semibold">LIVE</span>
                  </>
                ) : isTimed ? (
                  <span className="text-white/50">{formatTime(match.utcDate)}</span>
                ) : null}

                {/* Away team badge */}
                {awayClub ? (
                  <div className="flex h-4 w-4 items-center justify-center overflow-hidden rounded-full bg-white/10 shrink-0">
                    <Image
                      src={awayClub.badgeUrl}
                      alt={awayClub.name}
                      width={16}
                      height={16}
                      unoptimized
                      className="object-contain"
                    />
                  </div>
                ) : (
                  <span className="w-4 text-center shrink-0">
                    {match.awayTeam.name.substring(0, 1)}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  } catch {
    return null
  }
}
