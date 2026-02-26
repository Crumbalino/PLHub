import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { CLUBS_BY_SLUG, CLUBS } from '@/lib/clubs'
import { Post } from '@/types'
import StoryCard from '@/components/StoryCard'
import ClubSelector from '@/components/ClubSelector'
import PulseBadge from '@/components/PulseBadge'
import Pagination from '@/components/Pagination'
import Breadcrumb from '@/components/Breadcrumb'
import { formatDistanceToNow } from '@/lib/utils'

export const dynamic = 'force-dynamic'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://plhub.co.uk'

const POSTS_PER_PAGE = 20

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

interface PageProps {
  params: { slug: string }
  searchParams: { page?: string; sort?: string }
}

export async function generateStaticParams() {
  return CLUBS.map((club) => ({ slug: club.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const club = CLUBS_BY_SLUG[params.slug]
  if (!club) return {}

  return {
    title: `${club.name} News, Transfers & Rumours`,
    description: `The latest ${club.name} news, transfer rumours and fan discussion from Reddit and top football journalists. Updated constantly.`,
    alternates: {
      canonical: `${siteUrl}/clubs/${params.slug}`,
    },
    openGraph: {
      title: `${club.name} News & Transfers | PLHub`,
      description: `Latest ${club.name} news ranked by the community.`,
      images: [{ url: club.badgeUrl }],
    },
  }
}

export const revalidate = 300

const noSupabase =
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

async function getClubTop5Posts(slug: string): Promise<Post[]> {
  if (noSupabase) return []
  try {
    const since = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString()
    const { data, error } = await supabase
      .from('posts')
      .select('id, external_id, title, url, summary, content, source, club_slug, author, score, previous_score, subreddit, image_url, fetched_at, published_at, clubs(*)')
      .eq('club_slug', slug)
      .gte('published_at', since)
      .order('score', { ascending: false })
      .limit(5)

    if (error) return []
    return (data as unknown as Post[]) ?? []
  } catch {
    return []
  }
}

async function getClubTrendingPosts(slug: string, minScore: number = 50): Promise<Post[]> {
  if (noSupabase) return []
  try {
    const since = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString()
    const { data, error } = await supabase
      .from('posts')
      .select('id, external_id, title, url, summary, content, source, club_slug, author, score, previous_score, subreddit, image_url, fetched_at, published_at, clubs(*)')
      .eq('club_slug', slug)
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

async function getClubPostCount(slug: string, sort: SortOption): Promise<number> {
  if (noSupabase) return 0
  try {
    let query = supabase.from('posts').select('*', { count: 'exact', head: true }).eq('club_slug', slug)

    if (sort === 'hot') {
      const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
      query = query.gte('published_at', sixHoursAgo)
    }

    const { count, error } = await query
    if (error) return 0
    return count ?? 0
  } catch {
    return 0
  }
}

async function getClubPosts(slug: string, page: number, sort: SortOption): Promise<Post[]> {
  if (noSupabase) return []

  try {
    const offset = (page - 1) * POSTS_PER_PAGE
    let query = supabase
      .from('posts')
      .select('id, external_id, title, url, summary, content, source, club_slug, author, score, previous_score, subreddit, image_url, fetched_at, published_at, clubs(*)')
      .eq('club_slug', slug)

    if (sort === 'hot') {
      const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
      query = query
        .gte('published_at', sixHoursAgo)
        .order('score', { ascending: false })
        .order('published_at', { ascending: false })
    } else if (sort === 'new') {
      query = query.order('published_at', { ascending: false })
    } else {
      // index (default)
      query = query
        .order('published_at', { ascending: false })
    }

    const { data, error } = await query.range(offset, offset + POSTS_PER_PAGE - 1)

    if (error) return []

    return (data as unknown as Post[]) ?? []
  } catch {
    return []
  }
}

export default async function ClubPage({ params, searchParams }: PageProps) {
  const club = CLUBS_BY_SLUG[params.slug]
  if (!club) notFound()

  const currentPage = Math.max(1, parseInt(searchParams.page ?? '1', 10) || 1)
  const sort = parseSortParam(searchParams.sort)

  const [posts, top5, trendingPosts, totalCount] = await Promise.all([
    getClubPosts(params.slug, currentPage, sort),
    currentPage === 1 && sort === 'index' ? getClubTop5Posts(params.slug) : Promise.resolve([]),
    currentPage === 1 ? getClubTrendingPosts(params.slug, 50) : Promise.resolve([]),
    getClubPostCount(params.slug, sort),
  ])

  const totalPages = Math.max(1, Math.ceil(totalCount / POSTS_PER_PAGE))
  const lastUpdated =
    posts.length > 0 ? formatDistanceToNow(posts[0].fetched_at) : null

  // Two metrics: PLHub Index (logarithmic) and Heat (velocity-based)
  const allScores = [...posts.map(p => p.score ?? 1), ...top5.map(p => p.score ?? 1)]
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
    if (delta > 20 || score > maxScore * 0.7) return { label: '🔥🔥', color: 'text-orange-400' }
    if (delta > 5 || score > maxScore * 0.4) return { label: '🔥', color: 'text-yellow-400' }
    if (score > maxScore * 0.1) return { label: '📈', color: 'text-green-400' }
    return null
  }

  return (
    <div className="mx-auto max-w-2xl px-4">
      {/* Breadcrumb */}
      <div className="mb-6 pt-4">
        <Breadcrumb
          items={[
            { name: 'Home', href: '/' },
            { name: club.name, href: `/clubs/${club.slug}` },
          ]}
        />
      </div>

      {/* Club Hero Banner */}
      <section
        className="mb-8 overflow-hidden rounded-2xl p-6 sm:p-8"
        style={{
          background: `linear-gradient(135deg, ${club.primaryColor}28 0%, ${club.secondaryColor}18 100%)`,
        }}
      >
        <div className="flex items-center gap-4">
          <div className="h-20 w-20 shrink-0">
            <Image
              src={club.badgeUrl}
              alt={club.name}
              width={80}
              height={80}
              unoptimized
              className="object-contain"
            />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              {club.name} News &amp; Latest Updates
            </h1>
            <h2
              className="mt-1 text-base font-medium"
              style={{ color: club.primaryColor }}
            >
              {club.name} Latest Stories
            </h2>
          </div>
        </div>

        {/* Placeholder SEO copy */}
        <p className="mt-4 text-sm leading-relaxed text-white">
          Stay up to date with all the latest{' '}
          <strong className="text-white">{club.name}</strong> news, transfer
          gossip, match reports, and fan discussion. We aggregate posts from the{' '}
          <a
            href={`https://www.reddit.com/r/${club.subreddit}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-white"
          >
            r/{club.subreddit}
          </a>{' '}
          subreddit and BBC Sport, combining the best of fan reaction and
          professional journalism in one place.
        </p>

        {lastUpdated && (
          <p className="mt-2 text-xs text-white">
            Last updated {lastUpdated}
          </p>
        )}
      </section>

      {/* Club Selector Hero */}
      <section className="border-b border-white/10 py-6 text-center mb-8">
        <p className="mb-4 text-sm uppercase tracking-widest text-white">
          Select your club
        </p>

        {/* Mobile dropdown */}
        <div className="px-4">
          <ClubSelector currentSlug={params.slug} />
        </div>

        {/* Desktop badge grid */}
        <div className="hidden sm:block">
          <div className="mx-auto max-w-4xl flex items-center justify-center gap-3">
            {/* Premier League Badge */}
            <Link
              href="/"
              title="All Premier League stories"
              className="flex flex-col items-center justify-center shrink-0"
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white p-1 transition-all duration-150 ring-2 ring-transparent ring-offset-2 ring-offset-[#0B1F21] hover:ring-2 hover:ring-[#F5C842] hover:ring-offset-2 hover:ring-offset-[#0B1F21] hover:scale-110">
                <Image
                  src="https://upload.wikimedia.org/wikipedia/en/f/f2/Premier_League_Logo.svg"
                  alt="Premier League"
                  width={32}
                  height={32}
                  unoptimized
                  className="object-contain"
                />
              </div>
              <span className="text-[9px] text-white/40 mt-1 block text-center">All</span>
            </Link>

            {/* Divider */}
            <div className="border-r border-white/20 h-6" />

            {/* Club Badges */}
            <div className="grid grid-cols-5 gap-3 sm:grid-cols-10">
              {CLUBS.map((c) => (
                <Link
                  key={c.slug}
                  href={`/clubs/${c.slug}`}
                  className="flex items-center justify-center transition-transform hover:scale-110"
                >
                  <span className={`flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-white/10 ring-2 ring-offset-2 ring-offset-[#0B1F21] transition-all duration-150 hover:ring-[#F5C842] hover:scale-110 ${c.slug === club.slug ? 'ring-[#F5C842]' : 'ring-transparent'}`}>
                    <Image
                      src={c.badgeUrl}
                      alt={c.name}
                      width={28}
                      height={28}
                      unoptimized
                      className="object-contain"
                    />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Section 1: Today's Top 5 — page 1 of index sort only */}
      {currentPage === 1 && sort === 'index' && top5.length > 0 && (
        <section className="mb-8" aria-labelledby="top5-heading">
          <div className="mb-4 flex items-center gap-2">
            <span
              className="h-4 w-0.5 rounded-full"
              style={{ backgroundColor: 'var(--brand-gold)' }}
              aria-hidden="true"
            />
            <h2
              id="top5-heading"
              className="text-sm font-semibold uppercase tracking-wider text-white"
            >
              Today&apos;s Top 5
            </h2>
          </div>

          {/* Top 5 cards — horizontal scroll on mobile, grid on desktop, with gradient overlay */}
          <div className="relative overflow-hidden">
            {/* Gradient overlay for visual hierarchy */}
            <div
              className="pointer-events-none absolute inset-0 z-0"
              style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(245,200,66,0.04) 0%, transparent 70%)' }}
              aria-hidden="true"
            />
            <div className="flex gap-3 overflow-x-auto pb-6 sm:overflow-x-visible scrollbar-hide relative z-10">
              {top5.map((post, index) => {
                const isRankOne = index === 0
                const imageHeight = isRankOne ? 'h-28' : 'h-20'
                const padding = isRankOne ? 'p-4' : (index <= 2 ? 'p-3' : 'p-2')
                const titleSize = isRankOne ? 'text-base font-bold' : (index <= 2 ? 'text-sm font-semibold' : 'text-xs font-medium')
                const badgeSize = isRankOne ? 'text-4xl' : 'text-2xl'
                const shadow = isRankOne ? 'shadow-[0_0_20px_rgba(245,200,66,0.15)] shadow-[0_2px_20px_rgba(245,200,66,0.07)]' : 'shadow-[0_2px_20px_rgba(245,200,66,0.07)]'

                return (
                  <a
                    key={post.id}
                    href={`#post-${post.id}`}
                    className={`relative flex flex-col gap-2 rounded-lg bg-[#152B2E] ${padding} ${shadow} transition-colors hover:bg-[#1A3235] hover:shadow-[0_4px_24px_rgba(245,200,66,0.13)] sm:flex-1`}
                  >
                    {/* Rank badge — larger for #1 */}
                    <div className={`absolute top-0 left-0 bg-black/70 px-2 py-1 text-white ${badgeSize} font-black leading-none`}>
                      {index + 1}
                    </div>

                    {post.image_url && (
                      <img
                        src={post.image_url}
                        alt=""
                        className={`${imageHeight} w-full rounded object-cover`}
                        loading="lazy"
                      />
                    )}
                    <h3 className={`line-clamp-2 leading-tight text-white ${titleSize}`}>
                      {post.title}
                    </h3>

                    {/* Club badge image */}
                    {club && (
                      <div className="flex items-center gap-1">
                        <span className="flex h-5 w-5 items-center justify-center overflow-hidden rounded-full bg-white/10">
                          <Image
                            src={club.badgeUrl}
                            alt={club.name}
                            width={16}
                            height={16}
                            unoptimized
                            className="object-contain"
                          />
                        </span>
                        <span className="text-[11px] text-white">{club.shortName}</span>
                      </div>
                    )}

                    {/* Two metrics: Pulse + Heat, centered */}
                    <div className="mt-auto pt-2 border-t border-white/10 text-center space-y-1">
                      <div className={isRankOne ? 'text-sm' : 'text-xs'}>
                        <PulseBadge score={toIndex(post.score ?? 0)} size={isRankOne ? 'md' : 'sm'} />
                      </div>
                      {toHeat(post.score ?? 0, (post.score ?? 0) - (post.previous_score ?? post.score ?? 0)) && (
                        <div className={`font-bold ${toHeat(post.score ?? 0, (post.score ?? 0) - (post.previous_score ?? post.score ?? 0))?.color} ${isRankOne ? 'text-base' : 'text-sm'}`}>
                          {toHeat(post.score ?? 0, (post.score ?? 0) - (post.previous_score ?? post.score ?? 0))?.label}
                        </div>
                      )}
                    </div>
                  </a>
                )
              })}
            </div>
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 h-8"
              style={{
                background: 'linear-gradient(to bottom, transparent, #0B1F21)',
              }}
              aria-hidden="true"
            />
          </div>
        </section>
      )}

      {/* Trending section — page 1 only, vertical ranked list */}
      {currentPage === 1 && trendingPosts.length > 0 && (() => {
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
            <h2
              id="trending-heading"
              className="mb-4 text-xs font-semibold text-white"
            >
              <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse mr-2" />
              Trending Now
            </h2>

            <div className="flex flex-col gap-2">
              {movingPosts.map(({ post, delta }, idx) => {
                let movementBadge = ''
                let movementColor = ''

                if (delta > 20) {
                  movementBadge = '🔥 Hot'
                  movementColor = 'text-orange-400'
                } else if (delta > 5) {
                  movementBadge = '↑'
                  movementColor = 'text-green-400'
                } else if (delta < -5) {
                  movementBadge = '↓'
                  movementColor = 'text-red-400/70'
                }

                return (
                  <a
                    key={post.id}
                    href={`#post-${post.id}`}
                    className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2 cursor-pointer transition-all duration-150 hover:border-l-2 hover:border-[#F5C842] hover:pl-1"
                  >
                    <span className="w-6 text-white font-bold text-sm text-center">{idx + 1}</span>
                    <span className="text-sm text-white line-clamp-1 flex-1">{post.title}</span>
                    {movementBadge && (
                      <span className={`text-sm font-semibold shrink-0 ${movementColor}`}>{movementBadge}</span>
                    )}
                  </a>
                )
              })}
            </div>
          </section>
        )
      })()}

      {/* Posts Feed */}
      {posts.length === 0 ? (
        <EmptyState clubName={club.name} />
      ) : (
        <>
          {/* Section heading */}
          <h2 className="mb-6 text-lg font-semibold tracking-tight text-white">
            {sort === 'hot' ? 'What\'s Hot Right Now' : sort === 'new' ? 'Latest Stories' : 'Latest Stories'}
          </h2>

          <div className="flex flex-col gap-3">
            {(sort === 'index' ? interleavePosts(posts) : posts).map((post) => {
              return (
                <StoryCard
                  key={post.id}
                  post={post}
                  indexScore={toIndex(post.score ?? 0)}
                />
              )
            })}
          </div>
          <div className="mt-8">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              basePath={`/clubs/${club.slug}`}
              sortParam={sort !== 'index' ? sort : undefined}
            />
          </div>
        </>
      )}
    </div>
  )
}

function EmptyState({ clubName }: { clubName: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-white/10 py-16 text-center">
      <span className="text-4xl">⚽</span>
      <h3 className="mt-4 text-base font-semibold text-white">
        No {clubName} stories yet
      </h3>
      <p className="mt-2 max-w-sm text-sm text-white">
        {clubName} news will appear here once the cron jobs have run. Check back
        soon or trigger the cron manually.
      </p>
    </div>
  )
}
