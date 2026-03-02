// ============================================================
// GET /api/snapshot
// Comprehensive Snapshot briefing endpoint
// Assembles all module data: stories, standings, fixtures, quotes
// Query params: club? (e.g., "arsenal") — omitted for homepage
// ============================================================

export const dynamic = 'force-dynamic'
export const revalidate = 300 // ISR: 5 min revalidation

import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'
import { transformPost } from '@/lib/transform'
import { detectAllClubs, toClubBadges } from '@/lib/clubs'
import type { Post, FeedPost } from '@/lib/types'

const BIG_SIX = ['arsenal', 'chelsea', 'liverpool', 'man-city', 'man-united', 'tottenham']

// Team name mappings from football-data.org to club slugs
const FOOTBALL_DATA_TO_SLUG: Record<string, string> = {
  'Arsenal': 'arsenal',
  'Aston Villa': 'aston-villa',
  'Bournemouth': 'bournemouth',
  'Brentford': 'brentford',
  'Brighton and Hove Albion': 'brighton',
  'Chelsea': 'chelsea',
  'Crystal Palace': 'crystal-palace',
  'Everton': 'everton',
  'Fulham': 'fulham',
  'Ipswich Town': 'ipswich',
  'Leicester City': 'leicester',
  'Liverpool': 'liverpool',
  'Manchester City': 'man-city',
  'Manchester United': 'man-united',
  'Newcastle United': 'newcastle',
  'Nottingham Forest': 'nottingham-forest',
  'Southampton': 'southampton',
  'Tottenham Hotspur': 'tottenham',
  'West Ham United': 'west-ham',
  'Wolverhampton Wanderers': 'wolves',
}

interface StandingsEntry {
  position: number
  team: { name: string; shortName?: string }
  playedGames: number
  won: number
  drawn: number
  lost: number
  goalsFor: number
  goalsAgainst: number
  goalDifference: number
  points: number
}

interface Match {
  id: number
  homeTeam: { name: string; shortName?: string }
  awayTeam: { name: string; shortName?: string }
  utcDate: string
  status: string
  score?: { fullTime?: { home: number | null; away: number | null } }
}

interface SnapshotStory {
  id: string
  headline: string
  summary: string | null
  source: { name: string; url: string }
  clubs: Array<{ slug: string; shortName: string; code: string; badgeUrl: string }>
  plhub_index: number | null
  published_at: string
  story_card_id: string
}

interface SnapshotTableEntry {
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

interface SnapshotFixture {
  home: { name: string; slug: string }
  away: { name: string; slug: string }
  kickoff: string
  status: 'upcoming' | 'live' | 'finished'
  score: { home: number; away: number } | null
  stakes_line: string | null
}

interface SnapshotResponse {
  success: boolean
  data?: {
    metadata: {
      generatedAt: string
      matchday: number
      postsCount: number
    }
    modules: {
      get_caught_up: SnapshotStory[]
      the_table: {
        standings: SnapshotTableEntry[]
        highlighted_club: string | null
      }
      fixture_focus: SnapshotFixture[]
      transfers: SnapshotStory[]
      the_quote: {
        has_quote: boolean
        quote: string | null
        attribution: string | null
        club: string | null
        context: string | null
      }
      beyond_big_six: SnapshotStory[]
      by_the_numbers: null
      and_finally: {
        has_content: boolean
        headline: string | null
        colour_line: string | null
      }
    }
  }
  error?: string
}

/**
 * Convert FeedPost to SnapshotStory
 */
function toSnapshotStory(feedPost: FeedPost): SnapshotStory {
  return {
    id: feedPost.id,
    headline: feedPost.title,
    summary: feedPost.summary,
    source: {
      name: feedPost.sourceInfo.name,
      url: feedPost.url,
    },
    clubs: feedPost.clubs,
    plhub_index: feedPost.indexScore,
    published_at: feedPost.publishedAt,
    story_card_id: feedPost.id,
  }
}

/**
 * Fetch standings from football-data.org and transform to snapshot format
 */
async function getStandings(highlightedClub: string | null): Promise<{
  standings: SnapshotTableEntry[]
  highlighted_club: string | null
} | null> {
  try {
    const apiKey = process.env.FOOTBALL_DATA_API_KEY
    if (!apiKey) return null

    const res = await fetch('https://api.football-data.org/v4/competitions/PL/standings', {
      headers: { 'X-Auth-Token': apiKey },
      next: { revalidate: 3600 },
    })

    if (!res.ok) return null

    const data = await res.json()
    const table = data.standings?.[0]?.table as StandingsEntry[] | undefined

    if (!table) return null

    const standings = table.map((entry) => {
      const slug = FOOTBALL_DATA_TO_SLUG[entry.team.name] || entry.team.name.toLowerCase()
      // Extract form from data if available, otherwise generate from wins/draws/losses
      const form = 'WWDLW' // Placeholder — would be populated from actual match history
      return {
        position: entry.position,
        club: entry.team.name,
        club_slug: slug,
        played: entry.playedGames,
        won: entry.won,
        drawn: entry.drawn,
        lost: entry.lost,
        gf: entry.goalsFor,
        ga: entry.goalsAgainst,
        gd: entry.goalDifference,
        points: entry.points,
        form,
      }
    })

    return {
      standings,
      highlighted_club: highlightedClub,
    }
  } catch (err) {
    console.error('[Snapshot API] Error fetching standings:', err)
    return null
  }
}

/**
 * Generate stakes line for a fixture based on table positions
 */
function generateStakesLine(homePosition: number, awayPosition: number): string {
  // Max 8 words, factual, derived from positions
  if (homePosition <= 3 && awayPosition <= 3) return 'Title contenders meet'
  if (homePosition <= 3 && awayPosition >= 18) return 'Top three faces bottom'
  if ((homePosition <= 3 || awayPosition <= 3) && (homePosition >= 18 || awayPosition >= 18)) {
    return 'Top faces relegation battle'
  }
  if (Math.abs(homePosition - awayPosition) <= 2) return 'Close table battle'
  return ''
}

/**
 * Fetch fixtures and transform to snapshot format
 */
async function getFixtures(
  club: string | null,
  standings: SnapshotTableEntry[] | null
): Promise<SnapshotFixture[]> {
  try {
    const apiKey = process.env.FOOTBALL_DATA_API_KEY
    if (!apiKey) return []

    const res = await fetch(
      'https://api.football-data.org/v4/competitions/PL/matches?status=SCHEDULED,LIVE,IN_PLAY,PAUSED,FINISHED&limit=10',
      {
        headers: { 'X-Auth-Token': apiKey },
        next: { revalidate: 300 },
      }
    )

    if (!res.ok) return []

    const data = await res.json()
    const matches: Match[] = data.matches || []

    // Filter by club if specified
    let filtered = matches
    if (club) {
      filtered = matches.filter((m) => {
        const homeSlug = FOOTBALL_DATA_TO_SLUG[m.homeTeam.name]
        const awaySlug = FOOTBALL_DATA_TO_SLUG[m.awayTeam.name]
        return homeSlug === club || awaySlug === club
      })
      filtered = filtered.slice(0, 1) // Only next fixture for club pages
    }

    return filtered.slice(0, 5).map((match) => {
      const homeSlug = FOOTBALL_DATA_TO_SLUG[match.homeTeam.name] || match.homeTeam.name.toLowerCase()
      const awaySlug = FOOTBALL_DATA_TO_SLUG[match.awayTeam.name] || match.awayTeam.name.toLowerCase()

      // Find positions for stakes line
      const homeEntry = standings?.find((s) => s.club_slug === homeSlug)
      const awayEntry = standings?.find((s) => s.club_slug === awaySlug)
      const stakesLine =
        homeEntry && awayEntry
          ? generateStakesLine(homeEntry.position, awayEntry.position)
          : null

      return {
        home: { name: match.homeTeam.name, slug: homeSlug },
        away: { name: match.awayTeam.name, slug: awaySlug },
        kickoff: match.utcDate,
        status: mapMatchStatus(match.status),
        score: match.score?.fullTime
          ? {
              home: match.score.fullTime.home ?? 0,
              away: match.score.fullTime.away ?? 0,
            }
          : null,
        stakes_line: stakesLine,
      }
    })
  } catch (err) {
    console.error('[Snapshot API] Error fetching fixtures:', err)
    return []
  }
}

/**
 * Map football-data.org status to snapshot status
 */
function mapMatchStatus(status: string): 'upcoming' | 'live' | 'finished' {
  if (status === 'FINISHED') return 'finished'
  if (['LIVE', 'IN_PLAY', 'PAUSED'].includes(status)) return 'live'
  return 'upcoming'
}

export async function GET(request: NextRequest): Promise<NextResponse<SnapshotResponse>> {
  try {
    const { searchParams } = new URL(request.url)
    const club = searchParams.get('club')

    const supabase = getSupabase()

    // Fetch posts from last 48 hours
    const since = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()

    const { data: rawPosts, error } = await supabase
      .from('posts')
      .select(
        'id, external_id, title, url, summary, summary_hook, content, source, club_slug, author, score, subreddit, image_url, fetched_at, published_at, score_significance, clubs(*)'
      )
      .gte('published_at', since)
      .order('score', { ascending: false })
      .limit(100)

    if (error) {
      console.error('[Snapshot API] Supabase error:', error)
      // Return partial data on error
      return NextResponse.json(
        {
          success: true,
          data: {
            metadata: {
              generatedAt: new Date().toISOString(),
              matchday: 30,
              postsCount: 0,
            },
            modules: {
              get_caught_up: [],
              the_table: { standings: [], highlighted_club: club },
              fixture_focus: [],
              transfers: [],
              the_quote: { has_quote: false, quote: null, attribution: null, club: null, context: null },
              beyond_big_six: [],
              by_the_numbers: null,
              and_finally: { has_content: false, headline: null, colour_line: null },
            },
          },
        },
        {
          headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
        }
      )
    }

    // Transform posts
    const posts = (rawPosts as unknown as Post[]) || []
    const transformed: FeedPost[] = []

    for (const post of posts) {
      try {
        const feedPost = await transformPost(post)
        transformed.push(feedPost)
      } catch (err) {
        console.error(`[Snapshot API] Failed to transform post ${post.id}:`, err)
      }
    }

    // Filter by club if specified
    let filtered = transformed
    if (club) {
      filtered = transformed.filter((p) => p.clubs.some((c) => c.slug === club))
    }

    const usedIds = new Set<string>()

    // 1. Get Caught Up: top 5 by PLHub Index
    const getCaughtUp = filtered
      .sort((a, b) => (b.indexScore ?? 0) - (a.indexScore ?? 0))
      .slice(0, 5)
      .map(toSnapshotStory)
    getCaughtUp.forEach((s) => usedIds.add(s.id))

    // 2. The Table: standings
    const standings = await getStandings(club)

    // 3. Fixture Focus: fixtures with stakes
    const fixtures = await getFixtures(club, standings?.standings ?? null)

    // 4. Transfers: filter by transfer/contract tags
    const transfers = filtered
      .filter(
        (p) =>
          !usedIds.has(p.id) &&
          (p.title.toLowerCase().includes('transfer') ||
            p.title.toLowerCase().includes('contract') ||
            p.title.toLowerCase().includes('deal'))
      )
      .slice(0, 5)
      .map(toSnapshotStory)
    transfers.forEach((s) => usedIds.add(s.id))

    // 5. The Quote: placeholder (would query separate quotes table)
    const theQuote = {
      has_quote: false,
      quote: null,
      attribution: null,
      club: null,
      context: null,
    }

    // 6. Beyond Big Six: filter to non-Big-Six primary clubs
    const beyondBigSix = filtered
      .filter(
        (p) =>
          !usedIds.has(p.id) &&
          !p.clubs.some((c) => BIG_SIX.includes(c.slug))
      )
      .slice(0, 5)
      .map(toSnapshotStory)
    beyondBigSix.forEach((s) => usedIds.add(s.id))

    // 7. By The Numbers: placeholder
    const byTheNumbers = null

    // 8. And Finally: last remaining story
    const lastStory = filtered.find((p) => !usedIds.has(p.id))
    const andFinally = lastStory
      ? {
          has_content: true,
          headline: lastStory.title.length > 25 ? lastStory.title.substring(0, 25) : lastStory.title,
          colour_line: lastStory.summary?.substring(0, 100) ?? null,
        }
      : {
          has_content: false,
          headline: null,
          colour_line: null,
        }

    const response: SnapshotResponse = {
      success: true,
      data: {
        metadata: {
          generatedAt: new Date().toISOString(),
          matchday: 30,
          postsCount: transformed.length,
        },
        modules: {
          get_caught_up: getCaughtUp,
          the_table: standings || { standings: [], highlighted_club: club },
          fixture_focus: fixtures,
          transfers,
          the_quote: theQuote,
          beyond_big_six: beyondBigSix,
          by_the_numbers: byTheNumbers,
          and_finally: andFinally,
        },
      },
    }

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'Content-Type': 'application/json',
      },
    })
  } catch (err) {
    let errorMessage = 'Unknown error'
    if (err instanceof Error) {
      errorMessage = err.message
    } else if (typeof err === 'object' && err !== null && 'message' in err) {
      errorMessage = String((err as any).message)
    }

    console.error('[Snapshot API] Error:', errorMessage, err)

    // Return partial data even on error
    return NextResponse.json(
      {
        success: false,
        error: `Error assembling snapshot: ${errorMessage}`,
        data: {
          metadata: {
            generatedAt: new Date().toISOString(),
            matchday: 30,
            postsCount: 0,
          },
          modules: {
            get_caught_up: [],
            the_table: { standings: [], highlighted_club: null },
            fixture_focus: [],
            transfers: [],
            the_quote: { has_quote: false, quote: null, attribution: null, club: null, context: null },
            beyond_big_six: [],
            by_the_numbers: null,
            and_finally: { has_content: false, headline: null, colour_line: null },
          },
        },
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      }
    )
  }
}
