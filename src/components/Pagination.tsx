import Link from 'next/link'

interface PaginationProps {
  currentPage: number
  totalPages: number
  basePath: string
  sortParam?: string
}

export default function Pagination({ currentPage, totalPages, basePath, sortParam }: PaginationProps) {
  if (totalPages <= 1) return null

  function pageHref(page: number) {
    const params = new URLSearchParams()
    if (sortParam) params.set('sort', sortParam)
    if (page > 1) params.set('page', String(page))
    const qs = params.toString()
    return qs ? `${basePath}?${qs}` : basePath
  }

  const hasPrev = currentPage > 1
  const hasNext = currentPage < totalPages

  const btnActive =
    'rounded-lg bg-white/5 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10 hover:text-white'
  const btnDisabled =
    'cursor-not-allowed rounded-lg bg-white/[0.03] px-4 py-2 text-sm font-medium text-white'

  return (
    <div className="mt-10 flex items-center justify-center gap-4">
      {hasPrev ? (
        <Link href={pageHref(currentPage - 1)} className={btnActive}>
          ← Previous
        </Link>
      ) : (
        <span className={btnDisabled}>← Previous</span>
      )}

      <span className="text-sm text-white">
        Page{' '}
        <span className="font-semibold text-white">{currentPage}</span>
        {' '}of{' '}
        <span className="text-white">{totalPages}</span>
      </span>

      {hasNext ? (
        <Link href={pageHref(currentPage + 1)} className={btnActive}>
          Next →
        </Link>
      ) : (
        <span className={btnDisabled}>Next →</span>
      )}
    </div>
  )
}
