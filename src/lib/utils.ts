export function decodeHtmlEntities(text: string): string {
  if (!text) return ''
  return text
    .replace(/&#8216;/g, '\u2018')
    .replace(/&#8217;/g, '\u2019')
    .replace(/&#8220;/g, '\u201C')
    .replace(/&#8221;/g, '\u201D')
    .replace(/&#8211;/g, '\u2013')
    .replace(/&#8212;/g, '\u2014')
    .replace(/&#8230;/g, '\u2026')
    .replace(/&#39;/g, "'")
    .replace(/&#039;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&ndash;/g, '\u2013')
    .replace(/&mdash;/g, '\u2014')
    .replace(/&lsquo;/g, '\u2018')
    .replace(/&rsquo;/g, '\u2019')
    .replace(/&ldquo;/g, '\u201C')
    .replace(/&rdquo;/g, '\u201D')
    .replace(/&hellip;/g, '\u2026')
    .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
}

export function stripMarkdown(text: string): string {
  if (!text) return ''
  return text
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    .replace(/#{1,6}\s?/g, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^>\s?/gm, '')
    .replace(/^[-*+]\s/gm, '')
    .replace(/^\d+\.\s/gm, '')
    .trim()
}

export function formatDistanceToNow(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`

  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`

  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `${diffDays}d ago`

  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export function upgradeImageUrl(url: string | null | undefined): string | null | undefined {
  if (!url) return url

  // BBC: replace small crops with larger ones
  if (url.includes('bbc.co.uk') || url.includes('bbci.co.uk')) {
    url = url.replace(/\/\d+x\d+\.(jpg|png|webp)/i, '/976x549.$1')
    url = url.replace(/\/\d+\/cpsprodpb/i, '/800/cpsprodpb')
  }

  // Sky Sports: request larger image
  if (url.includes('skysports.com') || url.includes('skysports')) {
    url = url.replace(/width=\d+/i, 'width=800')
    url = url.replace(/height=\d+/i, 'height=450')
  }

  // Guardian: i.guim.co.uk — replace width parameter
  if (url.includes('guim.co.uk')) {
    url = url.replace(/width=\d+/i, 'width=800')
    url = url.replace(/\/\d+\.jpg/i, '/800.jpg')
  }

  // talkSPORT / News UK: replace crop sizes
  if (url.includes('talksport.com') || url.includes('talkSPORT')) {
    url = url.replace(/-\d+x\d+\.(jpg|png|webp)/i, '.$1')
  }

  // Generic WordPress: remove -WIDTHxHEIGHT from filename
  url = url.replace(/-\d{2,4}x\d{2,4}\.(jpg|jpeg|png|webp)/i, '.$1')

  // Reddit: use preview.redd.it instead of thumbs
  if (url.includes('thumbs.redd.it')) {
    url = url.replace('thumbs.redd.it', 'preview.redd.it')
  }
  // Reddit external previews: request larger size
  if (url.includes('preview.redd.it') && url.includes('width=')) {
    url = url.replace(/width=\d+/i, 'width=800')
  }

  // Generic: if URL has ?w= or ?width= parameter, increase it
  url = url.replace(/([?&])w=\d+/i, '$1w=800')
  url = url.replace(/([?&])width=\d+/i, '$1width=800')
  url = url.replace(/([?&])h=\d+/i, '$1h=450')
  url = url.replace(/([?&])quality=\d+/i, '$1quality=85')

  return url
}

export function calculateHotScore(post: any): number {
  const score = post.score || post.plhub_index || 0
  const publishedAt = new Date(post.published_at || post.created_at).getTime()
  const now = Date.now()
  const hoursAgo = Math.max(1, (now - publishedAt) / (1000 * 60 * 60))

  return score / Math.pow(hoursAgo, 1.5)
}

export function formatSummaryForDisplay(text: string): string {
  let cleaned = stripMarkdown(decodeHtmlEntities(text))

  const sentences = cleaned.split(/(?<=\.)\s+(?=[A-Z])/)
  const paragraphs: string[] = []
  for (let i = 0; i < sentences.length; i += 3) {
    paragraphs.push(sentences.slice(i, i + 3).join(' '))
  }

  return paragraphs.join('\n\n')
}
