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

export const revalidate = 300 // Revalidate every 5 minutes

async function getPosts(): Promise<Post[]> {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return []
  }

  try {
    const { data, error } = await supabase
      .from('posts')
      .select('*, clubs(*)')
      .order('published_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('Failed to fetch posts:', error)
      return []
    }

    return (data as Post[]) ?? []
  } catch {
    return []
  }
}

export default async function HomePage() {
  const posts = await getPosts()
  const lastUpdated =
    posts.length > 0 ? formatDistanceToNow(posts[0].fetched_at) : null

  return (
    <>
      {/* Hero SEO Section */}
      <section className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Premier League News &amp; Transfer Gossip
        </h1>
        <h2 className="mt-2 text-lg font-medium text-gray-400">
          Latest from Every Club
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-gray-500">
          {/* Placeholder copy */}
          PLHub aggregates the latest Premier League news, transfer rumours,
          match reports, and fan discussion from all 20 top-flight clubs. Our
          feeds pull from Reddit community posts and BBC Sport journalism,
          combined with AI-generated summaries so you can stay up to date at a
          glance. Covering Arsenal, Chelsea, Liverpool, Man City, and every club
          in between — your one-stop Premier League news hub.
        </p>
        {lastUpdated && (
          <p className="mt-2 text-xs text-gray-600">
            Last updated {lastUpdated}
          </p>
        )}
      </section>

      {/* Posts Grid */}
      {posts.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <StoryCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#333] py-20 text-center">
      <span className="text-5xl">⚽</span>
      <h3 className="mt-4 text-lg font-semibold text-gray-300">
        No stories yet
      </h3>
      <p className="mt-2 max-w-sm text-sm text-gray-500">
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
