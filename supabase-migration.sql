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
