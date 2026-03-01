// ============================================================
// Multi-source detection library
// Groups related stories from different publishers by club/keyword overlap
// ============================================================

// PL clubs with all name variants
const PL_CLUBS: Record<string, string> = {
  // Arsenal
  'arsenal': 'arsenal',
  'the gunners': 'arsenal',

  // Aston Villa
  'aston villa': 'aston-villa',
  'villa': 'aston-villa',

  // Bournemouth
  'bournemouth': 'bournemouth',
  'afc bournemouth': 'bournemouth',

  // Brentford
  'brentford': 'brentford',
  'the bees': 'brentford',

  // Brighton
  'brighton': 'brighton',
  'brighton hove albion': 'brighton',
  'bhfc': 'brighton',

  // Chelsea
  'chelsea': 'chelsea',
  'the blues': 'chelsea',

  // Crystal Palace
  'crystal palace': 'crystal-palace',
  'palace': 'crystal-palace',
  'cpfc': 'crystal-palace',

  // Everton
  'everton': 'everton',
  'the toffees': 'everton',

  // Fulham
  'fulham': 'fulham',
  'cottagers': 'fulham',

  // Ipswich Town
  'ipswich': 'ipswich',
  'ipswich town': 'ipswich',
  'the tractor boys': 'ipswich',

  // Leicester City
  'leicester': 'leicester',
  'leicester city': 'leicester',
  'lcfc': 'leicester',

  // Liverpool
  'liverpool': 'liverpool',
  'the reds': 'liverpool',
  'lfc': 'liverpool',

  // Manchester City
  'manchester city': 'man-city',
  'man city': 'man-city',
  'city': 'man-city',
  'mcfc': 'man-city',

  // Manchester United
  'manchester united': 'man-united',
  'man united': 'man-united',
  'man utd': 'man-united',
  'united': 'man-united',
  'mufc': 'man-united',

  // Newcastle United
  'newcastle': 'newcastle',
  'newcastle united': 'newcastle',
  'the magpies': 'newcastle',
  'nufc': 'newcastle',

  // Nottingham Forest
  'nottingham forest': 'nottingham-forest',
  "nott'm forest": 'nottingham-forest',
  'forest': 'nottingham-forest',
  'nffc': 'nottingham-forest',

  // Southampton
  'southampton': 'southampton',
  'the saints': 'southampton',
  'sofc': 'southampton',

  // Tottenham Hotspur
  'tottenham': 'tottenham',
  'spurs': 'tottenham',
  'tottenham hotspur': 'tottenham',
  'thfc': 'tottenham',

  // West Ham United
  'west ham': 'west-ham',
  'west ham united': 'west-ham',
  'hammers': 'west-ham',
  'whufc': 'west-ham',

  // Wolverhampton Wanderers
  'wolves': 'wolves',
  'wolverhampton': 'wolves',
  'wolverhampton wanderers': 'wolves',
  'wwfc': 'wolves',
}

// Common stop words to exclude from keyword extraction
const STOP_WORDS = new Set([
  'premier', 'league', 'pl', 'football', 'news', 'report', 'breaking',
  'latest', 'update', 'live', 'match', 'game', 'player', 'manager',
  'transfer', 'injury', 'goal', 'win', 'lose', 'draw', 'score',
  'vs', 'v', 'final', 'score', 'result', 'reaction', 'highlights',
  'interview', 'exclusive', 'revealed', 'claims', 'says', 'slams',
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had',
  'do', 'does', 'did', 'will', 'would', 'should', 'could', 'may', 'might',
])

export interface StoryFingerprint {
  id: string
  title: string
  publisher: string // subreddit name
  clubs: string[]
  keywords: string[]
  publishedAt: string
  category?: string
}

/**
 * Extract club slugs from text.
 * Sorted by name length descending so longer variants match first.
 */
export function extractClubs(text: string): string[] {
  const lowerText = text.toLowerCase()
  const clubs = new Set<string>()

  // Sort by length descending to match longer variants first
  const sortedClubNames = Object.keys(PL_CLUBS).sort((a, b) => b.length - a.length)

  for (const clubName of sortedClubNames) {
    if (lowerText.includes(clubName)) {
      clubs.add(PL_CLUBS[clubName])
    }
  }

  return Array.from(clubs).sort()
}

/**
 * Extract significant keywords (3+ chars) after removing clubs and stop words.
 */
export function extractKeywords(text: string): string[] {
  // Remove club names
  let cleaned = text.toLowerCase()
  for (const clubName of Object.keys(PL_CLUBS)) {
    cleaned = cleaned.replace(new RegExp(`\\b${clubName}\\b`, 'g'), '')
  }

  // Split into words and filter
  const words = cleaned
    .split(/\W+/)
    .filter(w => w.length >= 3 && !STOP_WORDS.has(w))

  return [...new Set(words)].sort()
}

/**
 * Calculate similarity between two stories (0-1).
 * Requires at least one shared club.
 * Uses Jaccard similarity on keywords with bonuses for club/keyword overlap.
 */
export function calculateSimilarity(
  clubsA: string[],
  keywordsA: string[],
  clubsB: string[],
  keywordsB: string[]
): number {
  // Must share at least one club
  const sharedClubs = clubsA.filter(c => clubsB.includes(c))
  if (sharedClubs.length === 0) return 0

  // Jaccard similarity on keywords
  const allKeywords = new Set([...keywordsA, ...keywordsB])
  const sharedKeywords = keywordsA.filter(k => keywordsB.includes(k))

  let jaccard = allKeywords.size > 0 ? sharedKeywords.length / allKeywords.size : 0

  // Bonus: multiple shared clubs (+0.15)
  if (sharedClubs.length >= 2) jaccard += 0.15

  // Bonus: 3+ shared keywords (+0.1)
  if (sharedKeywords.length >= 3) jaccard += 0.1

  return Math.min(1, jaccard)
}

/**
 * Generate deterministic cluster ID from clubs and keywords.
 * Format: "club1+club2::keyword1+keyword2+keyword3"
 */
export function generateClusterId(clubs: string[], keywords: string[]): string {
  const clubPart = clubs.sort().join('+')
  const keywordPart = keywords.sort().slice(0, 3).join('+')
  return `${clubPart}::${keywordPart}`
}

/**
 * Group stories from DIFFERENT publishers with similarity >= threshold.
 * Returns Map of clusterId → array of post IDs.
 * Only creates clusters with 2+ posts from different publishers.
 */
export function detectClusters(
  stories: StoryFingerprint[],
  threshold: number = 0.35
): Map<string, string[]> {
  const clusters = new Map<string, Set<string>>()
  const storyMap = new Map(stories.map(s => [s.id, s]))

  // Compare each pair of stories
  for (let i = 0; i < stories.length; i++) {
    for (let j = i + 1; j < stories.length; j++) {
      const storyA = stories[i]
      const storyB = stories[j]

      // Skip if same publisher
      if (storyA.publisher === storyB.publisher) continue

      // Calculate similarity
      const similarity = calculateSimilarity(
        storyA.clubs,
        storyA.keywords,
        storyB.clubs,
        storyB.keywords
      )

      if (similarity >= threshold) {
        const clusterId = generateClusterId(
          [...new Set([...storyA.clubs, ...storyB.clubs])],
          [...new Set([...storyA.keywords, ...storyB.keywords])]
        )

        if (!clusters.has(clusterId)) {
          clusters.set(clusterId, new Set())
        }

        clusters.get(clusterId)!.add(storyA.id)
        clusters.get(clusterId)!.add(storyB.id)
      }
    }
  }

  // Filter: only clusters with 2+ posts from different publishers
  const result = new Map<string, string[]>()

  for (const [clusterId, postIds] of clusters) {
    if (postIds.size < 2) continue

    // Check if posts are from different publishers
    const publishers = new Set(
      Array.from(postIds).map(id => storyMap.get(id)?.publisher)
    )

    if (publishers.size >= 2) {
      result.set(clusterId, Array.from(postIds))
    }
  }

  return result
}
