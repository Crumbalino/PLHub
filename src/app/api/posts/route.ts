import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { calculateIndex } from '@/lib/plhub-index'
import { Post } from '@/types'

const POSTS_PER_PAGE = 20

type SortOption = 'index' | 'hot' | 'new'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const sort = (searchParams.get('sort') || 'index') as SortOption
  const club = searchParams.get('club') || null

  const supabase = createServerClient()
  const offset = (page - 1) * POSTS_PER_PAGE

  let query = supabase
    .from('posts')
    .select('id, external_id, title, url, summary, content, source, club_slug, author, score, subreddit, image_url, fetched_at, published_at, clubs(*)', { count: 'exact' })

  if (club) {
    query = query.eq('club_slug', club)
  }

  if (sort === 'hot') {
    query = query
      .gte('published_at', new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString())
      .order('score', { ascending: false })
      .order('published_at', { ascending: false })
  } else if (sort === 'new') {
    query = query.order('published_at', { ascending: false })
  } else {
    // index (default)
    query = query.order('published_at', { ascending: false })
  }

  const { data: posts, count, error } = await query.range(offset, offset + POSTS_PER_PAGE - 1)

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 })
  }

  const postsData = (posts as unknown as Post[]) || []

  // Filter non-PL content
  const ALWAYS_HIDE = [
    'super boost', 'bet365', 'betfair', 'paddy power', 'william hill', 'ladbrokes',
    'coral', 'skybet', 'sky bet', 'betway', 'unibet', 'betfred', '888sport',
    'price boost', 'enhanced odds', 'money back', 'betting tips', 'free bets',
    'odds boost', 'accumulator', 'best football bets', 'betting offer', 'bet £10',
    'get £', 'acca', 'darts night', 'darts live', 'premier league darts',
    'conor benn', 'tyson fury', 'undercard', 'fury-', 'born to fight', 'progais',
    'fight night', 'ring walk', 'dana white', 'usyk', 'canelo', 'weigh-in',
    'boxing', 'bout', 'ronda rousey', 'rousey comeback', 't20 world cup',
    'west indies cricket', 'south africa cricket', 'nbc network', 'nbc shakeup'
  ]

  const HIDE_KEYWORDS = [
    'nfl', 'nba', 'katie taylor', 'tom brady', 'raiders',
    'tua tagovailoa', 'almeria', 'segunda division',
    'american football', 'conference league', 'europa conference',
    'champions league cash', 'world cup', 'carabao cup', 'celtic', 'rangers',
    'scottish', 'championship', 'league one', 'league two', 'efl',
    'plymouth', 'mexico open', 'tennis', 'golf', 'cricket', 'rugby',
    'mma', 'ufc', 'fenerbahce', 'zrinjski',
    'quarterback', 'touchdown', 'super bowl',
    'dortmund', 'borussia dortmund', 'bundesliga', 'mls', 'eric ramsay', 'charlton',
    'qatar league', 'al-sailiya', 'red bull chief', 'sprinkler pitch'
  ]

  const PL_CLUBS = [
    'arsenal', 'aston villa', 'bournemouth', 'brentford', 'brighton', 'chelsea',
    'crystal palace', 'everton', 'fulham', 'ipswich', 'leicester', 'liverpool',
    'man city', 'manchester city', 'man utd', 'manchester united', 'newcastle',
    'nottingham forest', 'forest', 'southampton', 'spurs', 'tottenham',
    'west ham', 'wolves'
  ]

  const filteredPosts = postsData.filter(post => {
    const text = ((post.title || '') + ' ' + (post.summary || '')).toLowerCase()

    // Always hide betting and boxing regardless of PL club mention
    if (ALWAYS_HIDE.some(kw => text.includes(kw))) return false

    // If PL club mentioned, keep it
    const hasPLClub = PL_CLUBS.some(club => text.includes(club))
    if (hasPLClub) return true

    // Otherwise check general non-PL keywords
    return !HIDE_KEYWORDS.some(kw => text.includes(kw))
  })

  // Deduplicate by URL
  const deduplicatedPosts = (() => {
    const seen = new Set<string>()
    return filteredPosts.filter(post => {
      if (!post.url) return true
      if (seen.has(post.url)) return false
      seen.add(post.url)
      return true
    })
  })()

  // For index sort, sort client-side by calculated index
  if (sort === 'index') {
    deduplicatedPosts.sort((a, b) => calculateIndex(b) - calculateIndex(a))
  }

  return NextResponse.json({
    posts: deduplicatedPosts,
    total: count || 0,
    page,
    pageSize: POSTS_PER_PAGE,
  })
}
