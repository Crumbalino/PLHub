-- Add summary_hook column to posts table
-- Run this in your Supabase SQL editor to add hook support

ALTER TABLE posts
ADD COLUMN summary_hook TEXT;

-- This allows storing teaser hooks for each story
-- The hook is a 4-6 word teaser that entices readers to expand and read the full summary
