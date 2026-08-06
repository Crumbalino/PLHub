// ============================================================
// GET /api/feed
//
// A thin wrapper over getFeed() in src/lib/feed.ts. The pipeline lives there
// so that server components can call it directly instead of fetching this
// route over HTTP — see the note at the top of that file.
//
// Query params:
//   sort  = pulse | hot | new       (default: pulse)
//   club  = arsenal | chelsea | ... (optional, filters to one club)
//   page  = 1, 2, 3 ...            (default: 1)
//   limit = 1-50                    (default: 20)
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { getFeed, DEFAULT_LIMIT } from '@/lib/feed'
import type { SortMode } from '@/lib/types'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const response = await getFeed({
      sort: (searchParams.get('sort') || 'pulse') as SortMode,
      club: searchParams.get('club') || null,
      page: parseInt(searchParams.get('page') || '1', 10),
      limit: parseInt(searchParams.get('limit') || String(DEFAULT_LIMIT), 10),
    })

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
      },
    })
  } catch (err: any) {
    // The score_significance column is the one that has actually been missing
    // in the past; keep the specific hint rather than a bare 500.
    if (err?.message?.includes('score_significance')) {
      console.error('[/api/feed] Missing score_significance column. See MIGRATION_GUIDE.md')
      return NextResponse.json(
        {
          error: 'Database setup incomplete',
          detail: 'The score_significance column is missing from the posts table',
          migration: 'Please run the SQL migration in MIGRATION_GUIDE.md',
        },
        { status: 500 },
      )
    }

    console.error('[/api/feed] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
