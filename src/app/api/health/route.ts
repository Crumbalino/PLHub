import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

interface Check {
  status: 'ok' | 'warning' | 'error'
  message?: string
  [key: string]: string | number | boolean | undefined
}

interface HealthResponse {
  status: 'ok' | 'error'
  checks: {
    latest_story: Check
    story_count_24h: Check
    ai_summaries: Check
    table_data: Check
    fixtures_data: Check
  }
  timestamp: string
}

async function getLatestStoryAge(): Promise<Check> {
  try {
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('posts')
      .select('published_at')
      .order('published_at', { ascending: false })
      .limit(1)
      .single()

    if (error || !data) {
      return {
        status: 'error',
        message: 'No stories found',
      }
    }

    const ageMs = Date.now() - new Date(data.published_at).getTime()
    const ageMinutes = Math.floor(ageMs / (1000 * 60))
    const ageHours = Math.floor(ageMinutes / 60)

    // Check: < 2 hours old
    if (ageMinutes > 120) {
      return {
        status: 'error',
        age_minutes: ageMinutes,
        message: `No stories in ${ageHours}+ hours`,
      }
    }

    return {
      status: 'ok',
      age_minutes: ageMinutes,
    }
  } catch (err) {
    return {
      status: 'error',
      message: `Error checking story age: ${err instanceof Error ? err.message : 'Unknown error'}`,
    }
  }
}

async function getStoryCount24h(): Promise<Check> {
  try {
    const supabase = createServerClient()
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

    const { count, error } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .gte('published_at', twentyFourHoursAgo)

    if (error) {
      return {
        status: 'error',
        message: `Error: ${error.message}`,
      }
    }

    const storyCount = count ?? 0

    // Check: >= 10 stories
    if (storyCount < 10) {
      return {
        status: 'warning',
        count: storyCount,
        message: `Low story count in last 24h: ${storyCount}`,
      }
    }

    return {
      status: 'ok',
      count: storyCount,
    }
  } catch (err) {
    return {
      status: 'error',
      message: `Error counting stories: ${err instanceof Error ? err.message : 'Unknown error'}`,
    }
  }
}

async function getAISummaryCoverage(): Promise<Check> {
  try {
    const supabase = createServerClient()
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

    // Total stories in 24h
    const { count: totalCount } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .gte('published_at', twentyFourHoursAgo)

    // Stories with summaries in 24h
    const { count: summaryCount } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .gte('published_at', twentyFourHoursAgo)
      .not('summary', 'is', null)

    const total = totalCount ?? 0
    const withSummary = summaryCount ?? 0
    const coverage = total === 0 ? 0 : Math.floor((withSummary / total) * 100)

    // Check: >= 50% coverage
    if (coverage < 50) {
      return {
        status: 'warning',
        coverage: `${coverage}%`,
        message: `Low summary coverage: ${coverage}%`,
      }
    }

    return {
      status: 'ok',
      coverage: `${coverage}%`,
    }
  } catch (err) {
    return {
      status: 'error',
      message: `Error checking summaries: ${err instanceof Error ? err.message : 'Unknown error'}`,
    }
  }
}

async function getTableDataAge(): Promise<Check> {
  try {
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('api_cache')
      .select('cached_at')
      .ilike('cache_key', 'standings:%')
      .order('cached_at', { ascending: false })
      .limit(1)
      .single()

    if (error || !data) {
      return {
        status: 'error',
        message: 'No standings data found',
      }
    }

    const ageMs = Date.now() - new Date(data.cached_at).getTime()
    const ageHours = Math.floor(ageMs / (1000 * 60 * 60))

    // Check: < 24 hours old
    if (ageHours > 24) {
      return {
        status: 'error',
        age_hours: ageHours,
        message: `Standings data is ${ageHours} hours old`,
      }
    }

    return {
      status: 'ok',
      age_hours: ageHours,
    }
  } catch (err) {
    return {
      status: 'error',
      message: `Error checking table data: ${err instanceof Error ? err.message : 'Unknown error'}`,
    }
  }
}

async function getFixturesDataAge(): Promise<Check> {
  try {
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('api_cache')
      .select('cached_at')
      .eq('cache_key', 'current_matchday:pl:2025')
      .single()

    if (error || !data) {
      return {
        status: 'error',
        message: 'No fixtures data found',
      }
    }

    const ageMs = Date.now() - new Date(data.cached_at).getTime()
    const ageHours = Math.floor(ageMs / (1000 * 60 * 60))

    // Check: < 24 hours old
    if (ageHours > 24) {
      return {
        status: 'error',
        age_hours: ageHours,
        message: `Fixtures data is ${ageHours} hours old`,
      }
    }

    return {
      status: 'ok',
      age_hours: ageHours,
    }
  } catch (err) {
    return {
      status: 'error',
      message: `Error checking fixtures data: ${err instanceof Error ? err.message : 'Unknown error'}`,
    }
  }
}

export async function GET(req: NextRequest): Promise<NextResponse<HealthResponse>> {
  try {
    const checks = await Promise.all([
      getLatestStoryAge(),
      getStoryCount24h(),
      getAISummaryCoverage(),
      getTableDataAge(),
      getFixturesDataAge(),
    ])

    const [latestStory, storyCount24h, aiSummaries, tableData, fixturesData] = checks

    // Determine overall status
    const overallStatus = checks.some((c) => c.status === 'error') ? 'error' : 'ok'
    const httpStatus = overallStatus === 'error' ? 503 : 200

    const response: HealthResponse = {
      status: overallStatus,
      checks: {
        latest_story: latestStory,
        story_count_24h: storyCount24h,
        ai_summaries: aiSummaries,
        table_data: tableData,
        fixtures_data: fixturesData,
      },
      timestamp: new Date().toISOString(),
    }

    return NextResponse.json(response, { status: httpStatus })
  } catch (err) {
    console.error('[Health check] Unexpected error:', err)

    const response: HealthResponse = {
      status: 'error',
      checks: {
        latest_story: { status: 'error', message: 'Health check failed' },
        story_count_24h: { status: 'error' },
        ai_summaries: { status: 'error' },
        table_data: { status: 'error' },
        fixtures_data: { status: 'error' },
      },
      timestamp: new Date().toISOString(),
    }

    return NextResponse.json(response, { status: 503 })
  }
}
