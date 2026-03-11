/**
 * Pure string-based card type detection.
 * No API calls, no async — runs on every ingest.
 * Deterministic patterns win except for 'lol' which Claude can detect better.
 */

export type CardType = 'story' | 'stat' | 'quote' | 'result' | 'lol' | 'rumour';

const RUMOUR_SOURCES = [
  'the sun', 'daily mirror', 'mirror', 'daily mail', 'mail online',
  'daily star', 'the star', 'calciomercato', 'fichajes', 'teamtalk',
  'football insider', 'givemesport'
];

const STAT_PATTERNS = [
  /\b\d+\s*(goals?|assists?|clean sheets?|wins?|losses?|defeats?|points?|minutes?|seasons?|years?|games?|matches?|appearances?|caps?|trophies?|titles?)\b/i,
  /\b(zero|no)\s+(goals?|wins?|defeats?|clean sheets?)\b/i,
  /\b(record|most|fewest|highest|lowest|fastest|slowest|first|last)\b.*\b\d+\b/i,
];

const QUOTE_PATTERNS = [
  /["""]/,
  /\b(says?|claims?|admits?|reveals?|confirms?|insists?|slams?|hits? out|opens? up)\b/i,
];

const RESULT_PATTERNS = [
  /\b\d+\s*[-–]\s*\d+\b/,
  /\b(win|wins|won|beat|beats|beaten|defeat|defeated|thrash|thrashed|hammer|hammered)\b/i,
  /\b(match report|player ratings|talking points|report:)\b/i,
];

const LOL_PATTERNS = [
  /\b(own goal|hit himself|scored against|bizarre|accidentally|somehow)\b/i,
];

const RUMOUR_LANGUAGE = [
  /\b(linked|could|set to|eyes|eyeing|targets?|considering|closing in|keen on|interested in|in talks?|nearing|approach)\b/i,
  /\b(rumour|rumored|rumoured|speculation|reportedly|report:|reports:|according to)\b/i,
  /\btransfer (news|update|latest|gossip)\b/i,
];

/**
 * Detect card type from title and source using pure string matching.
 * Fast, deterministic, no dependencies on external APIs.
 */
export function detectCardType(title: string, source: string): CardType {
  const sourceLower = source.toLowerCase();

  // Rumour detection: check both source and language patterns
  const isRumourSource = RUMOUR_SOURCES.some(s => sourceLower.includes(s));
  const hasRumourLanguage = RUMOUR_LANGUAGE.some(p => p.test(title));
  if (isRumourSource || hasRumourLanguage) return 'rumour';

  // Result: score line or match-related language
  if (RESULT_PATTERNS.some(p => p.test(title))) return 'result';

  // Quote: quotation marks or quote attribution verbs
  if (QUOTE_PATTERNS.some(p => p.test(title))) return 'quote';

  // Stat: numeric data with context
  if (STAT_PATTERNS.some(p => p.test(title))) return 'stat';

  // LOL: absurd or comedic situations (harder to detect — Claude helps here)
  if (LOL_PATTERNS.some(p => p.test(title))) return 'lol';

  // Default to story
  return 'story';
}
