import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { Post } from '@/types'
import StoryCard from '@/components/StoryCard'
import ClubSelector from '@/components/ClubSelector'
import PulseBadge from '@/components/PulseBadge'
import PLTable from '@/components/PLTable'
import NextFixtures from '@/components/NextFixtures'
import FeedContainer from '@/components/FeedContainer'
import PLTableWidget from '@/components/PLTableWidget'
import FixturesWidget from '@/components/FixturesWidget'
import AdPlaceholder from '@/components/AdPlaceholder'
import { formatDistanceToNow, decodeHtmlEntities } from '@/lib/utils'
import { CLUBS_BY_SLUG, CLUBS } from '@/lib/clubs'
import { calculateIndex } from '@/lib/plhub-index'

export const dynamic = 'force-dynamic'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://plhub.co.uk'

export const metadata: Metadata = {
  title: 'PLHub — Premier League News. Right Now.',
  description:
    'The pulse of the Premier League. News and views from all 20 clubs ranked by the community. Transfer rumours, match reports and fan discussion. Updated constantly.',
  alternates: {
    canonical: siteUrl,
  },
}

export const revalidate = 300

const POSTS_PER_PAGE = 20

const noSupabase =
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

type SortOption = 'index' | 'hot' | 'new'

function parseSortParam(raw: string | undefined): SortOption {
  if (raw === 'hot' || raw === 'new') return raw
  return 'index'
}

function interleavePosts(posts: Post[]): Post[] {
  const reddit = posts.filter(p => p.source === 'reddit')
  const news = posts.filter(p => p.source !== 'reddit')
  const result: Post[] = []
  let ri = 0, ni = 0

  while (ri < reddit.length || ni < news.length) {
    // Add up to 2 reddit posts
    if (ri < reddit.length) result.push(reddit[ri++])
    if (ri < reddit.length) result.push(reddit[ri++])
    // Then 1 news post
    if (ni < news.length) result.push(news[ni++])
  }
  return result
}

const SECTION_HEADINGS: Record<SortOption, string> = {
  index: 'Ranked by Heat',
  hot:   "What's Hot Right Now",
  new:   'Latest Stories',
}

const getTimeDisplay = (post: Post): string => {
  const published = new Date(post.published_at)
  const now = new Date()
  const diffMins = Math.floor((now.getTime() - published.getTime()) / 60000)
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`
  if (diffMins < 2880) return 'Yesterday'
  return published.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

const getClubCode = (slug: string): string => {
  const clubCodes: Record<string, string> = {
    'arsenal': '1', 'aston-villa': '2', 'bournemouth': '3', 'brentford': '4',
    'brighton': '6', 'chelsea': '8', 'crystal-palace': '9', 'everton': '11',
    'fulham': '13', 'ipswich': '40', 'leicester': '16', 'liverpool': '14',
    'manchester-city': '43', 'manchester-united': '1', 'newcastle': '4',
    'nottingham-forest': '17', 'southampton': '20', 'tottenham': '6',
    'west-ham': '21', 'wolverhampton': '39',
  }
  return clubCodes[slug] || slug
}

async function getTop5Posts(): Promise<Post[]> {
  if (noSupabase) return []
  try {
    const { data, error } = await supabase
      .from('posts')
      .select('id, external_id, title, url, summary, content, source, club_slug, author, score, subreddit, image_url, fetched_at, published_at, clubs(*)')
      .order('score', { ascending: false })
      .limit(5)

    if (error) return []
    const posts = (data as unknown as Post[]) ?? []
    return posts
  } catch {
    return []
  }
}

async function getTrendingPosts(minScore: number = 100): Promise<Post[]> {
  if (noSupabase) return []
  try {
    const since = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString()
    const { data, error } = await supabase
      .from('posts')
      .select('id, external_id, title, url, summary, content, source, club_slug, author, score, subreddit, image_url, fetched_at, published_at, clubs(*)')
      .gte('published_at', since)
      .gte('score', minScore)
      .order('score', { ascending: false })
      .limit(20)

    if (error) return []
    return (data as unknown as Post[]) ?? []
  } catch {
    return []
  }
}

async function getIndexCount(sort: SortOption, clubSlug?: string): Promise<number> {
  if (noSupabase) return 0
  try {
    let query = supabase.from('posts').select('*', { count: 'exact', head: true })

    if (sort === 'hot') {
      const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
      query = query.gte('published_at', sixHoursAgo)
    }

    if (clubSlug) {
      query = query.eq('club_slug', clubSlug)
    }

    const { count, error } = await query
    if (error) return 0
    return count ?? 0
  } catch {
    return 0
  }
}

async function getIndexPosts(page: number, sort: SortOption, clubSlug?: string): Promise<Post[]> {
  if (noSupabase) return []
  try {
    const offset = (page - 1) * POSTS_PER_PAGE
    let query = supabase
      .from('posts')
      .select('id, external_id, title, url, summary, content, source, club_slug, author, score, subreddit, image_url, fetched_at, published_at, clubs(*)')

    if (clubSlug) {
      query = query.eq('club_slug', clubSlug)
    }

    if (sort === 'hot') {
      query = query
        .order('score', { ascending: false })
        .order('published_at', { ascending: false })
    } else if (sort === 'new') {
      query = query.order('published_at', { ascending: false })
    } else {
      // index (default) — fetch without order, will sort client-side by calculateIndex
      query = query.order('published_at', { ascending: false })
    }

    const { data, error } = await query.range(offset, offset + POSTS_PER_PAGE - 1)

    if (error) return []
    const posts = (data as unknown as Post[]) ?? []

    // For index sort, sort client-side by calculated index
    if (sort === 'index') {
      return posts.sort((a, b) => calculateIndex(b) - calculateIndex(a))
    }

    return posts
  } catch {
    return []
  }
}

interface PageProps {
  searchParams: { page?: string; sort?: string; club?: string }
}

export default async function HomePage({ searchParams }: PageProps) {
  const currentPage = Math.max(1, parseInt(searchParams.page ?? '1', 10) || 1)
  const sort = parseSortParam(searchParams.sort)
  const clubSlug = searchParams.club

  // Top 5, trending, and feed posts
  const [top5, trendingPosts, indexPosts, totalCount] = await Promise.all([
    currentPage === 1 && sort === 'index' && !clubSlug ? getTop5Posts() : Promise.resolve([]),
    currentPage === 1 && sort === 'index' && !clubSlug ? getTrendingPosts(100) : Promise.resolve([]),
    getIndexPosts(currentPage, sort, clubSlug),
    getIndexCount(sort, clubSlug),
  ])

  // Frontend safety net: filter non-PL content
  const HIDE_KEYWORDS = [
    'nfl', 'nba', 'boxing', 'bout', 'katie taylor', 'tom brady', 'raiders',
    'afc west', 'tua tagovailoa', 'betting tips', 'free bets', 'odds boost',
    'accumulator', 'best football bets', 'almeria', 'segunda division',
    'american football', 'conference league', 'europa conference',
    'champions league cash', 'world cup', 'carabao cup', 'celtic', 'rangers',
    'scottish', 'championship', 'league one', 'league two', 'efl',
    'plymouth', 'mexico open', 'tennis', 'golf', 'cricket', 'rugby',
    'mma', 'ufc', 'fenerbahce', 'zrinjski', 'betting offer', 'bet £10',
    'quarterback', 'touchdown', 'super bowl',
  ]
  const PL_CLUBS = [
    'arsenal', 'aston villa', 'bournemouth', 'brentford', 'brighton', 'chelsea',
    'crystal palace', 'everton', 'fulham', 'ipswich', 'leicester', 'liverpool',
    'man city', 'manchester city', 'man utd', 'manchester united', 'newcastle',
    'nottingham forest', 'forest', 'southampton', 'spurs', 'tottenham',
    'west ham', 'wolves'
  ]
  const filteredIndexPosts = indexPosts.filter(post => {
    const title = (post.title || '').toLowerCase()
    const hasPLClub = PL_CLUBS.some(club => title.includes(club))
    if (hasPLClub) return true
    return !HIDE_KEYWORDS.some(kw => title.includes(kw))
  })

  const totalPages = Math.max(1, Math.ceil(totalCount / POSTS_PER_PAGE))
  const lastFetched =
    filteredIndexPosts.length > 0 ? formatDistanceToNow(filteredIndexPosts[0].fetched_at) : null
  const hasContent = true

  // Two metrics: PLHub Index (logarithmic) and Heat (velocity-based)
  const allScores = [...filteredIndexPosts.map(p => p.score ?? 1), ...top5.map(p => p.score ?? 1)]
  const maxScore = Math.max(...allScores, 1)

  // Logarithmic Index score (0-100) — prevents clustering at 0
  const toIndex = (score: number) => {
    if (!score || score <= 0) return null
    const logScore = Math.log(score + 1)
    const logMax = Math.log(maxScore + 1)
    return Math.max(1, Math.round((logScore / logMax) * 100))
  }

  // Heat label — based on score velocity/magnitude
  const toHeat = (score: number, delta: number): { label: string; color: string } | null => {
    if (!score || score <= 0) return null
    if (delta > 20 || score > maxScore * 0.7) return { label: 'Hot', color: 'text-orange-400' }
    if (delta > 5 || score > maxScore * 0.4) return { label: 'Warm', color: 'text-yellow-400' }
    if (score > maxScore * 0.1) return { label: 'Trending', color: 'text-green-400' }
    return null
  }

  // Group posts by time period
  const groupPostsByTime = (posts: Post[]) => {
    const now = new Date()
    const groups: { label: string; posts: Post[] }[] = [
      { label: 'Just now', posts: [] },
      { label: 'Today', posts: [] },
      { label: 'Yesterday', posts: [] },
      { label: 'This week', posts: [] },
      { label: 'Earlier', posts: [] },
    ]

    posts.forEach(post => {
      const diff = (now.getTime() - new Date(post.published_at).getTime()) / 60000
      if (diff < 60) groups[0].posts.push(post)
      else if (diff < 1440) groups[1].posts.push(post)
      else if (diff < 2880) groups[2].posts.push(post)
      else if (diff < 10080) groups[3].posts.push(post)
      else groups[4].posts.push(post)
    })

    return groups.filter(g => g.posts.length > 0)
  }

  const groupedPosts = groupPostsByTime(filteredIndexPosts)

  return (
    <div className="min-h-screen bg-[#0B1F21]">
      {/* Mobile/Tablet: Compact horizontal strips above feed */}
      <div className="lg:hidden border-b border-white/10 px-4 py-4 space-y-4">
        {/* Compact PL Table Strip */}
        <div>
          <h3 className="text-xs font-bold text-white mb-3">League Table</h3>
          <PLTableWidget />
        </div>

        {/* Compact Fixtures Strip */}
        <div>
          <h3 className="text-xs font-bold text-white mb-3">Next Matches</h3>
          <FixturesWidget />
        </div>
      </div>

      <div className="max-w-[1320px] mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* LEFT SIDEBAR — 280px fixed */}
          <div className="hidden lg:block w-[280px] shrink-0">
            <div className="sticky top-20 space-y-6">
              {/* PL Table Widget */}
              <PLTableWidget />

              {/* Ad Placeholder */}
              <AdPlaceholder size="300x250" />
            </div>
          </div>

          {/* CENTRE FEED — flex-1, max-w ~720px */}
          <div className="flex-1 min-w-0 lg:max-w-[720px]">
      {/* Hero SEO Section */}
      <section className="pt-6 pb-8 px-4 text-center">
        <h1 className="text-2xl md:text-4xl font-bold text-white text-center">
          The Pulse of the Premier League
        </h1>
        <p className="mt-2 text-sm md:text-base text-gray-300 text-center">
          Curated and summarised by The Secret Pundit
        </p>
      </section>

      {/* Club Selector Hero */}
      <section className="border-b border-white/10 py-10 text-center mx-auto" style={{ background: 'radial-gradient(ellipse at center, #0F2D31 0%, #0B1F21 70%)' }}>
        <p className="text-sm text-gray-400 text-center mb-3">
          Select your club
        </p>

        {/* Mobile dropdown */}
        <div className="px-4">
          <ClubSelector />
        </div>

        {/* Desktop badge grid */}
        <div className="hidden sm:block">
          <div className="mx-auto max-w-4xl px-4 mt-6">
            {/* All Clubs pill */}
            <div className="flex justify-center mb-4">
              <Link
                href="/"
                className={`text-xs font-medium rounded-full px-4 py-1.5 transition-colors ${
                  !clubSlug
                    ? 'bg-white/10 text-white ring-2 ring-[#C4A23E]'
                    : 'text-white bg-white/10 hover:bg-white/20'
                }`}
              >
                All
              </Link>
            </div>

            {/* Club Badges Grid */}
            <div className="flex flex-wrap gap-3 justify-center">
              {CLUBS.map((club) => (
                <Link
                  key={club.slug}
                  href={`/?club=${club.slug}${sort !== 'index' ? `&sort=${sort}` : ''}`}
                  className={`w-10 h-10 md:w-9 md:h-9 rounded-full p-1.5 cursor-pointer transition-colors ${
                    clubSlug === club.slug
                      ? 'bg-white/10 ring-2 ring-[#C4A23E]'
                      : 'bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <Image
                    src={club.badgeUrl}
                    alt={club.name}
                    width={28}
                    height={28}
                    unoptimized
                    className="w-full h-full object-contain"
                  />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Club filter indicator */}
      {clubSlug && (
        <div className="mx-auto max-w-[1320px] px-4 py-4 flex items-center gap-2 text-sm text-gray-300">
          <span>Showing: <span className="font-semibold text-white">{CLUBS_BY_SLUG[clubSlug]?.name || clubSlug}</span></span>
          <Link
            href="/"
            className="ml-2 text-gray-400 hover:text-white transition-colors"
            title="Clear club filter"
          >
            ✕ Clear
          </Link>
        </div>
      )}

      {!hasContent ? (
        <EmptyState />
      ) : (
        <>
          {/* Section 1: Today's Top 5 — page 1 of index sort only */}
          {currentPage === 1 && sort === 'index' && top5.length > 0 && (
            <section className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-px flex-1 bg-white/5" />
                <div>
                  <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    <span className="inline-block w-1 h-6 bg-[#C4A23E] rounded-full" />
                    Today's Top 5
                  </h2>
                  <p className="text-sm text-gray-400 mt-1">What The Secret Pundit is watching right now</p>
                </div>
                <div className="h-px flex-1 bg-white/5" />
              </div>
              <div className="rounded-xl border border-white/[0.08] overflow-hidden">
                {top5.map((post, index) => {
                  const indexScore = toIndex(post.score ?? 0)
                  return (
                    <a
                      key={post.id}
                      href={`#post-${post.id}`}
                      className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.06] last:border-0 hover:bg-white/[0.03] transition-colors group"
                    >
                      {/* Rank */}
                      <span className={`shrink-0 font-black tabular-nums w-5 text-center text-white ${
                        index === 0 ? 'text-lg' : 'text-white/30 text-sm'
                      }`}>
                        {index + 1}
                      </span>
                      {/* Thumbnail */}
                      <div className="shrink-0 w-12 h-10 rounded overflow-hidden bg-[#152B2E]">
                        {post.image_url && (
                          <img src={post.image_url} alt="" className="w-full h-full object-cover" />
                        )}
                      </div>
                      {/* Headline + meta */}
                      <div className="flex-1 min-w-0">
                        <p className={`font-semibold leading-snug line-clamp-2 group-hover:text-white/60 transition-colors ${
                          index === 0 ? 'text-sm text-white' : 'text-xs text-white/80'
                        }`}>
                          {decodeHtmlEntities(post.title)}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {post.club_slug && (
                            <img
                              src={`https://resources.premierleague.com/premierleague/badges/t${getClubCode(post.club_slug)}.svg`}
                              alt=""
                              className="w-3 h-3 object-contain opacity-60"
                            />
                          )}
                          <span className="text-[10px] text-white/30">{getTimeDisplay(post)}</span>
                        </div>
                      </div>
                      {/* Pulse */}
                      {indexScore && (
                        <div className="shrink-0">
                          <PulseBadge score={indexScore} size="sm" />
                        </div>
                      )}
                    </a>
                  )
                })}
              </div>
            </section>
          )}

          {/* Section 2: Trending Now — page 1 of index sort only, vertical ranked list */}
          {currentPage === 1 && sort === 'index' && trendingPosts.length > 0 && (() => {
            // Filter posts with meaningful movement (abs delta > 3)
            const movingPosts = trendingPosts
              .map(post => ({
                post,
                delta: (post.score ?? 0) - (post.previous_score ?? post.score ?? 0)
              }))
              .filter(({ delta }) => Math.abs(delta) > 3)
              .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
              .slice(0, 5)

            // Only show section if at least 2 posts with movement
            if (movingPosts.length < 2) return null

            return (
              <section className="mb-8" aria-labelledby="trending-heading">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <span className="text-white text-sm">↑</span>
                  <span className="text-sm font-bold text-white">Trending</span>
                </div>

                <div className="flex flex-col gap-2">
                  {movingPosts.map(({ post, delta }, idx) => {
                    const getDelta = (delta: number) => {
                      if (delta > 10) return { arrow: '↑↑', color: 'text-green-400', bold: true }
                      if (delta > 0) return { arrow: '↑', color: 'text-green-400', bold: false }
                      if (delta < -10) return { arrow: '↓↓', color: 'text-red-400', bold: true }
                      if (delta < 0) return { arrow: '↓', color: 'text-red-400/70', bold: false }
                      return { arrow: '→', color: 'text-white/20', bold: false }
                    }

                    const movement = getDelta(delta)

                    return (
                      <a
                        key={post.id}
                        href={`#post-${post.id}`}
                        className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2 cursor-pointer transition-all duration-150 hover:border-l-2 hover:border-[#F5C842] hover:pl-1"
                      >
                        <span className="w-6 text-white font-bold text-sm text-center">{idx + 1}</span>
                        <span className={`text-xs font-bold shrink-0 ${movement.color}`}>{movement.arrow}</span>
                        <span className="text-white/30 text-[10px] shrink-0">{Math.abs(delta)}</span>
                        <span className="text-sm text-white line-clamp-1 flex-1">{post.title}</span>
                      </a>
                    )
                  })}
                </div>
              </section>
            )
          })()}

          {/* Divider */}
          {currentPage === 1 && sort === 'index' && (top5.length > 0 || trendingPosts.length > 0) && filteredIndexPosts.length > 0 && (
            <hr className="mb-8 border-white/5" />
          )}

          {/* Section 3: Feed with sort toggle */}
          {filteredIndexPosts.length > 0 && (
            <section aria-labelledby="index-heading">
              {/* Section heading with description and update time */}
              <div className="mb-8">
                <h2
                  id="index-heading"
                  className="text-lg font-semibold tracking-tight text-white flex items-center gap-2 mb-2"
                >
                  <span className="inline-block w-1 h-6 bg-[#C4A23E] rounded-full" />
                  Ranked by the PLHub Index
                </h2>
                <p className="text-sm text-gray-400 mb-2">
                  Stories ranked by source credibility, recency, and community engagement — not paid placement, ever.
                </p>
                <p className="text-xs text-gray-500">
                  Updated {lastFetched || 'just now'}
                </p>
              </div>

              <FeedContainer
                initialPosts={filteredIndexPosts}
                totalCount={totalCount}
                sort={sort}
                club={clubSlug}
              />
            </section>
          )}
        </>
      )}
          </div>
          {/* End of centre feed */}

          {/* RIGHT SIDEBAR — 280px fixed */}
          <div className="hidden lg:block w-[280px] shrink-0">
            <div className="sticky top-20 space-y-6">
              {/* Fixtures Widget */}
              <FixturesWidget />

              {/* Ad Placeholder */}
              <AdPlaceholder size="300x250" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-white/10 py-16 text-center">
      <span className="text-4xl">⚽</span>
      <h3 className="mt-4 text-base font-semibold text-white">
        No stories yet
      </h3>
      <p className="mt-2 max-w-sm text-sm text-white">
        News will appear here once the cron jobs have fetched the latest posts
        from Reddit and BBC Sport. Trigger{' '}
        <code className="rounded bg-white/5 px-1 py-0.5 text-xs">
          /api/cron/reddit
        </code>{' '}
        to populate.
      </p>
    </div>
  )
}
