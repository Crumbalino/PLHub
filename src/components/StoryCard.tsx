import Image from 'next/image'
import { Post } from '@/types'
import { CLUBS_BY_SLUG } from '@/lib/clubs'
import { formatDistanceToNow, decodeHtmlEntities } from '@/lib/utils'
import JsonLd from './JsonLd'

interface StoryCardProps {
  post: Post
}

const TRUSTED_SOURCES = new Set(['BBC Sport', 'Sky Sports', 'The Guardian'])

const SOURCE_LOGOS: Record<string, string> = {
  'BBC Sport':    'https://upload.wikimedia.org/wikipedia/commons/thumb/e/eb/BBC_Sport_2022.svg/240px-BBC_Sport_2022.svg.png',
  'Sky Sports':   'https://upload.wikimedia.org/wikipedia/en/thumb/a/a5/Sky_Sports_logo_2020.svg/240px-Sky_Sports_logo_2020.svg.png',
  'The Guardian': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/The_Guardian_2018.svg/240px-The_Guardian_2018.svg.png',
  'Reddit':       'https://www.redditstatic.com/desktop2x/img/favicon/android-icon-192x192.png',
}

function getSourceLogo(post: Post): string | null {
  if (post.source === 'reddit') return SOURCE_LOGOS['Reddit']
  if (post.subreddit && SOURCE_LOGOS[post.subreddit]) return SOURCE_LOGOS[post.subreddit]
  return null
}

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

export default function StoryCard({ post }: StoryCardProps) {
  const club = post.club_slug ? CLUBS_BY_SLUG[post.club_slug] : null
  const sourceName = post.source === 'reddit' ? 'Reddit' : (post.subreddit ?? 'RSS')
  const sourceLogo = getSourceLogo(post)

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
    <article className="flex gap-3 border-b border-white/[0.08] bg-[#152B2E] p-3 shadow-[0_2px_20px_rgba(245,200,66,0.07)] transition-colors hover:bg-[#1A3235] hover:shadow-[0_4px_24px_rgba(245,200,66,0.13)] sm:rounded-lg sm:border sm:border-white/8">
      <JsonLd data={articleSchema} />

      {/* Image — left side, fixed size */}
      {post.image_url && (
        <img
          src={post.image_url}
          alt=""
          className="h-20 w-24 shrink-0 rounded-lg object-cover"
          loading="lazy"
        />
      )}

      {/* Content — right side */}
      <div className="flex min-w-0 flex-1 flex-col justify-between gap-2">
        {/* Headline */}
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-white">
          <a
            href={post.url}
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-white"
          >
            {decodeHtmlEntities(post.title)}
          </a>
        </h3>

        {/* Meta: club + source + timestamp */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-white/60">
          {club && (
            <>
              <span className="flex h-4 w-4 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/10">
                <Image
                  src={club.badgeUrl}
                  alt={`${club.name} badge`}
                  width={14}
                  height={14}
                  unoptimized
                  className="object-contain"
                />
              </span>
              <span>{club.shortName}</span>
              <span aria-hidden="true">·</span>
            </>
          )}

          {sourceLogo && (
            <span className="flex h-4 w-4 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/10 p-0.5">
              <Image
                src={sourceLogo}
                alt={sourceName}
                width={12}
                height={12}
                unoptimized
                className="object-contain"
              />
            </span>
          )}
          <span>{sourceName}</span>

          <span aria-hidden="true">·</span>

          <time dateTime={post.published_at}>
            {formatDistanceToNow(post.published_at)}
          </time>
        </div>

        {/* Bottom row: score left, read more right */}
        <div className="flex items-center justify-between text-xs">
          <a
            href={post.url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-white transition-colors hover:text-white/80"
          >
            Read more →
          </a>
          <span className="font-semibold text-[#F5C842]">
            {post.score > 0 ? `${post.score.toLocaleString()}` : '—'}
          </span>
        </div>
      </div>
    </article>
  )
}
