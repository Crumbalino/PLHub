-- ═══════════════════════════════════════════════════════════════════════════
-- Player identity — resolution becomes a later pass, not a write gate
-- Target: LIVE Supabase schema as of 2026-08-06-claim-ledger.sql (applied).
--
-- Why this exists. The extractor produces a player NAME. Nothing in the repo
-- resolves a name to a players row -- verify-claim.ts is a containment test
-- against source text, not a resolution step, and grep finds no player_id
-- outside the DDL. claims.player_id NOT NULL therefore made the extractor
-- unwireable: it could verify a claim and still have nothing to write.
--
-- Measured 2026-08-06, against the 10 real claude-opus-5 claims in
-- src/lib/__fixtures__/live-extraction.ts and a 610-name Premier League squad
-- seed from football-data.org: the seed resolves 4 of 10 claims and 3 of the
-- 7 distinct people. Torres, Jiménez, Diomandé and Vinícius Júnior are all
-- absent, because the ledger's subject is players arriving from ABROAD -- the
-- ones a Premier League squad list definitionally does not contain.
--
-- So identity cannot gate the write. It becomes a later pass over rows that
-- are already recorded. This is the fee_raw/fee_amount pattern applied to the
-- player: the verbatim string is the evidence, the resolved entity is
-- convenience, and convenience is never allowed to discard evidence.
--
-- Live facts this migration relies on (verified via PostgREST, 2026-08-06):
--   claims          0 rows   -- every change below is free
--   players         0 rows
--   player_aliases  0 rows
--   claims.player_id is NOT NULL REFERENCES players(id)
--   player_aliases.alias carries a GLOBAL unique constraint
--
-- Locking: claims, players and player_aliases are all empty and nothing
-- writes them yet, so the ACCESS EXCLUSIVE locks here are uncontended. This
-- does NOT touch posts -- the RSS cron writing at :00/:15/:30/:45 is unaffected.
--
-- Idempotent throughout: safe to re-run. No CREATE POLICY IF NOT EXISTS.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────
-- 1. CLAIMS — the player becomes evidence first, an entity second
-- ─────────────────────────────────────────────────────────────────────────

-- Verbatim, exactly as the outlet printed it. This is the field the ledger
-- can always defend: it came from the article, and verify-claim.ts has already
-- proved it appears there. Never normalised, never corrected, never
-- overwritten when resolution later succeeds -- if player_raw and the resolved
-- players row disagree, that disagreement is data about the outlet.
ALTER TABLE claims ADD COLUMN IF NOT EXISTS player_raw text;

-- Enforced separately so re-runs after rows exist fail loudly instead of
-- aborting mid-transaction with a bare NOT NULL violation.
DO $$
DECLARE n bigint;
BEGIN
  SELECT count(*) INTO n FROM claims WHERE player_raw IS NULL;
  IF n > 0 THEN
    RAISE EXCEPTION
      'claims.player_raw is NULL on % row(s). Backfill before enforcing NOT NULL.', n;
  END IF;
END $$;

ALTER TABLE claims ALTER COLUMN player_raw SET NOT NULL;

-- verify-claim.ts already rejects an empty player_name with reason
-- 'empty_player_name'. This is the same rule stated where it cannot be
-- bypassed by a future writer that skips the verification pass.
DO $$ BEGIN
  ALTER TABLE claims ADD CONSTRAINT claims_player_raw_present
    CHECK (length(btrim(player_raw)) > 0);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- The resolved entity. Nullable: an unresolved claim is a recorded claim.
ALTER TABLE claims ALTER COLUMN player_id DROP NOT NULL;

COMMENT ON COLUMN claims.player_raw IS
  'The player name verbatim as printed, verified present in the article text. '
  'The evidence. player_id is the resolution of it and may be NULL; a claim is '
  'never dropped for want of a players row. Same relationship as fee_raw to '
  'fee_amount: raw is what was asserted, parsed is convenience.';

COMMENT ON COLUMN claims.player_id IS
  'NULL until the resolution pass runs. NULL means unresolved, never absent -- '
  'player_raw is NOT NULL, so the subject of every claim is always recorded.';

-- The work queue for the resolution pass. Mirrors posts_extract_pending_idx:
-- a partial index on the pending state makes a stalled resolver visible as a
-- growing count rather than an invisible backlog.
CREATE INDEX IF NOT EXISTS claims_unresolved_player_idx
  ON claims (created_at) WHERE player_id IS NULL;

-- Resolution-independent threading. claims_entity_idx leads on player_id,
-- which is now NULL for unresolved rows, so thread assignment before
-- resolution has to key on the raw string.
CREATE INDEX IF NOT EXISTS claims_player_raw_idx ON claims (player_raw);

-- ─────────────────────────────────────────────────────────────────────────
-- 2. PLAYER_ALIASES — ambiguity must be representable
--
--    The global UNIQUE on alias meant the first player to claim 'Silva',
--    'Rodrigo' or 'Fernandes' owned that string permanently, and every later
--    claim naming it resolved to the wrong person. Silently attributing one
--    journalist's claim to the wrong player corrupts the hit rate in a way
--    that leaving it unresolved does not. Measured on the 610-name seed: 32
--    surnames and 93 first names collide within the Premier League alone.
--
--    So the constraint stops deciding. An alias may map to several players;
--    the resolver sees the ambiguity and declines, and the claim stays
--    unresolved -- which section 1 now permits.
-- ─────────────────────────────────────────────────────────────────────────

-- Dropped by shape rather than by name: the constraint was created inline by
-- `alias text UNIQUE NOT NULL`, so its name is generated and must not be
-- assumed.
DO $$
DECLARE c text;
BEGIN
  SELECT con.conname INTO c
    FROM pg_constraint con
   WHERE con.conrelid = 'player_aliases'::regclass
     AND con.contype = 'u'
     AND (SELECT array_agg(att.attname ORDER BY att.attnum)
            FROM pg_attribute att
           WHERE att.attrelid = con.conrelid
             AND att.attnum = ANY (con.conkey)) = ARRAY['alias'];
  IF c IS NOT NULL THEN
    EXECUTE format('ALTER TABLE player_aliases DROP CONSTRAINT %I', c);
  END IF;
END $$;

-- One player may not carry the same alias twice; two players may share one.
DO $$ BEGIN
  ALTER TABLE player_aliases ADD CONSTRAINT player_aliases_player_alias_key
    UNIQUE (player_id, alias);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Lookup is now one-to-many, so the alias column needs its own index -- the
-- dropped UNIQUE was providing that incidentally.
CREATE INDEX IF NOT EXISTS player_aliases_alias_idx ON player_aliases (alias);

COMMENT ON COLUMN player_aliases.alias IS
  'Not globally unique. An alias may map to several players; ambiguity is data '
  'the resolver must see, not an error the constraint should prevent. Ambiguous '
  'aliases are derivable: SELECT alias FROM player_aliases GROUP BY alias '
  'HAVING count(DISTINCT player_id) > 1. Stored as printed; normalisation for '
  'matching happens in normalise() in src/lib/verify-claim.ts.';

-- ─────────────────────────────────────────────────────────────────────────
-- 3. PLAYERS — an identity key that is not the slug
--
--    slug was the only unique column, so 'zubimendi' and 'martin-zubimendi'
--    were two people and one player's ledger split in two. That split
--    corrupts the hit rate, which is the number the product exists to
--    publish. Free at 0 rows; a migration-with-backfill at any other time.
-- ─────────────────────────────────────────────────────────────────────────

ALTER TABLE players ADD COLUMN IF NOT EXISTS external_id text;

-- NULLs are unconstrained in a Postgres UNIQUE, so players created by the
-- extractor on first sight -- which is most of them, since the ledger's
-- subject is players outside the Premier League -- coexist freely.
DO $$ BEGIN
  ALTER TABLE players ADD CONSTRAINT players_external_id_key UNIQUE (external_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

COMMENT ON COLUMN players.external_id IS
  'Stable third-party identity, namespaced by provider: ''football-data:3189''. '
  'Text rather than integer so a second provider can be added without a type '
  'change. NULL for players created from article text alone. Verified '
  '2026-08-06: football-data returns 607 distinct ids over 610 squad entries, '
  'with no name carrying two ids -- the three repeats are one person listed in '
  'two squads under one id, which is stale squad data, not identity drift.';

COMMIT;

-- ═══════════════════════════════════════════════════════════════════════════
-- POST-APPLY VERIFICATION — run separately; do not trust the file, read the
-- database. Expected results in comments.
-- ═══════════════════════════════════════════════════════════════════════════
--
-- -- claims.player_id nullable, claims.player_raw NOT NULL:
-- SELECT column_name, is_nullable FROM information_schema.columns
--  WHERE table_name = 'claims' AND column_name IN ('player_id','player_raw');
-- -- expect: player_id YES, player_raw NO
--
-- -- exactly one unique constraint on player_aliases, over (player_id, alias):
-- SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint
--  WHERE conrelid = 'player_aliases'::regclass AND contype = 'u';
-- -- expect: one row, UNIQUE (player_id, alias)
--
-- -- players.external_id present and unique:
-- SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint
--  WHERE conrelid = 'players'::regclass AND contype = 'u';
-- -- expect: players_slug_key UNIQUE (slug) AND players_external_id_key UNIQUE (external_id)
--
-- -- both new indexes exist:
-- SELECT indexname FROM pg_indexes WHERE tablename IN ('claims','player_aliases')
--   AND indexname IN ('claims_unresolved_player_idx','claims_player_raw_idx',
--                     'player_aliases_alias_idx');
-- -- expect: 3 rows
