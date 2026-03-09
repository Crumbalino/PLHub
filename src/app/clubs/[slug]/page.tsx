import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getClub, getAllClubSlugs } from '@/config/clubs'
import FeedList from '@/components/feed/FeedList'
import { JsonLd, sportsTeamSchema } from '@/components/JsonLd'

export const dynamic = 'force-dynamic'

/* ── Static params for all 20 clubs ── */
export async function generateStaticParams() {
  return getAllClubSlugs().map((slug) => ({ slug }))
}

/* ── Rich SEO metadata per club ── */
export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}): Promise<Metadata> {
  const club = getClub(params.slug)
  if (!club) return {}

  const baseUrl = 'https://pl-hub-webapp12.vercel.app'
  const title = `${club.name} News, Transfers & Rumours`
  const description = `The latest ${club.name} news, transfer rumours, match reports and fan discussion. Ranked by the PLHub Index. Updated constantly.`

  return {
    title,
    description,
    alternates: {
      canonical: `${baseUrl}/clubs/${params.slug}`,
    },
    openGraph: {
      title: `${club.name} News & Transfers | PLHub`,
      description: `Latest ${club.name} news ranked by the PLHub Index.`,
      url: `${baseUrl}/clubs/${params.slug}`,
      siteName: 'PLHub',
      locale: 'en_GB',
      type: 'website',
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
  const club = getClub(params.slug)
  if (!club) notFound()

  const baseUrl = 'https://pl-hub-webapp12.vercel.app'

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
                {club.name}
              </h1>
              <p className="text-sm text-[var(--plh-text-50)]">
                {club.code} • Founded {club.founded} • {club.city}
              </p>
              <p className="text-sm text-[var(--plh-text-70)] mt-2">
                Manager: <span className="text-[var(--plh-text-100)]">{club.manager}</span>
              </p>
              <p className="text-sm text-[var(--plh-text-50)] mt-2">
                Latest news, transfers and discussion — ranked by the PLHub Index
              </p>
            </div>
          </header>

          {/* Feed — filtered by club */}
          <FeedList club={params.slug} />
        </div>
      </div>
    </>
  )
}
