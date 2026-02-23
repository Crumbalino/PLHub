import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { CLUBS_BY_SLUG, CLUBS } from '@/lib/clubs'
import { Post } from '@/types'
import StoryCard from '@/components/StoryCard'
import Pagination from '@/components/Pagination'
import Breadcrumb from '@/components/Breadcrumb'
import { formatDistanceToNow } from '@/lib/utils'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://plhub.co.uk'

const POSTS_PER_PAGE = 20

type SortOption = 'index' | 'hot' | 'new'

function parseSortParam(raw: string | undefined): SortOption {
  if (raw === 'hot' || raw === 'new') return raw
  return 'index'
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

  const title = `${club.name} News & Updates`
  const description = `Latest ${club.name} news, transfer rumours and fan discussion aggregated from Reddit and BBC Sport.`
  const url = `${siteUrl}/clubs/${club.slug}`

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: `${title} | PLHub`,
      description,
      url,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | PLHub`,
      description,
    },
  }
}

export const revalidate = 300

const noSupabase =
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

async function getClubTrendingPosts(slug: string, minScore: number = 50): Promise<Post[]> {
  if (noSupabase) return []
  try {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { data, error } = await supabase
      .from('posts')
      .select('id, external_id, title, url, summary, content, source, club_slug, author, score, subreddit, image_url, fetched_at, published_at, clubs(*)')
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
      .select('id, external_id, title, url, summary, content, source, club_slug, author, score, subreddit, image_url, fetched_at, published_at, clubs(*)')
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

    if (error) {
      console.error(`Failed to fetch posts for club ${slug}:`, error)
      return []
    }

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

  const [posts, trendingPosts, totalCount] = await Promise.all([
    getClubPosts(params.slug, currentPage, sort),
    currentPage === 1 ? getClubTrendingPosts(params.slug, 50) : Promise.resolve([]),
    getClubPostCount(params.slug, sort),
  ])

  const totalPages = Math.max(1, Math.ceil(totalCount / POSTS_PER_PAGE))
  const lastUpdated =
    posts.length > 0 ? formatDistanceToNow(posts[0].fetched_at) : null

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
          <span className="text-6xl" aria-label={club.name}>
            {club.badgeEmoji}
          </span>
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
        <p className="mt-4 text-sm leading-relaxed text-white/60">
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
          <p className="mt-2 text-xs text-white/60">
            Last updated {lastUpdated}
          </p>
        )}
      </section>

      {/* Trending section — page 1 only */}
      {currentPage === 1 && trendingPosts.length > 0 && (
        <section className="mb-8" aria-labelledby="trending-heading">
          <h2
            id="trending-heading"
            className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#F5C842]"
          >
            Trending Now
          </h2>

          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {trendingPosts.map((post) => {
              const headline = post.title.substring(0, 40) + (post.title.length > 40 ? '...' : '')
              return (
                <a
                  key={post.id}
                  href={post.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-white/5 px-3 py-2 transition-colors hover:bg-white/10"
                >
                  <span className="flex h-4 w-4 items-center justify-center overflow-hidden rounded-full bg-white/10">
                    <Image
                      src={club.badgeUrl}
                      alt={club.name}
                      width={14}
                      height={14}
                      unoptimized
                      className="object-contain"
                    />
                  </span>
                  <span className="text-xs font-medium text-white">{headline}</span>
                  {post.score > 0 && (
                    <>
                      <span className="text-white/40" aria-hidden="true">·</span>
                      <span className="text-xs font-semibold text-[#F5C842]">{post.score}</span>
                    </>
                  )}
                </a>
              )
            })}
          </div>
        </section>
      )}

      {/* Posts Feed */}
      {posts.length === 0 ? (
        <EmptyState clubName={club.name} />
      ) : (
        <>
          {/* Section heading with toggle */}
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-semibold tracking-tight text-white">
              {sort === 'hot' ? '🔥 What\'s Hot Right Now' : sort === 'new' ? 'Latest Stories' : 'Latest Stories'}
            </h2>

            {/* Toggle: Heat and Recent */}
            <div className="flex items-center gap-2 rounded-full border border-white/20 bg-white/5 p-1">
              <Link
                href={`/clubs/${club.slug}?sort=hot`}
                className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                  sort === 'hot'
                    ? 'bg-white text-[#0B1F21]'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                🔥 Heat
              </Link>
              <Link
                href={`/clubs/${club.slug}?sort=new`}
                className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                  sort === 'new'
                    ? 'bg-white text-[#0B1F21]'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                🕒 Recent
              </Link>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {posts.map((post) => (
              <StoryCard key={post.id} post={post} />
            ))}
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
      <p className="mt-2 max-w-sm text-sm text-white/60">
        {clubName} news will appear here once the cron jobs have run. Check back
        soon or trigger the cron manually.
      </p>
    </div>
  )
}
