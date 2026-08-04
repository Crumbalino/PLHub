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

**RSS + Reddit. That is the whole ingest surface.**

**Scraping is dead. Do not reintroduce it.**

- RSS: 9 feeds in `src/lib/rss.ts` (`FEEDS`) — BBC Sport, Sky Sports, The
  Guardian, Goal.com, 90min, Football365, The Independent, ESPN FC, FourFourTwo.
  One feed per run, rotated.
- Reddit: `src/lib/reddit.ts`, public JSON endpoints per subreddit.
- `posts.source` is `'rss' | 'reddit' | 'youtube'`.

**Known exceptions to the no-scraping rule** (documented so the doc matches a
grep — both should go):

- `src/lib/scraper.ts` still exists and `/api/cron/backfill-summaries` still
  calls `scrapeArticle()` to fetch article bodies before summarising. This is
  live on every run of that cron. Slated for removal; do not build on it.
- A YouTube ingest cron (`/api/cron/youtube`) is still scheduled in
  `vercel.json` and still writes `source: 'youtube'` posts, despite ingest being
  nominally RSS + Reddit.

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

1. **Ingest** → RSS + Reddit via Vercel Cron
2. **Store** → Supabase Postgres (`posts`)
3. **Enrich** → club detection, AI summary, significance scoring
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

| Where | Model | Purpose |
|---|---|---|
| `src/lib/claude.ts:69` | `claude-sonnet-4-6` | `generateSummary()` — summary, hook, significance 0–25 |
| `src/app/api/cron/rss/route.ts:20` | `claude-haiku-4-5-20251001` | `isRelevantToPL()` headline filter |
| `src/lib/prompts/by-the-numbers.ts:64` | `claude-haiku-4-5-20251001` | By The Numbers tile |

Failures degrade gracefully — summaries return null and the cron continues.

---

## Cron Jobs

Scheduled in `vercel.json`, all protected by `CRON_SECRET`.

| Route | Schedule | Notes |
|---|---|---|
| `/api/cron/rss` | `0 0 * * *` | `maxDuration = 60` |
| `/api/cron/reddit` | `0 1 * * *` | |
| `/api/cron/youtube` | `0 2 * * *` | See ingest exceptions |
| `/api/cron/backfill-summaries` | `0 3 * * *` | Still scrapes; 2 posts/run |
| `/api/cron/digest` | `0 7 * * *` | **Currently fails — see Email** |

Not scheduled, but present and callable: `fixtures-refresh`, `stats-refresh`,
`post-match-stats`, `source-detection`, `run-migration`, plus `/api/cleanup`.

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

- `listContacts()` throws → the 07:00 digest cron 500s daily and sends nothing.
- `addContact()` throws → `/api/subscribe` 500s on every signup, so no one has
  ever been captured.

There are no subscribers anywhere, because no audience is configured to hold
them. Configure the three vars before treating the digest as functional.

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

1. **RSS rotation math is broken.** `rss/route.ts` buckets `runIndex` by 15
   minutes and its comment assumes 5 feeds on a 15-minute cron. There are **9**
   feeds and the cron is **daily**, so each feed is polled roughly every 9 days.
2. **`backfill-summaries` caps at 2 posts/run** citing a 10s Hobby timeout that
   does not exist. Raise it.
3. **`backfill-summaries` still scrapes** via `src/lib/scraper.ts`.
4. **Hardcoded `pl-hub-webapp12.vercel.app`** in `sitemap.ts`, `JsonLd.tsx`,
   `Breadcrumb.tsx`, `clubs/[slug]/page.tsx`.
5. **`NEXT_PUBLIC_SITE_URL` is the old domain**, and five pages share one fixed
   canonical. See SEO.
6. **`/api/cron/rss` does 13 sequential `DELETE ... ILIKE '%kw%'`** full scans on
   `posts` every run as a keyword cleanup.
7. **Email digest is non-functional** — no Resend config. See Email.

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
3. **Summaries missing** → `backfill-summaries` skips anything it can't scrape to
   300+ chars.
4. **Digest not arriving** → it isn't configured at all. See Email.
5. **noindex not applying** → check `SITE_NOINDEX` is exactly `true`, that the
   project was **redeployed** since, and that no `public/robots.txt` exists.
6. **Build fails** → clear `.next/`, check TS errors and import resolution.
