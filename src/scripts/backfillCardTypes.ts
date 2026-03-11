#!/usr/bin/env node
/**
 * Backfill card_type for all existing posts where card_type IS NULL
 * Uses deterministic detection only — no Claude API calls
 * Run once from project root with: npx ts-node --project tsconfig.json src/scripts/backfillCardTypes.ts
 */

import { createServerClient } from '../lib/supabase'
import { detectCardType, type CardType } from '../lib/detectCardType'

const BATCH_SIZE = 50
const BATCH_DELAY_MS = 200

async function backfillCardTypes() {
  console.log('[Backfill] Starting card type detection for posts without card_type...')

  const supabase = createServerClient()
  let offset = 0
  let totalProcessed = 0
  const counts: Record<CardType, number> = {
    story: 0,
    stat: 0,
    quote: 0,
    result: 0,
    lol: 0,
    rumour: 0,
  }

  try {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      // Fetch batch of posts without card_type
      const { data: posts, error: fetchError } = await supabase
        .from('posts')
        .select('id, title, source')
        .is('card_type', null)
        .order('published_at', { ascending: false })
        .range(offset, offset + BATCH_SIZE - 1)

      if (fetchError) {
        console.error('[Backfill] Fetch error:', fetchError)
        break
      }

      if (!posts || posts.length === 0) {
        console.log('[Backfill] No more posts to process')
        break
      }

      // Detect card type for each post
      const updates = posts.map(post => ({
        id: post.id,
        card_type: detectCardType(post.title, post.source),
      }))

      // Update in batch
      for (const update of updates) {
        try {
          await supabase
            .from('posts')
            .update({ card_type: update.card_type })
            .eq('id', update.id)

          counts[update.card_type]++
          totalProcessed++

          if (totalProcessed % 50 === 0) {
            console.log(`[Backfill] Processed ${totalProcessed} posts...`)
          }
        } catch (updateErr) {
          console.error(`[Backfill] Failed to update post ${update.id}:`, updateErr)
        }
      }

      // Move to next batch
      offset += BATCH_SIZE

      // Delay between batches to avoid hammering the DB
      if (posts.length === BATCH_SIZE) {
        await new Promise(resolve => setTimeout(resolve, BATCH_DELAY_MS))
      }
    }

    // Final summary
    console.log('\n[Backfill] COMPLETE')
    console.log(`[Backfill] Total processed: ${totalProcessed}`)
    console.log('[Backfill] Breakdown by type:')
    Object.entries(counts).forEach(([type, count]) => {
      if (count > 0) {
        console.log(`  - ${type}: ${count}`)
      }
    })
  } catch (err) {
    console.error('[Backfill] Fatal error:', err)
    process.exit(1)
  }
}

backfillCardTypes()
