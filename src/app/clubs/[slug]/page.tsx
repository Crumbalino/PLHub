import type { Metadata } from 'next'
import { SITE_URL } from '@/lib/site'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getClub, getAllClubSlugs } from '@/config/clubs'
import FeedList from '@/components/feed/FeedList'
import { JsonLd, sportsTeamSchema } from '@/components/JsonLd'
import { getFeed, emptyFeed } from '@/lib/feed'

export const dynamic = 'force-dynamic'

/* ── Static params for all 20 clubs ── */
export async function generateStaticParams() {
  return getAllClubSlugs().map((slug) => ({ slug }))
}

/**
 * The club's name as a reader would write it.
 *
 * config.name is the legal form ("Tottenham Hotspur Football Club") and
 * config.shortName is the nickname ("Spurs"), and neither is what people
 * search. Stripping the suffix gives "Tottenham Hotspur" — the term the slug
 * was chosen for. Derived rather than added as a config field so there is no
 * fourth club list to keep in sync.
 */
function displayName(name: string): string {
  return name.replace(/\s+Football Club$/, '')
}

/* ── Rich SEO metadata per club ── */
export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}): Promise<Metadata> {
  const club = getClub(params.slug)
  if (!club) return {}

  const baseUrl = SITE_URL
  const name = displayName(club.name)
  // The layout template appends " | The Football Hub".
  const title = `${name} Transfer News`
  // No score named here. The PLHub Index is deleted (DESIGN_SYSTEM §13) and this
  // description was reused in meta description, og:description,
  // twitter:description and the JSON-LD, so the claim appeared 8 times in the
  // HTML of all 22 club pages. Says only what the list is; makes no claim about
  // the order, because the order is not something the site stands behind.
  const description = `Transfer news and reporting about ${name}, gathered from published football coverage and updated through the day.`

  return {
    title,
    description,
    alternates: {
      canonical: `${baseUrl}/clubs/${params.slug}`,
    },
    openGraph: {
      title: `${name} Transfer News | The Football Hub`,
      description,
      url: `${baseUrl}/clubs/${params.slug}`,
      siteName: 'The Football Hub',
      locale: 'en_GB',
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title: `${name} Transfer News | The Football Hub`,
      description,
    },
  }
}

/* ── Club page ── */
export default async function ClubPage({
  params,
}: {
  params: { slug: string }
}) {
  const club = getClub(params.slug)
  if (!club) notFound()

  const baseUrl = SITE_URL

  // Page 1 is fetched HERE, on the server, so the posts are in the HTML a
  // crawler receives. getFeed() is called directly rather than through
  // /api/feed: a server component fetching its own API route is a second
  // request back into the same deployment, slower and able to fail on its own.
  // A database blip degrades to the empty state, which renders as real text.
  const initial = await getFeed({ club: params.slug, sort: 'pulse', page: 1, limit: 20 }).catch(
    (err) => {
      console.error(`[clubs/${params.slug}] feed failed:`, err)
      return emptyFeed()
    },
  )

  /* JSON-LD structured data for this club */
  const clubSchema = sportsTeamSchema(
    club.name,
    club.code,
    club.founded,
    club.city,
    club.stadium,
    club.manager
  )

  return (
    <>
      <JsonLd data={clubSchema} />

      <div className="min-h-screen bg-[var(--plh-bg)]">
        <div className="max-w-3xl mx-auto px-4 pt-2">
          {/* Breadcrumb */}
          <nav className="text-sm text-[var(--plh-text-50)] mb-6" aria-label="Breadcrumb">
            <ol className="flex items-center gap-1.5">
              <li>
                <Link href="/" className="hover:text-[var(--plh-text-100)] transition-colors">
                  PLHub
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                <Link href="/" className="hover:text-[var(--plh-text-100)] transition-colors">
                  Clubs
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="text-white font-medium text-[var(--plh-text-100)]">{club.name}</li>
            </ol>
          </nav>

          {/* Club Hero */}
          <header className="mb-8 pb-6 border-b border-[var(--plh-border)]">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-[var(--plh-text-100)] mb-2">
                {displayName(club.name)} Transfer News
              </h1>
              <p className="text-sm text-[var(--plh-text-50)]">
                {club.code} • Founded {club.founded} • {club.city}
              </p>
              <p className="text-sm text-[var(--plh-text-70)] mt-2">
                Manager: <span className="text-[var(--plh-text-100)]">{club.manager}</span>
              </p>
              <p className="text-sm text-[var(--plh-text-50)] mt-2">
                Transfer stories that mention {displayName(club.name)}, gathered
                from published football coverage
              </p>
            </div>
          </header>

          {/* Feed — filtered by club */}
          <FeedList
            club={params.slug}
            initialPosts={initial.posts}
            initialHasMore={initial.hasMore}
          />
        </div>
      </div>
    </>
  )
}
