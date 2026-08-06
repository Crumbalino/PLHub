-- ═══════════════════════════════════════════════════════════════════════════
-- Club slug rename — man-united -> man-utd, and the relegated four flipped
-- Target: LIVE Supabase schema after 2026-08-06-claim-ledger.sql (applied).
--
-- Deliberately narrow. No new club rows, no placeholders, nothing to hand-
-- supply, so there is no path where this aborts halfway. Promoted clubs and
-- Burnley are split out into 2026-08-06-club-promotions.PARKED.sql, which is
-- blocked on colours, managers, subreddits and api-football ids that
-- football-data.org does not carry.
--
-- ⚠ SHIP WITH THE CODE CHANGES IN THE SAME DEPLOY.
--   posts.club_slug is a FOREIGN KEY to clubs.slug, and src/lib/clubs.ts maps
--   the r/reddevils subreddit to 'man-united' via CLUBS_BY_SUBREDDIT, which is
--   what src/lib/reddit.ts:45 writes into posts.club_slug -- the only writer of
--   that column in the codebase. Run the SQL without the code and the reddit
--   ingest writes a slug that no longer exists; every insert fails on the FK.
--   The reddit cron currently returns n=0, so this is a landmine rather than an
--   outage, but it is armed the moment anyone re-enables it.
--   Run this migration BEFORE merging the PR that deploys the code.
--
-- Why rename at all: /clubs/[slug] and sitemap.ts read src/config/clubs.ts,
-- which uses man-utd / spurs / nottm-forest, while the database and every
-- data-side module use man-united / tottenham / nottingham-forest. Verified
-- live 2026-08-06: /clubs/man-utd 200 and /clubs/man-united 404;
-- /clubs/spurs 200 and /clubs/tottenham 404; /clubs/nottm-forest 200 and
-- /clubs/nottingham-forest 404. claims.club_slug REFERENCES clubs(slug), so
-- the ledger would store exactly the three values that 404. Chosen on search
-- volume, not on which list wins: man-utd (225k/mo), tottenham (125k/mo,
-- 'spurs' collides with the NBA team), nottingham-forest. The site is
-- noindexed, so URL changes are free today and expensive later.
--
-- tottenham and nottingham-forest are ALREADY correct in the database. Those
-- two renames are a src/config/clubs.ts edit only -- there is no SQL for them.
-- Manchester United is the one case where the database moves.
--
-- Live facts this relies on (verified via PostgREST, 2026-08-06):
--   clubs            20 rows, all in_scope = true
--   posts.club_slug  498 non-null over 20 distinct slugs;
--                    'man-united' is 27 of them, NOT 498
--   posts.club_slug  IS a FOREIGN KEY to clubs.slug -- read from the PostgREST
--                    OpenAPI document, not assumed
--   claims / players / club_aliases  0 rows
--
-- Locking: ALTER TABLE posts takes ACCESS EXCLUSIVE and the RSS cron writes at
-- :00/:15/:30/:45. Run between those marks.
--
-- Idempotent: safe to re-run.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ───────────────────────────────────────────────────────────────────────────
-- 1. MAKE SLUG RENAMES SURVIVABLE
--
--    clubs.slug is a natural key and this is the second time it has been
--    wrong. Promotion and relegation guarantee a third. Every FK pointing at
--    it gets ON UPDATE CASCADE so a rename is one UPDATE rather than a
--    drop/rewrite/re-add cycle. Rebuilt from pg_get_constraintdef so existing
--    constraint names and ON DELETE clauses survive; skipped where CASCADE is
--    already present, which makes the block a no-op on re-run.
-- ───────────────────────────────────────────────────────────────────────────

DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT con.conname,
           con.conrelid::regclass::text AS tbl,
           pg_get_constraintdef(con.oid)  AS def
      FROM pg_constraint con
     WHERE con.contype = 'f'
       AND con.confrelid = 'clubs'::regclass
  LOOP
    IF position('ON UPDATE CASCADE' in r.def) = 0 THEN
      EXECUTE format('ALTER TABLE %s DROP CONSTRAINT %I', r.tbl, r.conname);
      EXECUTE format('ALTER TABLE %s ADD CONSTRAINT %I %s ON UPDATE CASCADE',
                     r.tbl, r.conname, r.def);
      RAISE NOTICE 'FK %.% now cascades on update', r.tbl, r.conname;
    END IF;
  END LOOP;
END $$;

-- ───────────────────────────────────────────────────────────────────────────
-- 2. RENAME man-united -> man-utd
--    The 27 posts rows follow via the cascade from section 1.
-- ───────────────────────────────────────────────────────────────────────────

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM clubs WHERE slug = 'man-united')
 AND EXISTS (SELECT 1 FROM clubs WHERE slug = 'man-utd') THEN
    RAISE EXCEPTION
      'Both man-united and man-utd exist. Merge them by hand: this migration '
      'renames, it does not deduplicate.';
  END IF;
END $$;

UPDATE clubs SET slug = 'man-utd' WHERE slug = 'man-united';

DO $$
DECLARE n bigint;
BEGIN
  SELECT count(*) INTO n FROM posts WHERE club_slug = 'man-united';
  IF n > 0 THEN
    RAISE EXCEPTION
      'ON UPDATE CASCADE did not fire: % posts rows still read man-united', n;
  END IF;
END $$;

-- ───────────────────────────────────────────────────────────────────────────
-- 3. RELEGATED — flipped, never deleted
--
--    The clubs table is the 2024-25 Premier League (football-data season id
--    2287). These four are not in the 2026-27 season (id 2502). Their rows
--    must survive: claims.from_club_slug needs a target, they hold 94 posts
--    between them (west-ham 26, wolves 24, southampton 23, leicester 21), and
--    their club pages are live.
--
--    The four PROMOTED clubs are not added here -- see the parked migration.
--    Until it runs, clubs holds 16 of the 20 current Premier League sides.
-- ───────────────────────────────────────────────────────────────────────────

UPDATE clubs SET in_scope = false
 WHERE slug IN ('leicester', 'southampton', 'west-ham', 'wolves');

-- ───────────────────────────────────────────────────────────────────────────
-- 4. DEMOTE in_scope TO WHAT IT ACTUALLY IS
-- ───────────────────────────────────────────────────────────────────────────

COMMENT ON COLUMN clubs.in_scope IS
  'True when the club is in the Premier League THIS season. A display and '
  'navigation convenience, nothing more. It is NOT the basis of the scope '
  'stamp on a claim: claims.in_scope is frozen at write time from the season '
  'the claim was published in, and a boolean cannot express that. Ipswich is '
  'the proof -- in for 2024-25, out for 2025-26, in for 2026-27. A per-season '
  'membership table is the fix. The previous comment on this column claimed '
  'club pages and sitemap.ts filter on it; verified 2026-08-06, nothing in '
  'src/ reads this column at all.';

COMMIT;

-- ═══════════════════════════════════════════════════════════════════════════
-- POST-APPLY VERIFICATION — read the database, not this file.
--
-- SELECT count(*) FROM clubs WHERE slug = 'man-utd';          -- expect 1
-- SELECT count(*) FROM clubs WHERE slug = 'man-united';       -- expect 0
-- SELECT count(*) FROM posts WHERE club_slug = 'man-utd';     -- expect 27
-- SELECT count(*) FROM posts WHERE club_slug = 'man-united';  -- expect 0
--
-- SELECT slug, in_scope FROM clubs ORDER BY in_scope DESC, slug;
-- -- expect 20 rows: 16 true, 4 false
-- --   (leicester, southampton, west-ham, wolves)
--
-- SELECT conrelid::regclass AS tbl, conname, pg_get_constraintdef(oid)
--   FROM pg_constraint WHERE contype = 'f' AND confrelid = 'clubs'::regclass
--   ORDER BY 1;
-- -- expect every row to end ON UPDATE CASCADE
--
-- Then, after the PR deploys, all three of these must return 200:
--   /clubs/man-utd  /clubs/tottenham  /clubs/nottingham-forest
-- ═══════════════════════════════════════════════════════════════════════════
