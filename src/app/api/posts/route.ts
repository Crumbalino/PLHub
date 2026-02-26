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
  const HIDE_KEYWORDS = [
    'NFL', 'NBA', 'boxing', 'bout', 'Katie Taylor', 'Tua Tagovailoa', 'betting tips', 'free bets',
    'Almeria', 'Segunda Division', 'American football', 'Conference League', 'Tom Brady', 'Raiders',
    'AFC', 'NFC', 'Super Bowl', 'touchdown', 'quarterback', 'Celtic', 'Rangers', 'Scottish Premiership',
    'Scottish Cup', 'Carabao Cup', 'Plymouth', 'Championship', 'League One', 'League Two', 'EFL',
    'Wrexham', 'Sheffield Wednesday', 'Sheffield United', 'Sunderland', 'Leeds', 'Burnley', 'Luton',
    'Norwich', 'Coventry', 'Middlesbrough', 'Stoke', 'Swansea', 'Hull', 'Millwall', 'Bristol City',
    'QPR', 'Watford', 'Blackburn', 'Preston', 'Derby', 'Portsmouth', 'Oxford United', 'odds boost',
    'accumulator', 'MLB', 'NHL', 'UFC', 'MMA', 'tennis', 'golf', 'cricket', 'rugby', 'World Series',
    'Stanley Cup', 'La Liga', 'Serie A', 'Bundesliga', 'Ligue 1', 'MLS', 'College football',
    'March Madness', 'Dolphins', 'Patriots', 'Cowboys', 'Lakers', 'Yankees', 'Packers', 'Chiefs',
    'Patrick Mahomes', 'LeBron James', 'Super League', 'IPL', 'NRL', 'AFL', 'Olympics', 'Copa America',
    'Tour de France', 'Wimbledon', 'US Open', 'Ryder Cup', 'Six Nations', 'NFL Draft', 'Jaguars',
    'Broncos', 'Chargers', 'Bengals', 'Ravens', 'Steelers', 'Browns', 'Texans', 'Colts', 'Titans',
    'Bills', 'Jets', 'Eagles', 'Commanders', 'Giants', 'Bears', 'Lions', 'Vikings', 'Saints',
    'Buccaneers', 'Falcons', 'Panthers', '49ers', 'Seahawks', 'Rams', 'Cardinals'
  ]
  const PL_CLUBS = ['arsenal', 'aston villa', 'bournemouth', 'brentford', 'brighton', 'chelsea', 'crystal palace', 'everton', 'fulham', 'ipswich', 'leicester', 'liverpool', 'man city', 'manchester city', 'man utd', 'manchester united', 'newcastle', 'nottingham forest', 'forest', 'southampton', 'spurs', 'tottenham', 'west ham', 'wolves', 'wolverhampton']
  const filteredPosts = postsData.filter(post => {
    const t = (post.title || '').toLowerCase()
    const hasPLClub = PL_CLUBS.some(club => t.includes(club))
    if (hasPLClub) return true
    return !HIDE_KEYWORDS.some(kw => t.includes(kw.toLowerCase()))
  })

  // For index sort, sort client-side by calculated index
  if (sort === 'index') {
    filteredPosts.sort((a, b) => calculateIndex(b) - calculateIndex(a))
  }

  return NextResponse.json({
    posts: filteredPosts,
    total: count || 0,
    page,
    pageSize: POSTS_PER_PAGE,
  })
}
