# Session log — 7 August 2026

Written at the end of the session. Every claim here was measured against the live
system (production HTML, the served stylesheet, or the Supabase REST API) rather
than read from a doc. Row counts are timestamped readings, not facts.

Branch discipline: one branch, one PR, one concern, merged and verified live
before the next started.

---

## What shipped

| PR | Title | Verified live |
|---|---|---|
| [#37](https://github.com/Crumbalino/PLHub/pull/37) | Unplug `HomeContent` from the homepage | yes |
| [#39](https://github.com/Crumbalino/PLHub/pull/39) | CLAUDE.md states the claim-first pivot | n/a (docs) |
| [#40](https://github.com/Crumbalino/PLHub/pull/40) | Probe before pruning — Football365 URL corrected, Goal.com and 90min removed | yes |
| [#41](https://github.com/Crumbalino/PLHub/pull/41) | A dead feed logs as a failure, not a silent success | yes |
| [#42](https://github.com/Crumbalino/PLHub/pull/42) | `/how-it-works` names the feeds that exist | yes |
| [#43](https://github.com/Crumbalino/PLHub/pull/43) | Declare the `--plh-*` tokens so the site paints (closes #38) | yes |
| [#44](https://github.com/Crumbalino/PLHub/pull/44) | 308 the vercel.app alias to the apex | yes |
| [#45](https://github.com/Crumbalino/PLHub/pull/45) | `/deadline-day` stub — structure and schema, no copy | yes |

### T0 — `HomeContent` unplugged (#37)

The front door on the day the site went indexable. Homepage HTML went
**134,818 → 23,060 bytes**, `<img>` tags ~30 screens → **0**, and `horse` /
`racing` / `picsum` → 0. Hero, facts block, club nav and footer all still in
server-rendered HTML.

The email capture was never at risk: it lives in `Hero`, not `HomeContent`.
`/api/subscribe` is alive and validating (400 on bad input, not 500). The success
path was **not** exercised — that needs a real address and is G's step A.4.

### T1 — CLAUDE.md pivot (#39)

The file said the product was to *"score the source"* — the exact inverse of the
pivot. Now states claim-first, the unit being the rumour, the daily column at one
permanent URL, summaries as permanently deprecated, and the locked hero. 201
lines against the ~200 budget.

### Feeds (#40)

Probed before pruning, per the amendment. **7 feeds, all measured producing** —
up from 6 of 9, because Football365 was recovered rather than removed.

| Feed | HTTP | Items | Newest | Action |
|---|---|---|---|---|
| BBC Sport | 200 | 76 | today | keep |
| Sky Sports | 200 | 20 | today | keep |
| The Guardian | 200 | 62 | today | keep |
| ESPN FC | 200 | 21 | today | keep |
| FourFourTwo | 200 | 50 | today | keep |
| The Independent | 200 | 3 | today | **keep** — see contradictions |
| Football365 | 404 → **200 at `/rss`** | 31 | today | **URL corrected** |
| Goal.com | 404 on 7 candidates | 0 | — | removed |
| 90min | 200 | 90 | **11 Aug 2025** | removed |

Goal.com: `/feeds/en/news`, `/feed`, `/feed/`, `/rss`, `/rss.xml`,
`/feeds/news.xml`, `/en/feeds/news` all 404, and the homepage `<head>` has no
`application/rss+xml` link tag. 0 rows ever written.

### Feed failure detection (#41)

Three modes that all used to log `success`: `unreachable`, `empty` (200 with zero
items), `stale` (newest item older than `FEED_STALE_AFTER_DAYS = 14`). Packed into
the existing `cron_logs.error_message`, **no migration**. Filtering down to zero
is deliberately not a failure.

Acceptance tested, not assumed: pointed the rotating feed at a broken URL and got
a real `status: error` row —

```
feed=Football365 reason=unreachable: Status code 404 raw=0 kept=0 newest=none
age_days=n/a url=https://www.football365.com/DELIBERATELY-BROKEN-ACCEPTANCE-TEST
```

**That 15:29:21Z row in `cron_logs` is my test, not a Football365 outage.** Left
in place as evidence; delete it if you want the table clean. 7 tests pass.

---

## What I skipped, and why

### Item 3 — deleting the 211 orphaned rows: SKIPPED

The instruction was to delete after confirming no route renders them, and to skip
if one does. **One does**, so nothing was deleted.

- 211 rows total: 130 `talkSPORT`, 81 `90min`
- **92 survive `filterPLContent`** at read time (49 talkSPORT, 43 90min)
- **31 of those carry a `club_slug`**, so they are inside the club-page query set

Confirmed on production, not inferred:

- `/api/feed?club=nottingham-forest&page=2` renders *"Nottingham Forest coach
  requires stitches after overenthusiastic goal celebration"* (90min)
- `/api/feed?club=crystal-palace&page=2` renders *"Dean Henderson: Crystal Palace
  star pays for £1,000 of drinks at pub for jubilant fans"* (90min)

They are absent from page 1 only because they sort deep by `published_at`.

**This needs a decision I did not have cover for:** the rows are live indexed
content from a publisher dropped for gambling ad content (talkSPORT) and a feed
frozen since Aug 2025 (90min). Skipping the delete leaves them served. The safe
version is probably to null their `club_slug` or delete only the 92 that survive
the filter — both are data changes beyond the approved scope.

### T2 — nine overnight branches: VOID

They do not exist. Exhaustively checked: 6 non-`main` branches, **4 of them 0
commits ahead of `main`** (already merged; their apparent diff is `main` being
ahead). No closed-unmerged PRs, no stashes, no other worktrees.

Only genuinely unmerged work: `feat/claim-extractor` (3 commits, 1,339 lines —
explicitly parked by the brief) and `chore/parked-migrations` (3 migration files,
not in T2's list).

Every one of the nine described concerns — `cron_logs` honesty, empty catch
blocks, ILIKE collapse, relevance filter #21, phantom tables, Supabase types,
stadium aliases, dead code — would have to be **written from scratch**, not
triaged. #41 covers the `cron_logs` honesty concern for the RSS job only.

### T4, T6 — not reached

Not in the approved batch. T4 (delete dead sidebar widgets) and T6 (draft
`/about`, `/how-it-works`, `/principles`) remain open. #42 corrected only the
source list on `/how-it-works`; the PLHub Index, the AI-summaries description and
the gambling position are all still wrong on that page.

---

## Things that contradict the docs

Listed worst-first. Each was measured.

### 1. `--plh-*` was never declared anywhere — 67 usages, 0 declarations

The brief said the March token migration "stopped before reaching `HomeContent`",
implying a local problem. **The token set was not declared in the entire
codebase** — not `globals.css`, not `tailwind.config.ts`, not inline, not
`theme-context.tsx`. The served stylesheet had zero declarations.

So the "white background overriding the dark theme" was not an override.
**Nothing painted the ground at all**, sitewide, including the locked Hero and
every club page. Filed as #38, fixed in #43 from
`Brand ID/plhub-brand-v2.html` §17, corroborated by four exact matches in
`tailwind.config.ts`. 18 tokens declared; **5 deliberately left undeclared**
(`--plh-text-70/-50/-75`, `--plh-border-hover`, `--plh-text-base`) because the
§17 scale is 100/80/60/40/25 and inventing intermediate values would be designing
rather than mapping.

`DESIGN_SYSTEM.md` §5.1 was **not readable** — not in the repo. If §5.1 disagrees
with the Brand ID file, §5.1 wins and #43 is wrong.

### 2. The brief is wrong about The Independent

Described as the nastiest of the three dead feeds: *"returns valid RSS with zero
items — 200 OK, well-formed, empty."* Measured: **200, 3 items, newest 14:31 that
afternoon, 514 rows written.** Thin, not dead. **CLAUDE.md had this right and the
brief did not.** Kept, with a comment saying why.

### 3. Goal.com and Football365 were not the same case

Both docs treat them as one class ("404 and have never written a row"). True of
Goal.com. **Football365 has a working feed at `/rss`** serving 31 transfer items.
The publisher was alive and the configured path was simply wrong — which is why
the probe amendment mattered.

### 4. Sky Sports was exempt from staleness detection

Sky serves `Fri, 07 Aug 2026 15:21:00 BST`. RFC-822 defines no `BST`, so V8
returns `Invalid Date`, every Sky item parsed as undated, and **an undated feed
can never be measured stale.** Found by the test written for #41, fixed in the
same PR (`parseFeedDate` maps only observed offsets: BST, GMT).

### 5. CLAUDE.md was wrong about production in three places

Corrected in #39:

- **"`SITE_NOINDEX` currently `true` on Production and Preview."** Production
  serves `<meta name="robots" content="index, follow">` and `/robots.txt` with
  `Allow: /`. Preview not measured.
- **"`page.tsx` is a client component."** It is a server component.
- The consequent claim that the root canonical is inherited from a client page.

### 6. CLAUDE.md contradicts itself on RSS cadence

The Ingest section says RSS is "polled every 135 min"; the Cron section says
"enabled, every 15 min (96 runs/day)". The code computes
`runIndex = floor(Date.now() / (15 * 60 * 1000))`. **Not corrected — I had no
grounds to pick**, since the real cadence lives in the cron-job.org dashboard.

### 7. `/how-it-works` advertised a source dropped for gambling ads

The live Sources paragraph named **talkSPORT** — removed from `FEEDS` in
`1159257` *"due to gambling ad content"*, which EDITORIAL_VOICE §8 rules out —
and **Goal.com**, whose feed 404s and has never written a row. It also said "We
aggregate": a "we" where there is one person (§7), describing the deprecated
product. Fixed in #42.

### 8. The batch said six live feeds; there are seven

Football365 was recovered in #40 rather than removed, so the count moved 6 → 7
after the instruction was written. `/how-it-works` lists seven. Naming six would
have omitted a real producing source.

### 9. T5's `vercel.json` item was already done

Deleted in `332cfa9`. Nothing to strip. CLAUDE.md agrees.

### 10. `/deadline-day` is now the first page to override `robots`

CLAUDE.md's SEO section says "No page overrides `robots`". #45 does, deliberately
(`noindex, follow` on an empty shell, and out of the sitemap). **That CLAUDE.md
line is now one page out of date** — not edited, because it belonged to a
different PR's concern.

### 11. The 8 Aug brief parks `/deadline-day`

The "Do not touch" list parks it; the approved batch commissioned it. The
approval won. Recording the override rather than acting on it silently.

---

## Found tonight, not tracked, not fixed

None of these were in scope. Listed so they are not lost.

1. **`getFeed` pagination skips rows.** `offset = (page - 1) * fetchLimit` where
   `fetchLimit = limit * OVERFETCH_MULTIPLIER`, but only `limit` rows are
   returned. With `limit=20` and the overfetch multiplier, rows between `limit`
   and `fetchLimit` are **never served on any page**. Part of the table is
   unreachable through the API.
2. **`/api/health` returns 503 and has nothing to do with ingest.** It fails on
   `table_data` ("No standings data found") and `fixtures_data` ("No fixtures
   data found") — the dead sidebar widgets from T4 — plus a 0% summary-coverage
   *warning* for a feature that is permanently off. Ingest itself is healthy
   (95 stories/24h, latest 39 min old at the time of reading). As written, this
   endpoint can never go green, so it cannot be used as a monitor.
3. **`PageLayout` hardcodes `color: '#FFFFFF'`** on the subheading paragraph —
   white on near-white in light mode.
4. **The duplicate-update path refreshes `fetched_at` on every run**
   (`src/app/api/cron/rss/route.ts:116`). This is the exact mechanism that made
   90min's Aug-2025 rows look like they arrived today.
5. **`isRelevantToPL()` is defined and never called** (`route.ts:16`) — an
   Anthropic client and a full prompt, dead. Related to #21.
6. **13 sequential full-table `ILIKE` deletes per run** (`route.ts:73–75`),
   ~96 runs/day. This is #9, still open.

---

## Not verified, and needs a human

- **`getComputedStyle(document.body).backgroundColor`.** The one T0 acceptance
  check I could not run: the Chrome extension is not connected in this session.
  The served stylesheet now declares `--plh-bg: #0d1b2a` and
  `body{background:var(--plh-bg)}` with trivial specificity, so the computed
  value follows — but nobody has looked at it with an eye.
- **The `/api/subscribe` success path**, which needs a real address (G's step A.4).
- **Whether `/how-it-works` is now fully true.** Only the source list was
  corrected.

---

# Session log — part 2 (same day, 7 Aug 2026)

Second batch of approved work: `next` patch bump, eslint gate, dependency
review, issue hygiene.

## What shipped

| PR | Title | Verified live |
|---|---|---|
| [#46](https://github.com/Crumbalino/PLHub/pull/46) | `eslint-config-next` as the base gate | n/a (tooling) |
| [#47](https://github.com/Crumbalino/PLHub/pull/47) | next 14.2.29 → 14.2.35 | yes |

### next 14.2.29 → 14.2.35 (#47)

Patch only, same minor, no code changes alongside it. **The app was six patches
behind on its own minor line.**

`npm audit` proposes `next@16.3.0` and calls it breaking, which overstates the
requirement — 14.2.35 is a drop-in. Advisories against `next`: **27 → 21.**

Verified on production after deploy: homepage 200 at 23,210 bytes, hero + facts
block + email field + footer all present, `index, follow` intact, `--plh-bg`
still declared in the served CSS, and `/`, `/how-it-works`, `/privacy`,
`/principles`, `/about`, `/clubs/liverpool`, `/deadline-day`, `/sitemap.xml`,
`/robots.txt` all 200. The vercel.app 308 from #44 still in place.
`/api/health` still 503 — pre-existing, see below.

### eslint gate (#46)

`eslint` 8.57.1 and `eslint-config-next` 14.2.29 were **both already installed
with no config file at all**, so `next lint` sat on an interactive prompt and
never ran. That is why CLAUDE.md called build "the only working gate".

`.eslintrc.json` extends `next/core-web-vitals`. Nothing else. **Existing
violations not fixed, per instruction** — 14 across 8 files:

| Count | Rule | Severity |
|---|---|---|
| 7 | `react/no-unescaped-entities` | **Error** |
| 7 | `@next/next/no-img-element` | Warning |

`eslint.ignoreDuringBuilds: true` was necessary, not a dodge: Next runs ESLint
during `next build`, and I verified those 7 errors **fail the build**. Adding the
gate without the flag would have blocked every deploy on an indexed site over
straight quotation marks. Tracked as #52, with a note that four of the eight
files are in the T4 dead-widget set and may resolve by deletion.

---

## Dependency review — report only, no patches beyond the approved bump

### Next.js CVEs

On **14.2.35**, 21 advisories remain against `next`, none fixed anywhere in the
14.x line. Grouped by surface, with whether this app has that surface:

| Surface | Count | Applies here? |
|---|---|---|
| Server Actions / RSC | 7 | **No** — no `'use server'` anywhere in `src` |
| Middleware / rewrites / i18n | 4 | **No** — no `middleware.ts`, no `rewrites`, no `i18n` |
| Cache poisoning / confusion | 4 | Partly — App Router RSC behind Vercel's CDN |
| Image optimizer | 3 | **Yes** |
| CSP-nonce XSS, `beforeInteractive` XSS, WebSocket SSRF | 3 | No nonces, no `beforeInteractive`, no WS upgrades |
| Dev-server origin verification | 0 | **fixed by the bump** |

**The image-optimizer three are the ones that land.** `/_next/image` answers on
production (400 on a disallowed host, so the optimizer is running) with **15
`remotePatterns`** — and **no rendered page imports `next/image`**:
`MatchTicker` is rendered nowhere and `ClubFilterBar` only lived inside the
unplugged `HomeContent`. Three of the allowed hosts are publishers no longer
ingested at all (`*.talksport.com`, `*.90min.com`, `images.goal.com`). Filed as
#55 with a no-upgrade mitigation path. **Not patched.**

### npm audit

**14 vulnerabilities: 1 low, 13 high, 0 critical.** Nothing patched.

| Package | Severity | Direct | Note |
|---|---|---|---|
| `next` | high | yes | 21 remaining, see above |
| `sharp` <0.35.0 | high | no | inherited libvips CVEs (`CVE-2026-33327/33328/35590/35591`); fix is breaking |
| `ws` 8.0.0–8.20.1 | high | no | uninitialized memory disclosure + memory-exhaustion DoS; **non-breaking fix available** |
| `brace-expansion` | high | no | 5 DoS advisories |
| `minimatch`, `picomatch`, `glob`, `js-yaml`, `flatted`, `form-data`, `postcss` | high | no | transitive, mostly ReDoS/DoS |
| `eslint-config-next`, `@next/eslint-plugin-next` | high | yes/no | tied to the `next` version line |

Nearly all of the non-`next` entries are **build/dev-time transitives** (glob,
minimatch, picomatch, js-yaml, flatted, brace-expansion) rather than request-path
code, which is worth weighing before anyone runs `--force`. `ws` is the one with
a clean non-breaking fix. `npm audit fix --force` would pull `next@16.3.0` and
`sharp@0.35.3` — both breaking, neither approved.

---

## Issue hygiene

All 16 previously-open issues verified against the live system. **4 closed, 12
commented.** Plus #38 closed by #43. Open count went 16 → 20 because 8 new
issues were filed.

### Closed

| # | Reason |
|---|---|
| **#3** Summary backfill has no scheduler | **won't-do.** Summaries permanently deprecated; `CURRENT_STATE-1.md` §2 explicitly recorded as superseded so it is not reopened |
| **#12** Three of nine feeds return nothing | Fixed by #40. Each of the three was a *different* problem — Goal.com dead, Football365 recoverable, 90min frozen |
| **#15** Feed failures are unobservable | Fixed by #41 for `rss_fetch`, with the acceptance test result quoted. Scope limit recorded: other cron handlers still hardcode status |
| **#16** Two-signal club classification | Verified against the acceptance criteria — see below |
| **#38** `--plh-*` never declared | Fixed by #43 |

**#16 in detail**, since it was the one requiring real verification:

- Mechanism holds: `REQUIRED_SIGNALS = 2`, `return null` below threshold,
  ambiguous tokens never signals, plus a veto list for wrong-sport collisions.
  Wired into ingest at `rss.ts:340`.
- **Signal set deliberately differs from the acceptance list.** The criteria name
  "player name via squad list, manager name"; the code uses name / URL slug /
  stadium / nickname. `manager` was removed as point-in-time (load-bearing for
  487 of 4,700 before removal; five managers moved between PL clubs in summer
  2026) and squad lists are excluded for the same reason. **A stronger
  constraint than the criteria, not a shortfall.**
- **The ~14,900 unclassified rows are the rule working, not a backfill gap.**
  Sampled 3,000 rows stored as `club_slug IS NULL` — 1,000 newest, 1,000 oldest,
  1,000 at offset 7,000 — and re-ran `classifyClub()`. **1 of 3,000 would
  classify** (0.03%), and that one is a Reddit match thread naming two clubs.
- **One number I could not reconcile:** the file header claims the rule
  classified 30.9% of 19,447 posts; live is 23.9% of 19,567 (4,680 classified).
  A ~1,300-row gap that 120 posts of corpus growth does not explain. My sample
  found no evidence of a backfill gap, so I flagged the discrepancy rather than
  asserting either figure.

### Re-scoped

- **#24 club identity** — **reduced, not closed.** Slugs *are* reconciled:
  `man-united` and `nottm-forest` now have **0** references in `src`, and `spurs`
  appears only as a nickname mapping to `tottenham`, never as a slug. But the
  cause is intact: **`clubs` table 25 slugs, `src/config/clubs.ts` 22,
  `src/lib/clubs.ts` 21**, with `leeds-united` in one and not the other. Three
  hand-maintained lists plus the matcher's own tables.
- **#11 email digest** — **two of three blockers gone.** All three Resend vars
  are now set in Production (~7h ago), and `/api/subscribe` returns 400
  validation rather than 500. Re-scoped to the one remainder: **the digest cron
  is not registered with cron-job.org**, and `vercel.json` cannot come back.
  I did **not** exercise the success path — that needs a real address.

### Left open with a recorded reason

**#5** (club/cluster cron disabled) and **#6** (Reddit/YouTube dormant) both got
comments stating they are deliberately dormant and downstream of decisions not
taken, so they stop reading as neglect. Also commented with verified current
state: **#2** (rotation comment now wrong in a third way — 7 feeds means ~105
min, not ~75; and there is still no catch-up for a missed run), **#4**
(scraper still present; the "non-scraping backfill" option is now dead because
#3 closed won't-do, so the action is a joint deletion), **#9** (`CLEANUP` has
**12** entries not 13 → 1,152 full-table `ILIKE` deletes/day; and three
different places now decide what is non-football), **#13** (moot in practice —
coverage is 0% everywhere, not 100%-Guardian; the durable insight is that
`summary IS NULL` carries no signal), **#14** (7 feeds, still no red tops;
talkSPORT is the cautionary precedent), **#18** (still hardcoded null, now dead
code — do not "fix" it by re-enabling summaries), **#20** (extractor constraints
still accurate; the club-attribution warning now matters more given #16).

### New issues filed

| # | Title |
|---|---|
| **#48** | 211 rows from removed sources still served on club pages |
| **#49** | `getFeed` pagination skips rows — part of the table unreachable |
| **#50** | `/api/health` can never return 200 |
| **#51** | Duplicate ingest refreshes `fetched_at`, so stale rows look fresh |
| **#52** | ESLint backlog: 14 violations, gate decoupled from build |
| **#53** | `PageLayout` hardcodes `#FFFFFF` — invisible in light mode |
| **#54** | CLAUDE.md stale on Resend env vars and the robots override |
| **#55** | Image optimizer exposed with 15 remotePatterns, no consumer |

#53 is a **new** consequence of #43: before the token shim nothing painted the
ground, so a hardcoded white subheading was invisible only in theory. Now that
light mode paints `#F8F9FB`, it is a real defect on five pages.

---

## Still outstanding at the end of the session

- **T4** (delete dead sidebar widgets) and **T6** (draft `/about`,
  `/how-it-works`, `/principles`) — never in an approved batch. `/how-it-works`
  still describes AI summaries, the PLHub Index and a moved gambling position;
  #42 corrected only the source list.
- **#48** — the conditional delete I did not run. 211 rows still served.
- **G's manual steps**: Search Console property + sitemap + indexing requests,
  the `robots.txt` AI-crawler check, the real-address signup test, and the ten
  column items.
- **`getComputedStyle(document.body).backgroundColor`** still unverified by a
  human — the Chrome extension was not connected in this session.

---

# Session log — part 3 (same day, 7 Aug 2026)

Two approved follow-ups: the missing opacity tokens, and the re-approved delete.

## Opacity tokens declared (#57) — verified live

#43 left `--plh-text-70` and `--plh-text-50` undeclared because Brand ID §17 only
documents a 100/80/60/40/25 ramp, and inventing intermediate steps would have been
designing rather than mapping. **DESIGN_SYSTEM §5.2 supplied the actual rule:
hierarchy is opacity on textBase, never a grey hex.**

| Mode | textBase | `--plh-text-100` | `--plh-text-70` | `--plh-text-50` |
|---|---|---|---|---|
| Dark | `#FAF5F0` | 100% | **70%** | **50%** |
| Light | `#1A1D23` | 100% | **75%** | **65%** |

Light carries more opacity than dark for the same perceived hierarchy — §5.2's
spec, not a transcription slip. `rgba()`, matching the existing shim's form.

**Verified on the served stylesheet after deploy** (`916a95e02da75f4e.css`),
per selector block:

```
:root    100=#faf5f0   70=hsla(30,50%,96%,.7)   50=hsla(30,50%,96%,.5)
.light   100=#1a1d23   70=rgba(26,29,35,.75)    50=rgba(26,29,35,.65)
```

`hsla(30,50%,96%)` is cssnano's rewrite of `#FAF5F0` — same colour. Token count
18 → **20**. Both consumers confirmed still wired in the live CSS:
`.tfh-hero-name{…color:var(--plh-text-70)}` (the "The Football Hub" line) and
`.tfh-hero-awards{…color:var(--plh-text-50)}` (the Balloon Door Awards line).

Standing caveat unchanged: I can verify the declarations, the values and the
consuming rules in the served stylesheet, but not `getComputedStyle` — the Chrome
extension is not connected in this session.

### A doc conflict found doing it, left as found

**Brand ID §17 and DESIGN_SYSTEM §5.2 disagree about light-mode text.** §5.2 names
`#1A1D23` as the light textBase, but the `80/60/40/25` steps §17 supplied verbatim
use `rgba(13, 27, 42, …)` — that is `#0D1B2A`, the navy.

So the light ramp is now **mixed**: 100/70/50 on `#1A1D23`, 80/60/40/25 on
`#0D1B2A`. I did not restate the other four — §5.2 governed only the two tokens
approved here, and silently rebasing the rest would be a design change smuggled
into a token fix. Recorded in `globals.css` for whoever holds both docs.

`--plh-text-75` also still undeclared: 75 is not a step on the dark ramp and
borrowing light's 75% would be guessing. One hover state in `SortTabs`. Along with
`--plh-border-hover` and `--plh-text-base`.

## The 211 orphaned rows: deleted (#48 closed)

Re-approved after the condition was clarified — the original hold was about
per-story pages 404ing, and `/api/feed` is a paginated list, so removing rows
shortens the list rather than breaking a route. **Item 3 from part 1 is no longer
a skip.**

```
DELETE /rest/v1/posts?subreddit=in.(talkSPORT,90min)   →  200, content-range: */211
```

| Metric | Before | After |
|---|---|---|
| `posts` total | 19,567 | **19,356** (−211 exactly) |
| `talkSPORT` | 130 | **0** |
| `90min` | 81 | **0** |
| of those with `club_slug` | 36 | **0** |

A full backup of all 211 rows (every column, 277 KB JSON) was taken immediately
before the delete. Both rows that were provably rendering are gone, checked the
same way they were found: `/api/feed?club=nottingham-forest` no longer serves
"…coach requires stitches…" and `?club=crystal-palace` no longer serves the Dean
Henderson row. `/`, and the nottingham-forest, crystal-palace, liverpool and
chelsea club pages all still 200.

Remaining feed names in `posts`: BBC Sport, Sky Sports, ESPN FC, The Guardian,
FourFourTwo, The Independent. No orphaned source names left.

### The club-page counts did not move, and that is #49 proving itself

| Club | Before | After |
|---|---|---|
| nottingham-forest | 21 | 21 |
| crystal-palace | 28 | 28 |
| chelsea | 143 | 143 |
| liverpool | 200 | 200 |

`getFeed` advances its offset by `fetchLimit` while returning only `limit` rows,
so the corpus holds more rows than the API can expose. Deleting rows deep in the
list promotes rows that were previously skipped, and the page-walk total stays
flat.

**The flat counts are not evidence the delete failed** — the database counts and
the two per-row checks establish that it worked. They are evidence that
page-walking `/api/feed` cannot measure content volume, which is the substance of
#49.

## Corrections to my own earlier reporting

- **My first deploy check for #57 gave a false pass.** It grepped for
  `plh-text-70`, which matches the pre-existing `var(--plh-text-70)` *usage*, so
  it succeeded against the older build and I briefly read 18 tokens as a failed
  deploy. Re-polled on the declaration (`--plh-text-70:`) and got the real
  deploy. Worth knowing for any future check of this kind: **grep the
  declaration, never the token name.**
- Part 1 recorded 31 rows carrying `club_slug`; the correct total was **36** (17
  talkSPORT + 19 90min). 31 was the count *among the 92 that survive
  `filterPLContent`* — a different set, correct in its own sentence but easy to
  misread.

## Final state

- **13 PRs merged today:** #37 #39 #40 #41 #42 #43 #44 #45 #46 #47 #56 #57, plus
  this log.
- **Issues:** 6 closed (#3 #12 #15 #16 #38 #48), 12 verified and commented,
  8 filed. 19 open.
- **Nothing from the approved batches is now outstanding.** Still not started
  because never approved: T4 (delete dead sidebar widgets) and T6 (draft
  `/about`, `/how-it-works`, `/principles`).
