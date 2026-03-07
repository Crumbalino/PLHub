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
import { filterPLContent } from '@/lib/content-filter'
import { BY_THE_NUMBERS_SYSTEM_PROMPT, BY_THE_NUMBERS_API_CONFIG, type ByTheNumbersResponse } from '@/lib/prompts/by-the-numbers'
import type { Post, FeedPost } from '@/lib/types'

const BIG_SIX = ['arsenal', 'chelsea', 'liverpool', 'man-city', 'man-united', 'tottenham']

// Team name mappings from football-data.org to club slugs (2025/26 PL season)
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
  'Liverpool': 'liverpool',
  'Manchester City': 'man-city',
  'Manchester United': 'man-united',
  'Newcastle United': 'newcastle',
  'Nottingham Forest': 'nottingham-forest',
  'Southampton': 'southampton',
  'Sunderland': 'sunderland',
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
        plhub_index: number | null
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
 * Fetch and generate stat tiles for By The Numbers module
 * Calls Anthropic API with raw stats for contextualisation
 * Caches result in Supabase with 3-hour TTL
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
    const supabase = getSupabase()
    const apiKey = process.env.FOOTBALL_DATA_API_KEY
    const anthropicKey = process.env.ANTHROPIC_API_KEY

    if (!apiKey || !anthropicKey) return null

    // Check cache first (3-hour TTL) — failures don't block fresh data fetch
    const cacheKey = `by_the_numbers:homepage:${matchday}`
    try {
      const { data: cachedTile } = await supabase
        .from('by_the_numbers_tiles')
        .select('data, expires_at')
        .eq('cache_key', cacheKey)
        .single()

      if (cachedTile && cachedTile.expires_at && new Date(cachedTile.expires_at) > new Date()) {
        return cachedTile.data as any
      }
    } catch (cacheErr) {
      // Cache miss or table doesn't exist — proceed to fetch fresh data
    }

    // Fetch raw stats from football-data.org API
    const [standingsRes, scorersRes, recentMatchesRes] = await Promise.all([
      fetch('https://api.football-data.org/v4/competitions/PL/standings', {
        headers: { 'X-Auth-Token': apiKey },
        next: { revalidate: 3600 },
      }),
      fetch('https://api.football-data.org/v4/competitions/PL/scorers?limit=10', {
        headers: { 'X-Auth-Token': apiKey },
        next: { revalidate: 3600 },
      }),
      fetch('https://api.football-data.org/v4/competitions/PL/matches?limit=5&status=FINISHED', {
        headers: { 'X-Auth-Token': apiKey },
        next: { revalidate: 3600 },
      }),
    ])

    if (!standingsRes.ok || !scorersRes.ok || !recentMatchesRes.ok) {
      return null
    }

    const standingsData = await standingsRes.json()
    const scorersData = await scorersRes.json()
    const recentMatchesData = await recentMatchesRes.json()

    // Prepare stats payload for Anthropic
    const statsPayload = {
      scorers: scorersData.scorers || [],
      standings: standingsData.standings?.[0]?.table || [],
      recentMatches: recentMatchesData.matches || [],
    }

    // Call Anthropic API with By The Numbers prompt
    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: BY_THE_NUMBERS_API_CONFIG.model,
        max_tokens: BY_THE_NUMBERS_API_CONFIG.max_tokens,
        temperature: BY_THE_NUMBERS_API_CONFIG.temperature,
        system: BY_THE_NUMBERS_SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: JSON.stringify({
              scope: 'homepage',
              matchday,
              stats: statsPayload,
              standings: standingsData.standings?.[0]?.table || [],
            }),
          },
        ],
      }),
    })

    if (!anthropicRes.ok) {
      console.error('[By The Numbers] Anthropic API error:', anthropicRes.status)
      return null
    }

    const anthropicData = await anthropicRes.json()
    const responseText = anthropicData.content?.[0]?.text

    if (!responseText) {
      console.error('[By The Numbers] No response text from Anthropic')
      return null
    }

    // Parse JSON response from Claude
    // Handle markdown-wrapped JSON (e.g., ```json {...} ```)
    let jsonText = responseText.trim()
    if (jsonText.startsWith('```')) {
      // Remove markdown code fence
      jsonText = jsonText.replace(/^```(?:json)?\n/, '').replace(/\n```$/, '')
    }

    let parsedResponse: ByTheNumbersResponse
    try {
      // Strip markdown fences if Claude wraps response in ```json ... ```
      const cleaned = jsonText
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/```\s*$/i, '')
        .trim()
      parsedResponse = JSON.parse(cleaned)
    } catch (parseErr) {
      console.error('[By The Numbers] JSON parse error:', (parseErr as any)?.message, 'Response was:', jsonText.substring(0, 200))
      return null
    }

    // Validate response structure
    if (!parsedResponse.tiles || !Array.isArray(parsedResponse.tiles) || parsedResponse.tiles.length === 0) {
      console.error('[By The Numbers] Invalid response structure')
      return null
    }

    // Transform response to match component interface
    const tiles = parsedResponse.tiles.map((tile, idx) => ({
      number: tile.number,
      label: tile.label,
      context: tile.context,
      accent: idx === parsedResponse.accent_index,
    }))

    const result = { tiles, matchday }

    // Try to cache result in Supabase with matchday-window TTL (failure doesn't block result)
    try {
      // Cache until end of current matchday window (Mon midnight after weekend games)
      const now = new Date()
      const dayOfWeek = now.getDay() // 0=Sun, 1=Mon ... 6=Sat
      const hoursUntilTuesday = dayOfWeek === 0 ? 48 : dayOfWeek === 1 ? 24 : (9 - dayOfWeek) * 24
      const ttlMs = Math.min(hoursUntilTuesday, 48) * 60 * 60 * 1000
      const expiresAt = new Date(Date.now() + ttlMs).toISOString()
      await supabase.from('by_the_numbers_tiles').upsert({
        cache_key: cacheKey,
        data: result,
        created_at: new Date().toISOString(),
        expires_at: expiresAt,
      })
    } catch (cacheWriteErr) {
      // Cache write failed — still return the fresh data
    }

    return result
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
              and_finally: { has_content: false, headline: null, colour_line: null, plhub_index: null },
            },
          },
        },
        {
          headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
        }
      )
    }

    // Filter and transform posts
    const posts = (rawPosts as unknown as Post[]) || []

    // Filter out Reddit and YouTube, keep only editorial RSS sources
    const filteredPosts = filterPLContent(posts)

    const transformed: FeedPost[] = []

    for (const post of filteredPosts) {
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
    const postsWithClubs = filtered.filter((p) => p.clubs.length > 0)

    const getCaughtUp = postsWithClubs
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
          plhub_index: lastStory.indexScore || null,
        }
      : {
          has_content: false,
          headline: null,
          colour_line: null,
          plhub_index: null,
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
            and_finally: { has_content: false, headline: null, colour_line: null, plhub_index: null },
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
