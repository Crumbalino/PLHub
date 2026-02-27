import type { Post } from './types'

export const PL_CLUBS = [
  'arsenal', 'aston villa', 'bournemouth', 'brentford', 'brighton', 'chelsea',
  'crystal palace', 'everton', 'fulham', 'ipswich', 'leicester', 'liverpool',
  'man city', 'manchester city', 'man utd', 'manchester united', 'newcastle',
  'nottingham forest', 'forest', 'southampton', 'spurs', 'tottenham',
  'west ham', 'wolves',
]

// ALWAYS blocked — even if a PL club is mentioned in the same article
export const ALWAYS_HIDE = [
  // Betting / gambling
  'super boost', 'bet365', 'betfair', 'paddy power', 'william hill', 'ladbrokes',
  'coral', 'skybet', 'sky bet', 'betway', 'unibet', 'betfred', '888sport',
  'price boost', 'enhanced odds', 'money back', 'betting tips', 'free bets',
  'odds boost', 'accumulator', 'best football bets', 'betting offer', 'bet £10',
  'get £', 'acca',
  // Darts
  'darts night', 'darts live', 'premier league darts',
  'darts', 'oche', 'stephen bunting', 'luke humphries', 'luke littler',
  // Boxing / MMA / combat
  'conor benn', 'tyson fury', 'undercard', 'fury-', 'born to fight', 'progais',
  'fight night', 'ring walk', 'dana white', 'usyk', 'canelo', 'weigh-in',
  'boxing', 'bout', 'ronda rousey', 'rousey comeback', 'farewell fight', 'trilogy fight',
  'mma', 'ufc',
  // Other sports
  't20 world cup', 'west indies cricket', 'south africa cricket', 'cricket', 'rugby',
  'nfl', 'nba', 'wnba', 'mlb', 'nhl', 'mls',
  'nascar', 'golf', 'tennis', 'mexico open',
  'quarterback', 'touchdown', 'super bowl',
  'katie taylor', 'tom brady', 'raiders', 'tua tagovailoa',
  'vegas', 'las vegas', 'nfl las vegas',
  // Saudi / non-PL leagues
  'nwsl', 'saudi pro league', 'al-nassr', 'al nassr', 'al nassar', 'al-fayha', 'al fayha',
  'al-hilal', 'al hilal', 'al-ittihad', 'al ittihad',
  'qatar league', 'al-sailiya',
  'ligue 1', 'serie a', 'la liga', 'eredivisie', 'liga nos',
  'bundesliga', 'segunda division', 'spanish second division',
  'conference league', 'europa conference',
  'fenerbahce', 'zrinjski', 'dortmund', 'borussia dortmund',
  'celtic', 'rangers', 'scottish',
  'championship goal', 'league one', 'league two', 'efl',
  'plymouth', 'charlton', 'almeria',
  // Streaming / broadcasting noise
  'nbc network', 'nbc shakeup', 'nbc revamp', 'beloved analyst',
  'singapore streaming', 'streaming service in singapore',
  'singapore', 'streaming service in', 'premflix',
  'screen all premier league', 'direct-to-consumer',
  // Misc noise even when PL club is mentioned
  'biggest loss in english football', 'greatest loss in english football',
  'biggest defeat in english football', 'record defeat in english football',
  'ronaldo buys', 'ronaldo live', 'al-fayha vs',
  'cameron trilogy', 'red bull chief', 'sprinkler pitch',
  'eric ramsay',
  'american football', 'champions league cash', 'world cup', 'carabao cup',
]

/**
 * Strict PL-only content filter.
 * - YouTube always passes (curated from PL-specific channels)
 * - ALWAYS_HIDE keywords block even if a PL club is mentioned
 * - Posts must mention a PL club to pass (strict PL-only mode)
 */
export function filterPLContent(posts: Post[]): Post[] {
  return posts.filter(post => {
    // Always show YouTube content (it's curated from PL-specific channels)
    if (post.source === 'youtube') return true

    const text = ((post.title || '') + ' ' + (post.summary || '') + ' ' + (post.content || '')).toLowerCase()

    // Block anything matching ALWAYS_HIDE — even if a PL club is mentioned
    if (ALWAYS_HIDE.some(kw => text.includes(kw))) return false

    // If a PL club is mentioned, keep it (we've already filtered the bad stuff above)
    const hasPLClub = PL_CLUBS.some(club => text.includes(club))
    if (hasPLClub) return true

    // No PL club mentioned — reject by default (strict PL-only mode)
    return false
  })
}

/**
 * Dedicated gambling/betting content filter
 * Checks for casino, sports betting, odds boosting, and affiliate promotion content
 */
export const GAMBLING_KEYWORDS = [
  'bet £', 'bet $',
  'free bet', 'free bets', 'freebet',
  'betting odds', 'betting tips', 'betting offer',
  'accumulator', 'acca',
  'odds boost', 'price boost', 'enhanced odds',
  'get £', 'get $', 'get free',
  'welcome offer', 'sign up offer', 'sign-up offer',
  'bet builder', 'betbuilder',
  'paddy power', 'betfair', 'bet365', 'william hill',
  'ladbrokes', 'coral', 'skybet', 'sky bet',
  'betway', 'unibet', '888sport', 'betfred',
  'tote', 'shot on target on tote',
  'enhanced odds', 'money back',
  'casino', 'slots', 'slot game',
  'gamble', 'gambling', 'gambler',
  'anytime scorer', 'first goalscorer',
  '2/1 to get a shot',
  'betting affiliates', 'smarkets',
  'super boost',
]

export function isGamblingContent(title: string, content?: string): boolean {
  const text = `${title} ${content || ''}`.toLowerCase()
  return GAMBLING_KEYWORDS.some(keyword => text.includes(keyword.toLowerCase()))
}

/**
 * Deduplicate posts by URL
 */
export function deduplicatePosts(posts: Post[]): Post[] {
  const seen = new Set<string>()
  return posts.filter(post => {
    if (!post.url) return true
    if (seen.has(post.url)) return false
    seen.add(post.url)
    return true
  })
}
