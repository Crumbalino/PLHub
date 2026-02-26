'use client'

import { useRouter, useSearchParams } from 'next/navigation'

interface LoadMoreButtonProps {
  currentPage: number
  totalPages: number
  totalCount: number
  sortParam?: string
}

const POSTS_PER_PAGE = 50

export default function LoadMoreButton({
  currentPage,
  totalPages,
  totalCount,
  sortParam,
}: LoadMoreButtonProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  if (totalPages <= 1 || currentPage >= totalPages) return null

  const handleLoadMore = () => {
    const nextPage = currentPage + 1
    const params = new URLSearchParams(searchParams)
    if (sortParam) params.set('sort', sortParam)
    params.set('page', String(nextPage))
    const qs = params.toString()
    router.push(`/?${qs}`)
    // Smooth scroll to top after navigation
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const postsShowing = Math.min(currentPage * POSTS_PER_PAGE, totalCount)

  return (
    <div className="mt-12 flex flex-col items-center gap-4">
      <button
        onClick={handleLoadMore}
        className="rounded-xl bg-[#152B2E] px-6 py-3 text-white font-medium hover:bg-[#1A3235] transition-colors"
      >
        Load more stories
      </button>
      <span className="text-sm text-gray-400">
        Showing {postsShowing} of {totalCount} stories
      </span>
    </div>
  )
}
