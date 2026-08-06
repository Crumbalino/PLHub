-- ═══════════════════════════════════════════════════════════════════════════
-- ⛔ PARKED — DO NOT RUN. Blocked behind 2026-08-06-club-promotions.PARKED.sql,
--    which is itself blocked on hand-supplied colours, subreddits and emoji.
--
-- club_seasons — scope becomes temporal
--
-- RUN ORDER, all three required before this one will apply:
--   1. 2026-08-06-club-slug-rename.sql        seeds 'man-utd'
--   2. 2026-08-06-club-promotions.PARKED.sql  seeds 'sunderland', 'hull-city',
--                                             'leeds-united', 'coventry-city',
--                                             'burnley'
--   3. this file
-- The seed below references all six of those slugs. Run it earlier and every
-- insert violates the club_seasons -> clubs foreign key.
--
-- Why. clubs.in_scope is a boolean, so it can only describe one season, but
-- the ledger spans years. Ship Order step 3 -- "backfill 12-18 months of
-- resolved claims" -- crosses 2025-26 and 2026-27, two different Premier
-- League memberships. A January 2026 claim about Burnley was in scope when it
-- was made; Burnley are in the Championship now, and a current-season boolean
-- says it never was. Ipswich settles it: in for 2024-25, out for 2025-26, in
-- for 2026-27. No date range on clubs can express that. It needs a row per
-- club per season.
--
-- What this does NOT change: claims.in_scope is already the right shape. It is
-- NOT NULL, denormalised onto the claim and frozen at write time, so a claim
-- keeps the scope judgement it was made under. This migration only gives that
-- stamp a defensible basis -- "was either club in the Premier League in the
-- season containing the article's published_at" -- instead of a boolean that
-- was two seasons wrong.
--
-- Source: football-data.org, pulled 2026-08-06. Season ids 2287 (2024-25),
-- 2403 (2025-26), 2502 (2026-27). ?season= is honoured on this key, so the
-- table extends backwards for one request per season as the backfill window
-- grows. The seed rows below were GENERATED from those responses, not typed.
--
-- Idempotent throughout: safe to re-run.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ───────────────────────────────────────────────────────────────────────────
-- 1. THE TABLE
--
--    season_start_year is the calendar year the season BEGINS: 2026 means
--    2026-27. Unambiguous across the June-to-June boundary in a way a single
--    year label is not.
--
--    ON UPDATE CASCADE for the same reason as every other clubs FK: slug is a
--    natural key and has already been wrong twice.
-- ───────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS club_seasons (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_slug         varchar NOT NULL REFERENCES clubs(slug)
                      ON UPDATE CASCADE ON DELETE CASCADE,
  season_start_year integer NOT NULL,
  competition       text NOT NULL DEFAULT 'PL',
  created_at        timestamptz NOT NULL DEFAULT now(),

  -- One top-flight membership per club per season. A club cannot be in two
  -- leagues at once, so this is the natural key, not a convenience.
  CONSTRAINT club_seasons_unique UNIQUE (club_slug, season_start_year),
  CONSTRAINT club_seasons_year_sane CHECK (season_start_year BETWEEN 1992 AND 2100)
);

COMMENT ON TABLE club_seasons IS
  'Which clubs were in which competition in which season. The basis of the '
  'scope stamp: a claim is in scope when either club has a PL row for the '
  'season containing the article''s published_at. clubs.in_scope answers a '
  'different and much weaker question -- is this club in the PL right now.';

COMMENT ON COLUMN club_seasons.season_start_year IS
  'Calendar year the season begins. 2026 = the 2026-27 season, '
  'football-data season id 2502, 2026-08-21 to 2027-05-30.';

CREATE INDEX IF NOT EXISTS club_seasons_lookup_idx
  ON club_seasons (season_start_year, competition, club_slug);

-- ───────────────────────────────────────────────────────────────────────────
-- 2. SEED — 60 rows, 3 seasons, 25 distinct clubs
-- ───────────────────────────────────────────────────────────────────────────

INSERT INTO club_seasons (club_slug, season_start_year, competition) VALUES
  ('arsenal', 2024, 'PL'), ('aston-villa', 2024, 'PL'), ('bournemouth', 2024, 'PL'), ('brentford', 2024, 'PL'),
  ('brighton', 2024, 'PL'), ('chelsea', 2024, 'PL'), ('crystal-palace', 2024, 'PL'), ('everton', 2024, 'PL'),
  ('fulham', 2024, 'PL'), ('ipswich', 2024, 'PL'), ('leicester', 2024, 'PL'), ('liverpool', 2024, 'PL'),
  ('man-city', 2024, 'PL'), ('man-utd', 2024, 'PL'), ('newcastle', 2024, 'PL'), ('nottingham-forest', 2024, 'PL'),
  ('southampton', 2024, 'PL'), ('tottenham', 2024, 'PL'), ('west-ham', 2024, 'PL'), ('wolves', 2024, 'PL'),
  ('arsenal', 2025, 'PL'), ('aston-villa', 2025, 'PL'), ('bournemouth', 2025, 'PL'), ('brentford', 2025, 'PL'),
  ('brighton', 2025, 'PL'), ('burnley', 2025, 'PL'), ('chelsea', 2025, 'PL'), ('crystal-palace', 2025, 'PL'),
  ('everton', 2025, 'PL'), ('fulham', 2025, 'PL'), ('leeds-united', 2025, 'PL'), ('liverpool', 2025, 'PL'),
  ('man-city', 2025, 'PL'), ('man-utd', 2025, 'PL'), ('newcastle', 2025, 'PL'), ('nottingham-forest', 2025, 'PL'),
  ('sunderland', 2025, 'PL'), ('tottenham', 2025, 'PL'), ('west-ham', 2025, 'PL'), ('wolves', 2025, 'PL'),
  ('arsenal', 2026, 'PL'), ('aston-villa', 2026, 'PL'), ('bournemouth', 2026, 'PL'), ('brentford', 2026, 'PL'),
  ('brighton', 2026, 'PL'), ('chelsea', 2026, 'PL'), ('coventry-city', 2026, 'PL'), ('crystal-palace', 2026, 'PL'),
  ('everton', 2026, 'PL'), ('fulham', 2026, 'PL'), ('hull-city', 2026, 'PL'), ('ipswich', 2026, 'PL'),
  ('leeds-united', 2026, 'PL'), ('liverpool', 2026, 'PL'), ('man-city', 2026, 'PL'), ('man-utd', 2026, 'PL'),
  ('newcastle', 2026, 'PL'), ('nottingham-forest', 2026, 'PL'), ('sunderland', 2026, 'PL'), ('tottenham', 2026, 'PL')
ON CONFLICT (club_slug, season_start_year) DO NOTHING;

-- ───────────────────────────────────────────────────────────────────────────
-- 3. RLS AND GUARDS
--    Reference data: public reads it, nobody writes it but service_role.
-- ───────────────────────────────────────────────────────────────────────────

ALTER TABLE club_seasons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS club_seasons_public_read ON club_seasons;
CREATE POLICY club_seasons_public_read ON club_seasons FOR SELECT USING (true);

DO $$
DECLARE n bigint;
BEGIN
  FOR n IN SELECT season_start_year FROM club_seasons
            WHERE competition = 'PL' GROUP BY season_start_year
            HAVING count(*) <> 20
  LOOP
    RAISE EXCEPTION 'season % does not have exactly 20 Premier League clubs', n;
  END LOOP;
END $$;

COMMIT;

-- ═══════════════════════════════════════════════════════════════════════════
-- POST-APPLY VERIFICATION — read the database, not this file.
--
-- SELECT season_start_year, count(*) FROM club_seasons GROUP BY 1 ORDER BY 1;
-- -- expect 2024|20, 2025|20, 2026|20
--
-- SELECT count(DISTINCT club_slug) FROM club_seasons;   -- expect 25
--
-- -- Ipswich is the yo-yo case the boolean could not express:
-- SELECT season_start_year FROM club_seasons WHERE club_slug='ipswich' ORDER BY 1;
-- -- expect 2024, 2026 -- and NOT 2025
--
-- -- Burnley exists for 2025 only, and is out of scope today:
-- SELECT c.in_scope, s.season_start_year FROM clubs c
--   LEFT JOIN club_seasons s ON s.club_slug = c.slug WHERE c.slug='burnley';
-- -- expect in_scope false, season 2025
--
-- NEXT: nothing computes claims.in_scope from this yet. The extractor is
-- unwired, claims is empty, and the resolver does not exist. Wiring it is
-- "either side has a PL club_seasons row for the season containing
-- posts.published_at" -- one join, evaluated once, frozen into the claim.
-- ═══════════════════════════════════════════════════════════════════════════
