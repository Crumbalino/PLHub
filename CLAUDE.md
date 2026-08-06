# CLAUDE.md

**The Football Hub** — `thefootballhub.uk` — a transfer rumour accountability
ledger. Log each claim, resolve it later, score the source.

Byline is **"by G"**. Not "by Adhdad" — superseded, do not reintroduce.
Channel: **GVsEverything**. Annual awards: **The Balloon Door Awards**, early October.
Stack: Next.js 14 App Router, React 18, TypeScript, Tailwind, Supabase, Claude API.

Editorial rules: **[docs/PRINCIPLES.md](docs/PRINCIPLES.md)** — read before touching relevance, classification or scoring.
Known defects: **[GitHub Issues](https://github.com/Crumbalino/PLHub/issues)** — check before reporting or "fixing" anything below.

## Claim record

Each claim stores: entities (player, clubs from/to, agent), claim type, verbatim
hedging language, outlet, byline, attributed origin, source URL. Resolved later.

## Ship order

1. Security + live domain → 2. Claim schema → 3. Backfill 12–18 months of resolved claims → 4. Source + outlet pages with `Person`/`Organization` schema.

## Commands

```bash
vercel env pull  # REQUIRED FIRST — dev and build both throw without NEXT_PUBLIC_SITE_URL
npm run dev      # localhost:3000
npm run build    # the only working gate — `npm run lint` has no ESLint config and prompts interactively
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/rss
curl http://localhost:3000/api/health
```

`src/lib/site.ts` has no fallback: a missing `NEXT_PUBLIC_SITE_URL` fails the
build with `Refusing to build with a guessed domain`. Intended, not a broken repo.

## Ingest

RSS + Reddit is the intended surface. **Scraping is dead — do not reintroduce it.**

- RSS: 9 feeds in `src/lib/rss.ts` (`FEEDS`), one per run, rotated, each polled every 135 min.
- Reddit: `src/lib/reddit.ts`. Cron disabled — nothing arriving.
- `posts.source` is `rss|reddit|youtube`; only `rss` is written.

**Only RSS runs.** 3 of 9 feeds return nothing; only The Guardian clears 300 chars.

## Cron

**cron-job.org is the scheduler, not Vercel Cron.** There is no `vercel.json` —
it declared 5 crons that never registered (Hobby cap). Do not recreate it.

- `rss` — **enabled, every 15 min** (96 runs/day, `maxDuration = 60`)
- `reddit`, `youtube`, `backfill-summaries`, `source-detection` — disabled
- `digest` — absent from cron-job.org, has never fired
- unscheduled but present: `fixtures-refresh`, `stats-refresh`, `post-match-stats`, `run-migration`, `/api/cleanup`

**Auth — required in every exported handler, before any work:**

```ts
const cronSecret = process.env.CRON_SECRET
if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```

A missing secret must 401. Never `if (cronSecret && …)` — fails open. Never read
`CRON_SECRET` at module scope — unset makes the check `"Bearer undefined"`.

## Claude API

| Where | Model | Purpose |
|---|---|---|
| `src/lib/claude.ts:69` | `claude-sonnet-4-6` | `generateSummary()` — summary, hook, significance 0–25 |
| `src/lib/prompts/by-the-numbers.ts:64` | `claude-haiku-4-5-20251001` | By The Numbers tile |
| `src/app/api/cron/rss/route.ts:16` | `claude-haiku-4-5-20251001` | `isRelevantToPL()` — **defined but never called** |

Summaries are written **inline at ingest**, only when feed `content` is ≥300 chars;
backfill is disabled, so shorter posts never get one. Failures return null.

## SEO

**Sitewide noindex**: `src/lib/seo.ts` exports `NOINDEX` from `SITE_NOINDEX`,
consumed only by `layout.tsx` (`metadata.robots`) and `robots.ts`. No page
overrides `robots`, so the root value governs every route. **Build-time — a flip
needs a redeploy.** Currently `true` on Production and Preview.

**Never add `public/robots.txt`** — a static file there shadows the generated
route and silently disables the switch.

**Every route sets its own `alternates.canonical`**, relative to `metadataBase`;
both derive from `SITE_URL`. The root canonical is the *homepage's* (`page.tsx`
is a client component). A route omitting `alternates` inherits `/` and declares
itself a duplicate — always set it.

## Database

Supabase `bgshqmpnqfmtsdvzbetm`. RLS on; service role has full access.

In use: `posts`, `cron_logs`, `api_cache`, `by_the_numbers_tiles`. Unused: `clubs`,
`silly_stats`. **No subscribers table** — a Resend Audience that does not exist.

```
posts: id, external_id, title, url, content, summary, summary_hook, source,
  club_slug, author, score, num_comments, subreddit, image_url, card_type,
  detected_clubs (JSONB), generated_headline, fetched_at, published_at,
  score_{credibility,recency,engagement,significance}
cron_logs: id, job_name, status, stories_processed, error_message,
  execution_time_ms, created_at
```

`posts.subreddit` holds the **feed name** for RSS rows.

## Deployment

**Vercel Hobby**, project `pl-hub-webapp12`, team `crumbalinos-projects`,
auto-deploys `main`. **Do not create a second Vercel project for this repo.** Fluid
compute on; Hobby max is **300s, not 10s** — any `maxDuration = 10` is stale.

`thefootballhub.uk` is live over HTTPS (`A` → 76.76.21.21); `www` 308s to apex.

## Environment variables

```bash
NEXT_PUBLIC_SUPABASE_URL=  NEXT_PUBLIC_SUPABASE_ANON_KEY=  SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=         FOOTBALL_DATA_API_KEY=          CRON_SECRET=
NEXT_PUBLIC_SITE_URL=https://thefootballhub.uk
SITE_NOINDEX=true          # "true" noindexes; build-time
GA_MEASUREMENT_ID=         YOUTUBE_API_KEY=                # optional
RESEND_API_KEY= RESEND_AUDIENCE_ID= RESEND_FROM_EMAIL=  # UNSET — digest and /api/subscribe both 500
```

Set in Vercel, read by no code: `ENABLE_BTN`, `ENABLE_AI_SUMMARIES`,
`API_FOOTBALL_KEY` (code uses `FOOTBALL_DATA_API_KEY`).

## Conventions

- `createServerClient()` (`src/lib/supabase.ts`) in route handlers and server components.
- Cron auth: fail closed, read per-request, guard every handler.
- Degrade gracefully: log `console.error('[Module] Error:', err)`, prefer partial data over a 500.
- Types in `src/lib/types.ts` — export and reuse. Avoid `any`.
- `'use client'` only where interaction requires it.
- Football league ID is **2021** (Premier League); `39` is the Championship.

## Debugging

- **Feed thin/empty** → `cron_logs` logs `success` even on a 404 (`fetchFeed` swallows errors). `curl` the feed, count `<item>`.
- **Cron timing out** → `execution_time_ms` in `cron_logs`; ceiling is 300s.
- **Cron not firing** → cron-job.org dashboard, not Vercel's.
- **Summary missing** → expected below 300 chars of feed content.
- **noindex not applying** → `SITE_NOINDEX` exactly `true`, redeployed since, no `public/robots.txt`.
- **Build fails** → clear `.next/`, check TS errors and imports.
