import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { CLUBS_BY_SLUG, CLUBS } from '@/lib/clubs'
import { Post } from '@/types'
import StoryCard from '@/components/StoryCard'
import Breadcrumb from '@/components/Breadcrumb'
import { formatDistanceToNow } from '@/lib/utils'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://plhub.co.uk'

interface PageProps {
  params: { slug: string }
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

async function getClubPosts(slug: string): Promise<Post[]> {
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
      .eq('club_slug', slug)
      .order('published_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error(`Failed to fetch posts for club ${slug}:`, error)
      return []
    }

    return (data as Post[]) ?? []
  } catch {
    return []
  }
}

export default async function ClubPage({ params }: PageProps) {
  const club = CLUBS_BY_SLUG[params.slug]
  if (!club) notFound()

  const posts = await getClubPosts(params.slug)
  const lastUpdated =
    posts.length > 0 ? formatDistanceToNow(posts[0].fetched_at) : null

  return (
    <>
      {/* Breadcrumb */}
      <div className="mb-6">
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
          background: `linear-gradient(135deg, ${club.primaryColor}33 0%, ${club.secondaryColor}22 100%)`,
          borderLeft: `4px solid ${club.primaryColor}`,
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
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-gray-400">
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
          <p className="mt-2 text-xs text-gray-500">
            Last updated {lastUpdated}
          </p>
        )}
      </section>

      {/* Posts Grid */}
      {posts.length === 0 ? (
        <EmptyState clubName={club.name} />
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

function EmptyState({ clubName }: { clubName: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#333] py-20 text-center">
      <span className="text-5xl">⚽</span>
      <h3 className="mt-4 text-lg font-semibold text-gray-300">
        No {clubName} stories yet
      </h3>
      <p className="mt-2 max-w-sm text-sm text-gray-500">
        {clubName} news will appear here once the cron jobs have run. Check back
        soon or trigger the cron manually.
      </p>
    </div>
  )
}
