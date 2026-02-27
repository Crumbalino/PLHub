-- Remove all talkSPORT articles from the database
-- talkSPORT articles have subreddit field set to 'talkSPORT'

DELETE FROM posts
WHERE source = 'rss' AND subreddit = 'talkSPORT';

-- Verify deletion
-- SELECT COUNT(*) FROM posts WHERE source = 'rss' AND subreddit = 'talkSPORT';
