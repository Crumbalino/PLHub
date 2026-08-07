# Page inventory

Measured 7 August 2026 against production (`https://thefootballhub.uk`) and the
working tree at commit `c5382dd`. Facts only.

Method: routes enumerated with `find src/app`; HTTP status, `robots` meta and
`canonical` read from the served HTML with `curl`; dynamic params enumerated from
`getAllClubSlugs()` = `Object.keys(CLUBS)` in `src/config/clubs.ts`;
static/dynamic classification taken from `next build` output; link graph extracted
from the served HTML of all 30 page routes.

Counts are readings taken at that time.

---

## Table 1 — Routes that exist

`○` static · `●` SSG with generated params · `ƒ` dynamic (server-rendered per
request) · `API` route handler.

| Path | File | Type | Live | Indexable | Canonical emitted | In sitemap | Server-rendered content |
|---|---|---|---|---|---|---|---|
| `/` | `src/app/page.tsx` | ƒ | 200 | `index, follow` | `https://thefootballhub.uk` | Y | Y — 20,851 B |
| `/about` | `src/app/about/page.tsx` | ○ | 200 | `index, follow` | `…/about` | Y | Y — 23,514 B |
| `/contact` | `src/app/contact/page.tsx` | ○ | 200 | `index, follow` | `…/contact` | **N** | Y — 23,111 B |
| `/deadline-day` | `src/app/deadline-day/page.tsx` | ○ | 200 | **`noindex, follow`** | `…/deadline-day` | **N** | Y — 16,360 B |
| `/how-it-works` | `src/app/how-it-works/page.tsx` | ○ | 200 | `index, follow` | `…/how-it-works` | Y | Y — 33,529 B |
| `/principles` | `src/app/principles/page.tsx` | ○ | 200 | `index, follow` | `…/principles` | Y | Y — 28,306 B |
| `/privacy` | `src/app/privacy/page.tsx` | ○ | 200 | `index, follow` | `…/privacy` | Y | Y — 29,424 B |
| `/unsubscribe` | `src/app/unsubscribe/page.tsx` | ○ | 200 | `index, follow` | `…/unsubscribe` | **N** | Y — 15,422 B |
| `/_not-found` | none in `src/app` (Next.js built-in) | ○ | 404 | UNKNOWN — no `robots` meta read; body not inspected | UNKNOWN | N | UNKNOWN |
| `/clubs/[slug]` | `src/app/clubs/[slug]/page.tsx` | ● | see below | see below | see below | see below | see below |
| `/robots.txt` | `src/app/robots.ts` | ○ | 200 | n/a | n/a | N | n/a |
| `/sitemap.xml` | `src/app/sitemap.ts` | ○ | 200 | n/a | n/a | N | n/a |

API routes are in Table 4.

### `/clubs/[slug]` — 22 generated params

All 22 return **200**, all `index, follow`, all emit their own canonical
(`https://thefootballhub.uk/clubs/<slug>`), all server-render 20 `<article>`
elements containing post titles.

| Slug | Live | In sitemap | Bytes | `<h1>` |
|---|---|---|---|---|
| `arsenal` | 200 | Y | 116,814 | Arsenal |
| `aston-villa` | 200 | Y | 118,046 | Aston Villa |
| `bournemouth` | 200 | Y | 120,492 | AFC Bournemouth |
| `brentford` | 200 | Y | 128,318 | Brentford |
| `brighton` | 200 | Y | 120,649 | Brighton & Hove Albion |
| `chelsea` | 200 | Y | 118,961 | Chelsea |
| `crystal-palace` | 200 | Y | 122,424 | Crystal Palace |
| `everton` | 200 | Y | 116,885 | Everton |
| `fulham` | 200 | Y | 120,580 | Fulham |
| `ipswich` | 200 | Y | 112,624 | Ipswich Town |
| `leeds-united` | 200 | Y | 123,023 | Leeds United |
| `leicester` | 200 | Y | 117,304 | Leicester City |
| `liverpool` | 200 | Y | 111,549 | Liverpool |
| `man-city` | 200 | Y | 119,785 | Manchester City |
| `man-utd` | 200 | Y | 116,584 | Manchester United |
| `newcastle` | 200 | Y | 116,929 | Newcastle United |
| `nottingham-forest` | 200 | Y | 122,205 | Nottingham Forest |
| `southampton` | 200 | Y | 115,302 | Southampton |
| `sunderland` | 200 | Y | 110,065 | Sunderland Association |
| `tottenham` | 200 | Y | 121,050 | Tottenham Hotspur |
| `west-ham` | 200 | Y | 116,502 | West Ham United |
| `wolves` | 200 | Y | 122,191 | Wolverhampton Wanderers |

Two slugs present in the `clubs` table with `in_scope = true` have **no generated
param and no route**: `coventry-city` and `hull-city`. Both return **404** on
production. Neither is in `src/config/clubs.ts`.

`/clubs/burnley` also returns **404**; `burnley` is in the `clubs` table with
`in_scope = false`.

The homepage `<h1>` contains only `<span>` children, so no direct text was read
from it. Its rendered lines are "Some of this is true." and "Transfer gossip.
Scored."

---

## Table 2 — Link graph

Extracted from the served HTML of all 30 page routes. 356 total `href` matches;
`_next/*`, `/favicon.svg` and `/manifest.json` excluded below. **Every internal
link target resolves to an existing route — 0 broken internal links.** Every
target returns 200.

Two link sources account for all site-wide links:

- `src/components/Footer.tsx` — rendered by `src/app/layout.tsx` on all 30 pages.
  Links: `/`, `/about`, `/how-it-works`, `/principles`, `/contact`, `/privacy`.
- `src/components/home/SiteNav.tsx` — rendered on `/` only. Links: 18 club pages,
  plus `/how-it-works`, `/principles`, `/about`, `/privacy`.

| Route | Inbound from other pages | Outbound distinct internal links | All outbound resolve |
|---|---|---|---|
| `/` | 30 (footer on every page, incl. self) | 23 — 18 club pages + `/about`, `/how-it-works`, `/principles`, `/privacy`, `/contact` | 200 |
| `/about` | 30 (footer) | 5 (footer set) | 200 |
| `/contact` | 30 (footer) | 5 (footer set) | 200 |
| `/how-it-works` | 30 (footer) | 5 (footer set) | 200 |
| `/principles` | 30 (footer) | 5 (footer set) | 200 |
| `/privacy` | 30 (footer) | 5 (footer set) | 200 |
| `/clubs/<slug>` × 18 in-scope | 1 (`/` nav) | 6 — `/` (breadcrumb ×2) + footer set | 200 |
| `/clubs/leicester` | **0** | 6 | 200 |
| `/clubs/southampton` | **0** | 6 | 200 |
| `/clubs/west-ham` | **0** | 6 | 200 |
| `/clubs/wolves` | **0** | 6 | 200 |
| `/deadline-day` | **0** | 6 | 200 |
| `/unsubscribe` | **0** | UNKNOWN — not measured separately; page is client-rendered | UNKNOWN |

### Flags

**Orphans — 0 inbound links from any other page (self-links excluded):**

| Route | Indexable | In sitemap |
|---|---|---|
| `/clubs/leicester` | `index, follow` | Y |
| `/clubs/southampton` | `index, follow` | Y |
| `/clubs/west-ham` | `index, follow` | Y |
| `/clubs/wolves` | `index, follow` | Y |
| `/deadline-day` | `noindex, follow` | N |
| `/unsubscribe` | `index, follow` | N |

**Links pointing at routes that don't exist:** none. No page links to
`/clubs/coventry-city`, `/clubs/hull-city` or `/clubs/burnley`.

**Links to noindex pages from indexable ones:** none. `/deadline-day` is the only
`noindex` route and has 0 inbound links.

---

## Table 3 — Sitemap reconciliation

`https://thefootballhub.uk/sitemap.xml` — **27 `<loc>` entries.**

| Check | Result |
|---|---|
| Entries that are not a route | **none** — all 27 resolve to an existing route |
| Entries not returning 200 | **none** — all 27 return 200 |
| Entries not on the apex host | **none** — all 27 are `https://thefootballhub.uk…` |
| Entries not `https` | **none** |

**Routes absent from the sitemap:**

| Route | Indexable |
|---|---|
| `/contact` | `index, follow` |
| `/deadline-day` | `noindex, follow` |
| `/unsubscribe` | `index, follow` |
| `/_not-found` | UNKNOWN |
| `/robots.txt`, `/sitemap.xml` | n/a |

Sitemap composition: apex + 22 `/clubs/<slug>` + `/about` + `/how-it-works` +
`/principles` + `/privacy`.

The sitemap includes `/clubs/leicester`, `/clubs/southampton`,
`/clubs/west-ham` and `/clubs/wolves`. Those four slugs are `in_scope = false` in
the `clubs` table and are not in the homepage nav.

`robots.txt` served:

```
User-Agent: *
Allow: /
Disallow: /api/

Sitemap: https://thefootballhub.uk/sitemap.xml
```

---

## Table 4 — API routes

18 route handlers. "Auth: fail-closed" means the handler returns 401 when
`CRON_SECRET` is unset **or** the `Authorization` header does not match — i.e.
`if (!secret || authHeader !== \`Bearer ${secret}\`)`.

"Called from" lists files in `src/` outside `src/app/api`. "Reachable" states
whether that caller is rendered on a live page.

| Path | Methods | Auth | Called from | Reachable |
|---|---|---|---|---|
| `/api/cron/rss` | GET | fail-closed | none | n/a — external scheduler (cron-job.org) |
| `/api/cron/digest` | POST, GET | fail-closed | none | n/a |
| `/api/cron/backfill-summaries` | GET | fail-closed | none | n/a |
| `/api/cron/fixtures-refresh` | GET | fail-closed | none | n/a |
| `/api/cron/post-match-stats` | GET | fail-closed | none | n/a |
| `/api/cron/reddit` | GET | fail-closed | none | n/a |
| `/api/cron/run-migration` | GET | fail-closed | none | n/a |
| `/api/cron/source-detection` | GET, POST | fail-closed | none | n/a |
| `/api/cron/stats-refresh` | GET | fail-closed | none | n/a |
| `/api/cron/youtube` | GET | fail-closed | none | n/a |
| `/api/cleanup` | GET | fail-closed (variable named `cleanupSecret`) | none | n/a |
| `/api/feed` | GET | **open** | `src/hooks/useFeed.ts`, `src/lib/feed.ts` (comment), `src/app/clubs/[slug]/page.tsx` (comment) | **Yes** — `useFeed` → `FeedList`, rendered on `/clubs/[slug]`; "Load more" present in served HTML |
| `/api/subscribe` | POST, DELETE | **open** | `src/components/home/SubscribeForm.tsx`, `src/components/DigestSignup.tsx`, `src/app/unsubscribe/page.tsx` | **Yes** — `SubscribeForm` is inside `Hero` on `/`; `/unsubscribe` calls DELETE. `DigestSignup` has no render site |
| `/api/snapshot` | GET | **open** | `src/components/snapshot/SnapshotContainer.tsx`, `src/components/snapshot/ByTheNumbers.tsx` | **No** — `SnapshotContainer` is referenced only by `HomeContent`, which is not rendered; `ByTheNumbers` has no render site |
| `/api/health` | GET | **open** | `src/components/snapshot/StaleDataBanner.tsx` | **No** — `StaleDataBanner` has no render site |
| `/api/trending` | GET | **open** | `src/hooks/useTrending.ts` → `src/components/trending/TrendingStrip.tsx` | **No** — `TrendingStrip` has no render site |
| `/api/reactions/[cardId]` | GET, POST | **open** | `src/components/feed/YourVerdict.tsx` | **No** — served `/clubs/liverpool` HTML contains 0 occurrences of "Your Verdict" |
| `/api/summary` | POST | **open** | **none** | **No** — no caller anywhere in `src` |

`/api/health` returns **503** on production. Its `checks` object reports
`latest_story` ok, `story_count_24h` ok (95), `ai_summaries` warning (0%
coverage), `table_data` error ("No standings data found"), `fixtures_data` error
("No fixtures data found").

---

## Section 5 — Dead ends

### Routes rendering no meaningful content

| Route | Measured |
|---|---|
| `/deadline-day` | 16,360 B. `<h1>Deadline Day</h1>` and no body copy — all four content sections are JSX comments. `noindex, follow`, absent from sitemap, 0 inbound links |

No other page route was found to render no content.

### Nav items pointing at a stub

**None.** No page links to `/deadline-day`.

### Components with no render site anywhere in `src`

Found by searching for each component name across `src`, excluding its own file:

| Component | Data source it fetches |
|---|---|
| `src/components/snapshot/StaleDataBanner.tsx` | `/api/health` |
| `src/components/snapshot/ByTheNumbers.tsx` | `/api/snapshot` |
| `src/components/DigestSignup.tsx` | `/api/subscribe` |
| `src/components/trending/TrendingStrip.tsx` | `/api/trending` via `useTrending` |
| `src/components/MatchTicker.tsx` | UNKNOWN — not inspected |
| `src/components/PLTableWidget.tsx` | UNKNOWN — not inspected |
| `src/components/FixturesWidget.tsx` | UNKNOWN — not inspected |
| `src/components/NextFixtures.tsx` | UNKNOWN — not inspected |

### Components referenced only from a component that is not rendered

| Component | Only referenced by |
|---|---|
| `src/components/snapshot/SnapshotContainer.tsx` | `HomeContent.tsx` |
| `src/components/ClubFilterBar.tsx` | `HomeContent.tsx` |

`src/components/HomeContent.tsx` is imported by no route. `src/app/page.tsx`
mentions `HomeContent`, `ClubFilterBar` and `SnapshotContainer` in comments only.

### Imported but never rendered

`src/components/Navbar.tsx` is imported at `src/app/layout.tsx:5`. No `<Navbar`
element appears anywhere in `src`.

### Components rendered on a live page with no data behind them

None found. The components on live pages are `Hero`, `SubscribeForm`,
`FactsBlock`, `SiteNav`, `Footer`, `BackToTopButton` (all on `/`), and the
club-page feed, which server-renders 20 `<article>` elements containing post
titles.

### Other measured facts

- Served `/clubs/liverpool` HTML contains **"PLHub Index" ×2** and the string
  "Ranked by the Hub Index". `/clubs/[slug]/page.tsx` renders
  "ranked by the PLHub Index".
- Served `/clubs/liverpool` HTML contains **0** `href` values pointing at
  `bbc`, `skysports`, `theguardian`, `espn`, `fourfourtwo`, `independent` or
  `football365`. Where the 20 rendered article titles link to was not determined
  — UNKNOWN.
- `src/config/clubs.ts` contains 22 club keys. The `clubs` table contains 25 rows,
  20 with `in_scope = true`. `src/lib/clubs.ts` contains 21 slugs.
- `getInScopeClubs()` returns **18** — the intersection of `clubs.in_scope = true`
  (20) and `src/config/clubs.ts` (22). The two dropped are `coventry-city` and
  `hull-city`.
