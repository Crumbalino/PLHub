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
  image_url: string | null
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
      by_the_numbers: {
        tiles: Array<{
          number: string
          label: string
          context: string
          accent: boolean
        }>
        matchday: number
      } | null
      fantasy_premier_league: SnapshotStory[]
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
 * Truncate text to a maximum number of words, adding ellipsis if needed
 */
function truncateToWords(text: string, maxWords: number): string {
  const words = text.split(/\s+/)
  if (words.length <= maxWords) return text
  return words.slice(0, maxWords).join(' ') + '…'
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
    image_url: feedPost.imageUrl || null,
  }
}

/**
 * Fetch standings from football-data.org and transform to snapshot format
 */
async function getStandings(highlightedClub: string | null): Promise<{
  standings: SnapshotTableEntry[]
  highlighted_club: string | null
  matchday: number
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

    const currentMatchday = data.season?.currentMatchday ?? 30

    return {
      standings,
      highlighted_club: highlightedClub,
      matchday: currentMatchday,
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

/**
 * Deduplication helpers — track stories by both ID and URL
 */
class StoryTracker {
  private usedIds = new Set<string>()
  private usedUrls = new Set<string>()

  isUsed(post: FeedPost): boolean {
    return this.usedIds.has(post.id) || this.usedUrls.has(post.url)
  }

  markUsed(story: SnapshotStory): void {
    this.usedIds.add(story.id)
    this.usedUrls.add(story.source.url)
  }
}

/**
 * Detect if a post is about Fantasy Premier League
 * Matches on headline (case-insensitive):
 * - "FPL", "Fantasy Premier League", "Fantasy Football"
 * - "Gameweek" if combined with fantasy context (tips, picks, captain, transfers, etc.)
 */
function isFPLStory(headline: string): boolean {
  const normalizedHeadline = headline.toLowerCase()

  // Direct matches
  if (normalizedHeadline.includes('fpl') ||
      normalizedHeadline.includes('fantasy premier league') ||
      normalizedHeadline.includes('fantasy football')) {
    return true
  }

  // Gameweek with fantasy context
  if (normalizedHeadline.includes('gameweek')) {
    const fantasyKeywords = ['tips', 'picks', 'captain', 'transfers', 'chip', 'wildcard', 'bench', 'team of the week', 'totw']
    if (fantasyKeywords.some(kw => normalizedHeadline.includes(kw))) {
      return true
    }
  }

  return false
}

/**
 * Fetch and calculate stats for By The Numbers module
 * Uses football-data.org standings and scorers endpoints
 */
async function getByTheNumbersData(matchday: number): Promise<{
  tiles: Array<{
    number: string
    label: string
    context: string
    accent: boolean
  }>
  matchday: number
} | null> {
  try {
    const apiKey = process.env.FOOTBALL_DATA_API_KEY
    if (!apiKey) return null

    // Fetch standings and scorers in parallel
    const [standingsRes, scorersRes] = await Promise.all([
      fetch('https://api.football-data.org/v4/competitions/PL/standings', {
        headers: { 'X-Auth-Token': apiKey },
        next: { revalidate: 21600 }, // 6 hours
      }),
      fetch('https://api.football-data.org/v4/competitions/PL/scorers?limit=5', {
        headers: { 'X-Auth-Token': apiKey },
        next: { revalidate: 21600 }, // 6 hours
      }),
    ])

    if (!standingsRes.ok || !scorersRes.ok) {
      return null
    }

    const standingsData = await standingsRes.json()
    const scorersData = await scorersRes.json()

    const table = standingsData.standings?.[0]?.table as StandingsEntry[] | undefined
    const scorers = scorersData.scorers as any[] | undefined

    if (!table || !scorers || scorers.length === 0) {
      return null
    }

    // Stat 1: Top scorer
    const topScorer = scorers[0]
    const topScorerName = topScorer.player?.name ?? 'Unknown'
    const topScorerGoals = topScorer.goals ?? 0

    // Stat 2: Title race gap (points difference between 1st and 2nd)
    const titleGap = table.length >= 2 ? table[0].points - table[1].points : 0

    // Stat 3: Best defence (team with fewest goals against)
    let bestDefence = { team: '', goalsAgainst: Infinity }
    for (const entry of table) {
      if (entry.goalsAgainst < bestDefence.goalsAgainst) {
        bestDefence = { team: entry.team.name, goalsAgainst: entry.goalsAgainst }
      }
    }

    // Stat 4: Relegation battle (count teams within 3 points of 18th place)
    const place18th = table[17]
    if (!place18th) {
      return null
    }
    let relegationDanger = 0
    for (const entry of table) {
      if (entry.position >= 18 && entry.points >= place18th.points - 3) {
        relegationDanger++
      }
    }

    // Determine accent tile (top scorer if 15+ goals, otherwise title gap)
    const accentIsTopScorer = topScorerGoals >= 15

    // Build tiles array
    const tiles = [
      {
        number: topScorerGoals.toString(),
        label: `${topScorerName} goals`,
        context: 'Leading the Golden Boot race',
        accent: accentIsTopScorer,
      },
      {
        number: titleGap.toString(),
        label: 'points at the top',
        context: `${table[0].team.name} lead`,
        accent: !accentIsTopScorer,
      },
      {
        number: bestDefence.goalsAgainst.toString(),
        label: 'fewest goals conceded',
        context: `${bestDefence.team}'s league-best defence`,
        accent: false,
      },
      {
        number: relegationDanger.toString(),
        label: 'clubs in drop danger',
        context: 'Within 3 points of 18th',
        accent: false,
      },
    ]

    const finalTiles = tiles

    return { tiles: finalTiles, matchday }
  } catch (err) {
    console.error('[Snapshot API] Error fetching By The Numbers data:', err)
    return null
  }
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
              fantasy_premier_league: [],
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

    const tracker = new StoryTracker()

    // 1. Get Caught Up: top 5 by PLHub Index (must have at least one PL club tag)
    const getCaughtUp = filtered
      .filter((p) => p.clubs.length > 0) // Must have at least one PL club tag
      .sort((a, b) => (b.indexScore ?? 0) - (a.indexScore ?? 0))
      .slice(0, 5)
      .map(toSnapshotStory)
    getCaughtUp.forEach((s) => tracker.markUsed(s))

    // 2. The Table: standings
    const standings = await getStandings(club)

    // 3. Fixture Focus: fixtures with stakes
    const fixtures = await getFixtures(club, standings?.standings ?? null)

    // 4. Transfers: filter by transfer/contract tags (must have at least one PL club tag)
    const transfers = filtered
      .filter(
        (p) =>
          !tracker.isUsed(p) &&
          p.clubs.length > 0 && // Must have at least one PL club tag
          (p.title.toLowerCase().includes('transfer') ||
            p.title.toLowerCase().includes('contract') ||
            p.title.toLowerCase().includes('deal'))
      )
      .slice(0, 5)
      .map(toSnapshotStory)
    transfers.forEach((s) => tracker.markUsed(s))

    // 5. The Quote: placeholder (would query separate quotes table)
    const theQuote = {
      has_quote: false,
      quote: null,
      attribution: null,
      club: null,
      context: null,
    }

    // 6. Beyond Big Six: filter to non-Big-Six primary clubs (must have at least one PL club tag)
    const beyondBigSix = filtered
      .filter(
        (p) =>
          !tracker.isUsed(p) &&
          p.clubs.length > 0 && // Must have at least one PL club tag
          !p.clubs.some((c) => BIG_SIX.includes(c.slug)) // None of them Big Six
      )
      .slice(0, 5)
      .map(toSnapshotStory)
    beyondBigSix.forEach((s) => tracker.markUsed(s))

    // 7. Fantasy Premier League: FPL-focused stories
    const fantasyPremierLeague = filtered
      .filter(
        (p) =>
          !tracker.isUsed(p) &&
          p.clubs.length > 0 && // Must have at least one PL club tag
          isFPLStory(p.title)
      )
      .sort((a, b) => (b.indexScore ?? 0) - (a.indexScore ?? 0))
      .slice(0, 1) // Just take the top FPL story
      .map(toSnapshotStory)
    fantasyPremierLeague.forEach((s) => tracker.markUsed(s))

    // 8. By The Numbers: stat tiles
    const matchday = standings?.matchday ?? 30
    const byTheNumbers = await getByTheNumbersData(matchday)

    // 9. And Finally: last remaining story (must have at least one PL club tag)
    const lastStory = filtered.find(
      (p) => !tracker.isUsed(p) && p.clubs.length > 0
    )
    const andFinally = lastStory
      ? {
          has_content: true,
          headline: truncateToWords(lastStory.title, 25),
          colour_line: lastStory.summary ? truncateToWords(lastStory.summary, 20) : null,
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
          matchday,
          postsCount: transformed.length,
        },
        modules: {
          get_caught_up: getCaughtUp,
          the_table: standings || { standings: [], highlighted_club: club },
          fixture_focus: fixtures,
          transfers,
          the_quote: theQuote,
          beyond_big_six: beyondBigSix,
          fantasy_premier_league: fantasyPremierLeague,
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
            fantasy_premier_league: [],
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
