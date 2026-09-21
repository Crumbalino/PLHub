# GVsEverything + The Football Hub — CURRENT STATE

**Ground truth as of 7 Aug 2026.** Replaces CURRENT_STATE (6 Aug), the claim-first pivot handoff (7 Aug), the claim-first amendment (7 Aug) and the ship-order handoff (7 Aug). Where any of those conflict with this, this wins. Verify live state (repo, deployment) before making code changes.

**Conflicts resolved on merge, recorded so they don't get reopened:**

- **Tagline.** The ship-order handoff recommended *"Every transfer rumour, and how much of it is air."* The amendment had already killed it. Hero is locked in §3.
- **Second evergreen format.** The pivot handoff called it the biggest open item. It isn't — the Vs format was locked 4 Aug. That handoff was written from the 4 Aug material and never saw the 6 Aug doc.
- **Source vs club pages.** CURRENT_STATE named club pages the primary AEO asset. Search data says otherwise. Source pages first — §3.

---

## 1. What this project is

Three linked properties, one operator (Gautam Srivastava — "G"; Crumbalino on GitHub):

- **GVsEverything** — YouTube/TikTok/IG channel. Tagline: *"G vs Everything. Everything wins."* Byline everywhere: **G**.
- **The Football Hub** — thefootballhub.uk. Transfer rumours, scored. The channel's destination and product.
- **Stand-up** — live gigging. Filmed sets are the highest-value clip source for the channel.

The channel is top-of-funnel, the site is the destination. An anonymous aggregator has no moat; the persona gives it a reason to exist, and the site gives the persona a product that isn't just "follow me elsewhere."

Test for every piece, site or video: **would this still be interesting if nobody knew who wrote it?** Voice on everything, face on some things, biography on almost nothing.

---

## 2. The deadline and the ship order

**The transfer window closes 1 September. That is the only hard deadline in the project.** Everything else is self-imposed and can move. The old ship order put filming fifth, behind a pipeline rebuild of unknown duration — run that and the window closes before video 1 exists.

### This weekend

1. **Session 1, residual only** — the rebrand is largely in the codebase and the domain is wired (§3). What's left is the hero copy, the metadata/`NEXT_PUBLIC_SITE_URL` pass and the grep sweep (spec in §5). Hours, not a session.
2. **Re-enable a summary job.** Nothing is generating summaries anywhere since the duplicate `plhub` project was deleted. Small fix, currently invisible, blocks everything downstream of the pipeline.

### Week of 11 Aug

3. **Film video 1** (spec in §4). Before Session 2, not after.

One video needs one hand-researched rumour cluster: four outlets, trace to attributed origin, count what's missing. That's an evening, not a pipeline. Session 2 is the largest unknown-duration item in the project; if it overruns, filming slips past 1 September and the highest-demand content moment of the year goes with it.

### Rest of August

4. **Session 2** — RSS pipeline rebuild + feed expansion
5. **Source pages** — build order in §3
6. **One category page — the daily column — targeting `transfer gossip`, `transfer news today` and `premier league transfer news`.** Before 1 Sep. One build, not three.
7. **Videos 2–3** from the pipeline, inside the window

### September

8. **Project Hail Mary video** — §4
9. **Competitor audit** — if still wanted

---

## 3. The site

**What it is:** transfer rumour aggregator with a per-rumour sourcing score. Rebranding PLHub → The Football Hub.

- Domain: thefootballhub.uk (purchased, **not yet connected**)
- Current deployment: pl-hub-webapp12.vercel.app
- Repo: github.com/Crumbalino/PLHub (old name; CLAUDE.md at root)
- Stack: Next.js, TypeScript, Tailwind, Supabase, Vercel, Anthropic API
- Brand: navy / teal / pink / gold; Sora (display) + JetBrains Mono (accents/data); diagonal chevron logo; ADHD-friendly ethos (clear hierarchy, low clutter, generous whitespace)

**Status (7 Aug, late):** rebrand is largely in the codebase already. Domain is wired — DNS at 123-reg, `thefootballhub.uk` attached to `pl-hub-webapp12`. **The summary pipeline is not blocked by publishers; that diagnosis was wrong and cost four months.** Real causes: `maxDuration` was 10s (fixed to 60s in PR 1), and deleting the duplicate `plhub` Vercel project removed the only enabled summary job — so nothing is generating summaries anywhere right now. Source pages, SEO/AEO infrastructure and legal pages are genuinely not built.

### The claim-first pivot (7 Aug, canonical)

**The score is on the rumour, not the reporter.** The question the site answers is *"how likely is this, and how well is it sourced?"* — not *"has this journalist ever been right?"*

Author track record survives as an **input** to the claim score. It is never the published product.

The maths barely moved. The positioning, taglines and page architecture did.

### Hero copy — LOCKED 7 Aug. Do not reopen.

> **The Football Hub**
> *Some of this is true.*
> Transfer gossip. Scored.
> [ single email field ]
> *The Balloon Door Awards, October.*

The descriptor line is **required.** On its own, "this" has no referent and reads as the site being unreliable rather than the rumours being unreliable. Four words fixes it; longer turns the hero into a feature bullet. The tagline works standalone as a clip outro and newsletter subject line, because by then the audience has context.

Hero copy doesn't rank — title tags, H1s and body content do. `transfer gossip` at KD 8 / $50 CPC is a bonus, not the reason for the line.

**Rejected, recorded so they don't get reopened:** "Who said it, and have they ever been right?" (author-first, dead) · "Every transfer rumour, and how much of it is air" · "How likely is it, actually" · "We score the rumour, not the rumourmonger" · "Every rumour, and what's holding it up" · "Transfer news, by weight" · "Every Premier League transfer rumour, scored on how well it's sourced" (featurey) · "News and views. Scored." (promises opinion columns) · "All the football news ranked by authority" (\"authority\" is a property of a person and reverses the pivot; \"all the football news\" is unsupportable on nine RSS feeds with one cron).

**Site name unchanged.** Generic is normal in this lane — Goal, Sky Sports, BBC Sport don't say what they do either. The descriptor does that job, and a broad name doesn't box the product in if it widens past transfer rumours.

**Positioning line, keep:** *"We don't decide who's reliable. We just keep score."* More true after the pivot, not less.

### The five scoring inputs

1. **Contextual data** — exactly two fields, both derived from data already owned:
   - `window_state` — window open/closed, days to deadline. Pure date maths.
   - `pairing_history` — how many times this player-club pairing has been claimed before, and since when. Straight out of the ledger once clustering exists.

   Out of scope for launch: contract expiry, market value, wages, club financial position. Contract length and fee plausibility needed a data source that doesn't exist here, and Transfermarkt scraping is a ToS problem, not a build problem. `pairing_history` earns its place three ways at once — *"this is the 41st time this has been claimed since 2023"* is a scoring input, a joke and a headline.
2. **Conflicting reports** — does anyone credible say the opposite
3. **Initial poster authority** — who broke it first, and their history
4. **Breadth of coverage** — number of *independent* outlets, collapsed via attributed origin so five rewrites of one Romano tweet count as one
5. **Quality of coverage** — specificity (named fee, club, timeline) and attribution (named source vs "sources close to the player")

**At launch it runs on `window_state`, conflicting reports, breadth and quality.** `window_state` is pure date maths, so it's available day one. Track record and `pairing_history` switch on later — track record after one window, `pairing_history` once clustering exists. Say that on `/how-it-works`.

**Ledger schema unchanged, no migration.** Outlet, byline and attributed origin still captured — they moved from display layer to input layer. One build consequence: **clustering claims into a single rumour** (PR 3) is now load-bearing, not nice-to-have. Conflicting reports can't be detected without it.

### Locked build decisions

- **Do not re-engineer scraping.** Conclusion stands; the original reason for it was wrong. RSS isn't a decision still to be made — it's already what runs: `/api/cron/rss` is the only enabled cron, nine feeds, every 15 minutes via cron-job.org. Session 2 is a rebuild and feed expansion, not a re-architecture. Aggregate multiple sources per story, link out prominently — more resilient, more legally defensible, more AEO-citable than derivative single-article summaries.
- **Three of the nine feeds are dead.** Goal.com and Football365 404 silently; The Independent returns valid RSS with zero items. Carry into Session 2.
- **Pipeline outputs draft roundups in G's voice** for human punch-up — not anonymous summaries. Prompt-design decision inside Session 2.
- **Source pages are the primary AEO asset, ahead of club pages.** Journalist names are systematically low-difficulty at high volume because nobody optimises for them — they're navigational queries. This is a class of targets, not two.
- **Reframed, not dropped:** `/sources/[slug]` shows every claim originating with that person and how each scored — showing working, not ranking a human. Same URL, same Person schema, same intent captured.
- **Build order:** Ornstein → Chelsea → indykaila → **Ben Jacobs** → Tottenham → Arsenal. Ben Jacobs at 21,000/KD 4 is the evidence that Ornstein at KD 0 isn't a fluke — journalist names are a class of target, not two one-offs. Chelsea moves up: KD 10 at 91k with a $25 CPC is the strongest commercial target in the set. Romano stays late — KD 52 and a knowledge panel that absorbs the clicks.
- **AEO mechanics** (schema.org NewsArticle, SSG/ISR, sitemaps, semantic HTML, metadata, llms.txt) get baked into how pages are built, not done as a separate phase. Commodity news summaries won't get cited; AI engines cite original sources for news. The winnable surface is structured evergreen entity content.
- **FPL stays off the channel.** If wanted, it belongs on the site as weekly written content where the pipeline does the work.
- Legal pages slot in anywhere. Launch line = Session 1 + Session 2 + legal pages.

### The cost of source pages, stated plainly

The pivot claims reputational surface "drops significantly" under claim-first framing. The build decision says build source pages anyway. **Both cannot be true.** A page listing every David Ornstein claim with a balloon rating beside each reads as a scorecard to David Ornstein, whatever the H1 says. The reframe is real editorially and will not matter socially.

Not an argument against building them — 87,000/mo at difficulty 0 is the best asset in the project. An argument for choosing it knowingly rather than believing the protection still applies.

---

## 4. The channel

### Format 1 — the gossip column (lead)

Premier League-wide gossip/rumour roundup. Solo host. Deadpan. Delivered as news, with the absurdity of the rumour economy as the running joke rather than the rumours themselves being hyped. PL-wide, narrated by a Spurs fan.

**Why this and not match reaction or club content:**

- **It syncs with the site.** Pipeline drafts a roundup → roundup becomes the video script. Write once, ship twice.
- **Production cost is the moat.** Every rival pays full price per episode. With the pipeline, G doesn't. Structural, not editorial — therefore more defensible.
- PL-wide is roughly 20x the addressable audience of a single club.

**Competitive reality — the format exists and is contested:**

| Competitor | Shape |
| --- | --- |
| Transfer Gossip Daily (Telegraph) | Comedian + staff writer; newspaper-resourced |
| Thomlinson × James Allcott | Weekly "ranking transfer rumours" |
| The Backpost | Weekly summer transfer show |
| The Irish Guy | Grading every club's first rumour of the window |
| 442oons (~1.5M) | Animated parody |

**The gap:** every incumbent ranks, grades or reacts, in a register of excitement or comic outrage, and almost all are two-handers. Nobody is solo and deadpan.

**Open test, not settled fact:** every incumbent being a two-hander might mean solo deadpan is unclaimed — or that one person delivering rumours for fourteen minutes is a hard watch. Check whether any solo host in this lane has a breakout video before over-committing.

**The joke target moved with the pivot.** It was the journalist; it's now the rumour. Better fit with the voice guide — a named journalist is a person, a rumour is a system, and systems are safe to mock. Hook construction changes shape:

> ~~"Fabrizio Romano has been wrong about Spurs forty percent of the time."~~
> "Four outlets. One source. No fee, no timeline, no club. Five balloons."

The second is funnier, safer, and doesn't require a resolved ledger to say.

### Video 1 spec — the "here we go" economy

**Anchor:** `here we go fabrizio romano` — 500/mo UK, KD 2. The meme, not the man.

**Spine:** *"Four outlets. One source. No fee, no timeline, no club. Five balloons."*

**Footage:** screenshots, chyrons, timestamps. **No match footage.** PL and UEFA issue strikes and blocks, not claims — channel-threatening, not revenue-threatening. There is no press or EPK route that gets PL match clips; the asymmetry is structural.

**Register:** deadpan resignation. The rumour economy is absurd; the narrator is the mug refreshing the app at 1am. Narrator loses.

Selected because it was the only candidate scoring on all four axes — demand, competition, footage risk, register fit. Zero match footage, register-native, seasonally correct this month, and it makes site and channel one argument rather than two projects.

### Format 2 — "Vs" (locked 4 Aug 2026)

G vs VAR. G vs the international break. G vs 12:30 kick-offs. G vs ticket prices.

- **Not** balanced for-and-against — that's generic and drifts into the anger register.
- Every episode ends with G having lost to the thing. Narrator-must-lose applied at format level.
- Seasonless, so it fills the Aug–May gossip trough.
- Topic-agnostic enough to extend to wrestling and film later.
- Each episode generates a Short as a byproduct.
- Titles bare and lowercase: "G vs VAR". Never caps-lock rant style — that's Slater's lane.

**Not video 1.** Search is thin (`var premier league` 150/mo, KD 3) and it carries the same PL footage problem. It belongs in the trough, which is what it was locked for.

Aug–May is now covered three ways: Vs format, the ledger's post-window resolution work, and film/TV as an occasional third lane.

### Project Hail Mary — deferred to September

Not competing with the football window; covering the month after it.

- `project hail mary rocky` — 4,700 UK, **47,000 global, KD 1**
- UK volume: 837k (Mar) → 43k (Jun) → **313k (Jul**, Prime Video landing 3 Jul)
- Blu-ray/4K **11 Aug**; awards campaign **Nov–Jan** (Amazon MGM confirmed campaigning)
- $683.5M box office, 94% RT, third-biggest global take of 2026

**Assume no asset access.** Apply for it — the ask costs an email, and an active awards campaign is the most permissive moment in a film's life — but don't build on a yes. Stills carry the video (single film stills are generally defensible and don't trigger Content ID), trailer footage sparingly, G to camera doing the work. A Content ID claim redirects revenue and leaves the video up; on video 2 of a new channel that's a currency not yet earned.

**Access routes, ranked:** UK distributor's publicist (confirm who holds UK rights — Sony appears involved alongside Amazon MGM) → UK film PR firms, Premier and Organic Publicity → BFI press list (Press and PR Coordinator) → LFF accreditation, from £52, October 2026.

Trailers are not free. They're fully copyrighted and fully fingerprinted — Warner Bros claimed creators over *positive* Minecraft trailer reactions.

Deferred rather than run at video 2 because topic-cluster dilution is a real cost: at video 2 of 5 it reads as a channel finding its shape; at video 15 it reads as a channel with no shape.

### Parked and cut

- **Spursy / St Totteringham's Day — PARKED.** Most on-voice topic available, terms ownable outright (`spursy` 400/mo KD 1; `st totteringham's day` 900/mo KD 0). Killed by the worst footage problem on the list — the clips you'd want are exactly the clips you can't have — and St Totteringham's is April/May. Revisit in spring.
- **Building the Football Hub with AI — PARKED.** Zero footage risk, highest CPM niche on the platform, and the register there is 100% hype and revenue claims, so deadpan "here's everything that broke" is genuinely unclaimed. Already screen-recording Session 1, so raw material accrues free. Killed for now: search is thin (`claude code review` 400/mo), making it a feed play not a search play, and it forks the channel to a different audience. Strong option once the football floor holds.
- **Wrestling — CUT.** The essay and documentary lane is dense with established channels. No documented authority in it — a listed interest, not a position. Plus the advertiser-friendliness history.

### The footage table, which reordered everything

Demand was never the constraint. Rights were.

| Vertical | What happens when you use the footage |
| --- | --- |
| Premier League / UEFA | **Strikes and blocks.** Channel-threatening |
| Film / TV | Content ID claim → revenue redirects, video stays up. Survivable |
| WWE | Strict, plus a history of advertiser-unfriendly classification |
| Building with AI | Zero risk — your own screen |

Note *why* Tifo animates and Athletic Interest uses data and stills. Not stylistic choices — the workaround for exactly this. Those channels spent their entire differentiation budget solving the footage problem. "It's on YouTube" confers nothing; being uploaded is not a licence.

### Recent vs nostalgic — neither

Recency gets the spike but competes with everyone simultaneously, and the wave has moved by the time a first video is edited. Nostalgia gets the tail but no cold start. What works for a first video is the overlap: **demand currently rising, specific term uncontested.** That overlap is rare.

---

## 5. Session 1 brief (ready to execute in Claude Code)

Goal: every user-facing and machine-facing reference to PLHub becomes The Football Hub; codebase ready for thefootballhub.uk. One PR, reviewed before merge.

- **Audit first:** grep for PLHub / plhub / pl-hub (case-insensitive); categorise (UI strings, metadata, config, env vars, comments, package.json) and show the list before changing anything.
- **UI + copy:** header/footer/nav, titles, hardcoded mentions.
- **Hero copy per §3** — *"Some of this is true. / Transfer gossip. Scored."* The descriptor line is not optional. This is the change that stops the hero shipping twice.
- **Metadata:** Next.js metadata (title templates, descriptions, OG, Twitter cards); metadataBase → https://thefootballhub.uk; webmanifest/favicon refs.
- **Domain refs:** replace hardcoded vercel.app URLs with NEXT_PUBLIC_SITE_URL env var (prod default thefootballhub.uk).
- **robots.txt + minimal sitemap** (App Router sitemap.ts or next-sitemap) referencing the new domain. Full AEO later.
- **Byline is "by G"** — not "by Adhdad".
- **Don't touch:** summary pipeline, Supabase schema, source pages. List out-of-scope breakage; don't fix.
- **Verify:** build passes; grep clean bar intentional leftovers; homepage/article/404 show new brand locally.
- **Update root CLAUDE.md in this PR** with: the rebrand, the RSS decision, the claim-first pivot, the ship order, the G byline — so future Claude Code sessions inherit it without a handoff doc.
- **Screen-record it.** Raw material for the parked "building with AI" format, free.

**Manual (human) steps:** Vercel → Domains → add thefootballhub.uk + www redirect; DNS records at registrar; set NEXT_PUBLIC_SITE_URL in Vercel env.

**Tooling:** Claude Code pointed at the repo (local, or remote session from mobile); Vercel auto-deploys on push. The old chat + Chrome-extension-puppeteering-GitHub workflow is deprecated.

---

## 6. Voice and register

**Register is resignation, not anger.** The single most important line in this document.

Anger is the genre default — inherited from the AFTV reaction/watchalong template — the most contested register in football content, and the opposite of G's actual voice. The pivot makes deadpan work harder, not less: "here is a claim with nothing behind it, delivered flat" is the purest version of the bit.

**Barnaby Slater** (@barnabyslater_, IG @barnabyslatercomedy) already owns *comedian doing daily club content*: "Spurred On", 604 episodes since 2023, Patreon-funded, caps-lock rant titles. **Differentiate on cadence, register and production — never on identity.** He got there first.

**The channel tagline does the register-setting.** "G vs Everything" alone promises a man taking the world on. The act is a man the world has already comfortably beaten. "Everything wins" makes the irony legible to someone who's never seen him before. Don't drop the second half. (This is the *channel* tagline and is separate from the site hero in §3. Both stand.)

**Mechanics:**

- Short declarative sentences, one idea each
- No exclamation marks, no intensifiers
- Exact numbers always — scorelines, minutes, fees
- End each item cold; no summing up, no significance
- Narrator is always the most pathetic figure present; never punches down at players, fans or named journalists
- Reasonable logic arriving somewhere absurd, delivered as ordinary
- Spurs bias declared and mocked, never defended
- Comedy is optional per item — one landed line per three items beats three weak ones
- **The fact never bends for the joke.** Accuracy is the product.

Full detail in adhdad-voice-guide.md — that file predates the rebrand, so read "Adhdad" as "G"; everything else stands. Needs a find-and-replace pass.

---

## 7. The ADHD-friendly format contract

ADHD is **the lens and the format logic — not the topic.** The channel is not about ADHD; it's built for ADHD attention, and that shapes the product.

Thesis, unchanged since the site's original design: **football for brains that can't finish an article.** Not a football product — an ADHD product about football. Scales to everything on the channel.

- **Length as a promise.** 7 / 14 / 21 minutes as a stated commitment, 14 the primary tier for mid-roll revenue. Nobody perceives length as a promise unless you say so — from outside it's just a duration. Put it in the packaging and repeat it every episode until it's a known quantity.
- **Brevity as ethos, not constraint.** Short because long is a barrier, not because there's nothing to say.
- **Structure:** chains of self-contained blocks. Each block works alone — which is also what generates Shorts as a byproduct rather than extra work.
- **Camera:** full-frame face cutting to full-frame graphics. No picture-in-picture.
- **Site side:** clear hierarchy, low clutter, generous whitespace, links out prominently. Already the design system.

---

## 8. Cadence and scope fence

- **Platforms:** TikTok, Reels, Shorts. Same 9:16 file cross-posted natively, no watermarks. No per-platform customisation yet.
- **Cadence:** floor, not ceiling. Weekly floor = 1 site roundup + 1 clip. Good week = 3 clips. Max one filming/batch session per week (~2 hrs). Roundup script doubles as the video script.
- **If a week collapses:** skip, no public apology, resume next batch day.
- **Scope fence:** no podcast, no newsletter beyond the Balloon Door hook, no long-form YouTube until the weekly floor holds for two months. No paid ads. No "who is G" explainer content.
- **Metrics (monthly, light):** clips posted vs floor; site sessions from bio links; most-saved/shared clip shape.

---

## 9. Search data (Ahrefs, GB — pulled 4 and 7 Aug 2026)

Google volumes, not YouTube. Correlated, not equivalent. Evidence that demand exists; not a YouTube forecast.

### Site targets — build these

| Keyword | UK/mo | KD | CPC |
| --- | --- | --- | --- |
| david ornstein | 87,000 | **0** | – |
| chelsea transfer news | 91,000 | **10** | $25 |
| indykaila | 49,000 | 24 | – |
| ben jacobs | 21,000 | **4** | – |
| ornstein | 7,800 | **3** | – |
| tottenham transfer news | 125,000 | 40 | $10 |
| arsenal transfer news | 471,000 | 39 | $20 |
| fabrizio romano | 748,000 | 52 | $3 |
| **transfer gossip** | **2,800** | **8** | **$50** |
| **transfer news today** | **3,800** | **9** | **$30** |
| transfer deadline day | 19,000 | 18 | $4 |
| premier league transfer news | 8,500 | 20 | $3 |
| transfer news | 139,000 | 71 | $15 |

`transfer gossip` (2,800/KD 8), `transfer news today` (3,800/KD 9) and `premier league transfer news` (8,500/KD 20) all show 61–67k traffic potential against 3–9k volume, because the #1 result for each is the same kind of thing: a daily-updating gossip hub. **That's the daily column. Point all three at it — one page, not three.** Before 1 September. `transfer news` at KD 71 is a nav and title term, not a ranking target; don't build a page for it. Romano carries a knowledge panel that absorbs most clicks.

**AI Overviews:** none of these SERPs currently carry one. The risk is real and worsening but not yet live on these queries. Re-check before the source-page build.

### Channel anchors

| Keyword | UK/mo | KD |
| --- | --- | --- |
| here we go fabrizio romano | 500 | **2** — video 1 |
| project hail mary rocky | 4,700 (47,000 global) | **1** — September |
| st totteringham's day | 900 | **0** — parked, April/May |
| spursy | 400 | **1** — parked |
| var premier league | 150 | 3 — trough |
| claude code review | 400 | – — parked |

Title as the **bare term**: "Spursy", not "What Does Spursy Mean". The question form returns literally zero.

### The validity concept has no search demand — in any phrasing

`are transfer rumours true` 0 · `transfer news reliable` 0 · `tier 1 transfer news` 0 · `transfer rumours true or false` 0 · `how to spot fake transfer news` 0 · `clickbait transfer news` 0 · `transfer rumour accuracy` 0 · `fabrizio romano accuracy` 0 · `fake transfer news` 10 · `itk football` 20

**Validity is the product, not the doorway.** It's what makes someone stay. It is not what gets them through the door, and no reframing changes that — the question isn't one people type. Feed-driven discovery doesn't need search volume behind it, so the zeroes rule out a *search* strategy, not the angle.

### ADHD terms — not a viable anchor

`adhd symptoms in men` 2,000/mo and `adhd in men` 1,400/mo, both KD 57 at a $10 CPC. Competing with private clinics, not creators. 900 you can own beats 2,000 you can't.

---

## 10. Constraints to design around

- **Seasonality.** Transfer gossip clusters May–August; October is dead air. The gossip column cannot be the only format — Vs, ledger resolution work and film/TV are the answer.
- **Rights.** See the footage table in §4. This constraint reordered the entire content plan and will keep doing so.
- **Ceiling.** Independent single-club channels top out near 200K after a decade of daily output. Realistic band for a good non-daily channel: 10–50K in 18–24 months. PL-wide raises the ceiling but difficulty jumps from near-zero to newspaper-grade.
- **Treadmill risk.** Recency content punishes inconsistency, and the working pattern already assumes weeks will collapse. The pipeline is what makes a recency format survivable.
- **Reputational.** Source pages read as scorecards to the people on them, whatever the framing. Chosen knowingly — see §3.

---

## 11. Stand-up

**Development is paused** so three properties aren't half-arsed. Resume after the site and first five videos ship.

**Booked gigs are still played** with existing stage-ready material — filmed sets are the highest-value clip source, so these are content acquisition, not a competing project:

- Taproom — 6 Aug 2026
- Healing Comedy — 1 and 6 Sep 2026
- Bricking It — 14 Sep 2026

**Craft formula (codified in g-joke-development.skill):** Frame → Justify → Pivot → Land Cold.

- The narrator must always be the most pathetic/implicated figure in every beat — never the winner.
- Failure mode 1, *surface-observation trap*: the bit stays at diagnostic distance instead of implicating the narrator.
- Failure mode 2, *landing on the environment*: the punchline hits another character or external target instead of the narrator.
- Plain declarative sentences. Cold unadorned buttons, zero inflection, zero movement. Never editorialise on the button.
- Autobiographical specificity consistently outperforms invented detail.
- Ratings only count after a room — not from the desk.
- Tooling is ahead of stage time. The real bottleneck is gigging frequency and filmed material.

**Stage-ready:** Argentina/World Cup bit (~3 min, July 2026) — open-minded man collapses into national hatred → babies escalation → Messi shirt turn → monolingual arrogance ("Because I'm English") → Home Office biometrics closer → "cheating little arseholes" callback button. Placed in the back third of the ten, after Spurs material.

**Admin:** Angel Comedy RAW — email raw@angelcomedy.co.uk on 1 Sep (calendar reminder set, 8am).

---

## 12. Open items

**Before 1 September:**

- **Should source pages ship without the balloon column at launch?** At launch the score runs without track record, and under that config a genuine solo scoop — one outlet, "sources close to the player", nobody else on it yet — scores identically to an unsourced ITK tweet. The score would punish originators and reward herding, the exact thing attributed-origin exists to prevent. Mechanical fault, not a framing one. Proposed fix is a subtraction: ship source pages showing claims, outlets, attributed origin and verbatim hedging language only, and switch the balloon column on after one window. Costs nothing — the column is just hidden. Also dissolves §10's "reads as scorecards" constraint: no balloons, nothing to read as a scorecard. Not blocking Session 1; decide before the source-page build.
- Re-enable a summary job somewhere — nothing is generating summaries at all right now (§3)
- RSS feed-source selection for Session 2 (which publishers/feeds, per-club vs general)
- Legal pages (privacy, terms) — pre-launch
- Verify GVsEverything is free on YouTube, TikTok and Instagram — one sitting
- Apply for Project Hail Mary asset access (one email, no dependency on the answer)

**After:**

- Balloon Door category list redrawn at rumour level before the October publish
- Balloon Door first-edition date — Oct 2026 hand-researched, or Oct 2027 with real data
- Solo deadpan in the gossip lane still unverified — no incumbent is solo. Open
- Where the stand-up clips live — separate account or GVsEverything. Slater runs separate football and club TikToks after 600+ episodes, which suggests splitting
- About page copy (tells the persona story once)
- Fixed weekly batch day
- adhdad-voice-guide.md find-and-replace pass for the rebrand
- **ADH Dad** (YouTube Adhdad3000 / TikTok Adhdad_3000) — early ideation, development deferred

**Parked, deliberately:** ledger as B2B data. The licensable asset is claim-level scoring rather than a source league table — arguably better, since nobody else has claim-level data at all. Don't kill it, don't work on it.

---

## 13. Working preferences

- Claude Code for code work. Plan before editing; show audit/plan and wait for a go; small commits, single PR; flag ambiguity rather than guess; no manual copy/paste workflows.
- Voice mode for ideation, text for structured outputs. Links, lists, handles and documents always in text.
- Terse direction. Project context is assumed held, not re-summarised.
- Research rabbit holes (competitor audits, equipment research, deep dives) are a known displacement activity. Flag when exploration is eating shipping time.
- Instinct first, constraints second — anchoring to a practical constraint too early kills good options.
