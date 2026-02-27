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
import FeedPage from '@/components/FeedPage'
import { formatDistanceToNow, decodeHtmlEntities } from '@/lib/utils'
import { CLUBS_BY_SLUG, CLUBS } from '@/lib/clubs'
import { calculateIndex } from '@/lib/plhub-index'
import { getClubCode, getTimeDisplay, toIndex } from '@/lib/card-utils'
import { filterPLContent, deduplicatePosts } from '@/lib/content-filter'

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


async function getTop5Posts(): Promise<Post[]> {
  if (noSupabase) return []
  try {
    const { data, error } = await supabase
      .from('posts')
      .select('id, external_id, title, url, summary, content, source, club_slug, author, score, subreddit, image_url, fetched_at, published_at, clubs(*)')
      .order('score', { ascending: false })
      .limit(30)

    if (error) return []
    const posts = (data as unknown as Post[]) ?? []
    return posts
  } catch {
    return []
  }
}

async function getTrendingPosts(): Promise<Post[]> {
  if (noSupabase) return []
  try {
    // Fetch more than 5 so filtering still yields 5 PL-relevant items
    const { data, error } = await supabase
      .from('posts')
      .select('id, external_id, title, url, summary, content, source, club_slug, author, score, subreddit, image_url, fetched_at, published_at, clubs(*)')
      .order('score', { ascending: false })
      .limit(30)

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
  const [top5Raw, trendingPostsRaw, indexPosts, totalCount] = await Promise.all([
    currentPage === 1 && sort === 'index' && !clubSlug ? getTop5Posts() : Promise.resolve([]),
    currentPage === 1 && sort === 'index' && !clubSlug ? getTrendingPosts() : Promise.resolve([]),
    getIndexPosts(currentPage, sort, clubSlug),
    getIndexCount(sort, clubSlug),
  ])

  // Apply filters to all post lists
  const top5 = deduplicatePosts(filterPLContent(top5Raw))
  const trendingPosts = deduplicatePosts(filterPLContent(trendingPostsRaw))
    .slice(0, 5)

  const filteredIndexPosts = deduplicatePosts(filterPLContent(indexPosts))

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
          <PLTable />
        </div>

        {/* Compact Fixtures Strip */}
        <div>
          <h3 className="text-xs font-bold text-white mb-3">Next Matches</h3>
          <NextFixtures />
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 pt-6">
        {/* Hero SEO Section — Full Width */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white">The Pulse of the Premier League</h1>
          <p className="text-base text-white/60 mt-2">AI-powered Premier League news, ranked by what matters</p>
        </div>

        {/* Club Selector Hero — Full Width */}
        <section className="border-b border-white/10 py-10 text-center mx-auto mb-8" style={{ background: 'radial-gradient(ellipse at center, #0F2D31 0%, #0B1F21 70%)' }}>
          <p className="text-sm text-white/60 text-center mb-3">
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

        {/* Three Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_280px] gap-6">
          {/* LEFT SIDEBAR — PL Table */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-6 max-h-[calc(100vh-6rem)] overflow-y-auto scrollbar-hide">
              <PLTable />
              <div className="bg-[#183538] rounded-xl p-4 text-center text-xs text-white/30 h-[250px] flex items-center justify-center border border-white/5">
                Ad
              </div>
            </div>
          </aside>

          {/* CENTRE — Feed */}
          <main className="min-w-0">
            {!hasContent ? (
              <EmptyState />
            ) : (
              <>
                {/* Trending section */}
                {currentPage === 1 && sort === 'index' && !clubSlug && trendingPosts.length > 0 && (
                  <section className="mb-8">
                    <div className="flex items-center gap-2 mb-4">
                      <svg width="16" height="16" viewBox="0 0 32 32" fill="none">
                        <path d="M4 16h7l2.5-7 5 14 2.5-7H28" stroke="#C4A23E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span className="text-sm font-bold text-white">Trending</span>
                    </div>
                    <div className="flex flex-col gap-2">
                      {trendingPosts.slice(0, 5).map((post, idx) => {
                        const indexScore = toIndex(post.score ?? 0)
                        // Heat-based opacity: #1 is brightest, #5 is most muted
                        const scoreOpacity = idx === 0 ? 'text-white' : idx <= 2 ? 'text-white/80' : 'text-white/55'
                        const isTop = idx === 0
                        return (
                          <a
                            key={post.id}
                            href={`#post-${post.id}`}
                            className="flex items-center gap-3 rounded-lg bg-white/5 px-3 py-2.5 hover:bg-white/10 transition-colors group"
                          >
                            <span className="w-5 text-sm font-bold text-white/60">{idx + 1}</span>
                            <span className="text-green-400 text-xs font-bold">▲</span>
                            <span className="text-sm text-white line-clamp-1 flex-1 group-hover:text-[#C4A23E] transition-colors">{post.title}</span>
                            {indexScore && (
                              <div className={`flex items-center gap-1.5 shrink-0 rounded-full px-2.5 py-1 ${isTop ? 'bg-[#C4A23E]/10' : 'bg-white/5'}`}>
                                <svg
                                  width="14"
                                  height="14"
                                  viewBox="0 0 32 32"
                                  fill="none"
                                  className={isTop ? 'animate-trending-pulse' : ''}
                                >
                                  <path d="M4 16h7l2.5-7 5 14 2.5-7H28" stroke="#C4A23E" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                <span className={`text-sm font-bold tabular-nums ${scoreOpacity}`}>{indexScore}</span>
                              </div>
                            )}
                          </a>
                        )
                      })}
                    </div>
                  </section>
                )}

                {/* Divider */}
                {currentPage === 1 && sort === 'index' && !clubSlug && (trendingPosts.length > 0) && filteredIndexPosts.length > 0 && (
                  <hr className="mb-8 border-white/5" />
                )}

                {/* Feed */}
                {filteredIndexPosts.length > 0 && (
                  <section>
                    <FeedPage
                      initialPosts={filteredIndexPosts}
                      totalCount={totalCount}
                      initialClub={clubSlug || null}
                    />
                  </section>
                )}
              </>
            )}
          </main>

          {/* RIGHT SIDEBAR — Fixtures */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-6 max-h-[calc(100vh-6rem)] overflow-y-auto scrollbar-hide">
              <NextFixtures />
              <div className="bg-[#183538] rounded-xl p-4 text-center text-xs text-white/30 h-[600px] flex items-center justify-center border border-white/5">
                Ad
              </div>
            </div>
          </aside>
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
