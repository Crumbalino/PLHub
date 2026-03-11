#!/usr/bin/env node
/**
 * Backfill card_type for all existing posts where card_type IS NULL
 * Uses deterministic detection only — no Claude API calls
 * Run with: node src/scripts/backfillCardTypes.js
 */

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

const RUMOUR_LANGUAGE = [
  /\b(linked|could|set to|eyes|eyeing|targets?|considering|closing in|keen on|interested in|in talks?|nearing|approach)\b/i,
  /\b(rumour|rumored|rumoured|speculation|reportedly|report:|reports:|according to)\b/i,
  /\btransfer (news|update|latest|gossip)\b/i,
];

function detectCardType(title, source) {
  const sourceLower = source.toLowerCase();
  const isRumourSource = RUMOUR_SOURCES.some(s => sourceLower.includes(s));
  const hasRumourLanguage = RUMOUR_LANGUAGE.some(p => p.test(title));
  if (isRumourSource || hasRumourLanguage) return 'rumour';
  if (RESULT_PATTERNS.some(p => p.test(title))) return 'result';
  if (QUOTE_PATTERNS.some(p => p.test(title))) return 'quote';
  if (STAT_PATTERNS.some(p => p.test(title))) return 'stat';
  return 'story';
}

async function backfillCardTypes() {
  console.log('[Backfill] Starting card type detection...');

  // Lazy load Supabase client to avoid module issues
  const { createServerClient } = await import('../lib/supabase.ts');
  const supabase = createServerClient();

  let offset = 0;
  let totalProcessed = 0;
  const counts = {
    story: 0,
    stat: 0,
    quote: 0,
    result: 0,
    lol: 0,
    rumour: 0,
  };

  try {
    while (true) {
      const { data: posts, error: fetchError } = await supabase
        .from('posts')
        .select('id, title, source')
        .is('card_type', null)
        .order('published_at', { ascending: false })
        .range(offset, offset + 49);

      if (fetchError) {
        console.error('[Backfill] Fetch error:', fetchError);
        break;
      }

      if (!posts || posts.length === 0) {
        console.log('[Backfill] No more posts to process');
        break;
      }

      for (const post of posts) {
        const cardType = detectCardType(post.title, post.source);
        try {
          await supabase
            .from('posts')
            .update({ card_type: cardType })
            .eq('id', post.id);

          counts[cardType]++;
          totalProcessed++;

          if (totalProcessed % 50 === 0) {
            console.log(`[Backfill] Processed ${totalProcessed} posts...`);
          }
        } catch (updateErr) {
          console.error(`[Backfill] Failed to update post ${post.id}:`, updateErr);
        }
      }

      offset += 50;

      if (posts.length < 50) {
        break;
      }

      // Delay between batches
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    console.log('\n[Backfill] COMPLETE');
    console.log(`[Backfill] Total processed: ${totalProcessed}`);
    console.log('[Backfill] Breakdown by type:');
    Object.entries(counts).forEach(([type, count]) => {
      if (count > 0) {
        console.log(`  - ${type}: ${count}`);
      }
    });
  } catch (err) {
    console.error('[Backfill] Fatal error:', err);
    process.exit(1);
  }
}

backfillCardTypes();
