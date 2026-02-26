import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { calculateIndex } from '@/lib/plhub-index'
import { Post } from '@/types'
import { filterPLContent, deduplicatePosts } from '@/lib/content-filter'

const POSTS_PER_PAGE = 20

type SortOption = 'index' | 'hot' | 'new'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const sort = (searchParams.get('sort') || 'index') as SortOption
  const club = searchParams.get('club') || null

  const supabase = createServerClient()
  const offset = (page - 1) * POSTS_PER_PAGE

  // Fetch extra rows so we still have enough after strict filtering
  const fetchLimit = POSTS_PER_PAGE * 3

  let query = supabase
    .from('posts')
    .select('id, external_id, title, url, summary, content, source, club_slug, author, score, subreddit, image_url, fetched_at, published_at, clubs(*)', { count: 'exact' })

  if (club) {
    query = query.eq('club_slug', club)
  }

  if (sort === 'hot') {
    query = query
      .gte('published_at', new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString())
      .order('score', { ascending: false })
      .order('published_at', { ascending: false })
  } else if (sort === 'new') {
    query = query.order('published_at', { ascending: false })
  } else {
    query = query.order('published_at', { ascending: false })
  }

  const { data: posts, count, error } = await query.range(offset, offset + fetchLimit - 1)

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 })
  }

  const postsData = (posts as unknown as Post[]) || []

  // Apply the same strict PL-only filter used on the main page
  const filtered = deduplicatePosts(filterPLContent(postsData))

  // For index sort, sort client-side by calculated index
  if (sort === 'index') {
    filtered.sort((a, b) => calculateIndex(b) - calculateIndex(a))
  }

  // Return only POSTS_PER_PAGE items
  const pagedPosts = filtered.slice(0, POSTS_PER_PAGE)

  return NextResponse.json({
    posts: pagedPosts,
    total: count || 0,
    page,
    pageSize: POSTS_PER_PAGE,
  })
}
