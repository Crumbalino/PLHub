import type { Metadata } from 'next'
import ClubFilterBar from '@/components/ClubFilterBar'
import PLTable from '@/components/PLTable'
import NextFixtures from '@/components/NextFixtures'
import FeedList from '@/components/feed/FeedList'
import SnapshotContainer from '@/components/snapshot/SnapshotContainer'
import HomeContent from '@/components/HomeContent'

export const dynamic = 'force-dynamic'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://plhub.co.uk'

export const metadata: Metadata = {
  title: 'PLHub — Premier League News. Right Now.',
  description:
    'The pulse of the Premier League. News and views from all 20 clubs ranked by the community. Transfer rumours, match reports and fan discussion. Updated constantly.',
  alternates: {
    canonical: siteUrl,
  },
}

interface PageProps {
  searchParams: { club?: string }
}

export default async function HomePage({ searchParams }: PageProps) {
  const clubSlug = searchParams.club || null

  return (
    <div className="min-h-screen bg-transparent relative z-1">
      <HomeContent clubSlug={clubSlug} />
    </div>
  )
}
