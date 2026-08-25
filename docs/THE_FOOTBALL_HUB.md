# THE FOOTBALL HUB

**Version 1.0 · 25 August 2026 · Canonical.**

**Supersedes and replaces:** `CURRENT_STATE`, `SEO_AEO_STRATEGY_v2`, `MONETISATION_BRIEF`, `DESIGN_SYSTEM`, `EDITORIAL_VOICE`, and every document describing the claim-first rumour-scoring product. Those stay readable as history. **Nothing is implemented from them.**

**Companion document:** `PAGE_SPEC.md` — the build spec. This document is what and why. That one is how.

---

## 0. How to use this

Two documents govern the project. This one and `PAGE_SPEC.md`. If a third appears, one of them is wrong.

**Three rules govern every decision below.**

1. **We do not create football news. We organise the football world.** The moment a decision makes this a publisher, it is the wrong decision.
2. **Host the data. Link out for editorial.** Facts and figures live on pages we own. Reporting, analysis and discussion link out prominently.
3. **The snapshot is a snapshot.** Bounded, scannable, it ends. Depth is a click away, never an expansion in place.

---

## 1. The product

**The Football Hub is the place a football fan opens first.**

One page per Premier League club, plus a cross-league homepage. Each answers, in order:

- What just happened?
- What matters?
- What's next?
- What's worth my time?

Consumable in two minutes. A jumping-off point if you have twenty.

### The problem

Football fans have too much information, not too little. The current journey is: mainstream publisher → aggregator → wade through duplicates → clickbait and intrusive ads → Reddit for discussion → YouTube for a trusted specialist → a stats app for the match → Google for what channel it's on.

The information exists. The experience is fragmented.

### The question the product answers

> **What the fuck have I missed?**

Nobody answers that. FotMob answers *what's the score*. NewsNow answers *what's been published*. Reddit answers *what do people think*. The BBC answers *what did we write*.

"What's changed since I last looked" is unclaimed, and it is exactly what a time-poor person checking in three times a day wants.

### Positioning

**The Football Hub — your football front door.**

Supporting language: *Your football world, organised into one clear snapshot* · *What happened. What matters. What's next.* · *Football without the faff.*

---

## 2. The user

The founder. A football fan in his forties, ADHD, two small kids, works from home, watches games when he can, reads about his club in stolen moments all day. True or fake, he's interested either way.

**Design consequences, not a persona exercise:**

- Immediate orientation. No decoding the interface.
- Small chunks. Predictable structure. The same blocks in the same places every day.
- Scans before reading.
- Bounded. The page ends and finishing is the reward.
- Depth available, never forced.
- Never demands attention. Ready whenever there are two spare minutes.

**This is not an ADHD football site.** No ADHD mode, no accessibility labels, no announcing the feature. The objective is that it simply feels *weirdly easy to use* — which also serves someone tired, dyslexic, on a small screen, or cooking dinner.

---

## 3. Competition — honestly

### The real competitor is not who we assumed

**NewsNow** is the incumbent aggregator, twenty years of source relationships, and it already sells an ad-free faster tier at £1.99/month. That validates the pain and warns that the incumbent can fix it themselves whenever they choose.

**FotMob and OneFootball are the actual competition**, and they already do roughly 80% of the feature list — follow-a-club, personalised news, match stats with xG, player ratings, TV schedules, transfers, push notifications. Free, on mobile, better than we will build.

**Football on TV** is more contested than it looks. live-footballontv.com has sixteen years of hand-checked listings; wheresthematch has twenty. Plus FANZO, TVGuide.co.uk, LiveScore and FotMob.

**Footytube** is the dead precedent — aggregated football video, news and fan content per club, 1.4M monthly uniques, permanently offline since 2019. Worth an hour finding out what killed it rather than guessing.

### The four things they don't do

1. **Reddit.** Nobody surfaces club subreddit threads. It is the third stop in the user's own routine.
2. **Creator long-form.** Nobody surfaces independent club specialists contextually. Official highlights only.
3. **Curated, not comprehensive.** They give you everything. We throw 90% away.
4. **Bounded.** Apps are infinite feeds by design. We promise a page that finishes.

### The structural wedge

**They are apps. We are a website.** Apps do not rank in Google. The entire SEO and AEO surface is a space they cannot compete for.

### The insight that reframes everything

> *"I use OneFootball but I forget I have it."*

They compete for a slot on a home screen and lose, because a home screen is a shelf of things you might open. **We are not competing on features. We are competing for a time of day.**

That makes the newsletter the mechanism of the product, not the monetisation bolted onto it.

---

## 4. The content model

**Classify first. Then decide how to display it.** The previous product's central error was forcing every type of football information through one scoring system.

| Type | Examples | Display |
|---|---|---|
| **Developing story** | Transfers, managerial situations, takeovers, major injuries | Story Card with coverage |
| **Confirmed fact** | Club announcement, official injury update, fixture change | One line. No card, no summary |
| **Team news** | Injuries, fitness, suspensions, return dates | Availability module |
| **Matches** | Last, next, live | Match module, phase-aware |
| **Analysis** | Creator video, long-form journalism | Worth Your Time |
| **Community** | Reddit threads | Fan Pulse. Clearly labelled. Disposable |

### Story consolidation is the differentiator

Twenty articles become one story, with the outlets shown and counted. NewsNow shows twenty rows. FotMob shows a feed. We show one thing and say how many people are saying it.

**Two statuses only:** `CONFIRMED` (official announcement) and everything else, which shows its outlet count.

**No qualitative ladder.** "Early reports", "widely reported" are words added on top of a number and they imply a judgement about truth. *"6 outlets"* is a fact. *"Widely reported"* is an assertion.

**No truth score.** The internal index can be sophisticated. The user sees a count.

### Ordering — the mechanic that makes it feel alive

**Movement descending, then recency.** `movement` = new distinct outlets in the last 24 hours.

A story that had two outlets this morning and six now outranks something filed eleven minutes ago that nobody else touched.

Reverse-chronological reshuffles because someone hit publish, which is not information. Movement-ordered reshuffles because something changed. It is the only ordering that answers *what have I missed*, and no competitor can copy it without rebuilding.

---

## 5. Architecture

### One engine, many lenses

```
getSnapshot(entity) → SnapshotPayload
```

`/` is `entity = premier-league`. `/tottenham` is `entity = tottenham`. Same machine, different data, same page architecture. Twenty-one URLs, one component.

**The page is a client of the API, not a database consumer.** `GET /api/v1/snapshot/{entity}` returns the whole page as JSON. The website is client one. React Native is client two. No page component queries Supabase directly — that single decision is what makes the app a port rather than a rebuild.

### URLs

Clubs at root: `/tottenham`, not `/clubs/tottenham-hotspur-news`. Short, memorable, shareable.

**A reserved slug registry must exist before any new top-level route:** `transfers`, `matches`, `search`, `about`, `how-it-works`, `privacy`, `terms`, `api`, `deadline-day`.

### Blocks never move

Content changes. The layout is identical on every entity, every day. After a week the user knows where injuries are without looking. Novelty comes from content, never from position.

Not "blocks reorder intelligently". That destroys the thing that makes it scannable.

### Club identity is exactly two things

The badge, and one accent rule. Never a page theme, never a palette swap, never a club hero. The Football Hub owns the interface; the club is the subject.

### Progressive disclosure via navigation, not accordion

**The snapshot shows the top. A page we own holds the rest.** *Full injury list →*, not an expander.

Three reasons: the column must end, or the completion reward disappears; a real URL ranks and a hidden div does not; and it produces pages we host rather than clicks we send away.

---

## 6. Data — verified 25 August 2026

### Free and cleanly licensed

- **Wikidata SPARQL** — CC0, public domain, no obligations at any scale. Squad history via P54 with date qualifiers, nationality, positions, stadiums, honours. Slow-moving, occasionally wrong, legally unencumbered.
- **OpenFootball (`football.json`)** — public domain. Fixtures, results, club name aliases.
- **StatsBomb Open Data** — CC-BY. Event-level with xG. No current PL, so not a live source.

### Open, undocumented, not licensed

- **FPL API** (`fantasy.premierleague.com/api/`) — no key. 609 players, 109 fields each. Injuries with official wording and timestamps, suspensions, yellow-card counts, xG/xA, BPS, ICT, set-piece takers, five seasons of player history, fixture difficulty. **Transfer resolution**: the `news` field carries completed moves, dated. `selected_by_percent` and `transfers_in_event` are an attention metric nobody in the gossip lane uses.
- **Premier League pulselive** (`footballapi.pulselive.com/football/`) — no key. **175 Opta team metrics.** Referee, VAR, assistants and fourth official by name. Confirmed lineups, formations, substitutions, attendance, goals with assists. `previousTeam` on player objects.
- **football-data.co.uk** — 132 columns, back to 1993. Referee by name, shots, cards, and closing odds from ~20 bookmakers. Odds are a research input only; never a price a reader could act on.
- **TheSportsDB** — free tier works but search is crippled (team search returns Arsenal only) and it runs 30 req/min. $9/mo single developer if club furniture becomes load-bearing. **No commercial clause** — ads and revenue don't move you between tiers.
- **Official assets** — player photos `resources.premierleague.com/premierleague/photos/players/250x250/p{code}.png`, badges `/badges/t{code}.svg`. Both verified 200.

### Shut

FBref (403, Cloudflare, Opta-licensed anyway) · ESPN hidden API (403, closed) · Understat (payloads removed from initial HTML) · club official RSS (404s, app-first now) · Transfermarkt, SofaScore, WhoScored, FotMob (proprietary).

### No free source anywhere

**Broadcaster data.** Probed the PL API three ways; no field, and the `broadcastingschedule` and `broadcasters` endpoints 404. Manual entry or nothing.

### The rule for undocumented sources

**Derive, don't mirror.** Query server-side, cache, derive conclusions, publish findings, link out. Never render their table as our table.

Deriving *"three Spurs players are one booking from missing the derby"* is our finding. Rendering the PL's 175-stat table on our club pages is their product with our logo on it. That distinction matters more here than for a normal site, because the product is credibility — a takedown is a headline, not a legal problem.

Neither PL endpoint is documented or supported. Off-season format changes are the known failure mode. Cache defensively, fail soft.

### The four indexes

Underneath the simple page sits a football information graph:

1. **Source index** — who reported it. Publisher, journalist, tier, specialism.
2. **Creator index** — who is worth watching. Club, platform, content type (journalism / analysis / fan reaction), audience, cadence, long-form flag. **Not** a trust ranking — Ali Gold and Expressions Oozing are different things, not trustworthy vs untrustworthy.
3. **Officials index** — referee, dynamic stats (weekly), evergreen facts (written once). **The fun fact is nullable.** If there isn't a good one, the slot doesn't render.
4. **Broadcast index** — match × territory × broadcaster × channel × free-to-air × last verified. Territory-specific, never baked into match data.

---

## 7. Trusted sources are the product

We do not ingest the football internet. The source list is curated, and **that is the moat** — it is judgement, not code, and it cannot be copied.

- **Tier 1 — Official.** Clubs, PL, UEFA, FIFA, direct statements.
- **Tier 2 — Major publishers.** BBC, Sky, Guardian, Telegraph, The Athletic.
- **Tier 3 — Specialists.** Club journalists and creators with genuine expertise.
- **Tier 4 — Community.** Reddit and fan discussion. Surfaced as discussion, never as reporting.

The promise is not *everything here is true*. It is *this came from somewhere worth paying attention to*.

Building and maintaining the whitelist is a manual editorial job. Accept that. It's the part nobody can take.

---

## 8. Summarisation — the contract

Full implementation in `PAGE_SPEC.md` §13. The principle:

**One invented fee costs more than the product is worth.** A site that filters out the shit cannot itself make things up.

- **Extraction, not generation.** The model returns null-defaulted fields; prose is templated from them. A template cannot invent a fee.
- **Three deterministic gates.** Every number and every proper noun in the output must appear verbatim in the source. 75-word ceiling.
- **A verification pass**, then **fail closed** — publish the card without the summary rather than with a wrong one.
- **Paraphrase only, never quote.**
- **Log every summary with its source text**, so a challenge is settled in thirty seconds.

**The link out is prominent and real.** Value is added on top of other people's work; traffic is what makes that acceptable.

---

## 9. Voice

Flat, factual, devoid of emotion. Summaries orient the reader; they do not entertain.

**Three rules survive from the previous voice work and they still apply:**

1. The fact never bends for the joke.
2. The narrator is never above the reader.
3. Nothing is invented. Ever.

**Personality lives in exactly two slots**, and nowhere else:

- **The referee's one interesting fact.** The only place tone is licensed on the page, and the thing you repeat to your mate at kick-off.
- **The sign-off.** One human-written line at the end of the snapshot. Sixty seconds a day, and it's what makes the page feel like a person made it.

The newsletter carries more voice than the site, because there's a person in an email in a way there isn't on a page.

**Banned:** exclamation marks · "only time will tell" · "fans will be delighted" · "massive blow" · "huge boost" · "masterclass" · "crucial", "vital", "must-win" · GOAT, cooked, washed, based · "it remains to be seen".

### Copy rules

The banned list governs what we write. These govern what we display — every string that reaches a block, including the ones we did not author.

1. **Absence is never content.** No "unknown", "TBC", "N/A". A missing value means the line does not render. `"Knee injury - Unknown return date"` renders `Knee injury`, because a line whose content is *we do not know* is a line that should not have rendered.
2. **If every row says it, delete it.** A word repeated down a stack is a heading, not data.
3. **The label already said it.** Do not repeat the block name in its rows. Under DOUBTFUL, `50%` needs no "chance of playing" after it.
4. **Verbatim or nothing.** Source wording is displayed as published. Removing a null marker is not rewriting; changing "Knee injury" to anything at all is.
5. **The number, not the sentence.**
6. **Labels are mono uppercase, one or two words.**
7. **No hedging adverbs.**

Rules 1 and 4 are the pair that does the work, and they pull in opposite directions on purpose: strip what carries no information, and never touch what does. Where they meet is the only place judgement is required.

**Serious news is a different register entirely.** Facts, one sentence. Human response, one sentence. No wit, no hook.

---

## 10. Design direction

**Full philosophy is being rewritten separately.** What is settled:

**Calm canvas. Personality at the edges.** Reading surfaces stay clear. Personality lives in the logo, colour, motion, loading states, empty states and matchday moments.

**It is a board, not a page.** Football sites all look alike because they inherited the newspaper sports section — big photo, big headline, feed below. A board is a different object: departure boards, dashboards, the front of a Teletext page. Typographic, dense, information-first, photography incidental.

That satisfies "looks like nothing else in football" in a way a calm dashboard does not — and nobody in the category looks like it.

**Explicitly avoid:** grass green · stadium imagery · aggressive sports type · red breaking-news banners · betting-app aesthetics · Sky Sports overload · generic score-app design. Also avoid the Linear/Raycast dark-dense-developer-tool look — distinctive within football, completely generic outside it. **Strava is the better reference**: sport that doesn't look like sports media.

**Typography is a product feature.** Hierarchy comes from type, not from borders, boxes, badges and background colours. If a page needs decoration to communicate hierarchy, the typography isn't working.

**Measured numbers that carry over, because they were tested rather than felt:**

- **Contrast floors: 50% opacity dark, 65% light**, on the base text colour. Every previous brand document specified 40% — that's 3.5:1 and fails AA for body text. It is a large part of why the old build read as unstyled.
- **11px minimum font size**, anywhere. **44×44px minimum touch target.** **320px minimum viewport.**
- **Never a grey hex.** Hierarchy is opacity on the base text colour.
- **Tokens are plain TypeScript objects, never CSS custom properties.** Undefined CSS variables render components invisibly *and pass every build check*. That is what broke the site twice. Plain objects also port to React Native unchanged.
- **Verify in the live DOM, not in source.**
- **Fonts self-hosted via `next/font`.** Never a `fonts.googleapis.com` link — every prototype in the archive has one.

**Text-to-speech is parked.** It's a month of work, and the product is 30–75 word summaries designed to be scanned. Revisit if long-form ever ships.

**When in doubt:** simple over clever · clarity over density · remove the animation · make the text slightly larger · readability over branding. The solution to a plain interface is rarely more stuff — it's typography, spacing, hierarchy, rhythm.

---

## 11. Monetisation

**Target: ~£60k/year company revenue, realistically 24–30 months.** Not on any single stream, and not on display ads at any achievable traffic level.

### The newsletter is the mechanism, not the money

The email at 7am is what makes the site a habit instead of a bookmark you forget. That is the answer to the OneFootball problem, and it is the product working rather than a revenue bolt-on.

**Sequence: habit first, then the newsletter is obvious.** Not a bribe for an address. But **capture from day one** even if the first send is months away — a list that's been growing for three months is worth more on day one of sending than an empty one.

**The email is complete, not a teaser.** Sports newsletters run $8–30 CPM in B2C and higher in tight niches; football display is £3–8 RPM. Truncating to drive clicks pushes people to the lower-earning surface and adds friction at 7am with two kids in the house. The email is the bones, finished, readable in ninety seconds. The site is the same snapshot with the doors open — Reddit, creator videos, the expandable, the archive.

**The Friday pre-gameweek edition is the one email-only thing.** Who's out, who's back, the referee, what's on TV, the one thing to watch. It's the highest-intent moment of the week and it fixes the "the email is just delivery" objection.

### Revenue lines, in order of realism

| Line | Note |
|---|---|
| Newsletter (paid + sponsorship) | Sports is the highest-converting paid newsletter vertical measured — 1.93% vs 0.62% network median. 10k subs ≈ £25–35k/yr. First sponsor placements go cheap deliberately, to buy the case study |
| Brand deals | 5–15× ad RPM for the same views. **Chase fintech, not bookmakers** — highest-paying vertical, no age-gating, no LCCP vetting |
| Display | A floor, not a plan. £3–8 RPM. Ladder: Journey by Mediavine at 1,000 sessions → Mediavine main → Raptive |
| Data licensing | Small, slow, high-margin, audience-independent. Park it |

**Audience demographic is the master variable.** Adult 25–44 UK-heavy raises every rate card. 18–24 closes the two highest-paying routes. Read YouTube Studio and GA4 demographics before pitching anyone — the report *is* the pitch deck.

**The commercial trip switch:** the site becomes commercial the moment one ad renders, one affiliate link goes live, or one person pays for anything. Not incorporation, not intent. Journey by Mediavine at 1,000 sessions is close.

**Ad UX is non-negotiable, because the product is credibility:** one in-content unit maximum, in-view only, muted. Fixed-height containers, CLS 0. No interstitials, no vignettes, no autoplay with sound. Nothing above the H1.

**Gambling: unresolved.** The previous document had "no gambling content, ever, hardcoded" as a non-negotiable. The position has moved and has not been re-decided. It cannot sit in a document as a locked rule that isn't one. **Open — decide before any commercial page ships.**

---

## 12. Search and AI visibility

**SEO is acquisition. The snapshot is retention.** Do not build pages to chase keywords. Build the product properly and the pages exist naturally.

The club page answers *tottenham news*, *tottenham transfer news*, *tottenham injuries*, *tottenham fixtures*, *tottenham next match*, *tottenham on TV*, *tottenham vs arsenal* — **not as separate thin landing pages, but as aspects of one living entity page.** That's far more defensible and it's the whole argument for the architecture.

**What carries over from the previous SEO work:**

- **robots.txt is the binary gate.** Confirm no `Disallow: /` and no block on `GPTBot`, `ClaudeBot`, `PerplexityBot`, `CCBot`, `anthropic-ai`, `Google-Extended`, `Bytespider`. `noindex` and robots.txt are different things. **Check this before anything else.**
- **Reddit is 21.85% of all AI citations** — 30% for Perplexity, 52% for Grok, 34% in Media & Entertainment. Highest-leverage lever available and it needs zero engineering. Being the person who answers *"is this real?"* with actual sourcing, under one consistent username, no links.
- **YouTube is ~10% of AI citations.** Sourcing facts in plain text in the description is the part that gets retrieved.
- **Top Stories eligibility is a build requirement**, not a later phase — every money SERP is a news carousel.
- **Traffic potential beats volume and difficulty.** High volume plus low TP means a knowledge panel or Transfermarkt owns it.
- **Freshness is a top Perplexity and Grok factor.** A permanent URL with a moving `dateModified` beats a new URL per day, which resets the signal and splits equity 365 ways a year.
- **Schema is cheap and worth doing. It is not a citation lever.** `llms.txt` has no evidence behind it.

**Needs re-verification before use:** all previous keyword data. The league changed — Wolves and Burnley are out, Coventry, Hull and Ipswich are in — so club keyword volumes and the build order are stale. Re-pull.

**Inherited risk:** the domain had prior commercial life and an SEO spam network inflated apparent DR. Check Search Console for an inherited manual action on verification.

---

## 13. Build state — 25 August 2026

**Stack:** Next.js 14 / TypeScript / Tailwind / Supabase / Vercel. Repo `Crumbalino/PLHub`. Domain `thefootballhub.uk`, DNS at 123-reg, attached to `pl-hub-webapp12`.

### Shipped to branches, unmerged

**PR #67 — `feat/source-adapters`.** Ten new files, nothing existing modified.
`src/lib/sources/fpl.ts` · `pulselive.ts` · `reddit.ts` · `cache.ts` · `src/app/api/v1/snapshot/[entity]/route.ts` plus five test files. 185/185 tests, clean build. Every rule a pure function taking `now`; every fetcher caches, dedupes concurrent callers, returns null rather than throwing. No keys.

Verified live: Brentford 3–0 Tottenham, xG 3.91–0.57, scorers with assists, attendance 17,180, referee Michael Oliver.

**PR #68 — `feat/tottenham-snapshot-page`.** Three new files. `/tottenham` renders seven blocks, all four match phases verified, one h1, no heading skips, real `<time datetime>`, zero empty containers. Stacked on #67.

### Three corrections the live data forced

- **FPL `finished` is not a full-time signal** — it waits for the bonus-point check, so gameweek-1 fixtures still read `finished: false` three days after the whistle. Implementing phase detection literally reports a three-day-old match as LIVE. Fixed with `finished_provisional` plus a 3-hour ceiling.
- **Pulselive publishes no xG.** All 200 match stats enumerated to confirm. xG is summed from FPL player-level `expected_goals`, checking `explain[].fixture` so double gameweeks don't double-count.
- **Goals come from the fixture list, not match detail.** Detail returns `goals: null`; only the list carries `assistId`.

### Open items

| Item | Note |
|---|---|
| Merge #67, retarget #68 | Everything stacks on it |
| Booking thresholds | Spec was wrong. PL rule is 5 in 19 games and 10 in 32, so "one booking away" is **4 and 9**, not 4 and 5 |
| `src/lib/clubs.ts` is stale | Coventry, Hull and Leeds missing; Sunderland registered as badge `t58` where FPL says `t56` — likely a broken badge on the live site now |
| Reddit 403s | Blocked from the dev network; may behave identically from Vercel, which would leave Fan Pulse permanently dark. Test from a preview deploy before designing the block. Fix if needed is Reddit's free API with a registered app — which means one key |
| football-data.org not wired | Table and numbers blocks dark. Key is set |
| Legacy pages | `/about`, `/how-it-works`, `/principles` live and indexed, describing the deleted product. `/principles` carries an anti-gambling pledge. Check Search Console impressions before deleting — near-zero means delete and serve 410; anything landing means redirect |
| Player names | Availability renders FPL `web_name` — "P.M.Sarr", "Xavi", "Van de Ven". Reads as a typo, and "Xavi" is a different famous footballer. Patch the worst by hand at minimum |
| `docs/PAGE_SPEC.md` untracked | Commit it. An uncommitted spec is what stalled the first Claude Code attempt |

### Manual jobs — the moat, and nobody else can do them

1. **Creator whitelist.** 20 clubs × 3–5 creators, classified by content type. The single largest manual task and the least copyable asset.
2. **Referee evergreen facts.** ~20 active officials. Nullable — if there isn't a good one, leave it empty. **Highest hallucination risk in the project**: every fact needs a source URL attached, and none may be written from memory.
3. **Broadcaster listings.** Ten fixtures a week, five minutes. No free source exists.
4. **Search Console** — verify, submit a sitemap, check for an inherited manual action.

---

## 14. Build order

1. **Engine and API shape** — done, PR #67
2. **Match block, all four phases** — done, PR #68
3. **Availability, referee, key data, table, form, numbers** — partly done; table and numbers need football-data.org
4. **Fan Pulse and Worth Your Time** — needs the whitelist written first
5. **Ship Tottenham.** One real page. Use it for a week
6. **Template to twenty clubs and the homepage entity**
7. **Clustering, summarisation, the centre column** — the differentiator, landing on a page that already works
8. **The Snapshot email** — same payload, different renderer

Steps 1–6 need no clustering, no AI, and no new data source. **Thirteen of seventeen blocks ship before a line of clustering exists.**

---

## 15. Not building

Each was proposed and each is out, with a reason.

- **Anything that makes us a publisher.** No original articles, no AI-generated content pages, no editorial team.
- **A universal truth score.** False precision on a product about honest information.
- **A qualitative coverage ladder.** "Widely reported" is an assertion; a count is a fact.
- **Origin and independence detection, for now.** Two reputable outlets is good enough. `attributed_origin` stored, not displayed, not computed.
- **Hosted comments or discussion.** Reddit is for discourse. No moderation burden.
- **Drag-and-drop custom homepages.** Selection, not arrangement. Order stays movement-descending — letting users override it means someone builds a reverse-chronological feed, which is the thing we exist to replace.
- **Accounts, for now.** Club choice is a cookie and a newsletter field. Accounts arrive for one reason only: *notify me when this specific thing moves.*
- **Expand-in-place on data blocks.** Progressive disclosure via navigation.
- **A standalone TV directory.** Broadcaster on the match block. Expand only if the search opportunity justifies it.
- **Player, referee and competition entity pages.** The data model supports them. Build none.
- **User reactions.** Schema only.
- **Emoji in section headers.** Mono labels do the job and don't look like a template.
- **Story reordering animation** and **"Snapshot updated · 12 new items"** — a number with no referent until per-user state exists.
- **Text-to-speech.**
- **Every league in world football**, deep stats databases, comparison tools, a club wiki.

**Reintroducing any of these requires a named decision recorded here — not an inference from an old file.**

---

## 16. The north star

> The Football Hub is where football fans start.
>
> We do not create football news. We organise the football world into a clear, personalised snapshot.
>
> We consolidate **stories, not articles**.
>
> We surface **trusted sources, not noise**.
>
> We give **facts and context, not opinions**.
>
> The user understands what's happened in seconds. Then we point them at the best places to go deeper.

**A destination, not a feed.** Nobody comes because we published something. They come because they've been away from football for a few hours and want to know what they've missed — and within seconds, they know.

### The test for every decision

**Does this reduce the effort required to follow football?**

And: **would I miss this if I only had two minutes?**

If no to both, it doesn't belong prominently in the snapshot.

---

## 17. Open, and not decided

1. **Gambling.** Position has moved and hasn't been re-decided. §11.
2. **The wordmark.** THE / FOOTBALL HUB with the teal bracket survives the product change intact and is genuinely good. Whether "looks like nothing else" extends to redesigning it is undecided.
3. **Colour palette.** Deliberately not invented yet.
4. **Legacy pages** — delete, redirect or rewrite. Needs the Search Console data first.
5. **The Hub Rating.** No free source publishes a player rating; the proprietary ones are off the table. Building one from FPL's BPS, ICT and counting stats is defensible *if* it's named, published and minimum-minutes gated. Weighting undecided. Until then the block doesn't render.
6. **Reddit from production.** Untested.
7. **Relegated and promoted clubs** in the sitemap across seasons.
8. **Where the creator index ends and editorial judgement begins.** The classification is designed; the curation is not started.

---

*Living document. It changes when the product changes, and only then.*
