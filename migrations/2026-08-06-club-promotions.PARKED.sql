-- ═══════════════════════════════════════════════════════════════════════════
-- ⛔ PARKED — DO NOT RUN. Blocked on values only a human can supply.
--
-- Promoted clubs (2026-27) + Burnley (2025-26 only)
-- Target: LIVE Supabase schema AFTER 2026-08-06-club-slug-rename.sql.
--
-- Every '#TODO' / 'TODO' below must be replaced before this can run. The guard
-- in section 3 aborts the transaction otherwise, so a half-populated club row
-- cannot reach the database. football-data.org cannot supply any of them:
--
--   primary_color / secondary_color   clubColors is free text -- 'Red / White',
--                                     'Sky Blue / White' -- never hex
--   subreddit                         not in football-data at all
--   badge_emoji                       not in football-data at all
--
-- Also needed, in src/config/clubs.ts and src/lib/clubs.ts rather than here:
--   manager       football-data returns coach: null for all four promoted clubs
--   apiSportsId   different provider entirely
--   stadium       present but 2022-vintage and WRONG for two of them --
--                 Coventry reads "St Andrew's Trillion Trophy Stadium", which
--                 is Birmingham City's ground from the 2019-21 groundshare, and
--                 Hull reads "Kingston Communications Stadium". Verify by hand.
--
-- Reliable from football-data (season id 2502, pulled 2026-08-06):
--   Sunderland    id 71    SUN  founded 1879  Stadium of Light
--   Hull City     id 322   HUL  founded 1904  (venue stale)
--   Leeds United  id 341   LEE  founded 1904  Elland Road
--   Coventry City id 1076  COV  founded 1883  (venue wrong)
--   Burnley       id 328   BUR  founded 1881  Turf Moor
--
-- Burnley are here rather than in the rename migration because they are in
-- neither the 2024-25 nor the 2026-27 Premier League -- they were in the
-- 2025-26 season only (football-data id 2403). Nothing else adds them, and
-- 2026-08-06-club-seasons.PARKED.sql needs the row for its 2025 seed to point
-- at. in_scope is false: they are in the Championship now.
--
-- A clubs row satisfies the foreign key and gives claims.from_club_slug a
-- target. It does NOT create /clubs/burnley -- that page comes from
-- src/config/clubs.ts. Whether an out-of-scope club gets a page at all is
-- issue #24.
--
-- Idempotent: safe to re-run once the placeholders are filled.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ───────────────────────────────────────────────────────────────────────────
-- 1. PROMOTED — 2026-27 Premier League, in scope
-- ───────────────────────────────────────────────────────────────────────────

INSERT INTO clubs (slug, name, subreddit, primary_color, secondary_color, badge_emoji, in_scope)
VALUES
  ('sunderland',    'Sunderland',    'TODO', '#TODO', '#TODO', 'TODO', true),
  ('hull-city',     'Hull City',     'TODO', '#TODO', '#TODO', 'TODO', true),
  ('leeds-united',  'Leeds United',  'TODO', '#TODO', '#TODO', 'TODO', true),
  ('coventry-city', 'Coventry City', 'TODO', '#TODO', '#TODO', 'TODO', true)
ON CONFLICT (slug) DO NOTHING;

-- ───────────────────────────────────────────────────────────────────────────
-- 2. BURNLEY — 2025-26 only, out of scope today
-- ───────────────────────────────────────────────────────────────────────────

INSERT INTO clubs (slug, name, subreddit, primary_color, secondary_color, badge_emoji, in_scope)
VALUES ('burnley', 'Burnley', 'TODO', '#TODO', '#TODO', 'TODO', false)
ON CONFLICT (slug) DO NOTHING;

-- ───────────────────────────────────────────────────────────────────────────
-- 3. REFUSE TO COMMIT PLACEHOLDERS
-- ───────────────────────────────────────────────────────────────────────────

DO $$
DECLARE n bigint;
BEGIN
  SELECT count(*) INTO n FROM clubs
   WHERE 'TODO' IN (subreddit, badge_emoji)
      OR primary_color = '#TODO' OR secondary_color = '#TODO';
  IF n > 0 THEN
    RAISE EXCEPTION
      '% club row(s) still carry TODO placeholders. Supply subreddit, colours '
      'and badge_emoji before running this migration.', n;
  END IF;
END $$;

COMMIT;

-- ═══════════════════════════════════════════════════════════════════════════
-- MATCHING CODE CHANGES — the SQL is half of this change
--   [ ] src/config/clubs.ts  four new entries (slug, name, shortName, code,
--       colours, competitions: ['PL'], founded, stadium, city, manager,
--       footballDataId, apiSportsId) -- otherwise /clubs/sunderland 404s
--   [ ] src/lib/clubs.ts     four new CLUBS entries (subreddit, colours,
--       badgeEmoji, badgeUrl), plus CLUB_CODES, CLUB_NICKNAMES and the regex
--       table at :303. Note :308 already matches /\bsunderland\b/.
--   [ ] src/lib/api-football/team-ids.ts, src/components/ClubFilterBar.tsx
--
-- POST-APPLY VERIFICATION
-- SELECT slug, in_scope FROM clubs ORDER BY in_scope DESC, slug;
-- -- expect 25 rows: 20 true, 5 false
-- --   (burnley, leicester, southampton, west-ham, wolves)
-- ═══════════════════════════════════════════════════════════════════════════
