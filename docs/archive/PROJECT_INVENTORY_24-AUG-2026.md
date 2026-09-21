# THE FOOTBALL HUB — COMPLETE PROJECT INVENTORY

**24 August 2026. Written to be read cold by someone with no prior context.**

## 0. What this document is and how it was made

This is a full inventory of a solo-operated football media project: what it claims to be, what has actually been built, what is wired to what, and where it has sprawled.

**Provenance of every claim below:**

- **§2 (thesis) and §7 (document estate)** are summarised from five canonical planning documents written 6–7 August 2026.
- **§3, §4, §5 (live state)** were verified today by fetching the production website directly. Nothing in those sections is taken from the planning documents. Where live reality contradicts the plans, the contradiction is stated.
- **§6 (search and market data)** is a fresh Ahrefs pull, GB, dated today.
- **§8 (sprawl audit)** is analysis, flagged as such.

**Not verified** — the operator has not been asked to confirm anything, and there is no access to the GitHub repo, the Supabase database, the Vercel dashboard, Google Search Console, or the YouTube/TikTok accounts. Anything about internal state is inferred from external behaviour and marked as inference.

**The question being asked of the reader:** the operator suspects the project has sprawled beyond what one person can build and maintain. §8 sets out the case. §9 lists the specific decisions he wants tested.

---

## 1. The project in one page

**Operator:** one person, working solo, part-time, alongside a full-time job. Referred to as "G" (byline) or Gautam (real name). GitHub handle `Crumbalino`.

**Three linked properties:**

| Property | What it is | State |
|---|---|---|
| **The Football Hub** — thefootballhub.uk | Website. Premier League transfer rumours with a sourcing score | Live, partially built. §3–§5 |
| **GVsEverything** | YouTube / TikTok / Instagram channel. Tagline: *"G vs Everything. Everything wins."* | Planned. No published video as of today |
| **Stand-up comedy** | Live gigging. Filmed sets treated as clip source for the channel | Active but development explicitly paused. Gigs booked Sep 2026 |

**Intended relationship:** the channel is top-of-funnel, the site is the destination, the newsletter is the primary revenue wedge. The stand-up supplies the voice and free clip material.

**Stated hard deadline:** 1 September 2026, when the summer transfer window closes. Eight days away.

**Stated revenue goal:** £60,000/year company revenue (£5,000/month), estimated at 24–30 months out.

---

## 2. The product thesis, as the planning documents state it

### The one-line USP

> Every other football site tells you what is being said. This one tells you how much is behind it.

Not a prediction of whether a transfer will happen. A measurement of how well-sourced the claim is.

### The three supporting arguments

**1. The unit is the rumour, not the article.** An article is dead on publication; there is no reason to look at it twice. A rumour gains outlets, gains a fee, gains a timeline, gets contradicted, goes quiet, resolves or dies. The retention argument is *"did that thing get more real"* rather than *"is there something new."* Every competitor publishes articles in reverse chronological order.

**2. Manufactured corroboration is invisible to readers.** Four outlets rewriting one journalist's tweet reads as four independent sources. Collapsing rewrites to their attributed origin and stating *"four outlets, one source, no fee, no timeline, no club"* is a finding rather than an opinion.

**3. Production cost is the moat.** Every competitor pays full price per column. With an automated ingest pipeline the marginal cost of the next column approaches zero. Cost moats cannot be copied by hiring a better writer.

### The long-term asset

After a transfer window closes, claims resolve. Nobody else holds resolution data at claim level. Every existing "which transfer journalist is reliable" guide is a subjective crowdsourced tier list assembled by polling Reddit, and most are unmaintained. A pre-registered, dated, queryable ledger would be the only quantitative version in existence — and AI search engines demonstrably cite sources that hold unique data (Transfermarkt: 2,431 ChatGPT citations; CaughtOffside, which restates others' reporting: 60).

### The scoring mechanic — "balloons"

**More balloons = worse sourced.** A visual pun on hot air. Named after the **Balloon Door Awards** (a Ballon d'Or pun), planned as an annual October event.

Score inputs, per the plans:

| Input | Available at launch? | Depends on |
|---|---|---|
| Breadth — count of *independent* outlets, collapsed by attributed origin | No | Clustering (unbuilt) |
| Quality — specificity (named fee, club, timeline) and attribution (named source vs "sources close to") | Partially | Manual or extraction |
| Conflicting reports — does anyone credible say the opposite | No | Clustering (unbuilt) |
| `window_state` — window open/closed, days to deadline | **Yes** | Pure date maths |
| `pairing_history` — how many times this player–club pairing has been claimed before | **Yes** | Ledger counts |
| Initial poster authority / track record | No | Requires one resolved window |

**Recorded design flaw, acknowledged in the plans and unresolved:** at launch, with no resolution data, a genuine solo scoop (one outlet, hedged language, nobody else on it) scores identically to an unsourced ITK tweet. The score would punish originators and reward herding — the exact behaviour attributed-origin collapse exists to prevent. Proposed fix is to ship without the balloon column and switch it on after one window.

### Editorial register

Deadpan resignation, not anger or excitement. The narrator is "the person who knows exactly how thin this rumour is, and read it anyway" — always the most pathetic figure present. Stated influences: Charlie Brooker (contempt for the system, not the people), John Mulaney (structure, callbacks), Dan Soder (warmth). Explicitly rejected: Stewart Lee (too elitist), AFTV-style reaction content (the anger register).

Absolute rules: the fact never bends for the joke; nothing is ever invented; never punch down at players, fans or named journalists.

### The format contract

"Football for brains that can't finish an article." ADHD is the format logic, never the topic. Produces hard rules: the column ends and states its length up front ("Twelve items · about 90 seconds"); no infinite scroll ever; content is a chain of self-contained blocks; no autoplay, popups or interstitials; 11px minimum font size; WCAG 2.1 AA.

---

## 3. Live site — verified today by direct fetch

**Domain:** `thefootballhub.uk`, live over HTTPS, hosted on Vercel (project `pl-hub-webapp12`). Stack per plans: Next.js App Router, TypeScript, Tailwind, Supabase, Anthropic API.

### 3.1 Routes that exist and respond

| Route | Title tag | Indexable | State |
|---|---|---|---|
| `/` | The Football Hub | Yes | **Rebranded, current** |
| `/clubs/[slug]` × 25 | `[Club] Transfer News \| The Football Hub` | Yes | **Rebranded, current, stale content** |
| `/how-it-works` | How PLHub Works — Sources, Index, AI Summaries | Yes | **Legacy. Describes a dead product** |
| `/principles` | What PLHub Stands For — Our Principles | Yes | **Legacy. Contains a commercial contradiction** |
| `/about` | About PLHub — The Premier League Without the Noise | Yes | **Legacy. Describes a dead product** |
| `/privacy` | — | Yes | Not inspected |
| `/contact` | — | Not in sitemap | Linked in every footer; existence unverified |
| `/robots.txt` | — | — | Clean |
| `/sitemap.xml` | — | — | Present, stale, incomplete |

### 3.2 Routes the plans specify that do not exist

`/gossip` · `/gossip/[yyyy-mm-dd]` · `/transfers/[player]-to-[club]` · `/transfers/done-deals` · `/deadline-day` · `/transfer-window` · `/sources/[slug]` · `/balloon-door-awards` · `/api/v1/*`

**`/gossip` is the product.** The daily column at a permanent URL that updates in place is the object the entire design system was written around. It does not exist. What exists instead is a reverse-chronological feed of other people's headlines — the precise thing the design system explicitly rejects.

### 3.3 The homepage, as it renders today

Hero (matches the locked copy in the plans exactly):

```
The Football Hub
Some of this is true.
Transfer gossip. Scored.
[ email address ] [ Subscribe ]
The Balloon Door Awards, October.
```

Below it, a plain-HTML explanation block:

> The Football Hub logs Premier League transfer rumours and scores how well each one is sourced. Not whether it will happen — how much is behind it. Every claim keeps the outlet that published it, the wording they hedged with, and whoever they credited.

Then three running aggregates: **Stories logged this window 8,258 · Pinned to a club this window 970 · Clubs covered 18**. Then a club nav (18 clubs). Then footer.

**Nothing on the homepage is scored.** No column, no items, no balloons, no claims. The explanation block describes a product that is not on the page below it.

**The aggregate numbers are self-indicting.** 8,258 stories logged but only 970 pinned to a club — 88% of ingest is unclassified. And "this window" now means "up to 7 August."

### 3.4 Club pages — the only substantive content on the site

Inspected: `/clubs/tottenham` and `/clubs/newcastle`.

**What works:**
- Correct H1 (`Newcastle United Transfer News`), correct keyword-fronted title tag, correct self-canonical, `index, follow`.
- Club metadata block: abbreviation, founded year, city, current manager. Manager data is current as of late July (Newcastle shows Matthias Jaissle, appointed 30 July), so a `clubs` table exists and is maintained.
- Multiple publishers landing: BBC Sport, The Guardian, Sky Sports all present.
- Working "Load more" pagination.
- No fabricated score badge, no AI summary line — both correctly removed.

**What is broken, on live indexable pages:**

1. **Content stops on 7 August.** Newest item on both pages inspected. Seventeen days of the busiest fortnight of a transfer window are missing. *(Inference: the RSS cron has stopped firing or is failing silently. Cannot confirm the cause without repo or database access.)*

2. **Sort order is broken.** The control says "show newest first." Actual order on `/clubs/newcastle`: BBC item (9 Jul) → Guardian block (7 Aug down to 5 Jul) → Sky block (5 Aug down to 30 Jul). Items are grouped by publisher, then sorted by date within publisher. A reader sees a July story above an August story.

3. **The classifier matches on club name, not subject.** Live on a page titled "Newcastle United Transfer News":
   - *"Today on Sky Sports Racing: Siouxperb faces promising newcomers at Newcastle"* — horse racing.
   - *"Behind Milburn's magic: Wor Jackie was a pit village hero"* — a 1950s nostalgia feature.
   - *"'The utmost respect for him': Alex Ferguson pays tribute to Kevin Keegan"* — a tribute piece.

   This is the "feed scope" problem the planning documents flag as an open question, made concrete and indexed. The ingest is general Premier League news; the product is transfer rumours; nothing reconciles them.

4. **Club tagging shows two clubs per item** (`NEWARS`, `NEWTOT`, `NEWSUN`, `NEWCRY`) including obviously spurious pairings. The data contract document states `club_slug` is singular and "one club pill maximum." Live behaviour contradicts the document — one of the two is wrong.

5. **Breadcrumb reads "PLHub"** on every club page. The "Clubs" breadcrumb links to `/`, not to a clubs index.

6. **A rendering bug** on at least one item: a stray quotation mark followed by a duplicated headline.

7. **No `og:image`** on club pages at all. Sharing any club page produces a bare link.

### 3.5 The three legacy pages — live, indexed, and wrong

All three are the pre-rebrand PLHub pages, unchanged, now indexable because `noindex` was removed.

**`/about`** — *"PLHub is a Premier League news aggregator."* Names the operator in full ("I'm Gautam"), describes AI summaries, and closes on *"Drink up Trig, we're going"* — a tagline explicitly killed in the current voice document. Also contradicts the stated rule that the project carries "voice on everything, face on some things, biography on almost nothing."

**`/how-it-works`** — describes **the PLHub Index** (a four-factor composite score that has since been deleted as "a fabricated composite on a site whose product is honest scoring"), **three-sentence AI summaries** (the deprecated aggregator product), and **The Snapshot** (a daily digest that no longer exists).

This page is designated in the plans as *the highest-originality page on the site and the primary AEO asset* — a pre-registered, dated scoring methodology that exists nowhere else in the category. It currently describes a product that does not exist.

**`/principles`** — five numbered pledges. Number one:

> **No gambling content. Full stop.** No ads. No sponsored content. No odds. No affiliate links… This isn't a policy position — it's personal.

The monetisation plan models **betting affiliate revenue at 20–25% of the £60,000 target.** This is a published, indexed, explicitly personal promise that the business plan intends to break. The plan itself notes that "retrofitting a betting section into an established credibility product is a brand crisis; launching with a published policy is just a page" — and the page currently published is the opposite of the one the plan requires.

Pledge five closes on *"Next season, Rodney"* — the Del Boy register formally demoted in the current voice document.

**All three legacy pages emit `og:url` pointing at the homepage rather than themselves.** Canonicals are correct; Open Graph URLs are not.

### 3.6 Crawlability and indexing

**`robots.txt` — clean and correct:**
```
User-Agent: *
Allow: /
Disallow: /api/
Sitemap: https://thefootballhub.uk/sitemap.xml
```
No AI crawler is blocked (`GPTBot`, `ClaudeBot`, `PerplexityBot`, `CCBot`, `Google-Extended`, `Bytespider` all permitted). The planning documents identify this as the single binary gate on the whole AI-search strategy. It is passed.

**`noindex` is off.** Every page returns `index, follow`.

**Sitemap — present but degraded:**
- 26 URLs: homepage, four legacy pages, 25 club pages. Actually 5 + 21… listing 25 club entries in total.
- **Every `lastmod` is identical: `2026-08-07T23:40:02.032Z`.** A build-time constant, not honest modification data. Freshness signalling is a top-weighted factor for Perplexity and Grok; this actively transmits "nothing has changed in 17 days," which happens to be true.
- Includes four clubs not in the current Premier League set (Ipswich, Leicester, Southampton, Wolves) while the homepage nav shows a different 18. Sitemap and navigation disagree about what league this is.
- Omits `/contact`, which is linked from the footer of every page.
- Omits every strategic route because none of them exist.

**Indexing status: zero.** A `site:thefootballhub.uk` search returns no pages from the domain. Seventeen days after `noindex` came off, Google has indexed nothing. *(Inference: the sitemap has never been submitted, because Google Search Console verification is still listed as an outstanding task.)*

**Ahrefs organic keywords, GB, today: zero.** The site ranks for nothing.

### 3.7 Backlink profile — an unexpected finding

| Metric | Value |
|---|---|
| Live backlinks | 851 |
| Live referring domains | **471** |
| All-time referring domains | 509 |

471 referring domains on what was described as a newly purchased domain. Inspecting the top 20 by domain rating explains it, and neither explanation is good:

**Finding 1 — the domain has history.** Links from `goo.gl` and `nuzzel.com` with **first-seen dates in May and September 2017**. This domain had a prior life. *(A separate business, "The Football Hub," an indoor football facility in Portsmouth, operated at `thefootballhub.co.uk` and announced its closure in July 2025 — a plausible but unconfirmed connection, and a live brand-collision risk: that business still has an active Instagram at 1,434 followers and ranks for the brand name.)*

**Finding 2 — the rest is automated SEO spam.** `itxoft-professional-seo-services.site`, `fiverr-seo-for-small-businesses.site`, `fiverr-quality-seo-at-affordable-rates.site`, `seogrow.agency`, `rankgrowth.agency`, `linkrankpro.shop`, `rankxlinks.shop`, `ranklinkerpro.shop` — first seen March to June 2026, artificially inflated domain ratings of 54–72, and **nofollow in every case bar one.**

This is a scraper network that auto-links to domains it crawls. It is not an asset and is very unlikely to be a penalty, but two consequences follow: any domain-rating number for this site is meaningless, and **the 2017 history means Search Console verification should also be a check for an inherited manual action**, not just a sitemap submission.

---

## 4. Data and pipeline — what is wired

*Schema facts below are from a verification pass recorded in the planning documents on 7 August; live behaviour today is consistent with all of them.*

| Field / table | State | Consequence |
|---|---|---|
| `posts.title` | Always populated | The only reliable display element |
| `posts.summary` | Effectively never. `SUMMARIES_ENABLED=false`, and a 300-character gate passes roughly 8 of ~81 daily items | No summary line anywhere on the site |
| `posts.source` | Always the literal string `"rss"` | Never displayed |
| `posts.subreddit` | Holds the *feed name*, not the publisher | Publisher must be derived from URL domain |
| `posts.image_url` | Present on most rows, **frequently wrong** (a plane on a Rashford story) | Thumbnails are decorative only, never load-bearing |
| `posts.club_slug` | Singular; `unclassified` is common — 88% of rows per the homepage counters | Club pages capture 12% of ingest |
| `posts.score` | **0 on every row** | Never read |
| `posts.score_significance` | Populated | Orders the feed silently; not displayed |
| `posts.card_type` | Derived from publisher domain, not content | Semantically meaningless |
| `posts.story_cluster`, `posts.source_count` | **Columns exist, empty** | Clustering is unbuilt. Everything downstream is blocked |
| `trivia`, `on_this_day`, `quotes` | **Tables exist, zero rows** | Three designed block types are dark |
| `card_reactions` | Exists | Feature deferred |
| Subscribers | **No table at all** | The hero email field captures nothing |

**Ingest:** nine RSS feeds configured. Three are dead — Goal.com and Football365 404 silently; The Independent returns valid RSS with zero items; 90min returns 200 with nothing published since September 2025. Six live: BBC, Sky, ESPN, FourFourTwo, Guardian, Independent.

**Scheduling:** `vercel.json` declares five cron jobs. **None ever registered** — the Vercel plan is Hobby tier, which does not support them. They are dead configuration. The only real scheduler is an external service, cron-job.org, running `/api/cron/rss` every 15 minutes (~96 runs/day, cycling all nine feeds roughly every 135 minutes). *The rotation maths is deliberate and correct; it is not a bug.*

**Email:** `/api/subscribe` returns 500. The Resend API key is invalid and no audience ID was ever set. The plan is to repoint it at beehiiv, blocked on confirming whether API key generation is available on beehiiv's free tier, which is itself gated behind Stripe Identity verification. **The subscribe endpoint has never captured a single address.** The digest cron 500s daily for the same reason.

**Known code-level issues carried in the plans, unverifiable from outside:** 67 usages of `var(--plh-*)` CSS custom properties that are declared nowhere, causing silent invisible rendering (this is recorded as the root cause of a white homepage since March); 211 orphaned rows from a publisher removed for gambling ad content, still appearing on club pages; "Ranked by the PLHub Index" copy in the RSS feed output despite the Index being deleted; empty catch blocks; 13 sequential full-table `ILIKE` deletes that should be one query; a 2-post backfill cap; Reddit ingest disabled; no generated Supabase types; broken migrations; `cron_logs` not written.

**Four-month misdiagnosis, recorded so it is not repeated:** the pipeline was believed to be blocked by publishers. It was not. The real causes were a `maxDuration` of 10 seconds and Resend environment variables that were never set. The correction note in the plans is explicit: *always verify against the live database, not against documentation or migration files.* Three wrong diagnoses came from reading docs instead of querying.

---

## 5. Accounts, services and tooling — what is connected

| Service | Purpose | State |
|---|---|---|
| Vercel | Hosting | Live, Hobby tier. One project (`pl-hub-webapp12`); a duplicate (`plhub`) was deleted |
| Supabase | Database | Live |
| GitHub `Crumbalino/PLHub` | Repo (still old name) | Live |
| Claude Code | All code work | In use, via a work account, migration planned |
| 123-reg | DNS | Wired to Vercel |
| cron-job.org | Real scheduler | One job enabled |
| Resend | Transactional email | **Broken — invalid key** |
| beehiiv | Newsletter | **Not connected.** Free tier to 2,500 subscribers, 0% cut of paid subs; monetisation features gate at ~$89/mo |
| Google Search Console | Indexing | **Not verified.** DNS propagation makes this the long pole |
| Ahrefs | Keyword research | Connected and working |
| football-data API | Fixtures | Key set, live |
| Anthropic API | Summaries / drafting | Configured, disabled |
| Metricool | Social scheduling | Free tier, for media-requiring platforms |
| FFmpeg + Whisper | Video clipping / transcription | Local |
| X / Twitter | — | **Handle not reserved.** Site metadata already declares `twitter:site: @thefootballhub`, which points at an account the project may not own |
| Bluesky, Threads | Auto-poster targets | Planned, PR 3 |
| YouTube / TikTok / Instagram | GVsEverything handles | **Availability never verified** |

**Design tokens:** the plans mandate plain TypeScript constants (`src/lib/tokens.ts`) rather than CSS custom properties, because undefined CSS variables render components invisibly while passing every build check. A migration off CSS variables ran through March and stopped before reaching `HomeContent`.

**Fonts:** Sora (display/prose) + JetBrains Mono (all numerals, labels, timestamps), self-hosted via `next/font`. *A separate note records IBM Plex Mono replacing JetBrains Mono; the design system was not updated to match. **These two records conflict and one is wrong.***

---

## 6. Market and search evidence — refreshed today

### 6.1 The measured ceiling for this product form

SERP for `transfer gossip`, GB, today:

| # | URL | DR | Est. traffic/mo | Keywords |
|---|---|---|---|---|
| 1 | bbc.co.uk/sport/football/gossip | 93 | **178,942** | **741** |
| 2 | skysports.com/football/transfer-news | 85 | 53,249 | 366 |
| 3 | talksport.com/topic/transfer-news | 79 | 922 | 103 |
| 4 | newsnow.co.uk | 70 | 2,294 | 119 |
| 5 | footballtransfers.com | 64 | 307 | 17 |
| **6** | **football-rumours.co.uk** | **31** | **2,543** | 29 |
| 7 | skysports.com/football/transfer-rumours | 85 | 3,742 | 65 |
| 8 | YouTube — *"Ranking NEW HUGE Transfer Rumours This Week!"* | 99 | 107 | 3 |
| 9 | caughtoffside.com | 70 | 113 | 11 |
| 10 | transfermarkt.co.uk | 73 | 218 | 31 |

Four readings:

- **The BBC gossip column is one URL earning 178,942 UK visits a month from 741 keywords.** That is a measured ceiling for the exact product form, not a projection.
- **A DR 31 site holds position 6**, above Sky's second page, CaughtOffside (DR 70) and Transfermarkt (DR 73), on 29 keywords. This SERP is not authority-locked.
- **A YouTube video ranks 8th, and it is a direct competitor format** (the "ranking transfer rumours" show). Video is a ranking surface on this term.
- **No AI Overview on this SERP today.** Clean, and the single biggest external risk to the whole plan if that changes.

### 6.2 Keyword difficulty moved sharply in 17 days

The planning documents were built on an Ahrefs pull dated 7 August. Today's pull, same country, same terms:

| Keyword | Vol 7 Aug | KD 7 Aug | Vol today | KD today | Traffic potential today |
|---|---|---|---|---|---|
| transfer gossip | 2,800 | **8** | 2,100 | **36** | 67,000 |
| transfer news today | 3,800 | **9** | 3,600 | **33** | 51,000 |
| premier league transfer news | 8,500 | 20 | 8,500 | 37 | 51,000 |
| chelsea transfer news | 91,000 | **10** | 75,000 | **58** | 51,000 |
| tottenham transfer news | 125,000 | 40 | 127,000 | **21** | **156,000** |
| arsenal transfer news | 471,000 | 39 | 300,000 | 61 | 55,000 |
| newcastle transfer news | 43,000 | **0** | 40,000 | **6** | **89,000** |
| west ham transfer news | 70,000 | **0** | 48,000 | 21 | 56,000 |
| david ornstein | 87,000 | **0** | 68,000 | **2** | 21,000 |
| ben jacobs | 21,000 | 4 | 18,000 | 10 | 5,900 |
| indykaila | 49,000 | 24 | 56,000 | 25 | 49,000 |
| transfer deadline day | 19,000 | 18 | 20,000 | **8** | **1,400** |
| here we go fabrizio romano | 500 | 2 | 450 | 9 | **200** |
| **bbc gossip column** | *not pulled* | — | **1,700** | **1** | **67,000** |
| **football gossip** | *not pulled* | — | 15,000 | 61 | 65,000 |

**Interpretation — this matters for anyone rebuilding the plan.** The 7 August pull was taken at the quietest point of the transfer window. Difficulty on the core column terms roughly quadrupled as the major publishers poured freshness and links at them mid-window. This is seasonal SERP recomposition, not a permanent market change, and it should relax in October. **But it means the "KD 8 landgrab" framing in the planning documents is an artefact of when the data was pulled.** The daily column is still the right page; it is a twelve-month freshness-and-originality fight, not a quick win. Re-pull in November before making build-order decisions.

**Three specific corrections that fall out:**

1. **`bbc gossip column` at KD 1 with traffic potential of 67,000 is the cheapest doorway in the entire set** and was not in the original research. The parent topic for both `transfer gossip` and `football gossip` is *"bbc football gossip"* — Google already treats the whole cluster as one topic whose canonical answer is the BBC's column.
2. **The club build order inverts.** Newcastle (KD 6, TP 89,000) is now the best target; Tottenham has gone from KD 40 to **KD 21 with the highest traffic potential in the set at 156,000** — and it is the club the operator actually supports and writes about. Chelsea, previously the flagship commercial target, has collapsed to KD 58. Arsenal 61, Liverpool 68.
3. **The `/deadline-day` page is worth far less than planned.** `transfer deadline day` has 20,000 volume but **traffic potential of 1,400** — the volume is absorbed by broadcasters and inline answers. It was listed as the only date-critical asset before 1 September. On this data it should not consume the last eight days.

### 6.3 The demand shape that constrains everything

**The product concept has zero search demand in every phrasing tested:** `are transfer rumours true` 0 · `transfer news reliable` 0 · `tier 1 transfer news` 0 · `transfer rumours true or false` 0 · `how to spot fake transfer news` 0 · `transfer rumour accuracy` 0 · `fabrizio romano accuracy` 0 · `fake transfer news` 10 · `itk football` 20.

**Validity is the product, not the doorway.** It is what makes someone stay. It is not what gets them through the door, and no reframing changes that — the question is not one people type. The traffic must come from generic transfer-news demand and from feed-driven discovery.

### 6.4 Where AI citations actually come from

From two independent 2026 industry datasets referenced in the plans:

- AI engines cite a brand's own domain in only **16.05%** of responses; **12.10%** in Media & Entertainment. **84–88% of citations point off-domain.**
- Reddit is **21.85%** of all off-page AI citations — 28.26% for ChatGPT, 30.43% for Perplexity, **51.78% for Grok**, **33.63% in Media & Entertainment**. It is the single most-cited source for four of seven models measured.
- YouTube is **10.32%**.
- Structured data ranks **13th of 14 factors at 4% weight**; `llms.txt` has no demonstrated effect. `robots.txt` is the only binary gate.
- Originality and information gain carries roughly double schema's weight.

**Consequence the plans draw and then do not act on:** the highest-leverage AI-visibility work is answering "is this real?" in r/soccer and club subreddits under a consistent username, with actual sourcing, no links. It requires zero engineering time and can be done today with a dead pipeline and no column. It has not started.

**Consequence the plans do draw correctly:** the originality play cannot begin before 1 September, because nothing has resolved. Every page before then is either a feed of other people's claims or a methodology promise.

---

## 7. The document estate

Five canonical documents, all dated 6–7 August 2026, all self-described as "living," totalling roughly 40,000 words.

| Document | Governs | Status |
|---|---|---|
| `CURRENT_STATE` | Ground truth, ship order, channel formats, search data | **Superseded by live reality on at least six points** |
| `DESIGN_SYSTEM v1.0` | Colour, type, spacing, blocks, states, accessibility, three-phase data maturity | Specifies a page that has never been built |
| `EDITORIAL_VOICE v3.0` | Register, craft formula, banned language, pronouns, corrections | Live site contradicts it on three pages |
| `SEO_AEO_STRATEGY v2` | Search and AI-search strategy | Keyword data now 17 days stale and materially wrong |
| `MONETISATION_BRIEF` | Revenue model, gambling architecture, newsletter stack | Contradicted by a live published page |

Each supersedes and replaces multiple earlier documents. `DESIGN_SYSTEM` alone replaces five prior brand documents. `EDITORIAL_VOICE` replaces four prior voice documents.

Each contains a "deliberately excluded" section listing rejected ideas that require a named decision to reintroduce. This is genuine, functioning scope control and should not be mistaken for sprawl.

---

## 8. The sprawl audit

*This section is analysis rather than verified fact.*

### 8.1 Count the surfaces

| Category | Count | Detail |
|---|---|---|
| **Platforms and properties** | 12 | Website · YouTube · TikTok · Instagram/Reels · Shorts · newsletter · stand-up · X (reserved) · Bluesky (planned) · Threads (planned) · Reddit · "ADH Dad" second channel (ideation) |
| **Content formats** | 11 | Daily site column · gossip column video · "Vs" format · Project Hail Mary / film lane · Spursy (parked) · St Totteringham's (parked) · Building-with-AI (parked) · wrestling (cut) · stand-up clips · FPL written content · Balloon Door Awards |
| **Planned route families** | 16 | Six exist |
| **Designed but unbuilt mechanics** | 14 | Balloon scoring · `pairing_history` · `window_state` · seven-state temperature model · rumour clustering · attributed-origin collapse · six block families · movement-based ordering · dated corrections · Balloon Door categories · track record / hit rates · bracket grammar · publisher colour system · three-phase data maturity model |
| **Revenue lines** | 7 | Display · on-site video · YouTube ads · brand deals · newsletter · betting affiliate · B2B data licensing |
| **Canonical documents** | 5 | ~40,000 words |

### 8.2 Count what actually works

One thing: **25 club pages listing headlines scraped from three publishers, sorted wrongly, 12% classified, 17 days stale, indexed by nobody.**

### 8.3 The diagnosis

The sprawl is not primarily an idea problem. The rejected-and-parked lists are long, specific, and enforced — wrestling cut, Spursy parked with reasons, reader leaderboards rejected by name, four-tier claim taxonomies rejected by name. Scope control at the *idea* level is working better than most solo projects manage.

**The sprawl is a specification-to-build inversion.**

`DESIGN_SYSTEM` specifies a seven-value temperature model, a block-rhythm rule ("one non-Claim block every 3–4 Claims, never two adjacent"), a six-test gate for introducing new block types, and a bracket grammar spanning web, email, OG images and vertical video — **for a page that has never existed.** The design debt was incurred before the design was ever rendered.

Three symptoms confirm it:

1. **Every document is written in the present tense about a product in the future tense.** The homepage's own copy says the site "logs Premier League transfer rumours and scores how well each one is sourced." It does neither. That sentence is live, indexed, and false.

2. **The documents have started contradicting each other and the live site.** The mono typeface is JetBrains in one record and IBM Plex in another. `club_slug` is singular in the data contract and plural on the live page. Three legacy pages contradict the voice document, and one contradicts the revenue model. **No one is wrong here — the estate is simply too large for one person to keep synchronised.**

3. **The one asset that cannot be rebuilt later is the one that has been neglected.** Everything in §8.1 can be built in October at the same cost as today. The ledger cannot. A claim not logged while it was being made can never be logged, never resolved, and never counted. Seventeen days of a six-week window are gone, and eight remain.

### 8.4 The reframe worth testing

The documents treat **1 September as a search deadline** — get `/deadline-day` indexed before deadline day. Today's data says that page's ceiling is roughly 1,400 traffic potential and eight days is not enough runway to rank a new page on an unindexed domain anyway.

**1 September is a content-supply deadline, not a search deadline.** The column needs live rumours to score. After 1 September there are none until January. So the real fork is:

- **Restart ingest and start logging now**, and enter October holding a window of claims, resolutions, hit rates, `pairing_history` depth, and the raw material for the Balloon Door Awards — which is the entire originality and AI-citation play.
- **Or accept a January start** with an empty ledger, nothing to run the Awards on, and five months of dead air first.

---

## 9. What the operator wants tested

Roughly in order of how much rides on the answer.

1. **Is the product one thing or three?** The site, the channel and the newsletter are described as one funnel. They may be three products with three production cadences, one operator, and no shared output beyond a script. If it is three, which one is actually the business?

2. **Can a single person run a daily column?** The plans assume a pipeline drafts it and a human punches it up. The clustering that would make that possible is unbuilt, the ingest is 88% unclassified, and the classifier currently files horse racing under Newcastle transfers. Realistically, the first version is hand-curated daily labour. Is that survivable given the operator's own stated pattern that "weeks will collapse"?

3. **Should the balloon score ship at all in v1?** With no resolution data it rewards herding and punishes scoops — an acknowledged mechanical fault. Without it, the site is an aggregator with better copy. Is there a v1 that is honest and still differentiated?

4. **Is the ledger real or is it a story?** It is the only defensible long-term asset and the only justification for the AI-citation strategy, and it requires uninterrupted daily logging through every window for years. Seventeen days were lost without anyone noticing. Is a single part-time operator the right owner of an asset whose value is entirely a function of never missing a day?

5. **Does 1 September matter, and is §8.4's reframe right?**

6. **Gambling: rewrite `/principles`, or remove betting from the revenue model?** Both are defensible. The current state — a published personal pledge the business plan intends to break — is not.

7. **What should be cut?** The operator's instinct is that something must go. Nothing in the documents has been cut on grounds of operator capacity; everything cut so far was cut on strategic grounds (footage rights, search demand, competitive density). That may be the missing filter.

---

## 10. Immediate factual state, for reference

**Working:** domain, hosting, `robots.txt`, `noindex` off, hero copy, homepage facts block, per-page canonicals, 25 club page templates with correct titles and H1s, club metadata table, football-data fixtures API, one external cron.

**Broken:** RSS ingest (silent, since 7 August), club page sort order, club classifier, `/api/subscribe` (500), digest cron (500), three legacy pages, sitemap freshness, `og:url` on legacy pages, `og:image` on club pages, breadcrumb branding, five dead cron declarations.

**Never built:** the column, clustering, scoring, source pages, pairing pages, deadline-day page, Balloon Door page, subscriber capture, API routes, Search Console verification, any video, any social handle.

**Eight days to the stated deadline. Zero pages indexed. Zero email addresses captured. Zero videos published.**
