# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**PLHub** is a Premier League news aggregator that surfaces editorial content from multiple sources (BBC Sport, Sky Sports, The Guardian, Reddit, YouTube) and enriches it with AI analysis, fixture data, and standings. The platform uses Claude AI for summarization, scoring, and content synthesis.

**Tech Stack**: Next.js 14 + React 18 + TypeScript + Tailwind CSS + Supabase + Claude API + Football Data APIs

---

## Common Commands

```bash
# Development
npm run dev                    # Start dev server (localhost:3000)
npm run build                  # Production build (must pass before deploy)
npm run lint                   # Run ESLint

# Database & Migrations
CRON_SECRET=<secret> curl http://localhost:3000/api/cron/run-migration
                              # Check/run pending migrations

# Health & Monitoring
curl http://localhost:3000/api/health
                              # Check system health (5 metrics, returns 200/503)

# Manual Data Refresh (bypass cron schedule)
CRON_SECRET=<secret> curl http://localhost:3000/api/cron/fixtures-refresh
CRON_SECRET=<secret> curl http://localhost:3000/api/cron/reddit
CRON_SECRET=<secret> curl http://localhost:3000/api/cron/rss
CRON_SECRET=<secret> curl http://localhost:3000/api/cron/backfill-summaries
```

---

## Architecture Overview

### **Data Pipeline**

1. **Ingestion** → Reddit, RSS feeds, YouTube via cron jobs
2. **Storage** → Supabase PostgreSQL (posts table)
3. **Enrichment** → Club detection, AI summarization, significance scoring
4. **API Layer** → `/api/feed`, `/api/snapshot`, `/api/trending`
5. **UI** → Server-rendered or client-side hydrated React components

### **Key Directories**

| Path | Purpose |
|------|---------|
| `/src/lib` | Type defs, utilities, Supabase client, Football API wrapper |
| `/src/lib/api-football` | Football Data API client (standings, fixtures, stats) |
| `/src/lib/prompts` | Claude prompt templates (summaries, index scoring, snapshot) |
| `/src/components` | React components (feed cards, snapshot modules, navigation) |
| `/src/components/snapshot` | The Snapshot briefing (hero grid, by-the-numbers, quotes, cards) |
| `/src/app/api` | API routes (feed, snapshot, trending, cron jobs) |
| `/src/app/api/cron` | Background jobs (reddit, rss, fixtures, stats refresh) |
| `/src/app/page.tsx` | Homepage (feed + snapshot layout) |
| `/src/app/clubs/[slug]/page.tsx` | Club detail page (club-filtered snapshot) |

### **Design System**

- **CSS Variables** (in `globals.css`): `--plh-bg`, `--plh-card`, `--plh-pink`, `--plh-gold`, `--plh-teal`, `--plh-text-100`, `--plh-text-50`, `--plh-border`, etc.
- **Colors** defined in `/src/lib/constants.ts` (COLORS, SOURCE_COLORS)
- **Font**: Sora (brand) + Consolas (monospace for data)
- **Light/Dark Mode**: CSS custom properties respond to `.light` class on `<html>`
- **Opacity Floor**: All text has minimum 50% opacity (no text below --plh-text-50)

---

## Critical Concepts

### **PLHub Index (4-Pillar Scoring)**

Every post gets a score from 0–100 composed of:
- **Credibility** (0–25): Source trust level
- **Recency** (0–25): Time decay (fresher = higher)
- **Engagement** (0–25): Reddit upvotes, YouTube views, RSS comments
- **Significance** (0–25): AI-rated importance (stored in DB as `score_significance`)
- **Multi-Source Bonus** (0–8): +2 per additional source mentioning same story

Heat labels (Hot/Warm/Rising) and index badge derive from total score.

### **The Snapshot**

A dynamic briefing module that assembles:
- **Hero Grid**: Top 5 stories of the day
- **By The Numbers**: Key stat (AI-generated or evergreen fallback) + 3 supporting stats
- **Fixture Focus**: Next match or recent results
- **Transfers/FPL**: Editorial stories from sources
- **Quote Strip**: Topical quote from source
- **And Finally**: Fun/surprise story

Endpoint: `GET /api/snapshot?club=arsenal` — returns full snapshot data structure.

### **By The Numbers Fallback**

When AI module returns null, render evergreen stats (priority order):
1. Total goals scored this matchday (+ highest-scoring match)
2. League leader points (+ gap to 2nd place)
3. Relegation gap (17th vs 18th place)

### **Club Detection**

AI extracts club mentions from post text using Claude. Detected clubs are stored in `detected_clubs` and rendered as badges on feed cards. Multiple clubs per post allowed.

### **Cron Jobs**

Scheduled via Vercel Cron, protected by `CRON_SECRET` env var:
- `/api/cron/reddit` — Fetch new Reddit posts
- `/api/cron/rss` — Fetch RSS feeds (handles multiple feeds, logs execution time)
- `/api/cron/youtube` — Fetch YouTube videos
- `/api/cron/fixtures-refresh` — Update match data from Football Data API
- `/api/cron/stats-refresh` — Update standings, scorers, etc.
- `/api/cron/backfill-summaries` — Generate missing summaries via Claude (limited to 2 posts/run)
- `/api/cron/source-detection` — Re-run club detection on old posts
- `/api/cron/run-migration` — Check/apply pending DB migrations
- `/api/cron/post-match-stats` — Post-match analysis (unused currently)

**Backfill Summaries Note**: Limited to 2 posts per 15-min run due to Vercel Hobby plan 10s timeout. Each Anthropic call ≈3-4s, so 2 posts safely fits. Processes newest posts first (via `created_at DESC`), enabling ~8 posts/hour backfill completion.

---

## Monitoring & Health Checks

### **Health Endpoint** (`GET /api/health`)

Real-time system health check (returns HTTP 200 ok or 503 error). Evaluates 5 metrics:

| Metric | Failure Threshold | Purpose |
|--------|-------------------|---------|
| Latest story age | > 2 hours | Data freshness |
| Story count (24h) | < 10 stories | Feed volume |
| AI summaries (24h) | < 50% coverage | Enrichment quality |
| Table data age | > 24 hours | Database staleness |
| Fixtures data age | > 24 hours | Match data freshness |

**Response format**: `{ status: 'ok'|'error', checks: { ... }, timestamp }`
Each check includes: `status` (ok|warning|error), `message`, and metric-specific fields.

### **Cron Logging** (`cron_logs` table)

Every cron job logs execution details for monitoring:
- `job_name` — cron route name (e.g., 'backfill_summaries')
- `status` — success|error
- `stories_processed` — items processed (null for fixtures/migration)
- `error_message` — null on success, error text on failure
- `execution_time_ms` — wall-clock time (critical for Vercel timeout budgeting)
- `created_at` — log timestamp (auto-purged after 7 days by pg_cron)

**Why this matters**: Track which cron jobs fail, how long they take, and catch data drift before it becomes user-visible.

### **Frontend Stale Data Banner** (`StaleDataBanner.tsx`)

Component integrated into `SnapshotContainer.tsx` that:
- Checks health endpoint every 5 minutes
- Shows purple warning banner if latest story > 2 hours old
- Helps users understand when data is stale

---

## Database Schema (Key Tables)

### `posts`
```
id, external_id, title, url, content, summary, summary_hook,
source (reddit|rss|youtube), club_slug, author, score, num_comments,
subreddit, image_url, detected_clubs (JSONB),
score_credibility, score_recency, score_engagement, score_significance,
fetched_at, published_at
```

### `clubs`
```
slug, name, shortName, subreddit, primaryColor, secondaryColor,
badgeEmoji, badgeUrl
```

### `by_the_numbers_tiles`
```
cache_key, data (JSONB), created_at, expires_at
```

### `cron_logs` (monitoring)
```
id, job_name, status (success|error), stories_processed, error_message, execution_time_ms, created_at
```

---

## Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# Football Data API
FOOTBALL_DATA_API_KEY=...

# External
CRON_SECRET=<random 32-byte hex>
NEXT_PUBLIC_SITE_URL=https://plhub.co.uk
GA_MEASUREMENT_ID=G-... (optional)
```

See `.env.local.example` for full template.

---

## Important Notes

### **LEAGUE_ID Convention**

Football Data API uses different league IDs:
- **2021**: Premier League (correct — used in all fixtures/standings/stats endpoints)
- **39**: Championship (incorrect — sometimes mistakenly hardcoded)

Always verify league ID is **2021** when modifying `/src/lib/api-football/*` files.

### **Text Readability System**

Component text follows opacity hierarchy (set via CSS variables or inline rgba):
- **100%** (`--plh-text-100` or `#FAF5F0`): Primary labels, numbers, team names
- **85%** (`rgba(250, 245, 240, 0.85)`): Secondary metadata (times, sources, subtitles)
- **50%** (`--plh-text-50`): Context text, disabled states
- **25-35%** (`rgba(250, 245, 240, 0.25–0.35)`): Hints, fine print

Monospace (`Consolas`, `Courier New`) used for all numeric data.

### **Error Handling in API Routes**

Many endpoints gracefully degrade on error (e.g., snapshot API returns partial data on failure). Always log errors with context (`console.error('[Module Name] Error:', err)`) but don't crash the request. Return fallback data when possible.

### **Component Patterns**

- **Client Components**: Use `'use client'` at top for interactive features (state, events)
- **Server Components**: Default for static content and data fetching (faster, no JS)
- **Snapshot Modules**: Each is a client component that may fetch/manage internal state
- **Cards**: Use inline styles for CSS variables (Tailwind can't interpolate `var()`)

### **Claude API Usage**

All Claude calls are in `/src/lib/claude.ts` using Anthropic SDK (`@anthropic-ai/sdk`):
- **Model**: `claude-opus-4-6` (latest, most capable)
- **Key functions**:
  - `generateSummary()` — Returns summary (2-3 sentences) + hook (4-6 word teaser) + significance score (0-25)
  - Used by `/api/cron/backfill-summaries` and feed enrichment
- **Prompt strategy**: Persona-based (Guardian's Fiver voice), structured output parsing (HOOK: / SIGNIFICANCE: / SUMMARY:)
- **Error handling**: Returns `{ summary: null, hook: null, significance: null }` on failure; cron continues gracefully
- **Cost optimization**: Only calls API for posts missing summaries; backfill limited to 2 posts/run to stay within Vercel timeout

---

## Build & Deploy

**Before pushing:**
```bash
npm run build        # Must pass
npm run lint         # Should pass (warnings ok)
```

**Vercel Integration:**
- Auto-deploys on `main` branch
- Cron jobs run on schedule
- Edge runtime on select routes (check logs if static gen fails)

**Post-Deploy Verification:**
- Hit `/api/health` endpoint to verify all 5 metrics pass (or at least no errors)
- Check Vercel Cron dashboard to ensure scheduled jobs are executing
- Verify `cron_logs` table has recent successful entries
- Optional: Set up UptimeRobot or similar to monitor `/api/health` at 5-min intervals

---

## Debugging Tips

1. **Snapshot data missing**: Check `/api/snapshot` response for null modules. Look for errors in API logs.
2. **Feed empty**: Check Supabase `posts` table. Verify cron jobs are running (check Vercel dashboard). Query `cron_logs` table for recent failures.
3. **AI module returning null**: Check Claude API logs and token usage. Verify prompt in `/src/lib/prompts/`. Backfill summaries cron may be behind if queue is large.
4. **Club badges not showing**: Verify club slugs match database. Check `detected_clubs` JSONB field. Ensure source-detection cron has run.
5. **Build fails**: Clear `.next/`, check TypeScript errors, verify all imports resolve.
6. **Data appears stale**: Hit `/api/health` endpoint to check all 5 metrics. Banner on UI shows if latest story > 2 hours old. Check `cron_logs` for recent job failures.
7. **Cron timeout on Vercel**: Check execution time in `cron_logs`. Vercel Hobby has 10s timeout; scale down batch sizes if needed. Backfill summaries already limited to 2 posts/run.

---

## Key Patterns & Conventions

### **Supabase & Server Code**

- **Server Client**: Use `createServerClient()` (defined in `/src/lib/supabase.ts`) in all API routes and server components
- **Cron Jobs**: Always validate `CRON_SECRET` header before processing; use `createServerClient()` with service role key
- **RLS Policies**: Tables have Row Level Security enabled. Service role has full access; public role can read most tables
- **Error Handling**: Many endpoints gracefully degrade on DB errors (return partial data, cache fallback) rather than 500

### **API Response Patterns**

- **Success**: `{ status: 'ok', data: ..., timestamp }` or `{ success: true, ... }`
- **Error**: `{ error: 'message' }` with appropriate HTTP status (404, 500, 503)
- **Snapshot/Feed endpoints**: Return partial data if one module fails (e.g., hero grid works even if "And Finally" errors)
- **Health check**: Returns HTTP 200 (ok) or 503 (error); never 400-level responses

### **TypeScript Conventions**

- Types defined in `/src/lib/types.ts`; export and reuse rather than defining inline
- API responses should have clear status/error unions to catch missing error handling at compile time
- Avoid `any`; use `unknown` if type is truly unknown, then narrow with type guards

---

## Quick Reference

**Key Files to Know:**
- Types: `/src/lib/types.ts`
- Constants: `/src/lib/constants.ts`
- Supabase Client: `/src/lib/supabase.ts`
- Main Feed: `/src/components/feed/`
- Snapshot: `/src/components/snapshot/`
- Styles: `/src/app/globals.css`
- Config: `next.config.mjs`, `tailwind.config.js`

**Commonly Modified:**
- API route logic: `/src/app/api/*/route.ts`
- Component styling: `/src/components/**` (inline styles + globals.css)
- Prompt engineering: `/src/lib/prompts/`
- Club mappings: `/src/lib/clubs.ts`
