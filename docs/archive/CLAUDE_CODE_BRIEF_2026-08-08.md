# CLAUDE CODE BRIEF — session of 8 Aug 2026

**Repo:** `Crumbalino/PLHub` · **Deploy:** Vercel `pl-hub-webapp12` · **Live:** https://thefootballhub.uk
**State at handover:** working tree clean, `main` in sync with `origin/main`, no open PRs, several unmerged branches from an overnight run.
**Site went indexable this afternoon.** Everything below is written on the assumption that Google and AI crawlers are reading the site *right now*.

---

## 0. Read before touching anything

In the repo:
- `CLAUDE.md` at root — **note: this is stale.** The pivot update is on an unmerged branch. See T1.

In the project docs (not in the repo — ask G if you can't see them):
- `CURRENT_STATE-1.md` — product, ship order, working preferences
- `DESIGN_SYSTEM.md` v1.0 — **§4 data contract, §6 token rule, §7 routes/layout, §8 blocks.** §6 is the direct cause of T0.
- `EDITORIAL_VOICE.md` v3.0 — governs every string you write. §6 banned language, §7 pronouns, §12 microcopy.
- `SEO_AEO_STRATEGY_v2.md` — §3 site structure, §6 what ships before 1 Sep
- `MONETISATION_BRIEF` — **partially stale.** §5 and §7 superseded. Don't act on it this session.

**Where docs disagree, the 7 Aug handover note wins, then CURRENT_STATE, then the rest.**

---

## 1. Standing rules for this session

1. **Verify against the live system, never the artefact.** Three wrong diagnoses this week came from reading docs and migration files instead of querying the database or the live DOM. Before you fix a thing, confirm the thing is broken. Before you close an issue, confirm the code does what the commit message claimed.
2. **A component that references an undefined token renders invisibly and passes every build check.** `npm run build` passing is not evidence. Verify in the live DOM: `window.getComputedStyle(el).backgroundColor`.
3. **One branch, one PR, one concern.** Don't stack. Don't bundle a drive-by fix into an unrelated PR.
4. **Show the plan and wait** before: anything touching the ingest pipeline, anything writing user-facing copy, anything that deletes a file. **Don't wait** for T0 — it is revert-shaped and urgent.
5. **Flag ambiguity, don't guess.** If two files disagree about what's true, stop and say so.
6. **Scope check.** If a task starts growing new mechanisms, stop and ask: *is this shipping the thing or delaying the thing?* The default answer to any new layer is no. Nothing enters this session that isn't listed below.
7. **No new colours, no new block types, no new scoring inputs, no new page families.** All of those are decided elsewhere and locked.
8. **Screen-record the session** if it's not already running. Raw material, free.

---

## T0 — Unplug HomeContent. Do this first, before reading anything else in detail.

**Why it's first:** the site is indexable as of this afternoon. `HomeContent` was restored today after five months unplugged and is rendering, below the club nav, roughly thirty screens of stacked full-bleed images, a white background overriding the dark theme, unstyled empty widget containers, tiny type and horse racing. That is the current front door for every crawler and for anyone arriving from video 1.

**Cause, for context only — do not fix it now:** DESIGN_SYSTEM §6. The March migration from CSS custom properties to inline TS tokens ran through `StoryCard`, `SnapshotContainer`, `PLTable` (`8b64f7d`), fixtures (`daa8968`) and `ClubFilterBar` (`5f94764`), then stopped. `HomeContent` was never reached. Its tokens are undefined in the live DOM.

**The instruction is removal, not repair.** The repair is the homepage rebuild, which happens after G has written ten real column items and cannot happen usefully before then.

### Steps

1. Locate where `HomeContent` is rendered. Start at the App Router homepage route; don't assume the path.
2. Confirm what sits **above** it in the same tree — hero, facts block, club nav. Those are correct and server-rendered (#27, #29). They stay.
3. Remove the `HomeContent` render from the homepage route. Leave the component file in place — it is the input to the rebuild.
4. `grep` for other imports of `HomeContent`. If any other route renders it, remove those too and list them in the PR body.
5. Confirm the homepage still renders: hero → facts block → club nav → sign-up → footer. If the sign-up or footer lived *inside* `HomeContent`, re-parent them into the route rather than losing them. **Check this explicitly.** Losing the email capture on the day it started working would be the worst possible outcome of this task.
6. Local check at 320px, 768px and 1280px, both colour modes.
7. Commit, PR, merge, deploy.

### Acceptance

- `https://thefootballhub.uk` renders dark ground, no white block, no stacked full-bleed images, no empty widget containers, no horse racing.
- Page height is sane — single screens, not thirty.
- Facts block still present in server-rendered HTML. Verify with `curl -s https://thefootballhub.uk | grep` for a known facts-block string, not in the browser inspector — the crawler sees the former.
- Email field still present and still posting to `/api/subscribe`. Submit a real test address.
- `window.getComputedStyle(document.body).backgroundColor` returns the dark `bg` token value, not white.

**Do not request indexing on anything until this is deployed and verified.**

---

## T1 — Merge the CLAUDE.md pivot update

**Why second:** every subsequent session inherits its context from this file, and right now it's describing a product that no longer exists. Merging it early makes the rest of this session cheaper and every future session cheaper.

1. Check out the overnight branch carrying the CLAUDE.md update.
2. Review it against the five canonical docs. It must correctly state:
   - **Claim-first pivot.** The score is on the rumour, not the reporter. Author track record is an input, never the published product.
   - **The product form:** a daily gossip column with the score inline, at one permanent URL that updates in place. Not a feed, not an archive.
   - **The unit is the rumour, not the article.**
   - **Summaries are deprecated.** `SUMMARIES_ENABLED=false` is deliberate and permanent, not a cost decision and not a bug. Nobody should "fix" this.
   - **The hero is locked** and is not to be reopened: *The Football Hub / Some of this is true. / Transfer gossip. Scored.*
   - Links to `DESIGN_SYSTEM.md` and `EDITORIAL_VOICE.md` rather than restating them.
   - The G byline. Not "Adhdad".
3. Add anything from the list above that's missing. Keep it short — it was cut from 633 lines to 149 in PR 1 for a reason. If your edit pushes it past ~200 lines, you're restating a doc instead of linking to it.
4. Merge.

---

## T2 — Triage the overnight branches

Nine branches ran unattended and none are merged: CLAUDE.md pivot (done in T1), relevance filter #21, the `api_cache` / `by_the_numbers_tiles` phantom tables, `cron_logs` honesty, empty catch blocks, ILIKE scan collapse, Supabase types, dead code, stadium aliases.

**For each branch, in this order, produce a one-line verdict before merging anything: MERGE / FIX-THEN-MERGE / BIN.**

Post the full verdict list before you merge the first one.

### Triage criteria

- **Does it change runtime behaviour on a live, indexed site?** If yes, it needs a live verification step in the PR body, not just a build pass.
- **Does it touch the ingest pipeline?** If yes, it needs a before/after row count from Supabase.
- **Does it delete anything?** If yes, confirm the thing is actually dead by querying the live system, not by reading the migration files. This is exactly how the last four months went wrong.

### Per-branch notes

**Relevance filter (#21)** — highest value of the nine. Cricket, boxing, tennis and horse racing are in the DB and were visible on the homepage. This one also directly helps G: he is about to hand-curate ten column items out of ingest, and every non-football row is friction in that job. Verify it against the live table with a query, not against the test fixtures. Confirm it does not over-filter — check that the two-signal `unclassified` rows survive, because general PL news is in scope for the non-Claim blocks even though only transfer claims get scored.

**ILIKE scan collapse (#9)** — 13 sequential full-table scans running ~1,250×/day. Verify the collapsed query returns the identical set on live data before merging. A perf fix that silently changes the result set is worse than the perf problem.

**`cron_logs` honesty** — currently a hollow 200 that looks like success. This is the observability that would have caught the five-month pipeline failure. Must record items fetched, inserted, skipped, errored, and duration. Merge this even if it's the only thing you merge from the nine.

**Empty catch blocks** — same family. Every swallowed error is a future four-month diagnosis.

**Phantom tables (`api_cache`, `by_the_numbers_tiles`)** — confirm they're genuinely unused by querying, then remove the code that references them. Don't drop the tables in the same PR as the code change.

**Supabase types** — generate and pass `Database` to `createClient`. Low risk, high leverage on everything after.

**Stadium aliases** — this feeds the two-signal classifier. Check it against T5/#16 before merging so the two don't conflict.

**Dead code** — lowest priority. Merge last or defer. Deleting dead code on a live site the day it went indexable is a poor risk/reward.

---

## T3 — Dead feeds (#12) and feed observability (#15)

Three of nine feeds return nothing and the failures are silent.

### Known state, to be re-verified live, not trusted

- Goal.com — 404s silently
- Football365 — 404s silently
- The Independent — returns valid RSS with **zero items** (this is the nastiest of the three: 200 OK, well-formed, empty)
- 90min — 200 with nothing since Sep 2025

Live and believed working: BBC, Sky, ESPN, FourFourTwo, Guardian.

### Steps

1. `curl` every feed URL in the config. Record status code, content type, item count. Put the table in the PR body.
2. Remove or replace the dead ones. **Do not add new publishers in this PR** — feed expansion is a Session 2 decision with an editorial dimension (no red tops, no regional club desks currently). Removal only.
3. Wire failure detection: a feed returning 200 with zero items must log as a failure, not a success. Same for a feed whose newest item is older than N days — pick a threshold, state it in the PR, make it a constant not a magic number.
4. Surface it in `cron_logs` per T2, so a dead feed is visible without anyone going looking.

### Acceptance

A deliberately broken feed URL produces a visible, queryable failure record. Test this — don't assume it.

---

## T4 — Delete the dead sidebar widgets

Already decided in DESIGN_SYSTEM §7: `PLTableWidget`, `FixturesWidget`, `NextFixtures`, `MatchTicker`, `TrendingStrip` render empty containers, are not the product, and *"deletion is cheaper than repair."*

This is not new scope. It is executing a decided thing, and it makes the homepage rebuild materially cheaper because it removes five components the rebuild would otherwise have to reason about.

1. Confirm each is genuinely unused elsewhere before deleting. `grep` per component.
2. Delete the components and their imports.
3. Note in the PR body if any of them was the only consumer of a data fetch — that fetch may also be dead.
4. **`FixturesWidget` caveat:** DESIGN_SYSTEM §8 lists a **Fixture** block ("Next Up", football-data API, live, key set) as a *live* member of the block system. That is a different thing from the sidebar `FixturesWidget`. Do not delete the football-data integration itself, only the sidebar widget. If they turn out to be the same code, **stop and ask** rather than deleting.

---

## T5 — Issue hygiene

The issue list is currently lying about the state of the repo, and a lying issue list is how the last four months happened. This is a cheap, high-value pass.

Work through all 16 open issues. For each: verify against the live system, then close with a reason, re-scope, or leave with a comment recording what you verified.

### Specific ones with known answers

**#16 two-signal club classification** — commit `47c5063` claims the matcher is built, wired into RSS ingest and backfilled. The backfill classified 4,667 of ~19,500 posts. Verify the implementation against the issue's acceptance criteria before closing. Specifically confirm: no ambiguous abbreviation ever matches on its own; two independent signals required (full club name, URL slug, player name via squad list, manager name, stadium name); below two signals writes `unclassified`. If it does all that, close it. If the ~14,800 unclassified rows are a bug rather than the rule working as designed, say so and open a narrower issue.

**#3 summary backfill scheduler** — **close as won't-do.** Inline article summarisation is the deprecated aggregator product. `SUMMARIES_ENABLED=false` is deliberate. Record the reason in the closing comment so nobody re-opens it in three months. CURRENT_STATE §2 says "re-enable a summary job" — that instruction is superseded; note that too.

**#24 club identity, five disagreeing sources of truth** — club slugs were reconciled across DB, code and URLs today. Re-verify, then close or reduce to whatever genuinely remains.

**#11 email digest has never fired** — email capture via Resend went live and was tested end to end today, but the *digest cron* is a separate thing and is not in cron-job.org at all. Confirm which half of this issue is fixed and re-scope it to the remainder.

**#5 club/cluster detection cron disabled** and **#6 Reddit/YouTube ingest dormant** — leave open, do not enable. Both are downstream of decisions not taken. Add a comment recording why they're deliberately dormant so they stop reading as neglect.

**#9, #15, #21** — close if the T2/T3 merges cover them.

### Also

`vercel.json` still declares five crons that never registered on Hobby tier. Dead config that reads as live config. Strip it, and put a one-line comment in the repo recording that cron-job.org is the real scheduler.

---

## T6 — Draft the three wrong pages

`/about`, `/how-it-works` and `/principles` are live, crawlable and factually wrong. They describe AI summaries, the PLHub Index and a gambling position that has moved.

**Produce drafts in a PR for G to review. Do not merge copy without a go.** EDITORIAL_VOICE v3.0 governs every sentence — read §4 (Frame → Justify → Pivot → Land Cold), §6 (banned language), §7 (pronouns) and §11 (the writer's test) before writing a word.

### `/how-it-works` — do this one first, it's the most valuable page on the site

SEO_AEO §3 upgrades this from a footnote to a primary asset: it is the highest-originality page the site will have, because a pre-registered, dated scoring methodology does not exist anywhere else in this space — every competing transfer-reliability guide is a subjective crowdsourced tier list.

Must contain:
- What gets scored: **transfer claims only.** Team news, business, sponsorships and UEFA content appear on the site and are never scored, because there is nothing to resolve.
- The score is **on the rumour, not the reporter.** State the distinction explicitly: it describes how well-sourced a claim is, not whether the transfer will happen.
- **The five inputs**, named: contextual data (`window_state`, `pairing_history`), conflicting reports, initial poster authority, breadth of coverage (independent outlets, collapsed by attributed origin), quality of coverage (specificity and attribution).
- **Which are live now and which are not.** At launch it runs on `window_state`, conflicting reports, breadth and quality. Track record switches on after one window closes. `pairing_history` switches on once clustering ships. **Say this plainly** — it is the honesty that makes the page citable, and hiding it would be the one thing that discredits the product.
- **Balloons, inverted.** More balloons = worse sourced. Not a percentage, not odds.
- **The AI honesty line**, stated once, here and nowhere else: *"The extraction is automated against rules I set. The judgement is mine."* No badge on every item, no disclaimer theatre.
- **Corrections policy.** In place, dated, what was wrong and what's right. Never quietly edited.

Remove entirely: AI summaries, the PLHub Index, anything implying a per-journalist reliability rating.

### `/principles`

- Commercial policy. **EDITORIAL_VOICE §8 is current and MONETISATION_BRIEF §5 is stale.** Current position: no gambling or affiliate content; odds movements reportable only from real publishers, never from a betting or affiliate source, and never with a price a reader could act on.
- Privacy posture is a genuine differentiator now and should be said plainly: GA and Microsoft Clarity removed, zero trackers, no cookies. `/privacy` already carries the subheading *"What this site knows about you, which is almost nothing."* — keep the two pages consistent, don't duplicate them.
- No "we" as the organisation. There is one of you. EDITORIAL_VOICE §7.

### `/about`

- Persona story once. **First person** — this is one of the three places "I" is correct.
- Voice on everything, face on some things, **biography on almost nothing.** If the draft runs long, it's wrong.
- The test for every line: *would this still be interesting if nobody knew who wrote it?*

### Acceptance for all three

Run every sentence through EDITORIAL_VOICE §11. No exclamation marks. No "it remains to be seen". No "massive blow". Nothing invented. Ends cold.

---

## 2. Do not touch

Parked deliberately. Starting any of these is scope creep, regardless of how ready it looks:

- **Claim ledger wiring.** Schema is applied, zero rows. Leave it.
- **Extractor merge.** Written and tested, unmerged and unwired. Leave it.
- **Source pages** (`/sources/[slug]`).
- **Transfer-news child pages**, player-pairing pages, `/deadline-day`, `/transfer-window`, `/balloon-door-awards`.
- **Terms page.** (`/privacy` shipped; terms can wait.)
- **beehiiv migration.** Blocked on Stripe identity verification. Resend shipped instead and works.
- **Redirects for retired slugs.**
- **Clustering.** PR 3.
- **Re-enabling summaries.** See T5/#3.
- **The homepage rebuild.** Blocked on G's ten hand-written items. T0 is the holding action, not the fix.
- **Any hero copy change.** Locked, settled three times. DESIGN_SYSTEM §16.2 reopens it; ignore that line.

---

## 3. Manual steps — G, not Claude Code

### A. Verify T0 before anything else on this list

1. Open `https://thefootballhub.uk` on your phone.
2. Scroll to the bottom. If it takes more than a few flicks, T0 hasn't deployed yet — stop and wait.
3. Confirm dark background all the way down, no giant images, no empty boxes.
4. Enter a real email in the sign-up field and submit. Confirm you receive whatever the confirmation path sends.

### B. Google Search Console — only after A passes

1. Go to `https://search.google.com/search-console`.
2. Click the property dropdown, top left → **Add property**.
3. Choose the **Domain** option (left-hand box), not URL prefix. Type `thefootballhub.uk`. Click **Continue**.
4. It will show you a TXT record. Copy the whole value.
5. In a new tab, log in to **123-reg** → **Manage domains** → `thefootballhub.uk` → **Manage DNS**.
6. Add a new record: Type `TXT`, Hostname `@` (or blank — 123-reg's field varies), Value = the string you copied, TTL default. Save.
7. Back in Search Console, click **Verify**. If it fails, wait ten minutes and click Verify again. DNS propagation, not an error.
8. Once verified: left sidebar → **Sitemaps**. In the "Add a new sitemap" field type `sitemap.xml`. Click **Submit**.
9. Left sidebar → **URL Inspection**. Paste `https://thefootballhub.uk`. When it loads, click **Request Indexing**.
10. Repeat step 9 for the three club pages in build-order priority: Liverpool, Newcastle, Chelsea. Use the exact live URLs — copy them from the sitemap, don't type them from memory.
11. Don't request indexing on anything else. There's a daily quota and the rest of the site isn't worth spending it on yet.

### C. Check robots.txt — five minutes, gates everything in SEO_AEO §4

1. Open `https://thefootballhub.uk/robots.txt` in a browser.
2. Confirm there is **no** `Disallow: /` under `User-agent: *`.
3. Confirm there is no block on `GPTBot`, `ClaudeBot`, `PerplexityBot`, `CCBot`, `anthropic-ai`, `Google-Extended` or `Bytespider`.
4. Confirm `public/robots.txt` has not come back — there should be exactly one robots source, `app/robots.ts`.
5. If any AI user-agent is disallowed, that's one commit and it should jump the queue.

### D. The ten column items

An evening, no code, and **it is also the research for video 1** — same work, two deliverables. Pick one rumour cluster and do it properly: four outlets, trace each back to attributed origin, count what's missing (no fee, no timeline, no named club). That cluster is video 1's spine and item one of the column.

Everything downstream — the homepage rebuild, the block rhythm, the state line, whether the two-line Phase 1 Claim actually reads as finished — is unanswerable until ten real items exist on a page.

---

## 4. Suggested order, if you're working straight through

1. **T0** — unplug HomeContent. Immediately, no plan gate.
2. **T1** — merge CLAUDE.md.
3. **T2** — post the nine-branch verdict list, then merge in this order: `cron_logs` honesty → empty catch blocks → Supabase types → relevance filter #21 → ILIKE collapse → phantom tables → stadium aliases → dead code.
4. **T3** — dead feeds and observability.
5. **T5** — issue hygiene. (Deliberately before T4 and T6: it's cheap, and it tells you whether T4 and T6 are still correctly scoped.)
6. **T4** — delete the dead widgets.
7. **T6** — draft the three pages, hold for G's review.

If the session runs short, the cut line is after T3. T0 through T3 leaves the site correct and observable. T4 through T6 are improvements to a working site.

---

## 5. Known open — not for this session, recorded so it isn't lost

- **The gambling reversal has a commercial consequence nobody has costed.** EDITORIAL_VOICE §8 rules out affiliate content; MONETISATION_BRIEF §3 had betting affiliate at 20–25% of the £60k target with the best unit economics on the list. That's a hole in the plan, not a hole in the site. It needs a decision, not a code change.
- **GA4 demographics are gone.** MONETISATION_BRIEF §2, §5 and §8 all depend on them. Replacement evidence has to come from YouTube Studio and the mailing list.
- **Should source pages ship without the balloon column?** Still open, still not blocking. Decide before the source-page build, not now.
- **4,667 of ~19,500 posts classified** by the two-signal matcher. Whether ~76% `unclassified` is the rule working correctly or a coverage gap is unverified. See T5/#16.
- **No Search Console history.** Everything measured from here is a cold start with no baseline.

---

*Written 7 Aug 2026 for the 8 Aug session. If more than a week old when you read it, verify the live system before trusting a single line of it.*
