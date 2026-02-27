import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { CLUBS_BY_SLUG, CLUBS } from '@/lib/clubs'
import FeedList from '@/components/feed/FeedList'
import JsonLd from '@/components/JsonLd'

export const dynamic = 'force-dynamic'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://plhub.co.uk'

/* ── Static params for all 20 clubs ── */
export async function generateStaticParams() {
  return CLUBS.map((club) => ({ slug: club.slug }))
}

/* ── Rich SEO metadata per club ── */
export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}): Promise<Metadata> {
  const club = CLUBS_BY_SLUG[params.slug]
  if (!club) return {}

  const title = `${club.name} News, Transfers & Rumours`
  const description = `The latest ${club.name} news, transfer rumours, match reports and fan discussion. AI-summarised from BBC Sport, Sky Sports, The Athletic, Reddit and YouTube. Updated constantly.`

  return {
    title,
    description,
    alternates: {
      canonical: `${siteUrl}/clubs/${params.slug}`,
    },
    openGraph: {
      title: `${club.name} News & Transfers | PLHub`,
      description: `Latest ${club.name} news ranked by the PLHub Index.`,
      url: `${siteUrl}/clubs/${params.slug}`,
      siteName: 'PLHub',
      locale: 'en_GB',
      type: 'website',
      images: [
        {
          url: club.badgeUrl,
          width: 200,
          height: 200,
          alt: `${club.name} badge`,
        },
      ],
    },
    twitter: {
      card: 'summary',
      title: `${club.name} News | PLHub`,
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
  const club = CLUBS_BY_SLUG[params.slug]
  if (!club) notFound()

  /* JSON-LD structured data for this club's page */
  const clubPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${club.name} News & Transfers`,
    description: `Latest ${club.name} Premier League news, transfer rumours and fan discussion.`,
    url: `${siteUrl}/clubs/${params.slug}`,
    isPartOf: {
      '@type': 'WebSite',
      name: 'PLHub',
      url: siteUrl,
    },
    about: {
      '@type': 'SportsTeam',
      name: club.name,
      sport: 'Football',
      memberOf: {
        '@type': 'SportsOrganization',
        name: 'Premier League',
      },
    },
  }

  /* Adjacent clubs for quick nav */
  const clubIndex = CLUBS.findIndex((c) => c.slug === params.slug)
  const prevClub = clubIndex > 0 ? CLUBS[clubIndex - 1] : null
  const nextClub = clubIndex < CLUBS.length - 1 ? CLUBS[clubIndex + 1] : null

  return (
    <>
      <JsonLd data={clubPageSchema} />

      <div className="min-h-screen bg-[#0B1F21]">
        <div className="max-w-3xl mx-auto px-4 pt-2">
          {/* Breadcrumb */}
          <nav className="text-sm text-white/50 mb-6" aria-label="Breadcrumb">
            <ol className="flex items-center gap-1.5">
              <li>
                <Link href="/" className="hover:text-white transition-colors">
                  PLHub
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                <Link href="/" className="hover:text-white transition-colors">
                  Clubs
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="text-white font-medium">{club.name}</li>
            </ol>
          </nav>

          {/* Club Hero */}
          <header className="flex items-center gap-4 mb-8 pb-6 border-b border-white/10">
            <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0">
              <Image
                src={club.badgeUrl}
                alt={`${club.name} badge`}
                width={80}
                height={80}
                unoptimized
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">
                {club.name}
              </h1>
              <p className="text-sm text-white/60 mt-1">
                News, transfers and fan discussion — ranked by the PLHub Index
              </p>
            </div>
          </header>

          {/* Quick club nav — prev/next */}
          <div className="flex items-center justify-between mb-6">
            {prevClub ? (
              <Link
                href={`/clubs/${prevClub.slug}`}
                className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors"
              >
                <span>←</span>
                <Image
                  src={prevClub.badgeUrl}
                  alt=""
                  width={20}
                  height={20}
                  unoptimized
                  className="object-contain"
                />
                <span className="hidden sm:inline">{prevClub.shortName}</span>
              </Link>
            ) : (
              <span />
            )}
            <Link
              href="/"
              className="text-xs text-white/40 hover:text-white/70 transition-colors"
            >
              All clubs
            </Link>
            {nextClub ? (
              <Link
                href={`/clubs/${nextClub.slug}`}
                className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors"
              >
                <span className="hidden sm:inline">{nextClub.shortName}</span>
                <Image
                  src={nextClub.badgeUrl}
                  alt=""
                  width={20}
                  height={20}
                  unoptimized
                  className="object-contain"
                />
                <span>→</span>
              </Link>
            ) : (
              <span />
            )}
          </div>

          {/* Feed — uses the same FeedList component as home, filtered by club */}
          <FeedList club={params.slug} />
        </div>
      </div>
    </>
  )
}
