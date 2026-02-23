import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { Post } from '@/types'
import StoryCard from '@/components/StoryCard'
import Pagination from '@/components/Pagination'
import { formatDistanceToNow } from '@/lib/utils'
import { CLUBS_BY_SLUG } from '@/lib/clubs'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://plhub.co.uk'

export const metadata: Metadata = {
  title: 'PLHub — Premier League News Aggregator',
  description:
    'Latest Premier League news, transfer gossip and match updates from all 20 clubs aggregated from Reddit and BBC Sport.',
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    title: 'PLHub — Premier League News Aggregator',
    description:
      'Latest Premier League news, transfer gossip and match updates from all 20 clubs aggregated from Reddit and BBC Sport.',
    url: siteUrl,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PLHub — Premier League News Aggregator',
    description:
      'Latest Premier League news, transfer gossip and match updates from all 20 clubs aggregated from Reddit and BBC Sport.',
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

const SECTION_HEADINGS: Record<SortOption, string> = {
  index: 'Ranked by the PLHub Index',
  hot:   "What's Hot Right Now",
  new:   'Latest Stories',
}

async function getTop5Posts(): Promise<Post[]> {
  if (noSupabase) return []
  try {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { data, error } = await supabase
      .from('posts')
      .select('id, external_id, title, url, summary, content, source, club_slug, author, score, subreddit, image_url, fetched_at, published_at, clubs(*)')
      .gte('published_at', since)
      .order('score', { ascending: false })
      .limit(5)

    if (error) { console.error('Top5 fetch error:', error); return [] }
    return (data as unknown as Post[]) ?? []
  } catch {
    return []
  }
}

async function getTrendingPosts(minScore: number = 100): Promise<Post[]> {
  if (noSupabase) return []
  try {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
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

async function getIndexCount(sort: SortOption): Promise<number> {
  if (noSupabase) return 0
  try {
    let query = supabase.from('posts').select('*', { count: 'exact', head: true })

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

async function getIndexPosts(page: number, sort: SortOption): Promise<Post[]> {
  if (noSupabase) return []
  try {
    const offset = (page - 1) * POSTS_PER_PAGE
    let query = supabase
      .from('posts')
      .select('id, external_id, title, url, summary, content, source, club_slug, author, score, subreddit, image_url, fetched_at, published_at, clubs(*)')

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
        .order('score', { ascending: false })
        .order('published_at', { ascending: false })
    }

    const { data, error } = await query.range(offset, offset + POSTS_PER_PAGE - 1)

    if (error) { console.error('Index fetch error:', error); return [] }
    return (data as unknown as Post[]) ?? []
  } catch {
    return []
  }
}

interface PageProps {
  searchParams: { page?: string; sort?: string }
}

export default async function HomePage({ searchParams }: PageProps) {
  const currentPage = Math.max(1, parseInt(searchParams.page ?? '1', 10) || 1)
  const sort = parseSortParam(searchParams.sort)

  // Top 5, trending, and feed posts
  const [top5, trendingPosts, indexPosts, totalCount] = await Promise.all([
    currentPage === 1 && sort === 'index' ? getTop5Posts() : Promise.resolve([]),
    currentPage === 1 && sort === 'index' ? getTrendingPosts(100) : Promise.resolve([]),
    getIndexPosts(currentPage, sort),
    getIndexCount(sort),
  ])

  const totalPages = Math.max(1, Math.ceil(totalCount / POSTS_PER_PAGE))
  const lastFetched =
    indexPosts.length > 0 ? formatDistanceToNow(indexPosts[0].fetched_at) : null
  const hasContent = top5.length > 0 || indexPosts.length > 0

  return (
    <div className="mx-auto max-w-2xl px-4">
      {/* Hero SEO Section */}
      <section className="mb-12 py-8">
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Premier League News &amp; Transfer Gossip
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-white/60">
          PLHub aggregates the latest Premier League news, transfer rumours,
          match reports, and fan discussion from all 20 top-flight clubs. Our
          feeds pull from Reddit community posts and BBC Sport journalism,
          combined with AI-generated summaries so you can stay up to date at a
          glance. Covering Arsenal, Chelsea, Liverpool, Man City, and every club
          in between — your one-stop Premier League news hub.
        </p>
      </section>

      {!hasContent ? (
        <EmptyState />
      ) : (
        <>
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

              {/* Top 5 cards — horizontal scroll on mobile, grid on desktop */}
              <div className="relative overflow-hidden">
                <div className="flex gap-3 overflow-x-auto pb-6 sm:overflow-x-visible scrollbar-hide">
                  {top5.map((post) => {
                    const club = post.club_slug ? CLUBS_BY_SLUG[post.club_slug] : null
                    return (
                      <a
                        key={post.id}
                        href={post.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-col gap-2 rounded-lg bg-[#152B2E] p-2 shadow-[0_2px_20px_rgba(245,200,66,0.07)] transition-colors hover:bg-[#1A3235] hover:shadow-[0_4px_24px_rgba(245,200,66,0.13)] sm:flex-1"
                      >
                        {post.image_url && (
                          <img
                            src={post.image_url}
                            alt=""
                            className="h-24 w-full rounded object-cover"
                            loading="lazy"
                          />
                        )}
                        <h3 className="line-clamp-2 text-sm font-semibold leading-tight text-white">
                          {post.title}
                        </h3>
                        {club && (
                          <div className="flex items-center gap-1 text-[11px] text-white/60">
                            <span
                              className="inline-block h-3 w-3 rounded-full"
                              style={{ backgroundColor: club.primaryColor }}
                            />
                            {club.shortName}
                          </div>
                        )}
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

          {/* Section 2: Trending Now — page 1 of index sort only */}
          {currentPage === 1 && sort === 'index' && trendingPosts.length > 0 && (
            <section className="mb-8" aria-labelledby="trending-heading">
              <h2
                id="trending-heading"
                className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#F5C842]"
              >
                Trending Now
              </h2>

              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {trendingPosts.map((post) => {
                  const club = post.club_slug ? CLUBS_BY_SLUG[post.club_slug] : null
                  const headline = post.title.substring(0, 40) + (post.title.length > 40 ? '...' : '')
                  return (
                    <a
                      key={post.id}
                      href={post.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-white/5 px-3 py-2 transition-colors hover:bg-white/10"
                    >
                      {club && (
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
                      )}
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

          {/* Divider */}
          {currentPage === 1 && sort === 'index' && (top5.length > 0 || trendingPosts.length > 0) && indexPosts.length > 0 && (
            <hr className="mb-8 border-white/10" />
          )}

          {/* Section 3: Feed with sort toggle */}
          {indexPosts.length > 0 && (
            <section aria-labelledby="index-heading">
              {/* Section heading with toggle */}
              <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2
                  id="index-heading"
                  className="text-lg font-semibold tracking-tight text-white"
                >
                  {SECTION_HEADINGS[sort]}
                </h2>

                {/* Toggle: Heat and Recent (only show when not index sort) */}
                {sort !== 'index' && (
                  <div className="flex items-center gap-2 rounded-full border border-white/20 bg-white/5 p-1">
                    <Link
                      href="/?sort=hot"
                      className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                        sort === 'hot'
                          ? 'bg-white text-[#0B1F21]'
                          : 'text-white/60 hover:text-white'
                      }`}
                    >
                      🔥 Heat
                    </Link>
                    <Link
                      href="/?sort=new"
                      className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                        sort === 'new'
                          ? 'bg-white text-[#0B1F21]'
                          : 'text-white/60 hover:text-white'
                      }`}
                    >
                      🕒 Recent
                    </Link>
                  </div>
                )}
              </div>

              {sort === 'index' && (
                <p className="mb-6 text-sm text-white/60">
                  Stories are ranked by source credibility, recency, and community engagement — not paid placement, ever.
                </p>
              )}

              <div className="flex flex-col gap-3">
                {indexPosts.map((post) => (
                  <StoryCard key={post.id} post={post} />
                ))}
              </div>
              <div className="mt-8">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  basePath="/"
                  sortParam={sort !== 'index' ? sort : undefined}
                />
              </div>
            </section>
          )}
        </>
      )}
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
      <p className="mt-2 max-w-sm text-sm text-white/60">
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
