# Database Migrations

This directory contains database migration scripts for PLHub.

## rebuild-index-scoring.sql

Adds the `score_significance` column required for the four-pillar PLHub Index scoring system.

### How to Run

Since Supabase doesn't support arbitrary SQL execution via the Node.js client library, you must run this manually:

1. **Via Supabase Dashboard (Recommended)**
   - Go to https://app.supabase.com
   - Select your project
   - Click "SQL Editor"
   - Click "New Query"
   - Copy the contents of `rebuild-index-scoring.sql`
   - Paste into the editor
   - Click "Run"

2. **Via API**
   - Call `GET /api/cron/run-migration?secret=YOUR_CRON_SECRET`
   - This will check if the column exists and provide status
   - Note: The API can't create columns directly, but it will verify the column exists

3. **For detailed instructions**
   - See `../MIGRATION_GUIDE.md`

## Files

- `rebuild-index-scoring.sql` - Adds score_significance column with DEFAULT 12
- `run-migration.ts` - Node.js script to check/apply migrations (informational)
- `add-summary-hook.sql` - Previous migration (already applied)
- `remove-talksport.sql` - Data cleanup script

## Important

The `score_significance` column must exist before the feed API will work. Without it, you'll get:
```
{
  "error": "Database setup incomplete",
  "detail": "The score_significance column is missing from the posts table"
}
```
