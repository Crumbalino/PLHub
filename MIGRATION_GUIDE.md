# Database Migration Guide

## Required: Add score_significance Column

The feed API requires the `score_significance` column on the `posts` table. This column stores the AI-generated significance rating (0-25) for each story.

### Quick Setup

1. **Go to Supabase Dashboard**
   - Visit https://app.supabase.com
   - Sign in with your account
   - Select your PLHub project

2. **Open SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Run This SQL**
   ```sql
   ALTER TABLE posts ADD COLUMN IF NOT EXISTS score_significance INTEGER DEFAULT 12;
   UPDATE posts SET score_significance = 12 WHERE score_significance IS NULL;
   ```

4. **Verify**
   - Click the "Run" button (⏵)
   - You should see success messages
   - The feed API will now work correctly

### Alternative: Check Migration Status

If you want to verify whether the column exists, you can call:
```
GET /api/cron/run-migration?secret=YOUR_CRON_SECRET
```

This will check if the column exists and provide status.

### What This Does

- **Line 1**: Adds the `score_significance` column with a default value of 12 (neutral importance)
- **Line 2**: Sets all existing rows to have a significance of 12 if they're null

### Why It's Needed

The four-pillar PLHub Index scoring system requires:
1. **Credibility** (0-25) - Source trust level
2. **Recency** (0-25) - How fresh the story is
3. **Engagement** (0-25) - Community interaction
4. **Significance** (0-25) - AI-rated story importance ← **This is stored in `score_significance`**

The first three are calculated fresh on each request, but significance is generated once by Claude AI and stored in the database.

### After Migration

- The `/api/feed` endpoint will return the full four-pillar breakdown
- The Index score badge will show accurate component scores
- The tooltip will display the breakdown correctly
