# PAGE SPEC — The Football Hub Snapshot

**Version 1.0 · 25 August 2026 · Canonical.**

This is the build document. One spec covers the homepage and all twenty club pages, because they are the same page with a different entity.

**Supersedes** all prior layout, card and structure documents. Where the product brief and this spec disagree on layout, this wins. Where they disagree on product philosophy, the brief wins.

---

## 0. How to use this

- §1–§3 before building anything.
- §4–§6 to build the page.
- §7 onwards is per-block lookup.
- §12–§14 are the contracts that keep the product honest. They are not optional.

**Three rules govern every decision here.**

1. **The centre moves. The sides orient you.** Three clock speeds: season (slow), live (fast), imminent (match-shaped). If a block doesn't know which speed it runs at, it isn't specified.
2. **Blocks never move. Content changes.** The layout is identical on every entity, every day. After a week the user knows where injuries are without looking. Novelty comes from content, never from position.
3. **Nothing renders that the data cannot feed.** No placeholders, no "coming soon", no empty slots. A block with no data does not render and its neighbours close the gap.

---

## 1. The engine

One function. One page component. Twenty-one URLs.

```
getSnapshot(entity) → SnapshotPayload
```

| Route | Entity | H1 |
|---|---|---|
| `/` | `premier-league` | The Football Hub |
| `/tottenham` | `tottenham` | Tottenham |
| `/arsenal` | `arsenal` | Arsenal |
| … | … | … |

**The page is a client of the API, not a database consumer.** `GET /api/v1/snapshot/{entity}` returns the entire page as JSON (§14). The website is client one. React Native is client two. No page component queries Supabase directly — that decision is what makes the app a port rather than a rebuild.

**The H1 is the club name and nothing else.** "Snapshot" is internal wording — it names the thing we are building, not the thing the reader arrived at. The public name for this page is not settled, and until it is, the page is titled with the only word that is certainly right.

**Reserved slug registry.** Clubs live at root, so a static reserved list must exist before any new top-level route is added: `transfers`, `matches`, `search`, `about`, `how-it-works`, `privacy`, `terms`, `api`, `snapshot`, `deadline-day`. A club slug can never collide with these.

**Header is persistent and identical everywhere.** Wordmark, nav, club badges. The active badge takes a restrained active state. Next.js App Router soft-navigation handles the transition — no custom animation, no splash, no "12 new items" counter.

**Club identity is exactly two things:** the badge, and one accent rule. Never a page theme, never a palette swap, never a club hero. The Football Hub owns the interface; the club is the subject.

---

## 2. The three clock speeds

| Column | Question | Changes | Contains |
|---|---|---|---|
| **LEFT — CONTEXT** | Where are we? | Weekly | Table, form, next opponent, around the league |
| **CENTRE — THE BRIEFING** | What have I missed? | Hourly | Big story, developing, confirmed, worth your time, fan pulse |
| **RIGHT — THE MATCH** | What's happening around the game? | Per phase | Last or next match, availability, referee, key data |

The centre is the product. The sides are why the centre is legible.

---

## 3. The match block is phase-aware

**This is the single highest-value mechanic on the page and it costs almost nothing.**

The right column's lead block changes identity based on where we are in the week. Same slot, same component, different phase.

| Phase | Condition | Lead block |
|---|---|---|
| `LIVE` | Kick-off passed, match not finished | **Live** — score, minute |
| `POST` | Full time to FT+48h | **Last Match** — score, xG, scorers, ratings, events |
| `PRE` | FT+48h to next kick-off | **Next Match** — opponent, time, TV, availability, referee |
| `BREAK` | No fixture within 10 days | **Next Match**, reduced — opponent and date only |

Derived from FPL `fixtures` (`kickoff_time`, `started`, `finished`) plus system time. Pure date maths.

**Why it matters:** on Sunday evening nobody wants next Saturday's referee. On Friday nobody wants last week's xG. A fixed layout gets one of those wrong five days a week. This is also the thing a feed structurally cannot do, because a feed doesn't know where the user is in the week.

---

## 4. Desktop layout (≥1024px)

```
┌──────────────────────────────────────────────────────────────────────┐
│ THE FOOTBALL HUB   Football · My Clubs · Transfers · Matches · Search │
│ [ARS] [AVL] [BOU] … [TOT] …                                          │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  TOTTENHAM SNAPSHOT                          updated 14 min ago       │
│                                                                       │
├──────────────┬──────────────────────────────┬────────────────────────┤
│ CONTEXT      │ THE BRIEFING                 │ THE MATCH              │
│              │                              │                        │
│ TABLE        │ THE BIG STORY                │ [LAST or NEXT]         │
│  3 above     │  [Large Story Card]          │  score / xG / scorers  │
│  You         │                              │  — or —                │
│  3 below     │ DEVELOPING                   │  opponent / time / TV  │
│              │  [Story Card]                │                        │
│ FORM         │  [Story Card]                │ AVAILABILITY           │
│  W W D L W   │  [Story Card]                │  out / doubtful / susp │
│              │  [Story Card]                │                        │
│ NEXT OPPONENT│  [Story Card]                │ THE REFEREE            │
│  form        │                              │  name / cards / record │
│  big injury  │ CONFIRMED                    │  one interesting fact  │
│  their story │  [compact list · 5]          │                        │
│              │                              │ KEY DATA               │
│ AROUND THE   │ WORTH YOUR TIME              │  top scorer            │
│ LEAGUE       │  [Video]                     │  most assists          │
│  [3 items]   │  [Article]                   │  form player           │
│              │                              │  one booking away      │
│              │ FAN PULSE                    │                        │
│              │  [3 threads]                 │                        │
│              │                              │                        │
│              │ ─────────────                │                        │
│              │ Sign-off                     │                        │
└──────────────┴──────────────────────────────┴────────────────────────┘
```

Column widths: left 260px, centre fluid (max 640px), right 300px. Centre is the visual weight — larger cards, images, more space.

**640–1023px:** two columns. Centre plus right. Left content moves to the bottom of the stack.

---

## 5. Mobile stack (<640px)

Not a squashed desktop. A different presentation of the same model, and the order that most people will actually read.

**Matchweek (`PRE`, `LIVE`, `POST`):**

1. Match block (phase-appropriate)
2. Availability
3. **The Briefing** — big story, developing, confirmed
4. Referee (`PRE` only)
5. Worth Your Time
6. Fan Pulse
7. Key Data
8. Table / Form / Next Opponent
9. Around the League
10. Sign-off

**Off-week (`BREAK`):**

1. **The Briefing**
2. Match block (reduced)
3. Availability
4. Worth Your Time
5. Fan Pulse
6. Table / Form
7. Around the League
8. Sign-off

One conditional swap between the two. Nothing else differs.

---

## 6. Block inventory

Every block, its source, its cap, and whether it can be built today. Sources verified live 25 Aug 2026.

| # | Block | Source | Cap | Buildable |
|---|---|---|---|---|
| 1 | Match — Next | FPL `fixtures` + pulselive | 1 | **Now** |
| 2 | Match — Last | pulselive match detail | 1 | **Now** |
| 3 | Match — Live | FPL `fixtures` polling | 1 | **Now** |
| 4 | Availability | FPL `status`/`news`/`chance_of_playing_next_round` | 8 | **Now** |
| 5 | The Referee | pulselive `matchOfficials` + history | 1 | **Now** |
| 6 | Key Data | FPL `elements` | 4 | **Now** |
| 7 | Table | football-data.org (key set) | 7 rows | **Now** |
| 8 | Form | Derived from results | 5 | **Now** |
| 9 | Next Opponent | Same engine, opponent entity | 1 | **Now** |
| 10 | The Numbers | FPL + pulselive team stats | 6 | **Now** |
| 11 | Confirmed | Ingest + FPL `news` + official feeds | 5 | **Now** |
| 12 | The Big Story | Ingest + clustering | 1 | Needs clustering |
| 13 | Developing | Ingest + clustering | 5 | Needs clustering |
| 14 | Around the League | Ingest, cross-entity | 3 | Needs clustering |
| 15 | Worth Your Time | YouTube API + curated list | 2 | **Now** (manual list) |
| 16 | Fan Pulse | Reddit public JSON | 3 | **Now** |
| 17 | Sign-off | Human, daily | 1 | **Now** |

**Thirteen of seventeen blocks ship before a single line of clustering exists.** That is the build order argument in one line: the page is useful on day one and the differentiator lands on top of a page that already works.

---

## 7. Block specifications

### 1–3. THE MATCH

**PRE**
```
NEXT UP                                    SUN 16:30
TOTTENHAM v ARSENAL
Premier League · Tottenham Hotspur Stadium
Sky Sports
```
Fields: opponent, badge, home/away, kick-off (localised), competition, venue, broadcaster, FPL difficulty rating (1–5, colour-coded).

**POST**
```
FULL TIME                                  SAT 15:00
TOTTENHAM 2 — 1 ARSENAL
xG 1.84 — 1.12
Son 23'  ·  Maddison 67'  ·  Saka 81'
28 attendance · 61,412
```
Fields: score, xG both sides, scorers with minute and assister, red cards, attendance.

**LIVE**
```
LIVE · 67'
TOTTENHAM 1 — 1 ARSENAL
```
Poll every 60s during a fixture window only. No polling otherwise.

**Empty state:** never empty during a season. In `BREAK`, renders reduced (opponent, date only).

---

### 4. AVAILABILITY

```
AVAILABILITY

Romero          OUT         Groin injury · 33 days
Bissouma        SUSPENDED   Suspended until 19 Sep
Kulusevski      DOUBTFUL    Thigh injury · 75%
Solanke         BACK        Returned to training
```

Source: FPL `status` mapped as — `i` → OUT, `s` → SUSPENDED, `d` → DOUBTFUL, `u` → UNAVAILABLE (exclude if a completed transfer), `a` with recent `news_added` → BACK.

The `news` string is the club's own wording. **Display it as-is.** Do not rewrite, do not summarise, do not embellish. It is already factual and already short.

**The string is two parts joined by ` - `:** the injury description, then the return date or a marker standing in for its absence. Split on the separator and apply two rules to the second half only. The injury description is never touched.

1. **Render the return date only when there is one.** `"Knee injury - Unknown return date"` renders `Knee injury`, full stop. "Unknown return date" is FPL's null written as English, and a line whose content is *we do not know* is a line that should not have rendered. Same for TBC, N/A and their kin.
2. **Drop "chance of playing".** `"Thigh injury - 50% chance of playing"` renders `Thigh injury · 50%`. Under a DOUBTFUL label a percentage can only mean one thing, and the words are the block's own label repeated in every row.

A real return date passes through untouched: `"Ankle injury - Expected back 19 Sep"` renders `Ankle injury · Expected back 19 Sep`.

**Where the return date was dropped, say how long he has been out instead.** FPL stamps `news_added` on every item, so days elapsed is always available and is the only fact left once the null marker has gone. `"Groin injury - Unknown return date"`, filed 33 days ago, renders `Groin injury · 33 days`.

Rounded down to whole days, and nothing below one day — a fresh injury is news on its own and "0 days" is a worse answer than silence.

**Only where a null marker was actually dropped, and only for OUT and SUSPENDED.** Three conditions, and each rules out a real case:

- **DOUBTFUL is excluded** because it already carries a percentage, and two numbers on one line is the block competing with itself.
- **A row with a real return date is excluded**, because the date is the better fact.
- **Status alone is not the test.** Measured live on 25 Aug 2026, the only suspended player in the league reads `"Suspended until 19 Sep"` — no separator, and a return date already in the sentence. Gating on `SUSPENDED` rather than on the missing date would have appended a day count to a line that already said when he is back.

**Removing a null marker is not rewriting. Changing "Knee injury" to anything at all is.** The line between the two is that the first drops a word that carries no information and the second alters a club's medical claim.

Both rules are the general ones applied to this block — THE_FOOTBALL_HUB §9, copy rules 1, 3 and 4. They hold everywhere a string reaches a block, not only here.

Order: SUSPENDED, OUT, DOUBTFUL, BACK. Cap 8, expandable.

**Status word is text, never colour alone.** A dot may reinforce it. WCAG 1.4.1.

**Empty state:** *"Nobody unavailable."* — this is genuinely good news and worth stating. The only block permitted a message rather than non-render.

---

### 5. THE REFEREE

`PRE` phase only. Sits under Availability.

```
THE REFEREE
Anthony Taylor

4.8 cards per game
Tottenham record: 5W 2D 3L in 10

Has sent off more Premier League players
than any other active official.
```

Source: pulselive `matchOfficials` (role `MAIN`) once appointed, typically 2–5 days out. Card and record stats derived from your own accumulated fixture history — start logging from day one, it compounds.

**The one interesting fact is hand-written and stored per referee.** ~20 active PL officials. One evening of writing unblocks the whole season. It is the only place on the page where tone is licensed, and it must be factual — see §13.

**Empty state:** no appointment yet → the fact and stats still render without the "for Sunday" framing. If no referee history exists, block does not render.

---

### 6. KEY DATA

Four compact cards, no tables.

```
TOP SCORER      Son · 12
MOST ASSISTS    Maddison · 8
IN FORM         Kulusevski · 7.8 Hub Rating (last 5)
ONE BOOKING AWAY  Bissouma, Porro, Van de Ven
```

Source: FPL `elements` — `goals_scored`, `assists`, `yellow_cards`.

**"One booking away"** is the distinctive one: players on four yellows before the 19th fixture, nine before the 32nd. The Premier League bans a player for one match at five yellows in the first 19 fixtures and for two at ten in the first 32, so one booking away is four and nine. Pure calculation, free data, and nobody else surfaces it.

**Hub Rating** — see §11. Do not render until §11 is built.

---

### 7. TABLE

Three above, the club, three below. Full table behind *View full table*.

Homepage entity renders the top six.

---

### 8. FORM

Last five, most recent left. `W W D L W`. Letters, not colour alone.

---

### 9. NEXT OPPONENT

The cross-pollination block. Calls `getSnapshot(opponent)` and takes four fields.

```
NEXT OPPONENT
ARSENAL

Form      W W W D L
Missing   Saliba (back, unknown return)
Story     Arsenal open talks over Player X · 6 outlets

                                          Arsenal →
```

This is what makes twenty pages an ecosystem rather than twenty silos. The Arsenal page carries Tottenham in the same slot in the same week.

**Empty state:** `BREAK` phase → does not render.

---

### 10. THE NUMBERS

Position · points · goal difference · goals scored · goals conceded · xG for/against.

**Does not render on the club page.** Collapsed, it showed position and points — both of which the Table sits directly above it and already gives, for seven clubs including this one. The one line a reader saw was the line they had just read. THE_FOOTBALL_HUB §9, copy rule 2: if every row says it, delete it.

**The `numbers` key stays in the §14 payload.** The data is sound and the duplication is a property of this page's layout, not of the numbers. A surface with no table — the newsletter, a widget — can render it without changing anything upstream.

If it returns here, it returns without position and points, and it needs a reason to exist beyond four numbers nobody asked for.

---

### 11. CONFIRMED

Official announcements. **Not story cards** — there is nothing to consolidate, one source is definitive.

```
CONFIRMED

Kevin Danso joins Wolfsburg on loan for the season      2h
Contract extension agreed with Archie Gray             1d
Kick-off v Chelsea moved to Sunday 14:00               2d
```

Source: FPL `news` for departures (`"Has joined X permanently"`, `"Has joined X on loan"`), club official feeds, PL fixture change feeds.

One line each. No summary, no card, no image. Cap 5.

---

### 12–13. THE BIG STORY / DEVELOPING

The product. Full anatomy in §9.

**The Big Story** is one large card — the highest-ranked story, not necessarily the newest.

**Developing** is up to five standard cards **ordered by movement** (§8), not recency.

Transfers are not a separate section. A transfer story is a developing story. Splitting by topic after the content model split by type re-fragments the one thing that's uniquely yours.

**Empty state:** fewer than two stories → Developing does not render, Big Story remains. Zero stories → *"Nothing worth logging today."*

---

### 14. AROUND THE LEAGUE

Three stories from other entities, ranked by absolute movement. This is the serendipity the BBC gossip scan currently provides — the "oh, that's interesting" that keeps the page from being a silo.

On the homepage entity this block does not render (the whole centre is already cross-league).

---

### 15. WORTH YOUR TIME

Curated. Never "latest videos".

```
WORTH YOUR TIME

Worth 28 minutes
Ali Gold on why Spurs stopped bidding
[thumbnail]                                    YouTube

Worth 6 minutes
The Athletic on the Romero contract situation   The Athletic
```

Source: YouTube Data API against a **hand-maintained creator whitelist per club** (3–5 creators × 20 clubs). Free quota covers this comfortably at one refresh per club per day.

Long-form only. Filter out anything under 5 minutes. Cap 2.

**The whitelist is the moat.** It is judgement, not code, and it cannot be copied off you.

**Empty state:** nothing new in 7 days → does not render.

---

### 16. FAN PULSE

```
FAN PULSE · r/coys

Post-match thread: Tottenham 2-1 Arsenal          1.2k
Anyone else think we're actually good now?         340
Danso loan — thoughts?                             198
```

Source: Reddit public JSON (`/r/{sub}/hot.json`). No auth, no key.

Titles and scores only. **Never reproduce comment bodies.** Link out.

Labelled as fan discussion, not reporting. If the source disappears, the block is deleted and nothing else breaks.

Cap 3.

---

### 17. SIGN-OFF

```
                    That's your lot.
              14 stories · 4 moving · updated 14 min ago
```

Plus one human-written line, daily, in voice. The completion signal and the only editorial on the page.

Always renders. Always last.

---

## 8. Ordering — the rule that makes it feel alive

**Default sort for the centre: `movement` descending, then `recency` descending.**

`movement` = new distinct outlets covering this story in the last 24 hours.

A story that had two outlets this morning and six now outranks something filed eleven minutes ago that nobody else has touched.

**Why this and not recency:** reverse-chronological reshuffles because someone hit publish, which is not information. Movement-ordered reshuffles because something actually changed. It is the only ordering that answers *"what have I missed"* rather than *"what has been published"*, and it is the thing no competitor can copy without rebuilding.

**The Big Story** = highest `movement × source_weight`, with a floor: must have at least two distinct outlets, or be officially confirmed.

**Decay:** a story with zero movement for 48h drops out of Developing regardless of rank.

---

## 9. The Story Card

The core component. It is not a mini article.

```
┌────────────────────────────────────────────────────────┐
│ [image]  TRANSFER                                      │
│          Tottenham open talks over Player X            │
│                                                         │
│          Tottenham have made contact over a move for    │
│          Player X. No fee has been reported and no      │
│          timeline has been set.                         │
│                                                         │
│          [Sky] [Guardian] [BBC] [Telegraph]  4 outlets  │
│          3h · +2 today                          Read →  │
└────────────────────────────────────────────────────────┘
```

| Element | Spec |
|---|---|
| Category | Mono uppercase label. TRANSFER · TEAM NEWS · CLUB · MANAGER · MATCH |
| Image | 96×96 square, radius 6. Fallback ladder §10 |
| Headline | The story, not a publisher's headline. Sentence case, no clickbait |
| The Bones | 30–75 words. Generated under §13. Absent if verification fails |
| Coverage | Publisher wordmarks, normalised to one height, monochrome. Plus count |
| Movement | `+2 today` when movement > 0. Omitted when zero |
| Target | Whole card expands to the outlet list. Outlets link out |

**No emoji anywhere.** Mono labels do the same job and look like a wire desk rather than a template.

**The card never states a verdict.** It states what happened and how many outlets are covering it. Nothing more.

---

## 10. Images — the fallback ladder

No dead images, ever. Descend until something resolves.

1. **Article `og:image`**, fetched from the page itself — not the RSS enclosure. RSS commonly carries a section or brand image, which is why the previous build produced a plane on a Rashford story.
2. **Validate:** minimum 400px on the short edge, and hash-check against a blocklist of known generic placeholders. Any bad image seen once is blocked forever.
3. **Player photo** — story names a player: `resources.premierleague.com/premierleague/photos/players/250x250/p{code}.png`. Official, current club kit, updated on transfer. Verified 200.
4. **Club badge** on an accent field: `resources.premierleague.com/premierleague/badges/t{code}.svg`. Verified 200.
5. **Typographic card** — no image slot, headline goes one size larger.

Steps 3–5 are entirely yours and cannot break.

Note: player photos are square headshots. The card is designed square for this reason. No full-bleed images anywhere.

---

## 11. The Hub Rating

The only block requiring a build rather than a query.

No free source publishes a player rating. SofaScore, WhoScored and FotMob composites are proprietary. So it is built, from published inputs, with the method published.

**Inputs (all FPL `elements`, all official):** BPS, ICT Index, minutes, goal involvement, defensive contribution, expected goals and assists.

**Three rules:**
- **Named.** It renders as *"7.8 Hub Rating"*, never a bare 7.8. A bare number reads as borrowed and invites "which rating is that?"
- **Published.** `/how-it-works` states the inputs and the weighting. That page is also the highest-originality asset on the site.
- **Minimum minutes.** No rating below 180 minutes played. Small samples produce nonsense and nonsense is expensive here.

**Until built, the block does not render.** Never ship a placeholder rating.

---

## 12. Story consolidation — v1 scope

Deliberately minimal. The hard version is a later build.

**In v1:**
- Cluster on entity + event type + time window (player + club + event, 72h)
- Count distinct outlets
- Display outlets, count, and movement
- Two statuses only: **CONFIRMED** (official announcement) and everything else, which shows its count

**Not in v1:**
- Origin detection
- Independence weighting
- Source-quality weighting
- Any qualitative ladder — "early reports", "widely reported"

**Why no ladder:** those are words added on top of a number, and they imply a judgement about truth. The number is a fact. *"6 outlets"* is unarguable; *"widely reported"* is an assertion. Store `attributed_origin` in the schema so weighting can switch on later. Do not display it.

---

## 13. The summarisation contract

**Non-negotiable. One invented fee costs more than the entire product is worth.**

### Extraction, not generation

The model returns fields, not prose:

```json
{
  "what_happened": "string",
  "club": "string",
  "player": "string|null",
  "fee_stated": "string|null",
  "timeline_stated": "string|null",
  "attribution_stated": "string|null",
  "is_official": false,
  "what_is_not_known": ["string"]
}
```

**Every field defaults null.** The prose is then templated from the fields. A template cannot invent a fee, because if `fee_stated` is null the clause does not render.

### Three deterministic gates — no AI involved

1. **Number whitelist.** Every digit sequence in the output must appear verbatim in the source. Regex. Catches fees, ages, contract lengths — the most damaging class.
2. **Proper-noun whitelist.** Every capitalised entity must appear in the source. Catches invented clubs and misattributed journalists.
3. **Length ceiling.** 75 words, hard. Models hallucinate to fill space.

### Verification pass

Second call, different prompt: *"Here is the source. Here is the summary. Does every claim in the summary appear in the source? Return PASS, or FAIL and the offending claim."* Costs pennies.

### Fail closed

Verification fails → **publish the card without the summary.** Headline, outlets, link. Degraded is survivable. Wrong is not. The pipeline must never prefer "publish something" over "publish nothing".

### Additional

- **Paraphrase only. Never quote.** Removes reproduction risk and the temptation to lift a sentence.
- **Log every summary with its source text**, so a challenge is settled in thirty seconds.
- **The link out is prominent and real.** Value is added on top of other people's work; traffic is what makes that acceptable.

---

## 14. The API contract

```json
{
  "entity": { "slug": "tottenham", "name": "Tottenham Hotspur",
              "badge": "url", "accent": "#132257" },
  "updated_at": "2026-08-25T09:14:00Z",
  "phase": "PRE",
  "match": {
    "phase": "PRE",
    "opponent": { "slug": "arsenal", "name": "Arsenal", "badge": "url" },
    "home": true, "kickoff": "2026-08-30T15:30:00Z",
    "competition": "Premier League", "venue": "Tottenham Hotspur Stadium",
    "broadcaster": "Sky Sports", "difficulty": 5
  },
  "availability": [
    { "player": "Romero", "photo": "url", "status": "OUT",
      "detail": "Groin injury - Unknown return date", "chance": 0,
      "news_added": "2026-07-23T10:30:00Z" }
  ],
  "referee": {
    "name": "Anthony Taylor", "cards_per_game": 4.8,
    "club_record": "5W 2D 3L", "fact": "string"
  },
  "key_data": [ { "label": "TOP SCORER", "value": "Son", "detail": "12" } ],
  "table": { "rows": [], "highlight": "tottenham" },
  "form": ["W","W","D","L","W"],
  "next_opponent": { "slug": "arsenal", "form": [], "missing": [], "story": {} },
  "numbers": { "position": 4, "points": 18, "gd": 7 },
  "confirmed": [ { "text": "string", "age_hours": 2, "url": "string" } ],
  "big_story": { "story": {} },
  "developing": [ { "story": {} } ],
  "around_the_league": [ { "story": {} } ],
  "worth_your_time": [
    { "type": "video", "title": "string", "creator": "string",
      "duration_mins": 28, "thumbnail": "url", "url": "string" }
  ],
  "fan_pulse": { "subreddit": "coys",
                 "threads": [ { "title": "string", "score": 1200, "url": "string" } ] },
  "signoff": { "line": "string", "stats": { "stories": 14, "moving": 4 } }
}
```

**Story object:**

```json
{
  "id": "string",
  "category": "TRANSFER",
  "headline": "string",
  "bones": "string|null",
  "image": "url",
  "outlets": [ { "name": "Sky Sports", "wordmark": "url", "url": "string" } ],
  "outlet_count": 4,
  "movement_24h": 2,
  "first_seen": "2026-08-22T11:00:00Z",
  "last_movement": "2026-08-25T07:30:00Z",
  "confirmed": false
}
```

**Any block whose key is absent or empty does not render.** The client never draws an empty container.

---

## 15. States

| State | Behaviour |
|---|---|
| Loading | Skeleton matching final geometry. No spinner. No layout shift |
| Empty (block) | Does not render. Neighbours close the gap. No message — except Availability (§7.4) |
| Empty (page) | *"Nothing worth logging today."* plus date and email capture. Never blank |
| Error (block) | Does not render. `console.error`. Never propagates |
| Error (page) | Partial render of whatever resolved. Never a 500 |
| Stale | Newest story > 6h → marker in the header |

A page missing four blocks must still read as finished.

---

## 16. Explicitly not in v1

Each was proposed and each is deferred with a reason.

- **Origin / independence detection** — §12
- **Qualitative status ladder** — §12
- **Story reordering animation** — Next.js soft navigation covers it; animating content the user is reading is hostile
- **"Snapshot updated · 12 new items"** — a number with no referent until per-user state exists
- **Emoji in section headers** — mono labels do the job
- **Player, referee and competition entity pages** — the data model supports them; build none
- **User reactions** — schema only
- **Accounts** — club selection is a cookie and a newsletter field. Accounts arrive only for "notify me when this moves"
- **Standalone TV directory** — broadcaster on the match block only
- **Club theming beyond badge and accent**

---

## 17. Build order

1. **The engine and the API shape.** `getSnapshot(entity)` returning §14, with clustering-dependent keys empty.
2. **The match block, all four phases.** Highest value, lowest cost, no clustering.
3. **Availability, referee, key data, table, form, numbers.** All free official sources, all queries.
4. **Fan Pulse and Worth Your Time.** Needs the whitelist written first.
5. **Ship Tottenham.** One real page. Use it for a week.
6. **Template to twenty clubs and the homepage entity.**
7. **Clustering, summarisation, the centre column.** The differentiator, landing on a page that already works.
8. **The Hub Rating.**
9. **The Snapshot email**, same payload, different renderer.

Steps 1–6 need no clustering, no AI, and no new data source.

---

## 18. Open

1. **Broadcaster data is manual.** No free API carries UK rights. Ten fixtures a week, five minutes. Confirm you'll do it, or the match block ships without TV.
2. **Referee facts** — 20 officials, one evening of writing. Unblocks the whole season.
3. **Creator whitelist** — 20 clubs × 3–5. The moat, and the largest single manual task.
4. **Hub Rating weighting** — needs a decision before §11 is built.
5. **Sign-off cadence** — daily human line, or weekly with a computed fallback.

---

*Living document. It changes when the data changes, and only then.*
