-- Rebuild PLHub Index with four-pillar scoring system
-- Run this in your Supabase SQL editor

-- Add score_significance column if it doesn't exist
-- (credibility, engagement, recency are calculated on-the-fly from post data)
ALTER TABLE posts
ADD COLUMN score_significance INTEGER DEFAULT 12;

-- Set default significance for posts that don't have one yet
UPDATE posts
SET score_significance = 12
WHERE score_significance IS NULL;
