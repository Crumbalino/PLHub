-- ═══════════════════════════════════════════════════════════════════════════
-- Promoted clubs for 2026-27, plus Burnley
-- Target: LIVE Supabase schema after 2026-08-06-club-slug-rename.sql (applied).
--
-- Supersedes migrations/2026-08-06-club-promotions.PARKED.sql on the
-- chore/parked-migrations branch, which held TODO placeholders because
-- football-data.org carries no hex colours, no subreddit and no emoji. The
-- values below are owner-supplied and authoritative.
--
-- football-data.org is WRONG about two of these grounds and is not used:
--   Hull City      it returns "Kingston Communications Stadium" (2022 data)
--   Coventry City  it returns "St Andrew's Trillion Trophy Stadium", which is
--                  Birmingham City's ground from the 2019-21 groundshare
-- The venue values here are the owner's.
--
-- Burnley is in_scope = false: they were in the Premier League in 2025-26
-- only, and are in the Championship now. The row exists so claims can name
-- them as a from_club and so a per-season membership table has something to
-- point at.
--
-- THREE OF THESE FIVE HAVE A ROW BUT NO PAGE. Burnley, Hull City and Coventry
-- City are absent from src/config/clubs.ts, so /clubs/<slug> does not exist
-- for them and they are not in the sitemap or the homepage nav.
--
--   Burnley       Championship. The row is a foreign-key target for
--                 claims.from_club_slug, not a destination. It also disposes
--                 of the manager we do not have: no page, no hero, no wrong
--                 fact. Removed from the matcher too, so nothing is
--                 attributed to a club you cannot open.
--
--   Hull City     Promoted for 2026-27, so the Feb-Aug 2026 corpus barely
--   Coventry City covers them -- both were in the Championship for all of it.
--                 Measured before launch: 1 post and 6 posts. They stay IN
--                 the matcher so attribution accrues from the new season, and
--                 a config entry turns the page on later with content already
--                 behind it. A page with one post is not worth launching.
--
-- Live facts this relies on (verified 2026-08-07):
--   clubs           20 rows, 16 in_scope true
--   clubs.subreddit NOT NULL  <- changed below
--   posts.club_slug FK to clubs.slug, ON UPDATE CASCADE
--
-- Idempotent: safe to re-run.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ───────────────────────────────────────────────────────────────────────────
-- 1. subreddit BECOMES NULLABLE
--
--    None of these five clubs gets a subreddit. The column was NOT NULL, so
--    the only alternatives were inventing one or storing an empty string, and
--    both are lies that later code would read as data. NULL is the honest
--    representation of "we do not have one".
--
--    Nothing breaks: CLUBS_BY_SUBREDDIT is built in src/lib/clubs.ts from a
--    hardcoded list, not from this column, and the reddit cron is disabled.
-- ───────────────────────────────────────────────────────────────────────────

ALTER TABLE clubs ALTER COLUMN subreddit DROP NOT NULL;

COMMENT ON COLUMN clubs.subreddit IS
  'The club subreddit, where one is tracked. NULL means we do not have one -- '
  'never an empty string, which reads as a value.';

-- ───────────────────────────────────────────────────────────────────────────
-- 2. THE FIVE CLUBS
-- ───────────────────────────────────────────────────────────────────────────

INSERT INTO clubs (slug, name, subreddit, primary_color, secondary_color, badge_emoji, in_scope)
VALUES
  ('sunderland',    'Sunderland',    NULL, '#EB172B', '#FFFFFF', NULL, true),
  ('hull-city',     'Hull City',     NULL, '#F18A01', '#000000', NULL, true),
  ('leeds-united',  'Leeds United',  NULL, '#FFFFFF', '#1D428A', NULL, true),
  ('coventry-city', 'Coventry City', NULL, '#78D0F3', '#000000', NULL, true),
  ('burnley',       'Burnley',       NULL, '#6C1D45', '#99D6EA', NULL, false)
ON CONFLICT (slug) DO NOTHING;

-- ───────────────────────────────────────────────────────────────────────────
-- 3. GUARDS
-- ───────────────────────────────────────────────────────────────────────────

DO $$
DECLARE n bigint;
BEGIN
  SELECT count(*) INTO n FROM clubs
   WHERE slug IN ('sunderland','hull-city','leeds-united','coventry-city','burnley');
  IF n <> 5 THEN
    RAISE EXCEPTION 'expected all five new clubs to exist, found %', n;
  END IF;

  SELECT count(*) INTO n FROM clubs WHERE in_scope;
  IF n <> 20 THEN
    RAISE EXCEPTION
      'expected exactly 20 in_scope clubs after this migration, found %. '
      'The 2026-27 Premier League has 20 members.', n;
  END IF;
END $$;

COMMIT;

-- ═══════════════════════════════════════════════════════════════════════════
-- POST-APPLY VERIFICATION — read the database, not this file.
--
-- SELECT count(*) FROM clubs;                      -- expect 25
-- SELECT count(*) FROM clubs WHERE in_scope;       -- expect 20
-- SELECT slug, in_scope FROM clubs WHERE NOT in_scope ORDER BY slug;
-- -- expect burnley, leicester, southampton, west-ham, wolves
-- SELECT slug FROM clubs WHERE subreddit IS NULL ORDER BY slug;
-- -- expect the five added here
--
-- MATCHING CODE, in the same PR:
--   src/config/clubs.ts    five entries, or /clubs/sunderland 404s
--   src/lib/club-matcher.ts  NAMES and NICKNAMES, or the new pages classify
--                            nothing and render "No stories yet"
--   then re-run scripts/backfill-club-slug.ts to attribute existing posts
-- ═══════════════════════════════════════════════════════════════════════════
