import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { decodeHtmlEntities } from '@/lib/formatting'

export const maxDuration = 10

const YOUTUBE_CHANNELS = [
  { id: 'UCGHiEMsKFaFdjJJudmXis0A', name: 'Adam Cleary', slug: 'adam-cleary' },
  { id: 'UCBkBMwHBOcGBTLMzBXuKkVA', name: 'HITC Sevens', slug: 'hitc-sevens' },
  { id: 'UCGYYNGmyhZ_kwBF_lqqXdAQ', name: 'Tifo Football', slug: 'tifo' },
  { id: 'UCEem4k3VKQHGfjSeMZJl4tA', name: 'The Overlap', slug: 'the-overlap' },
  { id: 'UC5d9SIoFGjGKLmshPLzlZfA', name: 'Sky Sports PL', slug: 'sky-sports-pl' },
  { id: 'UCNAf1k0yIjyGu3k9K8UHxbg', name: 'Football Daily', slug: 'football-daily' },
  { id: 'UCddiUEpeqJcYeBxX1IVBKvQ', name: 'The Premier League', slug: 'premier-league' },
  { id: 'UCKy1dAqELo0zrOtPkf0eTMw', name: '442oons', slug: '442oons' },
]

async function fetchYouTubeVideos(channelId: string, apiKey: string) {
  const url = new URL('https://www.googleapis.com/youtube/v3/search')
  url.searchParams.set('part', 'snippet')
  url.searchParams.set('channelId', channelId)
  url.searchParams.set('maxResults', '5')
  url.searchParams.set('order', 'date')
  url.searchParams.set('type', 'video')
  url.searchParams.set('key', apiKey)

  const res = await fetch(url.toString())
  if (!res.ok) return []

  const data = await res.json()
  return data.items || []
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  const youtubeApiKey = process.env.YOUTUBE_API_KEY

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!youtubeApiKey) {
    return NextResponse.json({ error: 'YOUTUBE_API_KEY not configured' }, { status: 500 })
  }

  try {
    const supabase = createServerClient()

    // Rotate one channel per run — spreads videos throughout the day
    // With 8 channels on a 15-min cron, each channel checked every ~2 hours
    const runIndex = Math.floor(Date.now() / (15 * 60 * 1000))
    const channelIndex = runIndex % YOUTUBE_CHANNELS.length
    const channel = YOUTUBE_CHANNELS[channelIndex]

    const videos = await fetchYouTubeVideos(channel.id, youtubeApiKey)

    let inserted = 0
    let skipped = 0
    let errors = 0

    for (const video of videos) {
      const videoId = video.id.videoId
      const url = `https://www.youtube.com/watch?v=${videoId}`

      const { data: existing } = await supabase
        .from('posts')
        .select('id')
        .eq('url', url)
        .single()

      if (existing) {
        skipped++
        continue
      }

      const { error } = await supabase.from('posts').insert({
        external_id: videoId,
        title: decodeHtmlEntities(video.snippet.title),
        url,
        source: 'youtube',
        author: channel.name,
        image_url: video.snippet.thumbnails?.high?.url || video.snippet.thumbnails?.default?.url,
        published_at: video.snippet.publishedAt,
        club_slug: null,
        content: video.snippet.description.substring(0, 500),
        summary: null,
        score: 30,
      })

      if (error) {
        console.error('Insert error for', url, error)
        errors++
      } else {
        inserted++
      }
    }

    return NextResponse.json({
      success: true,
      channel: channel.name,
      channelIndex,
      inserted,
      skipped,
      errors,
    })
  } catch (err) {
    console.error('YouTube cron error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
