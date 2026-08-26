-- ═══════════════════════════════════════════════════════════════════════════
-- Referee provenance, officials, appointments, KMI incidents
-- Target: LIVE Supabase schema as of 26 August 2026.
--
-- APPLIED 26 August 2026. The career coverage strings were corrected from
-- 2014/15 to 2000/01 afterwards — see
-- migrations/2026-08-26-referee-coverage-correction.sql, which is the statement
-- to run against a database that already has this one.
--
-- Re-read the live schema after applying rather than trusting this file —
-- migrations/, docs and CLAUDE.md have each been wrong about production before.
--
-- Order matters and is the order of the build brief: the provenance contract
-- exists before anything that would need it.
--
--   1. metric_definitions            what licenses a number to be rendered
--   2. match_officials               who the officials are
--   3. match_official_appointments   who did what in which match
--   4. kmi_incidents                 created empty, nothing writes to it
--
-- RLS is enabled on every table with no policies, which denies all access to
-- anon and authenticated while leaving the service role unaffected. These are
-- server-read tables; nothing in the browser touches them.
-- ═══════════════════════════════════════════════════════════════════════════


-- ───────────────────────────────────────────────────────────────────────────
-- 1. metric_definitions
--
-- ONE ROW PER DEFINITION, NOT PER VALUE. Every official's cards-per-game
-- inherits the single 'referee.cards_per_game.season' row. Thirty-nine
-- officials produce one row here, not thirty-nine.
--
-- src/lib/provenance.ts holds the same rows as a compile-time copy, so the
-- runtime check needs no database round trip and an unapplied migration cannot
-- defeat it. This table is the durable, queryable record. The two must agree;
-- the contract test asserts the keys match.
-- ───────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS metric_definitions (
  metric_key       TEXT PRIMARY KEY,
  source_name      TEXT        NOT NULL,
  source_url       TEXT        NOT NULL,
  -- How the number is produced, in terms a reader could reproduce.
  formula          TEXT        NOT NULL,
  -- Stated in full. A career figure that starts in 2000/01 says so here.
  coverage_period  TEXT        NOT NULL,
  -- False for a figure read straight from the source, true for one we derive.
  calculated       BOOLEAN     NOT NULL DEFAULT TRUE,
  last_refreshed   TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE metric_definitions ENABLE ROW LEVEL SECURITY;

INSERT INTO metric_definitions
  (metric_key, source_name, source_url, formula, coverage_period, calculated)
VALUES
  ('referee.matches.season', 'football-data.co.uk',
   'https://www.football-data.co.uk/englandm.php',
   'Count of rows in the E0 results file where Referee matches the official.',
   'Premier League, 2026/27', TRUE),

  ('referee.matches.career', 'football-data.co.uk',
   'https://www.football-data.co.uk/englandm.php',
   'Count of rows across all loaded E0 seasons where Referee matches the official.',
   'Premier League, 2000/01 to 2026/27', TRUE),

  ('referee.yellow_cards.season', 'football-data.co.uk',
   'https://www.football-data.co.uk/englandm.php',
   'Sum of HY + AY over the official’s matches.',
   'Premier League, 2026/27', TRUE),

  ('referee.yellow_cards.career', 'football-data.co.uk',
   'https://www.football-data.co.uk/englandm.php',
   'Sum of HY + AY over the official’s matches, all loaded seasons.',
   'Premier League, 2000/01 to 2026/27', TRUE),

  ('referee.red_cards.season', 'football-data.co.uk',
   'https://www.football-data.co.uk/englandm.php',
   'Sum of HR + AR over the official’s matches.',
   'Premier League, 2026/27', TRUE),

  ('referee.red_cards.career', 'football-data.co.uk',
   'https://www.football-data.co.uk/englandm.php',
   'Sum of HR + AR over the official’s matches, all loaded seasons.',
   'Premier League, 2000/01 to 2026/27', TRUE),

  ('referee.cards_per_game.season', 'football-data.co.uk',
   'https://www.football-data.co.uk/englandm.php',
   'Sum of HY + AY + HR + AR divided by matches refereed. A second yellow is counted by the source as both a yellow and a red, and is not deduplicated here.',
   'Premier League, 2026/27', TRUE),

  ('referee.cards_per_game.career', 'football-data.co.uk',
   'https://www.football-data.co.uk/englandm.php',
   'Sum of HY + AY + HR + AR divided by matches refereed, all loaded seasons. A second yellow is counted by the source as both a yellow and a red, and is not deduplicated here.',
   'Premier League, 2000/01 to 2026/27', TRUE),

  ('referee.club_record.career', 'football-data.co.uk',
   'https://www.football-data.co.uk/englandm.php',
   'Wins, draws and losses for one club in matches refereed by the official, from the FTR column, read from the club’s side.',
   'Premier League, 2000/01 to 2026/27', TRUE)
ON CONFLICT (metric_key) DO UPDATE SET
  source_name     = EXCLUDED.source_name,
  source_url      = EXCLUDED.source_url,
  formula         = EXCLUDED.formula,
  coverage_period = EXCLUDED.coverage_period,
  calculated      = EXCLUDED.calculated;


-- ───────────────────────────────────────────────────────────────────────────
-- 2. match_officials
--
-- NOT A HARD-CODED TWENTY. The 2026/27 Professional Referee Group is 39
-- officials across the Premier League and the Championship, and the number
-- moves within a season. Nothing here assumes a count.
--
-- `id` is the pulselive official id — stable, real, and already the key the
-- appointment feed uses. Not a surrogate, so appointments join without a
-- lookup table.
--
-- NO SEED ROWS. Officials are inserted from sources that name them: the
-- pulselive match detail feed, and the Referee column of football-data.co.uk.
-- Writing 39 names, associations and debut dates by hand would be inventing
-- biographical detail about real people, which is the one thing this codebase
-- will not do (THE_FOOTBALL_HUB §8).
--
-- fa_association and pl_debut are therefore NULLABLE AND CURRENTLY NULL. No
-- free source carries either. They are here because the block will want them,
-- not because they are populated.
-- ───────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS match_officials (
  -- pulselive official id.
  id          INTEGER PRIMARY KEY,
  -- Display name as the source gives it, e.g. 'Michael Oliver'.
  name        TEXT NOT NULL,
  first_name  TEXT,
  last_name   TEXT,
  -- County FA. No free source; null until entered by hand.
  fa_association TEXT,
  -- First Premier League appointment. No free source; null.
  pl_debut    DATE,
  -- On the current Professional Referee Group list.
  active      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- The join key to football-data.co.uk, which writes 'M Oliver' where pulselive
-- writes 'Michael Oliver'. Derived, not stored, so it cannot drift from name.
CREATE INDEX IF NOT EXISTS idx_match_officials_last_name ON match_officials (last_name);
CREATE INDEX IF NOT EXISTS idx_match_officials_active ON match_officials (active);

ALTER TABLE match_officials ENABLE ROW LEVEL SECURITY;


-- ───────────────────────────────────────────────────────────────────────────
-- 3. match_official_appointments
--
-- Populated from the pulselive match detail endpoint, which returns
-- matchOfficials with roles.
--
-- ROLE MAPPING, measured against live payloads on 26 August 2026:
--
--   pulselive            here
--   MAIN                 REFEREE
--   VAR                  VAR
--   ASSISTANT_VAR        AVAR
--   FOURTH_OFFICIAL      FOURTH_OFFICIAL
--   (role absent)        ASSISTANT_REFEREE
--
-- The last line is the fragile one. Assistant referees are identified by the
-- ABSENCE of a role field, not by a value. If pulselive ever starts labelling
-- them, the mapper keeps working; if it starts omitting roles more widely,
-- everything unlabelled silently becomes an assistant. The adapter logs an
-- unknown role rather than guessing.
-- ───────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS match_official_appointments (
  id           BIGSERIAL PRIMARY KEY,
  -- pulselive match id.
  match_id     INTEGER NOT NULL,
  official_id  INTEGER NOT NULL REFERENCES match_officials (id) ON DELETE CASCADE,
  role         TEXT    NOT NULL CHECK (role IN (
                 'REFEREE',
                 'VAR',
                 'AVAR',
                 'FOURTH_OFFICIAL',
                 'ASSISTANT_REFEREE'
               )),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- One person holds one role in one match. Two assistants per match are two
  -- rows with different official_id, which this allows.
  UNIQUE (match_id, official_id, role)
);

CREATE INDEX IF NOT EXISTS idx_appointments_match ON match_official_appointments (match_id);
CREATE INDEX IF NOT EXISTS idx_appointments_official ON match_official_appointments (official_id);
CREATE INDEX IF NOT EXISTS idx_appointments_role ON match_official_appointments (role);

ALTER TABLE match_official_appointments ENABLE ROW LEVEL SECURITY;


-- ───────────────────────────────────────────────────────────────────────────
-- 4. kmi_incidents
--
-- CREATED EMPTY. NOTHING WRITES TO IT. There is no parser and no ingestion,
-- because the first weekly publication has not appeared and a parser written
-- against an imagined format is worse than none.
--
-- Each incident carries its OWN source_url and source_published_at, unlike a
-- metric, because each incident has a distinct publication. It is not one
-- definition inherited by many values; it is many rows from many documents.
--
-- THE VERDICT ENUM IS DELIBERATE. The Premier League's own wording is that a
-- decision is adjudged correct or incorrect "in the opinion of the panel" —
-- five members, majority vote. PANEL_JUDGED_CORRECT and PANEL_JUDGED_INCORRECT
-- carry that attribution in the value itself, so no query, export or template
-- can render a bare "Correct" without deliberately stripping it out.
-- ───────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS kmi_incidents (
  id                  BIGSERIAL PRIMARY KEY,
  match_id            INTEGER,
  matchweek           INTEGER,
  date                DATE,
  -- Shirt-clock minute as published, e.g. '45+2'. Text, not integer.
  minute              TEXT,
  period              TEXT,
  incident_type       TEXT CHECK (incident_type IN (
                        'PENALTY',
                        'RED_CARD',
                        'SECOND_YELLOW',
                        'OFFSIDE',
                        'GOAL',
                        'HANDBALL',
                        'FOUL',
                        'OTHER'
                      )),
  club_involved       TEXT,
  player_involved     TEXT,
  referee_id          INTEGER REFERENCES match_officials (id) ON DELETE SET NULL,
  var_id              INTEGER REFERENCES match_officials (id) ON DELETE SET NULL,
  original_decision   TEXT,
  var_intervention    TEXT,
  final_decision      TEXT,
  kmi_verdict         TEXT CHECK (kmi_verdict IN (
                        'PANEL_JUDGED_CORRECT',
                        'PANEL_JUDGED_INCORRECT'
                      )),
  kmi_reason          TEXT,
  -- Per incident, not per metric. Each has its own publication.
  source_url          TEXT,
  source_published_at TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kmi_match ON kmi_incidents (match_id);
CREATE INDEX IF NOT EXISTS idx_kmi_referee ON kmi_incidents (referee_id);
CREATE INDEX IF NOT EXISTS idx_kmi_matchweek ON kmi_incidents (matchweek);

ALTER TABLE kmi_incidents ENABLE ROW LEVEL SECURITY;
