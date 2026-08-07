# CLAUDE.md

**The Football Hub** — `thefootballhub.uk` — transfer gossip, scored.

**Claim-first. The score is on the rumour, not the reporter.** It describes how
well-sourced a claim is, not whether the transfer will happen and not how
trustworthy a journalist is. Author track record is an *input* to the score; it
is never the published product. Anything that ships a per-journalist reliability
rating is the wrong product — that was the old PLHub Index, and it is gone.

**The unit is the rumour, not the article.** Many articles, one claim.

**The product form:** a daily gossip column with the score inline, at **one
permanent URL that updates in place.** Not a feed. Not an archive. The homepage
feed (`HomeContent`) is **deliberately unplugged** — see `src/app/page.tsx`; #29
re-plugged it once and it broke the front door on the day the site went
indexable. Do not re-plug it.

**The hero is locked** — settled three times, not to be reopened, and
DESIGN_SYSTEM §16.2 is wrong to reopen it:

> The Football Hub / Some of this is true. / Transfer gossip. Scored.

Byline is **"by G"**. Not "by Adhdad" — superseded, do not reintroduce. Channel:
**GVsEverything**. Annual awards: **The Balloon Door Awards**, early October.
Stack: Next.js 14 App Router, React 18, TypeScript, Tailwind, Supabase, Claude API.

Editorial rules: **[docs/PRINCIPLES.md](docs/PRINCIPLES.md)** — read before touching relevance, classification or scoring. Known defects: **[GitHub Issues](https://github.com/Crumbalino/PLHub/issues)** — check before reporting or "fixing" anything below.

**Two governing docs live outside this repo — ask G, don't reinvent them here.**
`DESIGN_SYSTEM.md` (§4 data contract, §6 tokens, §7 routes/layout, §8 blocks)
governs anything visual; `EDITORIAL_VOICE.md` (§6 banned language, §7 pronouns,
§8 commercial policy, §11 the writer's test) governs **every string that ships.**

**Club-matcher signals must be time-invariant properties of a club** (`src/lib/club-matcher.ts`) — name, URL slug, stadium, nickname. `manager` was dropped: it is point-in-time, the corpus spans months, and a current snapshot misfiles historical posts (five managers moved between PL clubs in summer 2026). Do not re-add it, and do not add squad lists, which fail the same way.

**Verify against the live system, not the artefact.** `migrations/`, docs and this file have each been wrong about production — three separate misreadings on 6 Aug 2026 (`fetched_at` as an ingest time, "RLS is enabled on existing tables", `relrowsecurity=true` as proof). Query the database, the deployment and the dashboard; report findings before committing.

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

`src/lib/site.ts` has no fallback — a missing `NEXT_PUBLIC_SITE_URL` fails the
build with `Refusing to build with a guessed domain`. Intended, not a broken repo.

## Ingest

RSS + Reddit is the intended surface. **Scraping is dead — do not reintroduce it.**

- RSS: `FEEDS` declares **7** feeds, one per run, rotated. **All 7 were measured
  producing on 7 Aug 2026**: BBC, Sky, Guardian, Football365, Independent, ESPN,
  FourFourTwo. Every URL in that list has been curled — 200, XML, items inside
  24h. Do not add a feed without curling it first.
  - **Goal.com removed** — 7 candidate URLs all 404, no `<head>` rss link tag,
    0 rows ever written. The publisher is alive; the feed is not.
  - **90min removed** — the feed works (200, 90 items); the *content* is frozen
    at 11 Aug 2025 and ingest was still inserting those rows a year later, so
    stale stories arrived looking fresh. A frozen archive passes any `<item>`
    count. **Do not re-add either.**
  - **Football365 URL corrected**, not removed: `/premier-league/rss` 404s,
    `/rss` serves 31 transfer items. Site-wide, so the PL filter works harder.
  - **The Independent is thin, not dead** — 3 items, 514 rows. Kept. A low item
    count is not a failure.
- Reddit: `src/lib/reddit.ts`. Cron disabled — nothing arriving.
- `posts.source` is `rss|reddit|youtube`; only `rss` is written.

**Only The Guardian clears the 300-char summary gate** — ~8/day of ~81 ingested.

## Cron

**cron-job.org is the scheduler, not Vercel Cron.** There is no `vercel.json` — it
declared 5 crons that never registered (Hobby cap). Do not recreate it.

- `rss` — **enabled, every 15 min** (96 runs/day, `maxDuration = 60`). Everything
  else is disabled; `digest` is absent from cron-job.org and has never fired.
- Unscheduled but present: `fixtures-refresh`, `stats-refresh`, `post-match-stats`, `run-migration`, `/api/cleanup`

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
| `src/lib/claude.ts` | `claude-sonnet-4-6` | `generateSummary()` — summary + hook. Returns `significance: null` always (#18) |
| `src/lib/prompts/by-the-numbers.ts:64` | `claude-haiku-4-5-20251001` | By The Numbers tile |
| `src/app/api/cron/rss/route.ts:16` | `claude-haiku-4-5-20251001` | `isRelevantToPL()` — **defined but never called** |

**Summaries are deprecated. `SUMMARIES_ENABLED=false` is deliberate and
permanent — not a cost decision and not a bug. Do not "fix" it, do not re-enable
it, do not schedule the backfill.** Inline article summarisation was the
aggregator product; the product is now a scored claim, and a summary of someone
else's article is not that. Backfill is off too, so nothing writes summaries.
Anything asking for a summary job to be restored — including CURRENT_STATE §2 —
is superseded. See issue #3 for the reasoning, closed won't-do.

The model fences its JSON: parse via `stripCodeFences()`, never bare
`JSON.parse`.

## SEO

**Indexability switch**: `src/lib/seo.ts` exports `NOINDEX` from `SITE_NOINDEX`,
consumed only by `layout.tsx` (`metadata.robots`) and `robots.ts`. No page
overrides `robots`. **Build-time — a flip needs a redeploy.**

**The site is INDEXABLE as of 7 Aug 2026.** Measured on production that day:
`<meta name="robots" content="index, follow">` and `/robots.txt` serving
`Allow: /` with `Disallow: /api/`. Assume Google and AI crawlers are reading
every deploy. Preview was not measured.

**Never add `public/robots.txt`** — it shadows the generated route and silently
disables the switch.

**Every route sets its own `alternates.canonical`**, relative to `metadataBase`;
both derive from `SITE_URL`. A route omitting `alternates` inherits `/`. Always
set it. (`page.tsx` is a **server** component and exports `metadata` directly —
the "client component" note here was stale.)

## Database

Supabase `bgshqmpnqfmtsdvzbetm`. RLS on; service role has full access.

**A row count in any doc is a timestamped reading, not a fact** — `posts` and
`cron_logs` grow every 15 minutes. Re-count before reasoning about volume.

In use: `posts`, `cron_logs`. Also present: `clubs`, `silly_stats`, `card_reactions`,
`on_this_day`, `quotes`, `trivia`. **No subscribers table.**

```
posts (21 cols, verified live): id, external_id, title, url, content, summary,
  summary_hook, source, club_slug, author, score, subreddit, image_url, card_type,
  generated_headline, category, source_count, story_cluster, score_significance,
  fetched_at, published_at
cron_logs: id, job_name, status, stories_processed, error_message, execution_time_ms, created_at
```

`posts.subreddit` holds the **feed name** for RSS rows.

## Deployment

**Vercel Hobby**, project `pl-hub-webapp12`, team `crumbalinos-projects`,
auto-deploys `main`. **Do not create a second Vercel project.** Fluid compute on;
Hobby max is **300s, not 10s** — any `maxDuration = 10` is stale.

`thefootballhub.uk` is live over HTTPS (`A` → 76.76.21.21); `www` 308s to apex.

## Environment variables

```bash
NEXT_PUBLIC_SUPABASE_URL=  NEXT_PUBLIC_SUPABASE_ANON_KEY=  SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=         FOOTBALL_DATA_API_KEY=          CRON_SECRET=
NEXT_PUBLIC_SITE_URL=https://thefootballhub.uk
SITE_NOINDEX=true          # "true" noindexes; build-time
SUMMARIES_ENABLED=false    # "true" enables inline summarisation at ingest
YOUTUBE_API_KEY=                                           # optional
RESEND_API_KEY=            # SET but NOT VALID — 11 chars, no re_ prefix;
                           # /audiences returns 400 "API key is invalid"
RESEND_AUDIENCE_ID= RESEND_FROM_EMAIL=  # STILL UNSET — addContact() needs the
                           # audience id, so /api/subscribe and digest 500
                           # regardless of the key. Verified 7 Aug 2026.
```

Dead vars set in Vercel, read by no code: `ENABLE_BTN`, `ENABLE_AI_SUMMARIES`
(**not** `SUMMARIES_ENABLED`), `API_FOOTBALL_KEY`, `GA_MEASUREMENT_ID`.

**No analytics, no session recording, no pixels, no third-party fonts.** GA4
and Microsoft Clarity ran on every page with no consent gate until 6 Aug 2026;
both are removed. Adding any tracker back needs a lawful basis and a consent
banner under UK GDPR/PECR — and `/how-it-works` promises no cookie walls, which
is only true while nothing needs consent. Fonts come from `next/font`,
self-hosted; never re-add a `fonts.googleapis.com` link or `@import`.

## Conventions

- `createServerClient()` (`src/lib/supabase.ts`) in route handlers and server components. Cron auth: fail closed, read per-request, guard every handler.
- Degrade gracefully: log `console.error('[Module] Error:', err)`, prefer partial data over a 500.
- Types in `src/lib/types.ts` — export and reuse. Avoid `any`. `'use client'` only where interaction requires it.
- Football league ID is **2021** (Premier League); `39` is the Championship.

## Debugging

- **Feed thin/empty** → `cron_logs` logs `success` even on a 404 (`fetchFeed` swallows errors). `curl` it and count `<item>` — and check the dates: 90min returns items that are a year old.
- **Cron timing out / not firing** → `execution_time_ms` in `cron_logs` (ceiling 300s); for scheduling, the cron-job.org dashboard, not Vercel's.
- **Summary missing** → expected: `SUMMARIES_ENABLED` is off, and the gate is 300 chars.
- **noindex not applying** → `SITE_NOINDEX` exactly `true`, redeployed since, no `public/robots.txt`. **Build fails** → clear `.next/`, check TS errors and imports.
