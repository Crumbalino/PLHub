import type { Metadata } from 'next'
import { supabase } from '@/lib/supabase'
import { Post } from '@/types'
import StoryCard from '@/components/StoryCard'
import { formatDistanceToNow } from '@/lib/utils'

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

const noSupabase =
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

async function getTop5Posts(): Promise<Post[]> {
  if (noSupabase) return []
  try {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { data, error } = await supabase
      .from('posts')
      .select('*, clubs(*)')
      .gte('published_at', since)
      .order('score', { ascending: false })
      .limit(5)

    if (error) { console.error('Top5 fetch error:', error); return [] }
    return (data as Post[]) ?? []
  } catch {
    return []
  }
}

async function getIndexPosts(): Promise<Post[]> {
  if (noSupabase) return []
  try {
    const { data, error } = await supabase
      .from('posts')
      .select('*, clubs(*)')
      .order('score', { ascending: false })
      .order('published_at', { ascending: false })
      .limit(50)

    if (error) { console.error('Index fetch error:', error); return [] }
    return (data as Post[]) ?? []
  } catch {
    return []
  }
}

export default async function HomePage() {
  const [top5, indexPosts] = await Promise.all([getTop5Posts(), getIndexPosts()])

  const lastFetched =
    indexPosts.length > 0 ? formatDistanceToNow(indexPosts[0].fetched_at) : null

  const hasContent = top5.length > 0 || indexPosts.length > 0

  return (
    <div className="mx-auto max-w-[760px]">
      {/* Hero SEO Section */}
      <section className="mb-12">
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Premier League News &amp; Transfer Gossip
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-gray-400">
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
          {/* Section 1: Today's Top 5 */}
          {top5.length > 0 && (
            <section className="mb-14" aria-labelledby="top5-heading">
              <div className="mb-6 flex items-center gap-3">
                <span
                  className="h-5 w-0.5 rounded-full"
                  style={{ backgroundColor: 'var(--brand-gold)' }}
                  aria-hidden="true"
                />
                <h2
                  id="top5-heading"
                  className="text-lg font-semibold tracking-tight text-white"
                >
                  Today&apos;s Top 5
                </h2>
                <span
                  className="rounded-full px-2 py-0.5 text-[11px] font-medium"
                  style={{
                    backgroundColor: 'var(--brand-gold)',
                    color: '#0a0a0a',
                  }}
                >
                  by score
                </span>
              </div>
              <div className="flex flex-col gap-8">
                {top5.map((post) => (
                  <StoryCard key={post.id} post={post} />
                ))}
              </div>
            </section>
          )}

          {/* Divider */}
          {top5.length > 0 && indexPosts.length > 0 && (
            <hr className="mb-14 border-[#222]" />
          )}

          {/* Section 2: PLHub Index Feed */}
          {indexPosts.length > 0 && (
            <section aria-labelledby="index-heading">
              <div className="mb-6 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span
                    className="h-5 w-0.5 rounded-full bg-[#333]"
                    aria-hidden="true"
                  />
                  <h2
                    id="index-heading"
                    className="text-lg font-semibold tracking-tight text-white"
                  >
                    Ranked by the PLHub Index
                  </h2>
                </div>
                {lastFetched && (
                  <p className="shrink-0 text-xs text-gray-400">
                    Updated {lastFetched}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-8">
                {indexPosts.map((post) => (
                  <StoryCard key={post.id} post={post} />
                ))}
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
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#333] py-20 text-center">
      <span className="text-5xl">⚽</span>
      <h3 className="mt-4 text-lg font-semibold text-gray-300">
        No stories yet
      </h3>
      <p className="mt-2 max-w-sm text-sm text-gray-400">
        News will appear here once the cron jobs have fetched the latest posts
        from Reddit and BBC Sport. Trigger{' '}
        <code className="rounded bg-[#222] px-1 py-0.5 text-xs">
          /api/cron/reddit
        </code>{' '}
        to populate.
      </p>
    </div>
  )
}
