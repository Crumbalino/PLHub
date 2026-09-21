# Handoff — design chat → engineering chat

**26 August 2026.** Everything this chat produced, in order. It started as design work and drifted into repo surgery, which is why it's being handed over.

**Read §4 and §5 first if you're short of time.** Those are the live findings and the outstanding work.

---

## 1 · Design work (no repo impact)

Brand and visual exploration only. Nothing here touched code.

1. Reference research — Smörgåsbord (Ajax, BBC Football), Barkas (Common Goal), DesignStudio (Premier League numerals). Category conclusion: everyone defaults to shouty italic sans, dark navy, neon accent.
2. Mark exploration — ~50 concepts across six rounds. Turnstiles, floodlights, monograms, brackets, slashes, dots, register marks.
3. **Two name collisions found and killed:**
   - **Slash Football** — G nearly renamed the product and had `slashfootball.uk`/`.co.uk` in a 123-reg cart. An active UK football brand already owns it: 3.3M Facebook, 46K Instagram, YouTube channel, brand deals. Not bought. Dead.
   - **Fantasy Football Hub** — established paid FPL product marketing itself as "the Hub", national-press bylines, beehiiv newsletter. Rules out an FPL destination.
4. Colour — four palettes with measured WCAG ratios. Key findings: pure white on pure black (21:1) causes halation and is the wrong target; FPL owns green→cyan gradients (`#00FF87 → #02EFFF`) and we consume their API, so any green-cyan ramp reads as affiliation; desaturating to hit contrast targets produced pastels and khaki, both rejected.
5. **Typeface decided: Atkinson Hyperlegible Next + Atkinson Hyperlegible Mono.** Both on Google Fonts. Next shipped 2025 with seven weights and a variable version; the mono sibling is built for table alignment. Commissioned by the Braille Institute, engineered so no two characters can be confused. Solves scanning, tables and the no-dim hierarchy in one family. h1 sits at weight **300**, not 800 — a wide face goes lumpen when large *and* heavy.
6. Type scale: h1 44/29 mobile · h2 26/20 · h3 20/18 · body 17/16 · small 15/14 · label mono 11 caps 0.2em · data mono 13 tabular. Breakpoint 640px.

**Design decisions still open:** the mark itself, and the final accent hue (amber `#F0A32A` vs spring green `#22E08A`, with green reserved for `CONFIRMED` either way).

---

## 2 · Prototypes produced (HTML, throwaway)

- `tottenham.html` v1.0 — reference implementation of the design system in context
- `tottenham-v2.html` — added the change band, reversed column order, real link-outs
- `tottenham-v3.html` — rebuilt on the movement primitive; includes the quiet-day state
- `tfh-expression.html` / `-v3.html` — 7 then 10 scenarios: transfer movement, derived insight, match approaching/in-progress/finished, cross-club effect, FPL adjacency, serious news, correction, mobile

Reference implementations, **not canon**. The two governing documents win.

---

## 3 · Documents written or changed

| File | State |
|---|---|
| `THE_FOOTBALL_HUB.md` | **v1.1, merged in place.** Added §1.5 (what the product believes), §15.5 (accounts decided, in), split broadcast vs transactional sending in §11, extended §16, two new open items |
| `CATCH_UP_WINDOW.md` | v2.0. Superseded by the LOCKED file below — **delete it** |
| `LOCKED_catch_up.md` | **20 canonical decisions.** Paste into `PAGE_SPEC.md` |
| `PRODUCT_LEARNINGS.md` | Thesis, 12 principles, state model, dependency graph, FPL verdict, 20 test scenarios, 10 open questions |
| `PARKED_fpl_lens.md` | v2. FPL is a lens, not a destination. Parked |
| `PRINCIPLE_16.md` | Ideas are cheap, architectural changes are expensive. For `PRODUCT_LEARNINGS.md` §2 |
| `BRAND_FOUNDATION_v2.md` | The register, "I'd know", *everything moves, the form doesn't* |
| `BUILD_STATUS.md` | Placed at repo root by Claude Code |

**Principles added:** 13 (FPL is a lens), 14 (build the state once), 15 (never add a job to preserve optionality; never discard data a job already has), 16 (architectural changes are expensive).

---

## 4 · Code written, and where it stands

**Placed in the repo, on branch `feat/state-model`, 52 new tests passing, 418 total, build clean:**

- `src/lib/movement/types.ts` · `score.ts` · `diff.ts` — movement scoring and the catch-up diff. Pure, framework-free, no Supabase import. `ancestorsOf` and `eventsSinceSeen` are **injected as functions** — do not wire a client into `diff.ts`, that's what makes it testable without a database.
- `src/lib/derive/engine.ts` — six derivation rules with refusals, suppression and audit trail.
- Tests at `src/lib/__tests__/` (not `tests/` — `npm test` globs that exact path).

**`migrations/2026-08-26-state-model.sql` — SHELVED. Do not apply.** It's on the branch as a design artefact only. Reasons in §5.

**Verified facts encoded in the engine:**
- PL accumulation thresholds are 5 by match 19, 10 by 32, 15 by 38. Verified against regulations, not remembered.
- **PL yellow cards do not carry into the FA Cup or EFL Cup.** Red-card suspensions do. So "one booking from missing the next match" is only true when the next fixture is a league game. The engine checks competition.
- **Centre-back is not derivable.** FPL provides four position buckets only (GKP/DEF/MID/FWD) and no free source is finer. The engine *refuses* rather than approximating.

---

## 5 · Live findings — the important part

All read from the live system by Claude Code, not from documentation.

### The state model conflicts with the real schema, and it's my error

I designed it against `PAGE_SPEC_1.md` and `THE_FOOTBALL_HUB.md` with no repo access. The live schema has `claims`, `clubs`, `players`. My migration adds `claim`, `club`, `player`. Three parallel registries for three core entities.

**The `claim` conflict is a grain disagreement, not a column gap:**
- Live `claims` = one row per **extracted assertion**. Post-scoped (`post_id` NOT NULL), 29 columns, six FKs.
- My `claim` = one row per **story**, with `state_version`, `outlet_count`, `merged_into`.

**Proposed fix, unimplemented:** these are two levels of one hierarchy and the live schema is missing the top. `thread_id` and `echoes_claim_id` are already reaching for a cluster entity without having one — a column standing in for an entity, which is principle 16's exact failure. So: add a `story` table, add `claims.story_id`, leave `claims` untouched. `club`/`player` become `ALTER TABLE`s adding `fpl_id` and `position_bucket`. Don't rename `display_name` → `web_name`; adapt the code instead.

**`claim_source` should die.** Six of eleven columns are redundant — `posts.url`, `posts.published_at`, `posts.fetched_at`, `outlets.domain`, `outlets.tier`, `posts.byline_raw`. And it inverts a relationship that already exists, since `claims.post_id` is NOT NULL. Only three columns are new: `content_hash` and `withdrawn_at` belong on `posts`; `cites_other_outlet` is already covered by `claims.origin` / `origin_source_id`. The genuinely new content is **one unique index on (story, domain)** — one corroboration per domain, ever, which is what stops five Sky articles counting as five outlets.

### The bigger finding: extraction has never run

**19,742 posts. 0 claims. 0 players. 0 `outlet_id`. 0 `story_cluster`. 0 sources.**

Diagnosis, precise:
- `extractClaims()` **exists** but has **no caller** — no route, no script, no cron.
- It has **no writer** — nothing persists its output. It returns into the void.
- It's on an **unmerged branch, 20 days stale**.
- Its own commit message (21bbc57) depends on a **migration that was never written**: drop the global UNIQUE on `player_aliases.alias`, make `claims.player_id` nullable. Live `claims.player_id` is NOT NULL, so the code and the database directly contradict each other.
- `ANTHROPIC_API_KEY` is present and is **not** the blocker.

**So `state-model.sql` would add a second claim table to serve a pipeline that has no writer for the first one.** That's why it's shelved. It's the wrong layer.

### Two operational findings

- **Only 5 of 10 cron routes call `logCronJob`** — `digest`, `post-match-stats`, `run-migration`, `source-detection`, `stats-refresh` are silent. This is how the RSS pipeline died unnoticed for 17 days. Absence from `cron_logs` proves nothing for those five.
- **The Football365 feed 404s on every `rss_fetch` run.** One-line fix, and it's the 9% of post URLs that don't resolve to a seeded outlet.

### What is actually healthy

Ingest. 11,783 runs, 682:1 success, 19,742 posts, still firing every 15 minutes. Twenty club pages templated. PR #79 open and unmerged (301 redirects `/clubs/*` → root slugs). 418 tests. Build clean.

---

## 6 · Cost warning — read before wiring extraction

Extraction spends API credit: one call per post, and there are 19,742 posts sitting there. A backfill triggered as a side effect of turning the pipeline on is a real bill.

This has happened before on this project — spend went unnoticed because nothing surfaced it.

**Guards to encode, not to remember:**
- Forward-only. New posts from ingest, roughly 1–4 per 15 minutes.
- Hard cap of 20 posts per run, hard-coded, not env-configurable.
- Refuse and log if a run would exceed the cap, rather than proceeding.
- Write a `cron_logs` row every run including the count of API calls made.
- Backfilling the existing 19,742 is a **separate decision requiring an estimated cost first.**

---

## 7 · Recommended order from here

1. Show the unmerged extraction branch — contents, what it touches, whether it merges cleanly. Don't merge yet.
2. Write the missing migration (`player_aliases.alias` UNIQUE dropped, `claims.player_id` nullable). Show the SQL, don't apply.
3. Show what a persistence layer needs: which `claims` columns are NOT NULL, which have no source in the extraction output, where a value would have to be invented. **That last list is the one that matters.**
4. Add `logCronJob` to the five silent routes. Fix the Football365 feed.
5. Wire the caller — extend `rss_fetch`, with the §6 guards.
6. Watch `claims` go 0 → non-zero. That's the milestone.
7. **Only then** revisit the state model, against real rows.

Steps 2–5 are the entire gap between 19,742 posts and a working product.

---

## 8 · One thing worth doing that nobody's asked for

A status photograph, read from the live system rather than from any document: every cron with its last run, every table with its row count, every branch with its state, every env var that's set. Not a plan — a snapshot.

Four sessions have each described this schema slightly differently and there is no single file saying what's true. That's the actual cause of feeling lost, and it's a ten-minute job.
