-- ═══════════════════════════════════════════════════════════════════════════
-- Claim ledger — initial schema
-- Target: LIVE Supabase schema as introspected 2026-08-06.
--
-- Written to apply against the live database, NOT against migrations/.
-- Those files have drifted (add-api-football-tables.sql was never applied;
-- supabase-migration.sql contains `CREATE POLICY IF NOT EXISTS`, which is not
-- valid Postgres). Reconciling them is deliberately out of scope here.
--
-- Live facts this migration relies on:
--   clubs  PK = slug (character varying), 20 rows
--   posts  PK = id (uuid), 21 columns
--   outlets / sources / players / claims do not exist
--   RLS is enabled on existing tables; service_role bypasses it
--
-- Idempotent throughout: safe to re-run. No CREATE POLICY IF NOT EXISTS.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────
-- 1. ENUM TYPES
--    CREATE TYPE has no IF NOT EXISTS; guard with an exception block.
-- ─────────────────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE claim_type AS ENUM (
    'interest','bid_made','bid_rejected','bid_accepted','personal_terms_agreed',
    'medical_scheduled','medical_completed','deal_agreed','deal_off',
    'contract_extension','release_clause_activated','loan_agreed','exit_sought','other'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE resolution_state AS ENUM (
    'unresolved',    -- default; resolution window still open
    'confirmed',     -- happened as claimed
    'refuted',       -- a contradictory outcome occurred
    'expired',       -- window closed with no outcome. NOT failure.
    'superseded',    -- overtaken by a later claim in the same thread
    'unresolvable'   -- too vague to adjudicate; excluded from hit-rate denominator
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE origin_kind AS ENUM (
    'none',   -- the article states no origin
    'vague',  -- origin stated but unresolvable ('sources in Spain', 'report')
    'named'   -- origin resolves to a sources row
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─────────────────────────────────────────────────────────────────────────
-- 2. EXTEND EXISTING TABLES
-- ─────────────────────────────────────────────────────────────────────────

-- clubs: the existing 20 are all Premier League, so they must end up true;
-- every club added later (RB Leipzig, PSG…) must default false.
-- Adding the column with DEFAULT true backfills the existing rows in place,
-- then the default is flipped for future inserts. Re-running is a no-op.
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS in_scope boolean NOT NULL DEFAULT true;
ALTER TABLE clubs ALTER COLUMN in_scope SET DEFAULT false;

COMMENT ON COLUMN clubs.in_scope IS
  'True for Premier League clubs. Club pages and sitemap.ts filter on this, so '
  'non-PL clubs can exist as from_club without appearing on the site.';

CREATE TABLE IF NOT EXISTS outlets (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug       text UNIQUE NOT NULL,
  name       text NOT NULL,
  domain     text UNIQUE NOT NULL,
  tier       text CHECK (tier IN ('broadsheet','red_top','regional','broadcaster',
                                  'magazine','aggregator','wire','other')),
  paywalled  boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Sources are PEOPLE and are outlet-independent: journalists move between
-- outlets and a reputation earned at one title must follow them to the next.
CREATE TABLE IF NOT EXISTS sources (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug         text UNIQUE NOT NULL,
  display_name text NOT NULL,
  is_desk      boolean NOT NULL DEFAULT false,
  handle_x     text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

COMMENT ON COLUMN sources.is_desk IS
  'True for wire/desk bylines such as "ESPN News Services". Desks must not be '
  'averaged in with named journalists when scoring.';

CREATE TABLE IF NOT EXISTS source_affiliations (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id  uuid NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  outlet_id  uuid NOT NULL REFERENCES outlets(id) ON DELETE CASCADE,
  started_on date,
  ended_on   date,
  UNIQUE (source_id, outlet_id, started_on)
);

-- 'Exclusive by Nick Ames' / 'Nick Ames' / 'nick ames' all map to one source.
CREATE TABLE IF NOT EXISTS source_aliases (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id  uuid NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  raw_byline text UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS players (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug              text UNIQUE NOT NULL,
  display_name      text NOT NULL,
  current_club_slug varchar REFERENCES clubs(slug),
  created_at        timestamptz NOT NULL DEFAULT now()
);

-- Feeds the extractor's verification pass: 'Zubimendi' must resolve to
-- 'Martín Zubimendi' before a claim naming it can be accepted.
CREATE TABLE IF NOT EXISTS player_aliases (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  alias     text UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS club_aliases (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_slug varchar NOT NULL REFERENCES clubs(slug) ON DELETE CASCADE,
  alias     text UNIQUE NOT NULL
);

-- posts: extended rather than replaced. The 19,430 legacy rows keep
-- extract_status NULL, which honestly records that the extractor never ran.
ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS outlet_id        uuid REFERENCES outlets(id),
  ADD COLUMN IF NOT EXISTS byline_source_id uuid REFERENCES sources(id),
  ADD COLUMN IF NOT EXISTS byline_raw       text,
  ADD COLUMN IF NOT EXISTS byline_absent    boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS body             text,
  ADD COLUMN IF NOT EXISTS body_source      text NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS extract_status   text;

DO $$ BEGIN
  ALTER TABLE posts ADD CONSTRAINT posts_body_source_check
    CHECK (body_source IN ('none','rss_encoded','scraped'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE posts ADD CONSTRAINT posts_extract_status_check
    CHECK (extract_status IS NULL OR extract_status IN
           ('ok','no_claims','prefiltered','parse_failed','api_failed'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

COMMENT ON COLUMN posts.byline_absent IS
  'True when the feed carries no author element at all. BBC Sport and Sky '
  'Sports ship none, and they are the two highest-volume feeds, so "no byline" '
  'is a permanent state rather than a gap to be filled later.';

COMMENT ON COLUMN posts.extract_status IS
  'NULL means the extractor has never run on this row. Distinguishing that from '
  '''no_claims'' is what makes a dead extractor visible.';

CREATE INDEX IF NOT EXISTS posts_extract_pending_idx
  ON posts (published_at DESC) WHERE extract_status IS NULL;

-- ─────────────────────────────────────────────────────────────────────────
-- 3. CLAIMS
-- ─────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS claims (
  id       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id  uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,

  -- One assertion = one player + one club. "Chelsea and Spurs both want X"
  -- is two rows in two threads.
  player_id      uuid NOT NULL REFERENCES players(id),
  club_slug      varchar REFERENCES clubs(slug),
  from_club_slug varchar REFERENCES clubs(slug),
  direction      text NOT NULL DEFAULT 'in' CHECK (direction IN ('in','out')),
  type           claim_type NOT NULL,

  -- Denormalised: scope is a property of the CLAIM (which two clubs), not of
  -- either club alone, so it cannot be derived without joining both sides.
  in_scope boolean NOT NULL,

  -- A completed transfer reported as fact. EXPLICIT, never inferred from a
  -- null hedge -- inferring meaning from absence is the bug that produced the
  -- origin ambiguity below.
  is_completed_event boolean NOT NULL DEFAULT false,

  -- Verbatim. Never normalised. The wording IS the evidence.
  hedge_text text,
  claim_text text NOT NULL,

  -- Attributed origin: who the OUTLET says it heard from.
  origin           origin_kind NOT NULL DEFAULT 'none',
  origin_raw       text,
  origin_source_id uuid REFERENCES sources(id),
  is_self_reported boolean NOT NULL DEFAULT false,

  -- Specificity. *_raw is verbatim as printed, so the verification pass can
  -- confirm it with a substring test exactly as it does for hedge_text.
  -- The parsed columns are convenience only and are never the evidence.
  fee_raw        text,
  fee_amount     numeric,
  fee_currency   text,
  deadline_raw   text,
  stated_deadline date,

  -- Resolution: a batch job at transfer-window close, not a queue.
  state                  resolution_state NOT NULL DEFAULT 'unresolved',
  resolved_at            timestamptz,
  resolution_note        text,
  resolution_window_ends date,

  -- Spread. There is deliberately no is_origin column: "first" is an artefact
  -- of which feeds we ingest, so it is derived from thread order at query time.
  thread_id       uuid NOT NULL,
  echoes_claim_id uuid REFERENCES claims(id) ON DELETE SET NULL,

  -- Provenance of the extraction itself.
  extracted_by text NOT NULL,
  verified_at  timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT claims_club_side_present
    CHECK (club_slug IS NOT NULL OR from_club_slug IS NOT NULL),
  CONSTRAINT claims_clubs_differ
    CHECK (from_club_slug IS NULL OR club_slug IS NULL OR from_club_slug <> club_slug),
  CONSTRAINT claims_resolved_has_timestamp
    CHECK (state = 'unresolved' OR resolved_at IS NOT NULL),
  CONSTRAINT claims_origin_consistent CHECK (
    (origin = 'none'  AND origin_raw IS NULL     AND origin_source_id IS NULL) OR
    (origin = 'vague' AND origin_raw IS NOT NULL AND origin_source_id IS NULL) OR
    (origin = 'named' AND origin_raw IS NOT NULL AND origin_source_id IS NOT NULL)
  ),
  CONSTRAINT claims_no_self_echo CHECK (echoes_claim_id IS NULL OR echoes_claim_id <> id)
);

COMMENT ON COLUMN claims.thread_id IS
  'Clusters (player, club, type) where club is whichever side is non-null. '
  'Three outlets all saying Torres wants out of Barcelona share one thread -- '
  'that is corroboration. A destination appearing later starts a NEW thread, '
  'because "wants out" and "joining Arsenal" are different assertions.';

COMMENT ON COLUMN claims.in_scope IS
  'At least one side is a Premier League club. False rows are stored but '
  'filtered at display AND excluded from the published hit-rate denominator; '
  'the methodology is pre-registered and its scope is the Premier League.';

CREATE INDEX IF NOT EXISTS claims_thread_idx        ON claims (thread_id, created_at);
CREATE INDEX IF NOT EXISTS claims_entity_idx        ON claims (player_id, club_slug, type);
CREATE INDEX IF NOT EXISTS claims_post_idx          ON claims (post_id);
CREATE INDEX IF NOT EXISTS claims_unresolved_idx    ON claims (resolution_window_ends)
  WHERE state = 'unresolved';
CREATE INDEX IF NOT EXISTS claims_scored_idx        ON claims (in_scope, state)
  WHERE in_scope;

-- ─────────────────────────────────────────────────────────────────────────
-- 4. ROW LEVEL SECURITY
--    Existing tables have RLS on. Without it these are readable AND writable
--    through PostgREST with the anon key. service_role bypasses RLS, so the
--    ingest path is unaffected. Public gets SELECT only; no write policies.
-- ─────────────────────────────────────────────────────────────────────────

ALTER TABLE outlets             ENABLE ROW LEVEL SECURITY;
ALTER TABLE sources             ENABLE ROW LEVEL SECURITY;
ALTER TABLE source_affiliations ENABLE ROW LEVEL SECURITY;
ALTER TABLE source_aliases      ENABLE ROW LEVEL SECURITY;
ALTER TABLE players             ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_aliases      ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_aliases        ENABLE ROW LEVEL SECURITY;
ALTER TABLE claims              ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS outlets_public_read  ON outlets;
CREATE POLICY outlets_public_read  ON outlets  FOR SELECT USING (true);

DROP POLICY IF EXISTS sources_public_read  ON sources;
CREATE POLICY sources_public_read  ON sources  FOR SELECT USING (true);

DROP POLICY IF EXISTS players_public_read  ON players;
CREATE POLICY players_public_read  ON players  FOR SELECT USING (true);

-- Only in-scope claims are publicly readable. Out-of-scope rows are retained
-- for methodology review but are not part of the published ledger.
DROP POLICY IF EXISTS claims_public_read   ON claims;
CREATE POLICY claims_public_read   ON claims   FOR SELECT USING (in_scope);

-- Alias and affiliation tables are internal resolution machinery: no public
-- policy, so anon sees nothing and service_role still has full access.

-- ─────────────────────────────────────────────────────────────────────────
-- 5. SEED OUTLETS
--    The six feeds that actually produce rows, measured 2026-08-06.
--    Every one is currently unpaywalled -- the paywalled outlets that break
--    transfer stories (The Athletic, The Telegraph) are not in the pool.
-- ─────────────────────────────────────────────────────────────────────────

INSERT INTO outlets (slug, name, domain, tier, paywalled) VALUES
  ('bbc-sport',       'BBC Sport',       'bbc.co.uk',        'broadcaster', false),
  ('sky-sports',      'Sky Sports',      'skysports.com',    'broadcaster', false),
  ('the-guardian',    'The Guardian',    'theguardian.com',  'broadsheet',  false),
  ('espn-fc',         'ESPN FC',         'espn.com',         'broadcaster', false),
  ('fourfourtwo',     'FourFourTwo',     'fourfourtwo.com',  'magazine',    false),
  ('the-independent', 'The Independent', 'independent.co.uk','broadsheet',  false)
ON CONFLICT (slug) DO NOTHING;

-- No backfill of posts.outlet_id. Matching on posts.subreddit would rely on a
-- coincidental equality with a column that means something else, applied to
-- 19,430 legacy rows we are not enriching. They keep outlet_id NULL, which
-- extract_status IS NULL already records honestly. Structure only.

COMMIT;
