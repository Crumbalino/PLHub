-- PLGossip Supabase Schema Migration
-- Run this in your Supabase SQL editor

-- clubs table (seeded once)
CREATE TABLE IF NOT EXISTS clubs (
  slug VARCHAR PRIMARY KEY,
  name VARCHAR NOT NULL,
  subreddit VARCHAR NOT NULL,
  primary_color VARCHAR NOT NULL,
  secondary_color VARCHAR NOT NULL,
  badge_emoji VARCHAR
);

-- posts table
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id VARCHAR UNIQUE NOT NULL,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  content TEXT,
  summary TEXT,
  source VARCHAR NOT NULL CHECK (source IN ('reddit', 'rss')),
  club_slug VARCHAR REFERENCES clubs(slug),
  author VARCHAR,
  score INTEGER DEFAULT 0,
  subreddit VARCHAR,
  image_url TEXT,
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS posts_club_slug_idx ON posts(club_slug);
CREATE INDEX IF NOT EXISTS posts_published_at_idx ON posts(published_at DESC);

-- Seed clubs data
INSERT INTO clubs (slug, name, subreddit, primary_color, secondary_color, badge_emoji) VALUES
  ('arsenal',           'Arsenal',         'Gunners',             '#EF0107', '#023474', '🔴'),
  ('aston-villa',       'Aston Villa',     'avfc',                '#670E36', '#95BFE5', '🟣'),
  ('brentford',         'Brentford',       'Brentford',           '#E30613', '#FFD700', '🐝'),
  ('brighton',          'Brighton',        'BrightonHoveAlbion',  '#0057B8', '#FFCD00', '🔵'),
  ('bournemouth',       'Bournemouth',     'AFCBournemouth',      '#DA291C', '#000000', '🍒'),
  ('chelsea',           'Chelsea',         'chelseafc',           '#034694', '#DBA111', '💙'),
  ('crystal-palace',    'Crystal Palace',  'crystalpalace',       '#1B458F', '#C4122E', '🦅'),
  ('everton',           'Everton',         'Everton',             '#003399', '#FFFFFF', '💙'),
  ('fulham',            'Fulham',          'fulhamfc',            '#000000', '#FFFFFF', '⚫'),
  ('ipswich',           'Ipswich',         'ipswich',             '#0044AA', '#FFFFFF', '🔵'),
  ('leicester',         'Leicester',       'lcfc',                '#003090', '#FDBE11', '🦊'),
  ('liverpool',         'Liverpool',       'LiverpoolFC',         '#C8102E', '#00B2A9', '🔴'),
  ('man-city',          'Man City',        'MCFC',                '#6CABDD', '#1C2C5B', '🩵'),
  ('man-united',        'Man United',      'reddevils',           '#DA291C', '#FFE500', '👹'),
  ('newcastle',         'Newcastle',       'NUFC',                '#241F20', '#41B6E6', '⬛'),
  ('nottingham-forest', 'Nott''m Forest',  'nffc',                '#E53233', '#FFFFFF', '🌲'),
  ('southampton',       'Southampton',     'SaintsFC',            '#D71920', '#130C0E', '⚽'),
  ('tottenham',         'Tottenham',       'coys',                '#132257', '#FFFFFF', '🐓'),
  ('west-ham',          'West Ham',        'Hammers',             '#7A263A', '#1BB1E7', '⚒️'),
  ('wolves',            'Wolves',          'wolves',              '#FDB913', '#231F20', '🐺')
ON CONFLICT (slug) DO NOTHING;

-- Enable Row Level Security (optional but recommended)
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY IF NOT EXISTS "Public read posts" ON posts FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Public read clubs" ON clubs FOR SELECT USING (true);

-- Service role can do everything (used by cron routes)
CREATE POLICY IF NOT EXISTS "Service role all posts" ON posts
  FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY IF NOT EXISTS "Service role all clubs" ON clubs
  FOR ALL
  USING (auth.role() = 'service_role');

-- cron_logs table (logs for monitoring cron job health)
CREATE TABLE IF NOT EXISTS cron_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name VARCHAR NOT NULL,
  status VARCHAR NOT NULL CHECK (status IN ('success', 'error')),
  stories_processed INTEGER,
  error_message TEXT,
  execution_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS cron_logs_job_name_idx ON cron_logs(job_name);
CREATE INDEX IF NOT EXISTS cron_logs_created_at_idx ON cron_logs(created_at DESC);

-- Auto-delete logs older than 7 days
-- Note: This requires pg_cron extension. Run this separately if needed:
-- SELECT cron.schedule('delete-old-cron-logs', '0 0 * * *',
--   'DELETE FROM cron_logs WHERE created_at < NOW() - INTERVAL ''7 days''');

-- Enable RLS and allow service role to write logs
ALTER TABLE cron_logs ENABLE ROW LEVEL SECURITY;

-- Service role can read and write cron logs
CREATE POLICY IF NOT EXISTS "Service role all cron_logs" ON cron_logs
  FOR ALL
  USING (auth.role() = 'service_role');

-- Public can read cron logs (for monitoring dashboard)
CREATE POLICY IF NOT EXISTS "Public read cron_logs" ON cron_logs
  FOR SELECT
  USING (true);

-- ============================================================
-- Front-end redesign: card types and headlines
-- ============================================================

-- Add card_type column to posts (story|stat|quote|result|lol|rumour)
ALTER TABLE posts ADD COLUMN IF NOT EXISTS card_type VARCHAR DEFAULT 'story'
  CHECK (card_type IN ('story', 'stat', 'quote', 'result', 'lol', 'rumour'));

-- Add generated_headline column to posts
ALTER TABLE posts ADD COLUMN IF NOT EXISTS generated_headline TEXT;

-- silly_stats table — reward cards for milestones
CREATE TABLE IF NOT EXISTS silly_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stat_text TEXT NOT NULL,
  source VARCHAR,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  used_count INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS silly_stats_created_at_idx ON silly_stats(created_at DESC);

-- Enable RLS on silly_stats
ALTER TABLE silly_stats ENABLE ROW LEVEL SECURITY;

-- Public can read silly_stats
CREATE POLICY IF NOT EXISTS "Public read silly_stats" ON silly_stats
  FOR SELECT
  USING (true);

-- Service role can do everything with silly_stats
CREATE POLICY IF NOT EXISTS "Service role all silly_stats" ON silly_stats
  FOR ALL
  USING (auth.role() = 'service_role');
