'use client'

import { useState, useMemo } from 'react'
import { Post } from '@/types'
import FeedContainer from './FeedContainer'
import Top5Tabs from './Top5Tabs'

export default function FeedPage({
  initialPosts,
  totalCount,
  initialClub = null,
  top5Posts = [],
}: {
  initialPosts: Post[]
  totalCount: number
  initialClub?: string | null
  top5Posts?: Post[]
}) {
  const [clubFilter, setClubFilter] = useState<string | null>(initialClub || null)

  const filteredPosts = useMemo(() => {
    if (!clubFilter) return initialPosts

    return initialPosts.filter((post) => {
      const clubName = post.club_slug?.toLowerCase() || ''
      return clubName === clubFilter.toLowerCase()
    })
  }, [initialPosts, clubFilter])

  const filteredTop5 = useMemo(() => {
    if (!clubFilter) return top5Posts

    return top5Posts.filter((post) => {
      const clubName = post.club_slug?.toLowerCase() || ''
      return clubName === clubFilter.toLowerCase()
    })
  }, [top5Posts, clubFilter])

  const headingText = clubFilter
    ? `${clubFilter.replace('-', ' ').charAt(0).toUpperCase() + clubFilter.replace('-', ' ').slice(1)} Stories`
    : 'Ranked by the PLHub Index'

  return (
    <>
      {/* Club filter indicator */}
      {clubFilter && (
        <div className="mx-auto max-w-[1320px] px-4 py-4 flex items-center gap-2 text-sm text-gray-200">
          <span>
            Showing: <span className="font-semibold text-white capitalize">{clubFilter.replace('-', ' ')}</span>
          </span>
          <button
            onClick={() => setClubFilter(null)}
            className="ml-2 text-gray-400 hover:text-white transition-colors"
            title="Clear club filter"
          >
            ✕ Clear
          </button>
        </div>
      )}

      {/* Top 5 - only show when no club filter or club has posts */}
      {!clubFilter && filteredTop5.length > 0 && <Top5Tabs posts={filteredTop5} />}

      {/* Feed heading */}
      <div className="mb-6 mt-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <div className="w-1 h-6 bg-[#C4A23E] rounded-full"></div>
          {headingText}
        </h2>
        {!clubFilter && (
          <p className="text-sm text-gray-400 mt-1 ml-3">
            Stories ranked by source credibility, recency, and community engagement — not paid placement, ever.
          </p>
        )}
      </div>

      <FeedContainer
        initialPosts={filteredPosts}
        totalCount={filteredPosts.length}
      />
    </>
  )
}
