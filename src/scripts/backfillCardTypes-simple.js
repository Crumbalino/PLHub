#!/usr/bin/env node
/**
 * Backfill card_type for all posts using inline detection logic
 * Run with: node --env-file=.env.local src/scripts/backfillCardTypes-simple.js
 */

const { createClient } = require('@supabase/supabase-js');

const RUMOUR_DOMAINS = [
  'thesun', 'mirror', 'dailymail', 'mailonline', 'dailystar',
  'calciomercato', 'fichajes', 'teamtalk', 'footballinsider', 'givemesport',
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
  /\b(draw|drew|held|held to|rescues|rescue)\b/i,
  /\b(first.leg|second.leg|aggregate)\b/i,
];

const LOL_PATTERNS = [
  /\b(own goal|hit himself|scored against|bizarre|accidentally|somehow)\b/i,
];

const RUMOUR_LANGUAGE = [
  /\b(linked|could|set to|eyes|eyeing|targets?|considering|closing in|keen on|interested in|in talks?|nearing|approach)\b/i,
  /\b(rumour|rumored|rumoured|speculation|reportedly|report:|reports:|according to)\b/i,
  /\btransfer (news|update|latest|gossip)\b/i,
];

function extractDomain(url) {
  try { return new URL(url).hostname.replace('www.', '') } catch { return '' }
}

function detectCardType(title, url) {
  const domain = extractDomain(url);
  const isRumourSource = RUMOUR_DOMAINS.some(d => domain.includes(d));
  const hasRumourLanguage = RUMOUR_LANGUAGE.some(p => p.test(title));
  if (isRumourSource || hasRumourLanguage) return 'rumour';
  if (RESULT_PATTERNS.some(p => p.test(title))) return 'result';
  if (QUOTE_PATTERNS.some(p => p.test(title))) return 'quote';
  if (STAT_PATTERNS.some(p => p.test(title))) return 'stat';
  if (LOL_PATTERNS.some(p => p.test(title))) return 'lol';
  return 'story';
}

async function backfill() {
  console.log('[Backfill] Starting card type detection for all posts...');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  let offset = 0;
  let totalProcessed = 0;
  const counts = { story: 0, stat: 0, quote: 0, result: 0, lol: 0, rumour: 0 };

  try {
    while (true) {
      const { data: posts, error: fetchError } = await supabase
        .from('posts')
        .select('id, title, url')
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
        const cardType = detectCardType(post.title, post.url || '');
        try {
          await supabase.from('posts').update({ card_type: cardType }).eq('id', post.id);
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
      if (posts.length < 50) break;
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
    process.exit(0);
  } catch (err) {
    console.error('[Backfill] Fatal error:', err);
    process.exit(1);
  }
}

backfill();
