import { Post } from '@/types'
import { CLUBS_BY_SLUG } from '@/lib/clubs'
import { formatDistanceToNow } from '@/lib/utils'
import JsonLd from './JsonLd'

interface StoryCardProps {
  post: Post
}

export default function StoryCard({ post }: StoryCardProps) {
  const club = post.club_slug ? CLUBS_BY_SLUG[post.club_slug] : null
  const accentColor = club?.primaryColor ?? '#3DFF91'

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: post.title,
    url: post.url,
    datePublished: post.published_at,
    author: post.author
      ? {
          '@type': 'Person',
          name: post.author,
        }
      : undefined,
    publisher: {
      '@type': 'Organization',
      name: post.source === 'reddit' ? 'Reddit' : 'BBC Sport',
    },
  }

  return (
    <article
      className="relative flex flex-col gap-3 overflow-hidden rounded-xl bg-[#1a1a1a] p-4 transition-colors hover:bg-[#1f1f1f]"
      style={{ borderLeft: `3px solid ${accentColor}` }}
    >
      <JsonLd data={articleSchema} />

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          {club && (
            <span className="text-lg" aria-label={club.name}>
              {club.badgeEmoji}
            </span>
          )}
          <span
            className={`rounded px-2 py-0.5 text-xs font-semibold uppercase tracking-wide ${
              post.source === 'reddit'
                ? 'bg-orange-500/20 text-orange-400'
                : 'bg-blue-500/20 text-blue-400'
            }`}
          >
            {post.source === 'reddit' ? 'Reddit' : 'BBC Sport'}
          </span>
          {post.club_slug && club && (
            <span
              className="rounded px-2 py-0.5 text-xs font-medium"
              style={{
                backgroundColor: accentColor + '22',
                color: accentColor,
              }}
            >
              {club.name}
            </span>
          )}
        </div>
        <time
          dateTime={post.published_at}
          className="shrink-0 text-xs text-gray-500"
        >
          {formatDistanceToNow(post.published_at)}
        </time>
      </div>

      {/* Title */}
      <h3 className="text-sm font-semibold leading-snug text-white">
        <a
          href={post.url}
          target="_blank"
          rel="noopener noreferrer"
          className="transition-colors hover:text-gray-300"
        >
          {post.title}
        </a>
      </h3>

      {/* AI Summary */}
      {post.summary && (
        <p className="text-xs leading-relaxed text-gray-400">{post.summary}</p>
      )}

      {/* Footer */}
      <div className="mt-auto flex items-center justify-between text-xs text-gray-500">
        {post.source === 'reddit' && post.score > 0 && (
          <span className="flex items-center gap-1">
            <span className="text-orange-400">▲</span>
            {post.score.toLocaleString()} upvotes
          </span>
        )}
        {post.source === 'rss' && (
          <span>BBC Sport</span>
        )}
        <a
          href={post.url}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto transition-colors hover:text-white"
        >
          Read more →
        </a>
      </div>
    </article>
  )
}
