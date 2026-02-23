import Image from 'next/image'
import { Post } from '@/types'
import { CLUBS_BY_SLUG } from '@/lib/clubs'
import { formatDistanceToNow, decodeHtmlEntities } from '@/lib/utils'
import JsonLd from './JsonLd'

interface StoryCardProps {
  post: Post
}

const TRUSTED_SOURCES = new Set(['BBC Sport', 'Sky Sports', 'The Guardian'])

type CredibilityTier = 'trusted' | 'community'

function getCredibilityTier(post: Post): CredibilityTier {
  if (
    post.source === 'rss' &&
    post.subreddit &&
    TRUSTED_SOURCES.has(post.subreddit)
  ) {
    return 'trusted'
  }
  return 'community'
}

function CredibilityBadge({ tier }: { tier: CredibilityTier }) {
  if (tier === 'trusted') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-[#C4A23E]/10 px-2 py-0.5 text-[11px] font-medium tracking-wide text-[#C4A23E]">
        <svg width="9" height="9" viewBox="0 0 9 9" fill="none" aria-hidden="true">
          <path
            d="M1.5 4.5L3.5 6.5L7.5 2.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Trusted Source
      </span>
    )
  }
  return (
    <span className="inline-flex items-center rounded-full bg-white/5 px-2 py-0.5 text-[11px] font-medium tracking-wide text-gray-500">
      Community
    </span>
  )
}

export default function StoryCard({ post }: StoryCardProps) {
  const club = post.club_slug ? CLUBS_BY_SLUG[post.club_slug] : null
  const credibilityTier = getCredibilityTier(post)
  const sourceName =
    post.source === 'reddit' ? 'Reddit' : (post.subreddit ?? 'RSS')

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: post.title,
    url: post.url,
    datePublished: post.published_at,
    author: post.author
      ? { '@type': 'Person', name: post.author }
      : undefined,
    publisher: {
      '@type': 'Organization',
      name: sourceName,
    },
  }

  return (
    <article className="flex flex-col gap-4 rounded-2xl bg-[#141414] p-6 transition-colors hover:bg-[#181818]">
      <JsonLd data={articleSchema} />

      {/* 1. HEADER ROW — club badge + short name + source + timestamp */}
      <div className="flex items-center gap-2 text-xs text-gray-400">
        {/* Club badge or generic ball */}
        {club ? (
          <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/10">
            <Image
              src={club.badgeUrl}
              alt={`${club.name} badge`}
              width={24}
              height={24}
              unoptimized
              className="object-contain"
            />
          </span>
        ) : (
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-base">
            ⚽
          </span>
        )}

        {/* Club short name */}
        {club && (
          <>
            <span className="font-medium text-gray-300">{club.shortName}</span>
            <span className="text-gray-600" aria-hidden="true">·</span>
          </>
        )}

        {/* Source */}
        <span>{sourceName}</span>

        <span className="text-gray-600" aria-hidden="true">·</span>

        {/* Timestamp */}
        <time dateTime={post.published_at}>
          {formatDistanceToNow(post.published_at)}
        </time>
      </div>

      {/* 2. HEADLINE — dominant element */}
      <h3 className="text-xl font-bold leading-snug text-white">
        <a
          href={post.url}
          target="_blank"
          rel="noopener noreferrer"
          className="transition-colors hover:text-gray-200"
        >
          {decodeHtmlEntities(post.title)}
        </a>
      </h3>

      {/* 3. AI SUMMARY — indented with teal left border */}
      {post.summary && (
        <div className="border-l-2 pl-4" style={{ borderColor: 'var(--brand-teal)' }}>
          <p className="text-sm leading-relaxed text-gray-300">
            {decodeHtmlEntities(post.summary)}
          </p>
        </div>
      )}

      {/* 4. CTA ROW */}
      <div>
        <a
          href={post.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-[#C4A23E] hover:underline"
        >
          {post.source === 'reddit' ? 'Read thread →' : 'Read article →'}
        </a>
      </div>

      {/* 5. TAGS ROW — credibility + club tag + upvotes, small and muted */}
      <div className="flex flex-wrap items-center gap-2">
        <CredibilityBadge tier={credibilityTier} />
        {club && (
          <span
            className="rounded-full px-2 py-0.5 text-[11px] font-medium"
            style={{
              backgroundColor: club.primaryColor + '18',
              color: club.primaryColor,
            }}
          >
            {club.shortName}
          </span>
        )}
        {post.source === 'reddit' && post.score > 0 && (
          <span className="flex items-center gap-1 text-[11px] text-gray-500">
            <span className="text-orange-400" aria-hidden="true">▲</span>
            {post.score.toLocaleString()}
          </span>
        )}
      </div>
    </article>
  )
}
