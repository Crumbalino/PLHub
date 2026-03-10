/**
 * Article scraper — fetches the full article URL and extracts body text.
 * Returns up to 3000 characters of clean prose, or null on failure.
 * Used by the backfill-summaries cron before calling generateSummary.
 */
export async function scrapeArticle(url: string): Promise<string | null> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; PLHub/1.0; +https://plhub.co.uk)',
        'Accept': 'text/html,application/xhtml+xml',
      },
    })
    clearTimeout(timeout)

    if (!res.ok) return null

    const html = await res.text()

    // Extract text from <article> first, fall back to <main>, then <body>
    const articleMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i)
    const mainMatch = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i)
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)

    const raw = articleMatch?.[1] ?? mainMatch?.[1] ?? bodyMatch?.[1] ?? html

    // Strip all HTML tags
    const stripped = raw
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s{2,}/g, ' ')
      .trim()

    // Must have meaningful content
    if (stripped.length < 300) return null

    return stripped.slice(0, 3000)
  } catch {
    return null
  }
}
