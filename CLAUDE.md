# CLAUDE.md

Guidance for Claude Code (claude.ai/code) when working in this repository.

## Project Overview

**The Football Hub** — `thefootballhub.uk`

A **transfer rumour accountability ledger**. The product is not a news feed; it is a
record that holds sources to account for what they claimed and when.

Every claim is logged with:

| Field | Notes |
|---|---|
| Entities | Player, clubs (from/to), agent, competition |
| Claim type | e.g. bid made, medical booked, personal terms agreed, deal off |
| Verbatim hedging language | Quoted exactly as published — "understood to", "closing in on", "expected to" |
| Outlet | Publication |
| Byline | Named journalist |
| Attributed origin | Who the outlet says it heard from, when it isn't the byline |
| Source URL | Canonical link to the claim |

Claims are **resolved later** against what actually happened, and sources are then
scored on:

- **Hit rate** — how often their claims resolve true
- **Volume** — how much they publish (a high hit rate on two claims is not a record)
- **Originality** — did they break it, or echo someone who did
- **Specificity** — "a Premier League club" is not a prediction; a named fee and date is

The verbatim hedging language matters as much as the outcome. An outlet that
hedges everything and is technically never wrong is a different failure than one
that commits and misses.

**Annual awards**: **The Balloon Door Awards**, published **early October**.

**Byline**: **"by G"**. *Not* "by Adhdad" — that byline is superseded, do not
reintroduce it anywhere.

**Channel**: **GVsEverything**.

**Tech Stack**: Next.js 14 (App Router) + React 18 + TypeScript + Tailwind +
Supabase (Postgres) + Claude API + football data APIs.

---

## Ship Order

Work in this order. Do not jump ahead.

1. **Security + live domain** — cron auth fail-closed, no unauthenticated
   endpoints, `thefootballhub.uk` serving.
2. **Claim schema** — the ledger tables. Everything else depends on this shape.
3. **Backfill 12–18 months of resolved claims** — the ledger has no value empty;
   credibility comes from history that already resolved.
4. **Source + outlet pages** — with `Person` / `Organization` structured data.

---

## Ingest

**Intended surface: RSS + Reddit.**

**Scraping is dead. Do not reintroduce it.**

> ⚠️ **Actual current state: RSS is the only thing running.** `/api/cron/rss` is
> the sole enabled scheduled job. Reddit ingest has been **disabled since 3 Mar**
> and YouTube ingest is **dormant, not live**. Anything you read below about
> Reddit or YouTube describes code that exists, not a pipeline that runs. See
> Cron Jobs for the full picture before assuming any data is arriving.

- RSS: 9 feeds in `src/lib/rss.ts` (`FEEDS`) — BBC Sport, Sky Sports, The
  Guardian, Goal.com, 90min, Football365, The Independent, ESPN FC, FourFourTwo.
  One feed per run, rotated — each feed polled every 135 min (2h15m) at the
  live 15-minute cadence. See Known Debt #1 before touching the rotation.
  **This is the only live ingest path.**
- Reddit: `src/lib/reddit.ts`, public JSON endpoints per subreddit. **Code
  present, cron disabled since 3 Mar — no Reddit posts are arriving.**
- `posts.source` is `'rss' | 'reddit' | 'youtube'`. Only `'rss'` is currently
  being written.

**Known exceptions to the no-scraping rule** (documented so the doc matches a
grep — both should go):

- `src/lib/scraper.ts` still exists and `/api/cron/backfill-summaries` calls
  `scrapeArticle()` to fetch article bodies before summarising — it is a hard
  requirement there, with no snippet fallback. **That cron is disabled, so no
  scraping is currently happening** and `scraper.ts` is effectively dead code
  reachable only from a dormant route. Delete rather than revive.
- A YouTube ingest cron (`/api/cron/youtube`) still exists and would write
  `source: 'youtube'` posts if invoked, but it is **disabled since 3 Mar —
  dormant, not live.**

---

## Common Commands

```bash
npm run dev            # Dev server (localhost:3000)
npm run build          # Production build — must pass before deploy

# npm run lint is NOT usable: there is no ESLint config in the repo, so
# `next lint` drops into an interactive "configure ESLint?" prompt and
# exits. Treat `npm run build` as the gate until a config is added.

# Manual cron trigger (all cron routes require the secret; no route fails open)
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/rss
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/reddit
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/backfill-summaries

# Health
curl http://localhost:3000/api/health
```

---

## Architecture

### Data Pipeline

1. **Ingest** → RSS only in practice (Reddit disabled). cron-job.org drives it.
2. **Store** → Supabase Postgres (`posts`)
3. **Enrich** → partly running. Summaries and significance are generated
   **inline during RSS ingest**, but only for posts arriving with ≥300 chars of
   feed content. Club/cluster detection (`source-detection`) is **disabled**, and
   the summary **backfill** path is disabled. See Claude API Usage.
4. **Serve** → `/api/feed`, `/api/snapshot`, `/api/trending`
5. **Render** → server components, with client components for interaction

### Key Directories

| Path | Purpose |
|---|---|
| `src/lib` | Types, utilities, Supabase client, scoring |
| `src/lib/api-football` | Football data client (standings, fixtures, stats) |
| `src/lib/prompts` | Claude prompt templates |
| `src/lib/email` | Resend client, digest content + template |
| `src/lib/seo.ts` | Sitewide indexing switch (see SEO below) |
| `src/components` | React components |
| `src/app/api` | Route handlers |
| `src/app/api/cron` | Scheduled jobs |

---

## Claude API Usage

Calls live in `src/lib/claude.ts` and `src/app/api/cron/rss/route.ts`.

| Where | Model | Purpose | Live? |
|---|---|---|---|
| `src/lib/claude.ts:69` | `claude-sonnet-4-6` | `generateSummary()` — summary, hook, significance 0–25 | ✅ via RSS ingest |
| `src/app/api/cron/rss/route.ts:20` | `claude-haiku-4-5-20251001` | `isRelevantToPL()` headline filter | ✅ |
| `src/lib/prompts/by-the-numbers.ts:64` | `claude-haiku-4-5-20251001` | By The Numbers tile | on request |

Failures degrade gracefully — summaries return null and the cron continues.

### Which summaries actually get written

There are two paths to a summary, and only one of them runs:

1. **Inline at ingest** — `/api/cron/rss` calls `generateSummary()` directly for
   any post whose feed `content` is **≥300 chars**. This is enabled and running
   every 15 minutes, so these summaries *are* being written.
2. **Backfill** — `/api/cron/backfill-summaries` handles posts that arrived with
   too little content, by scraping the article first. Scraping is a **hard
   requirement** there: `if (!articleContent) skip`, with no snippet fallback.
   **This cron is disabled on every host, so this path never runs.**

**Consequence:** a post arriving with <300 chars of feed content will never get a
summary, because the only path that would fill it is dead. Expect permanent gaps
in `summary` / `summary_hook` / `score_significance` correlated with which feeds
publish short RSS descriptions — not with story importance.

---

## Cron Jobs

**The real scheduler is cron-job.org, not Vercel Cron.** All routes are
protected by `CRON_SECRET` regardless of who calls them.

`vercel.json` declares 5 cron jobs, but Hobby caps the number that actually
register, so those schedules **never took effect**. Do not trust `vercel.json`
as a description of what runs — treat it as dead configuration until it is
either pruned or the plan changes.

> ⚠️ **Exactly one scheduled job is enabled: `/api/cron/rss`.** Everything else
> is disabled. The system is ingesting RSS and doing essentially nothing else.

State below is from the cron-job.org dashboard.

| Route | State | Cadence |
|---|---|---|
| `/api/cron/rss` | ✅ **ENABLED** | every 15 min — 96 runs/day, `maxDuration = 60` |
| `/api/cron/reddit` | ❌ disabled since 3 Mar | — |
| `/api/cron/youtube` | ❌ disabled since 3 Mar | — |
| `/api/cron/backfill-summaries` | ❌ disabled since 3 Mar, last run **failed** | — |
| `/api/cron/source-detection` | ❌ disabled since 2 Mar, last run **failed** | — |
| `/api/cron/digest` | ⛔ **not present in cron-job.org at all** | never scheduled |

**The digest has never fired from cron-job.org.** It is not merely
misconfigured — no scheduler has ever invoked it. Combined with the missing
Resend config (see Email), the digest has never worked.

A second enabled cron-job.org job used to hit `/api/cron/backfill-summaries` on
the `plhub-lovat.vercel.app` host. That Vercel project has been deleted, so that
job now hits a dead host. **Summary backfill has no working scheduler on any
host.** If backfill is wanted again, re-point that job at
`pl-hub-webapp12.vercel.app` and re-enable it.

Present and callable but not scheduled anywhere: `fixtures-refresh`,
`stats-refresh`, `post-match-stats`, `run-migration`, plus `/api/cleanup`.

**Auth convention** — every cron route uses, and must keep using:

```ts
const cronSecret = process.env.CRON_SECRET
if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```

A **missing** secret must 401. Never `if (cronSecret && ...)` — that fails open.
Never read `CRON_SECRET` at module scope — an unset value turns the comparison
into `"Bearer undefined"`, which is guessable. Guard before doing any work, and
guard *every* exported handler, including `GET` preview handlers.

---

## SEO

### Sitewide noindex

Single control point: `src/lib/seo.ts` exports `NOINDEX`, read from
`SITE_NOINDEX`. Two consumers, which are the only places that speak to indexing:

- `src/app/layout.tsx` → `metadata.robots`. No page overrides `robots`, so the
  root value governs every route, club pages included.
- `src/app/robots.ts` → `/robots.txt`.

Turn on: set `SITE_NOINDEX=true` and redeploy. Turn off: remove it (or set
anything else) and redeploy. **Build-time, not runtime** — both consumers are
statically generated, so a flip always needs a redeploy.

Do **not** add `public/robots.txt`. A static file there shadows the generated
route and silently disables the switch.

### Canonicals — currently wrong

- `NEXT_PUBLIC_SITE_URL` is `https://plhub.co.uk`, the superseded domain. It
  feeds `metadataBase`, the canonical, and the `robots.txt` sitemap line.
- `layout.tsx` sets a **fixed** `alternates.canonical`, so `/`, `/about`,
  `/contact`, `/how-it-works` and `/principles` all canonical to the *same* URL,
  declaring themselves duplicates of each other.
- `/clubs/[slug]` overrides correctly but to a hardcoded
  `pl-hub-webapp12.vercel.app`.
- `sitemap.ts`, `JsonLd.tsx` and `Breadcrumb.tsx` also hardcode that
  `.vercel.app` host.

Net effect: three hostnames across the SEO surface and no page canonicalising to
`thefootballhub.uk`. Fix before letting crawlers in.

---

## Database

Supabase project `bgshqmpnqfmtsdvzbetm`. Use `createServerClient()`
(`src/lib/supabase.ts`) in route handlers and server components. RLS is on;
service role has full access.

Tables actually in use: `posts`, `cron_logs`, `api_cache`,
`by_the_numbers_tiles`. Also defined: `clubs`, `silly_stats`.

### `posts`
```
id, external_id, title, url, content, summary, summary_hook,
source (rss|reddit|youtube), club_slug, author, score, num_comments,
subreddit, image_url, detected_clubs (JSONB), card_type, generated_headline,
score_credibility, score_recency, score_engagement, score_significance,
fetched_at, published_at
```

### `cron_logs`
```
id, job_name, status (success|error), stories_processed,
error_message, execution_time_ms, created_at
```

**There is no subscribers table.** See Email.

---

## Email Digest

Subscribers were designed to live in a **Resend Audience**, not in Postgres.
`src/lib/email/resend.ts` is the only consumer.

**This is currently broken.** `RESEND_API_KEY`, `RESEND_AUDIENCE_ID` and
`RESEND_FROM_EMAIL` are not set in any Vercel environment, so:

- `listContacts()` throws → the digest cron 500s and sends nothing whenever it
  is invoked.
- `addContact()` throws → `/api/subscribe` 500s on every signup, so no one has
  ever been captured.

There are no subscribers anywhere, because no audience is configured to hold
them.

**And nothing invokes it.** `/api/cron/digest` is not present in cron-job.org at
all, and `vercel.json`'s `0 7 * * *` never registered. So the digest has **never
fired** — this is not a broken feature, it is an unlaunched one. Making it work
needs all three of: the Resend vars set, a scheduler entry created, and at least
one subscriber to exist.

---

## Deployment

**Vercel Hobby**, project `pl-hub-webapp12` (team `crumbalinos-projects`),
auto-deploying `main` from `Crumbalino/PLHub`.

### Function duration

Fluid compute is enabled; the project default timeout is **300s**.

| Plan | Default | Max |
|---|---|---|
| Hobby | 300s | **300s** |
| Pro / Enterprise | 300s | 800s (1800s beta) |

**Hobby is not limited to 10s.** That was the pre-fluid-compute limit and it is
the reason several routes carry `maxDuration = 10` and artificially small batch
sizes. Those caps are unnecessary.

### Domain

`thefootballhub.uk` is attached to the project and ownership-verified, but DNS
still points at the registrar. To finish, either set `A @ → 76.76.21.21` or move
nameservers to `ns1/ns2.vercel-dns.com`.

A second Vercel project (`plhub`) previously deployed the same repo with the same
env and the same five crons, double-running every job against one database. It
has been deleted. **Do not recreate a second project for this repo.**

---

## Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Anthropic
ANTHROPIC_API_KEY=

# Football data
FOOTBALL_DATA_API_KEY=

# Cron auth (openssl rand -hex 32)
CRON_SECRET=

# Site
NEXT_PUBLIC_SITE_URL=https://thefootballhub.uk
SITE_NOINDEX=false            # "true" noindexes the whole site; build-time

# Email digest — NOT CURRENTLY SET, digest and signup are broken without them
RESEND_API_KEY=
RESEND_AUDIENCE_ID=
RESEND_FROM_EMAIL=

# Optional
GA_MEASUREMENT_ID=
YOUTUBE_API_KEY=
```

**Set in Vercel but read by no code** — `ENABLE_BTN`, `ENABLE_AI_SUMMARIES`
(no reader anywhere in `src/`), and `API_FOOTBALL_KEY` (everything uses
`FOOTBALL_DATA_API_KEY`).

---

## Known Debt

Real, verified, and deliberately not yet fixed. Don't rediscover these.

1. **RSS feed rotation works — only its comment is stale.** Not a bug; recorded
   so it isn't "fixed" by mistake.

   ```ts
   const runIndex  = Math.floor(Date.now() / (15 * 60 * 1000))  // 15-min buckets
   const feedIndex = runIndex % FEEDS.length                    // FEEDS.length === 9
   ```

   The bucket width (15 min) equals the real cron-job.org cadence (15 min), so
   `runIndex` advances by exactly 1 per run and the modulo cycles cleanly through
   all 9 feeds. **Each feed is polled every 135 minutes (2h15m)**, about 10.7
   times per day across 96 runs.

   The code comment still says "With 5 feeds on a 15-min cron, each feed is
   checked every ~75 minutes." That was correct at 5 feeds; at 9 it should read
   **~135 minutes**. The mechanism is sound — only the numbers are outdated.

   Two properties worth knowing before changing it: `runIndex` is derived from
   wall-clock time rather than a stored counter, so it is stateless and survives
   cold starts and redeploys — but there is no catch-up, so a missed run simply
   skips that feed until the next cycle. And because the cadence exactly equals
   the bucket width, jitter across a bucket boundary can occasionally poll one
   feed twice and skip its neighbour. **If the cadence is ever changed, this
   bucket width must change with it**, or the rotation stops matching the
   schedule.
2. **Summary backfill is dead on every host.** `/api/cron/backfill-summaries` is
   disabled in cron-job.org (since 3 Mar, last run failed), and the second job
   that hit it on `plhub-lovat.vercel.app` points at a now-deleted project. Posts
   arriving with <300 chars of feed content will therefore never get a summary.
   To revive: re-point the job at `pl-hub-webapp12.vercel.app` and re-enable.
   Its 2-posts-per-run cap also cites a 10s Hobby timeout that does not exist,
   so raise that at the same time.
3. **`backfill-summaries` still scrapes** via `src/lib/scraper.ts` — a hard
   requirement with no snippet fallback. Since that cron is disabled, no scraping
   is currently happening and `scraper.ts` is reachable only from a dormant
   route.
4. **Club/cluster detection is disabled.** `/api/cron/source-detection` has been
   off since 2 Mar with a failed last run, so `detected_clubs`, `source_count`
   and `story_cluster` are not being maintained. Multi-source bonuses in the
   score will be stale or absent.
5. **Reddit and YouTube ingest are dormant.** Both crons disabled since 3 Mar.
   The Reddit half of the stated RSS + Reddit ingest surface is not running.
6. **Hardcoded `pl-hub-webapp12.vercel.app`** in `sitemap.ts`, `JsonLd.tsx`,
   `Breadcrumb.tsx`, `clubs/[slug]/page.tsx`.
7. **`NEXT_PUBLIC_SITE_URL` is the old domain**, and five pages share one fixed
   canonical. See SEO.
8. **`/api/cron/rss` does 13 sequential `DELETE ... ILIKE '%kw%'`** full scans on
   `posts` every run as a keyword cleanup. At 96 runs/day that is roughly
   **1,250 full-table scans per day**, all to delete rows matching a hardcoded
   keyword list.
9. **`vercel.json` declares 5 crons that never registered.** It reads as the
   schedule and is not one. Prune it or move the real cadences into it.
10. **The digest has never fired.** No Resend config *and* no scheduler entry.
    See Email.

---

## Conventions

- **Server client**: `createServerClient()` in all route handlers and server
  components.
- **Cron auth**: fail closed, per-request read, guard every handler. See above.
- **Error handling**: degrade gracefully — log with context
  (`console.error('[Module] Error:', err)`) and return partial data rather than
  500 where a partial answer is useful.
- **Types**: defined in `src/lib/types.ts`; export and reuse. Avoid `any`.
- **Components**: `'use client'` only where interaction requires it.
- **Football league ID is `2021`** (Premier League). `39` is the Championship —
  verify when touching `src/lib/api-football/*`.

---

## Debugging

1. **Feed empty** → check `posts` in Supabase, then `cron_logs` for failures.
2. **Cron timing out** → read `execution_time_ms` in `cron_logs`. Remember the
   ceiling is 300s, not 10s.
   **Cron not firing at all** → check the cron-job.org dashboard, not the Vercel
   Cron dashboard. `vercel.json`'s schedules never registered.
3. **Summaries missing** → expected for any post that arrived with <300 chars of
   feed content. Inline generation at ingest is the only live path;
   `backfill-summaries` is disabled everywhere. Not a bug to chase — a dead
   scheduler entry to revive.
4. **Digest not arriving** → it isn't configured at all. See Email.
5. **noindex not applying** → check `SITE_NOINDEX` is exactly `true`, that the
   project was **redeployed** since, and that no `public/robots.txt` exists.
6. **Build fails** → clear `.next/`, check TS errors and import resolution.
