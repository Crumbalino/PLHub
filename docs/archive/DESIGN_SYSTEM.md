# Design System — The Football Hub

**Version 1.0 · 7 August 2026 · Canonical.**

**Supersedes and replaces:** `PLHub-Brand-Identity-v1` (Feb), `tfh-brand-v6.html` (Mar), `tfh-frontend-redesign-brief.md` (Mar), `tfh-card-interaction-spec.md` (Mar), `the-snapshot-v2-spec.md` (Mar), and any earlier `docs/DESIGN_SYSTEM.md`. Those stay readable as history. **Nothing is implemented from them.**

**Visual reference:** deployment `5f94764`, 12 Mar 2026. It renders correctly and is the closest thing to a working target. It is a reference, not an authority — §1 explains what it got wrong.

---

## 0. How to use this document

Read §1–§4 before designing anything. Read §5–§6 before writing any component. Everything after that is lookup.

**Three rules govern every decision below. If a future question isn't answered here, answer it with these.**

1. **The unit is the rumour, not the article.** Articles are dead on publication. Rumours have a state that changes. Everything that makes this site worth revisiting comes from that distinction.
2. **Every block looks finished at today's data level and gets richer, not fixed, as data arrives.** No placeholders, no empty slots, no "coming soon". A block with less data renders smaller, not broken.
3. **Nothing is specified that the database cannot feed.** Every prior document failed this test, which is why every implementation drifted back to broken.

---

## 1. What we are designing

### The object

A **daily column of transfer rumours, ordered by movement, at one permanent URL that updates in place.**

Not a feed. Not an archive. Not a homepage of everything ingested.

| | Feed | Column (this) |
|---|---|---|
| Unit | Article | **Rumour** |
| Order | Reverse chronological | **Movement, then recency** |
| Length | Infinite | **Bounded and stated** |
| Ends | Never | **Yes — with a sign-off** |
| Changes after publish | No | **Yes. This is the product** |

### Why not a feed

A feed's unit is the article, and an article cannot change after it publishes. There is no reason to look at it twice. The BBC gossip column has this problem and it is structural, not stylistic.

A rumour gains outlets, gains a fee, gains a timeline, gets contradicted, goes quiet, resolves or dies. The reason to return is not *"is there something new"* — it's ***"did that thing get more real."*** That is the only genuinely live object on the site and it is the entire retention argument.

### What the March build got wrong

It rendered articles in a feed with a fabricated score badge and five blocks of hardcoded demo data. It looks complete because a third of it is a mock, and it feels static because articles are static. The typography, palette and density are right. The object is wrong.

### Data maturity — design for all three phases now

| Phase | Available | Item renders as |
|---|---|---|
| **1 — today** | Articles. No clusters. `story_cluster` and `source_count` empty | Two lines: claim + attribution. No state line |
| **2 — clustering ships** | Rumours. Age, outlet count, movement, temperature | Three lines: the state line appears |
| **3 — post-window** | Resolutions, hit rates, balloons | Balloon count fills the reserved slot |

**The design must not visibly degrade in Phase 1.** A two-line item is a complete item, not a three-line item with a missing row. This is rule 2 and it is the single most important constraint in this document.

---

## 2. The ADHD contract

The thesis, unchanged since the site's first design: **football for brains that can't finish an article.** This is the lens and the format logic, never the topic. It produces hard design rules, not a mood.

| Principle | Rule |
|---|---|
| **Chunking** | Content is a chain of self-contained blocks. Each block is complete alone and comprehensible out of order |
| **Boundedness** | The column ends. It states its length up front — *"Twelve items · about 90 seconds"* — and signs off at the bottom. **No infinite scroll, ever.** Finishing is the reward |
| **Variety** | Consecutive identical blocks are the failure mode. A non-Claim block appears every 3–4 Claims (§8). Variety is format logic, not decoration |
| **Scannability** | Every block is legible in under 2 seconds without reading it. Hierarchy from size and weight first, colour second, opacity last |
| **One action** | A block offers at most one interaction. Never two competing affordances |
| **No ambush** | No autoplay, no popups, no interstitials, no cookie wall, no motion the reader didn't start |
| **Legibility floor** | Nothing below 11px. Nothing below the contrast floor in §5.2. No exceptions for "meta" text |
| **Predictable rhythm** | Same block types in the same visual positions every day. Novelty comes from content, never from layout |

**The reward loop is the reveal, and the payoff is the ending.** Not points, badges, streaks or confetti. A short thing that finishes is the delight.

---

## 3. Liveness — the mechanic

This section defines what makes the page feel alive. Implement it in Phase 2; reserve the space now.

### Rumour state

| Field | Derivation | Owned data? |
|---|---|---|
| `age` | Days since earliest claim in the cluster | Yes |
| `outlets` | Count of **independent** outlets, collapsed by attributed origin | Needs clustering |
| `movement` | Independent outlets added in the last 24h | Needs clustering |
| `temperature` | Derived, table below | Needs clustering |
| `pairing_history` | Times this player–club pairing has been claimed before, and since when | Yes, from the ledger |
| `window_state` | Window open/closed, days to deadline | Yes, pure date maths |

### Temperature — defined here so it is never invented ad hoc

| Value | Condition |
|---|---|
| `rising` | ≥1 new independent outlet in 24h |
| `steady` | Claimed within 72h, no new outlets |
| `cooling` | No new outlets for 3–7 days |
| `quiet` | No new outlets for >7 days, window still open |
| `contradicted` | A credible source has published the opposite |
| `dead` | Window closed unresolved |
| `happened` | Resolved true |

### Ordering

Default sort: **`movement` descending, then `age` ascending.** Not pure recency.

A four-day-old rumour that picked up two outlets this morning outranks something filed an hour ago and ignored. This is what produces visible reshuffling between visits, and it is the entire difference between this and a wire feed.

### Display

The state line is the third line of a Claim block. It renders **only when there is movement to report** — never as a placeholder.

```
2 outlets → 5 since Tuesday · still no fee, no timeline
RISING · first claimed 11 days ago
```

Temperature is a mono uppercase word at tertiary opacity. **`rising` may take teal; every other value stays monochrome.** No traffic-light ramp — a red/green scale reads as a verdict on whether the transfer will happen, which the product explicitly does not claim.

---

## 4. Data contract

Verified against the live schema, 7 Aug 2026. Design follows from this table.

| Field | Reality | Consequence |
|---|---|---|
| `title` | Always | Primary element of every Claim |
| `summary` | **Effectively never.** `SUMMARIES_ENABLED=false`; the 300-char gate passes only The Guardian, ~8 of ~81 daily | **No summary line anywhere.** Gating the feed on summaries was shipped (`5d26041`) and reverted next day (`4476ffd`) — it emptied the page |
| `subreddit` | Feed name for RSS rows | Not the publisher. Derive publisher from URL domain via `sources.ts` |
| `source` | Always `"rss"` | Never displayed |
| `image_url` | Present on most, **frequently wrong** — a plane on a Rashford story, a building on an Enzo story | Thumbnail is decorative, optional, fixed-size, never full-bleed, never load-bearing |
| `club_slug` | **Singular.** `unclassified` is valid and common | One club pill maximum; none when unclassified |
| `score_significance` | Populated | Orders Phase 1. **Not displayed** — §13 |
| `score` | 0 on every row | Never read |
| `card_type` | Derived from publisher domain (`051444d`), not content | Not semantically meaningful. One Claim type only |
| `story_cluster`, `source_count` | Columns exist, empty | Reserved for Phase 2 |
| `trivia`, `on_this_day`, `quotes` | Tables exist, unpopulated | Blocks are dark until rows exist |
| Subscribers | **No table.** `/api/subscribe` 500s — invalid Resend key, no audience ID | The hero email field currently captures nothing |

**Live feeds:** BBC, Sky, ESPN, FourFourTwo, Guardian, Independent. Goal.com and Football365 404. 90min returns 200 with nothing since Sep 2025.

**Ingest is general PL news; the product is transfer rumours.** Until the pipeline narrows, the column is curated from ingest, not equal to it.

---

## 5. Foundations

### 5.1 Colour

| Token | Dark | Light | Role |
|---|---|---|---|
| `bg` | `#0D1B2A` | `#F8F9FB` | Page |
| `surface` | `#112238` | `#FFFFFF` | Blocks |
| `surfaceRaised` | `#162D45` | `#F0F1F4` | Hover, active |
| `textBase` | `#FAF5F0` | `#1A1D23` | All text, via opacity |
| `accent` | `#3AAFA9` | `#1F7A77` | Structure, data, interaction, logo bracket |
| `alert` | `#E84080` | `#C42063` | Breaking, primary CTA, off-site bracket |
| `hairline` | `rgba(250,245,240,0.06)` | `rgba(13,27,42,0.08)` | Borders, dividers |

Never pure black. **Never a grey hex** — hierarchy is opacity on `textBase`, which keeps everything tonally related; grey reads dead against warm white.

Light-mode `accent` and `alert` are **not** the dark values. `#3AAFA9` on white is 3.66:1 and `#E84080` is 3.83:1 — both fail AA for body text. The light values above pass at 5.11:1 and 5.62:1.

### 5.2 Contrast and opacity

Measured, not assumed. Ratios are against `surface`.

| Semantic token | Dark | Ratio | Light | Ratio | Use |
|---|---|---|---|---|---|
| `textPrimary` | 100% | 14.8:1 | 100% | 16.9:1 | Headlines, claims, numerals |
| `textSecondary` | 70% | 7.9:1 | 75% | 7.4:1 | Body, context lines |
| `textTertiary` | **50%** | **4.7:1** | **65%** | **5.3:1** | Timestamps, labels, eyebrows, state lines |

**These are the floors. 50% dark / 65% light. Below them, AA fails for body text.**

Every prior brand document specified a 40% floor (3.5:1 — large text only) or a 25% timestamp (2.2:1 — fails outright). Both are wrong and both are why type reads as unstyled.

**Implementers never write raw opacity values.** Use the semantic token; the mode supplies the number.

### 5.3 Publisher colour

The left border carries publisher identity. **The publisher label is text at `textSecondary`, not in publisher colour.**

Sky's pink at 9px bold is 4.18:1 and fails AA. Rather than exempt one publisher, all labels are neutral: colour reinforces, text informs. This also removes the redundant double-encoding in the March build, where every card carried both a coloured border and a coloured label.

| Publisher | Dark | Light |
|---|---|---|
| BBC Sport | `#D4A843` | `#A07E28` |
| Sky Sports | `#E84080` | `#E84080` |
| The Guardian | `#6B9E78` | `#6B9E78` |
| ESPN | `#8AACCC` | `#5A7F9F` |
| FourFourTwo | `#F97316` | `#D96A14` |
| The Independent | `#C084FC` | `#9B59B6` |
| Unknown | `textBase` 30% | `textBase` 30% |

Borders need 3:1 non-text contrast. Light gold moves from `#B8923A` (2.91:1, fails) to `#A07E28` (3.81:1). ESPN moves off teal, which is reserved for structure.

**Publisher colours are not brand colours.** They change when the feed list changes. They appear nowhere except a Claim's left border.

### 5.4 Type

**Sora** — prose, headlines, UI. **JetBrains Mono** — every number, timestamp, label, eyebrow, state value. No third family.

Both via `next/font`, self-hosted. **Never add a `fonts.googleapis.com` link or `@import`.** Every prototype in the archive contains one; strip it when porting.

| Role | Family | Weight | Size / line | Tracking |
|---|---|---|---|---|
| `display` | Sora | 800 | 28 / 32 | −0.5px |
| `blockHeading` | Sora | 700 | 18 / 24 | −0.2px |
| `claim` | Sora | 700 | 16 / 22 | −0.2px |
| `body` | Sora | 400 | 14 / 22 | 0 |
| `meta` | Mono | 400 | 11 / 16 | +0.5px |
| `label` | Mono | 600 | 11 / 14 | +2px, uppercase |
| `numeral` | Mono | 700 | 20 / 20 | 0 |
| `statDisplay` | Mono | 700 | 48 / 48 | −2px |

**Hard floor: 11px.** The March build used 13–14px claims and 9px meta; both are too small for the audience and 9px compounds badly with any opacity below 100%.

Body text never exceeds ~70 characters per line.

### 5.5 Space, radius, target

4px base. Scale: `4, 8, 12, 16, 24, 32, 48, 64`.

Radius: `6` small (thumbnails, pills), `12` blocks, `16` containers.

**Minimum touch target 44×44px**, including padding. A 20px chevron in a 44px hit area is correct.

### 5.6 Motion

| Event | Spec |
|---|---|
| Block entry | `opacity 0→1`, `translateY(16px)→0`, 450ms ease-out, IntersectionObserver at 15%, fires once then disconnects |
| Reveal expand | `max-height` + `opacity`, 300ms ease-out |
| Hover | Border brightens, 200ms ease-out |
| Prompt pulse | Affordance text brightens to accent, 600ms, every 3s, stops permanently on first interaction |
| Theme switch | 300ms ease |

Nothing else. No parallax, no autoplay, no continuous ambient loops, no scroll-jacking.

**`prefers-reduced-motion: reduce` disables all of the above**, including the prompt pulse. Content appears at final state immediately.

---

## 6. Implementation and governance

### The rule that broke the site

**Colour and type values are declared as inline constants at the top of each component file. Not as CSS custom properties.**

CSS variables were undefined in the live DOM, so any component referencing them rendered invisibly. A migration off them ran through March — `StoryCard`, `SnapshotContainer`, `PLTable` (`8b64f7d`), fixtures (`daa8968`), `ClubFilterBar` (`5f94764`) — and stopped there. `HomeContent` was never reached. That, alone, is the white homepage.

```ts
// src/lib/tokens.ts — single source, plain TS objects, no CSS dependency
export const C = {
  bg: '#0D1B2A', surface: '#112238', surfaceRaised: '#162D45',
  textBase: '#FAF5F0', accent: '#3AAFA9', alert: '#E84080',
} as const;

export const T = { primary: 1, secondary: 0.7, tertiary: 0.5 } as const;
```

Plain objects, not CSS — this is also what makes the tokens portable to React Native later.

### Verification

Verify in the live DOM, never in source:
`window.getComputedStyle(el).backgroundColor`

A component that references an undefined token renders invisibly and passes every build check. This is not theoretical; it has happened twice.

### Change control

- Any change to §5 updates this document **in the same PR**.
- New colour values require a named decision recorded in §16. Palette sprawl is how the last four documents diverged.
- `CLAUDE.md` links to this file and does not restate it.

---

## 7. Layout and page architecture

### Column

| Breakpoint | Width |
|---|---|
| `<640px` | Full width, 16px gutters |
| `640–1023px` | 600px, centred |
| `≥1024px` | 680px, centred |

**Single column at every size. No sidebar, ever.** Two columns break the chunked reading order, and the widgets that occupied the old sidebar (`PLTableWidget`, `FixturesWidget`, `NextFixtures`, `MatchTicker`, `TrendingStrip`) render empty containers and are not the product. They are removed from the column pages entirely — deletion is cheaper than repair.

The March build centres ~440px on desktop, which reads as a phone screenshot on a monitor. 680px is wide enough to read as a site and narrow enough to hold line length.

### Routes

| Route | Contains | Canonical |
|---|---|---|
| `/` | Hero · facts · club nav · **today's column, top 5** · sign-up · footer | Self |
| `/gossip` | **The column, full.** Permanent URL, updates in place. `NewsArticle` schema, honest `dateModified` | Self |
| `/gossip/[yyyy-mm-dd]` | Archive | Self |
| `/clubs/[slug]` | Club-filtered column + club content | Self |

`/` and `/gossip` share one component with an item cap. The homepage converts and is the AI-crawler entry point; `/gossip` ranks and carries the archive. Both set their own canonical — a route omitting `alternates.canonical` inherits `/`.

### Column header

```
TRANSFER GOSSIP · FRI 07 AUG                    updated 14 min ago
Today's Gossip
Twelve items · about 90 seconds
```

The length statement is not optional. Nobody perceives brevity as a promise unless it is stated (§2, boundedness).

---

## 8. The block system

### Families

| Block | Purpose | Data | Status |
|---|---|---|---|
| **Claim** | The rumour. The spine | `posts` | Live |
| **Marker** | One number with context — pairing count, club aggregate, days to deadline | Ledger + date maths | Buildable now |
| **Archive** | On This Day | `on_this_day` | Dark until seeded |
| **Question** | Trivia | `trivia` | Dark until seeded |
| **Fixture** | Next Up | football-data API | Live, key set |
| **Sign-off** | Ends the column | Computed | Live |

### Rhythm

- One non-Claim block every **3–4 Claims**.
- **Never two non-Claim blocks adjacent.**
- Sign-off always last, always present.
- Same families in the same relative positions daily. Novelty is content, never layout.

### Adding a block type — the rule

Any future block must satisfy **all six**:

1. Reads from a live table or is a pure function of owned data. **No hardcoded strings, ever** — the March build shipped five blocks of prototype fixtures to production and it looked finished because a third of it was a mock.
2. Complete in one screen with no interaction required.
3. Defines its empty state as *does not render*.
4. Fits the three-line grammar, or documents why not.
5. Works at 320px and in both modes.
6. **Introduces no new colour.**

Fail any one and it is not a block.

---

## 9. Block specifications

### Claim — the spine

```
┌─┬───────────────────────────────────────────────┬────────┐
│ │ Atlético in talks with Spurs to sign Romero   │ ▓▓▓▓▓▓ │
│ │ SKY SPORTS · 3h                               │ ▓▓▓▓▓▓ │
│ │ 2 outlets → 5 since Tuesday · no fee, no date │        │
│ │ RISING · first claimed 11 days ago            │        │
└─┴───────────────────────────────────────────────┴────────┘
```

| Element | Spec |
|---|---|
| Left border | 3px, publisher colour. `alert` overrides for breaking |
| Surface | `surface`, 1px `hairline`, radius 12, padding 16 |
| Line 1 — claim | `claim`, `textPrimary` |
| Line 2 — attribution | `meta`, `textSecondary`. Publisher · relative time |
| Line 3 — state | `meta`, `textTertiary`. **Phase 2. Renders only when movement exists** |
| Line 4 — temperature | `label`, `textTertiary`; `accent` when `rising`. **Phase 2, conditional** |
| Thumbnail | 96×54, radius 6, `object-fit: cover`, `brightness(0.85)`. **Absent when null — row reflows, no placeholder** |
| Club pill | `accent` on 12% `accent`, radius 6. Only when classified |
| Reserved slot | Right of line 2. Holds balloons in Phase 3 (§13). Empty until then |
| Target | Whole block links to source. No chevron, no expand, no summary |

**Phase 1 renders lines 1–2 only, and that is a finished block.**

### Marker

One number, one label, one line of context on reveal.

- `statDisplay` numeral in `accent`, label in `body`
- Ghost numeral echo at 10% opacity, right-aligned — decorative, `aria-hidden`
- `TAP FOR CONTEXT` in `label` at `textTertiary`, prompt-pulses until first use
- Reveal: context paragraph, `body`, `textSecondary`, 300ms

Content that qualifies today: *"41st time this pairing has been claimed since 2023."* · *"47 claims logged about Spurs this window. 3 happened."* · *"24 days to deadline."*

Ledger byproducts, no new pipeline, and on-register — which Nottingham Forest's clean-sheet count was not.

### Archive · Question · Fixture

Same shell as Marker: `label` eyebrow in the block's accent, `blockHeading`, one reveal, one payoff.

**Archive** and **Question** stay dark until their tables have rows. Roughly 30 rows each is an evening of writing and unblocks both.

**Fixture** carries no reveal-reward and no reaction. It is data; the response comes after the whistle.

### Sign-off

```
                    That's today.
              12 claims logged · 4 rising
                  Archive →   Get it by email →
```

`body` at `textSecondary`, centred, generous space above. This is the completion signal — the boundedness payoff from §2. It replaces the progress bar, the Caught Up badge and the confetti entirely.

---

## 10. States

Every block defines all five. A block without them is incomplete.

| State | Behaviour |
|---|---|
| **Loading** | Skeleton matching final geometry. No spinner. **No layout shift** — reserve the height |
| **Empty (block)** | Does not render. Neighbours close the gap. No "no data" message |
| **Empty (column)** | *"Nothing worth logging yet today."* plus the date and the email capture. **Never a blank page** |
| **Error (block)** | Does not render. `console.error('[Block] …')`. **Never propagates** |
| **Error (page)** | Partial render of whatever succeeded. **Never a 500** |
| **Stale** | Newest item >6h old → marker in the column header. `StaleDataBanner` exists |

Degrade gracefully is a design rule here, not just an engineering one: a page missing three blocks must still read as finished.

---

## 11. Interaction

| | |
|---|---|
| **Reveal** | Tap anywhere on Marker, Archive, Question, Fixture. Expands in place. No modal, no navigation |
| **Claim** | Links out. No expand — there is nothing to expand to. The March card spec reached this independently: *"They have no drop-down interaction. They tap straight to the source article"* |
| **One per block** | Never two competing affordances |
| **Pagination** | The column ends. Archive is a link. **No infinite scroll** |
| **Focus** | `2px solid accent`, `outline-offset: 2px`, on `:focus-visible`. Every interactive element |
| **Keyboard** | Full traversal in DOM order. Reveal on Enter and Space |

---

## 12. Accessibility floor

Non-negotiable. Verified, not assumed.

- **WCAG 2.1 AA.** Body text ≥4.5:1, large text and UI ≥3:1. Ratios in §5.2
- **11px minimum** font size, anywhere
- **44×44px** minimum touch target
- **Colour is never the sole carrier** of meaning — publisher colour is reinforced by the publisher's name in text; temperature by the word
- `prefers-reduced-motion: reduce` disables all motion
- Semantic HTML: one `<h1>` per page, blocks as `<article>`, real `<time datetime>`, real `<button>` for reveals
- Decorative ghost numerals `aria-hidden="true"`
- **320px** minimum viewport, no horizontal scroll
- **200% zoom** without loss of content or function
- Every `<img>` has `alt`; decorative thumbnails take `alt=""`

---

## 13. Reserved — decided now so they are not invented badly later

**Balloons (Phase 3).** More balloons = worse sourced. Occupies the reserved slot on the Claim. Renders as a **mono numeral plus one balloon glyph** — not five glyphs, which fails at 320px. **Monochrome at `textSecondary`. Never a red/green ramp**: a colour scale reads as a verdict on whether the transfer will happen, which contradicts *"we don't decide who's reliable, we just keep score."*

**The INDEX score is deleted, not reserved.** A fabricated composite on a site whose product is honest scoring is the worst possible artefact. `score_significance` continues to order Phase 1 silently.

**Your Verdict.** `card_reactions` exists, so it is cheaper than previously assessed. Conditions before it ships: seeded counts so it never appears empty, one vote, no undo, inherits the block's accent, no hardcoded colour inside the component. Deferred, not killed.

**Track record.** Post-window only. Never a launch element — with no resolutions, a genuine solo scoop scores identically to an unsourced tweet, which punishes originators and rewards herding.

**Progress bar, Caught Up badge, confetti, silly stats.** Rejected. The column's boundedness is the completion signal; a second one competes with it.

---

## 14. Surfaces beyond the web

The system has to survive leaving the browser. It will, in this order.

### Email — the newsletter

The highest-value surface commercially and the most constrained technically. **Design light-first**; dark-mode handling is unreliable across clients, the opposite of the web default.

- Tables for layout. **No flexbox, no grid, no CSS variables, no webfonts**
- All styles inline
- Font stack: `Georgia, 'Times New Roman', serif` for prose; `'Courier New', monospace` for data. Sora and JetBrains Mono will not load
- 600px single column
- Publisher colour as a left border on a table cell, not a pseudo-element
- Images with explicit `width`/`height` and `alt`; the email must read correctly with images off
- One CTA maximum

### Share images — OG and Twitter card

1200×630, `bg` ground, bracket pair at 40–60% opacity framing the content, wordmark bottom-centre at 40%. Headline Sora 700, 48px, maximum three lines, `textPrimary`. Every share URL points at `thefootballhub.uk`, never at a source.

### Clips — TikTok, Reels, Shorts

1080×1920. Bracket pair at 40–60% framing the safe area. Same wordmark treatment. Titles bare and lowercase. No match footage, ever.

### Native

Tokens are plain TypeScript objects with no CSS dependency, so they port unchanged. `IntersectionObserver` is web-only — swap for `Animated` plus `onLayout`; component structure is identical, only the animation driver changes.

### The bracket grammar

Consistent across every surface:

- **One bracket (top-left)** = a data mark. The wordmark, and any single reserved data slot
- **Two brackets (TL + BR)** = a frame. Content the site has curated: share images, clip frames, quote treatments
- Teal on-site, pink off-site. **Never both on one surface**
- On-site frames sit at 12–15% opacity; off-site at 40–60%, because they must read at scroll speed

---

## 15. Deliberately excluded

Six card types · score badges · AI summary lines · expand-in-place on Claims · sidebar widgets · full-bleed images · progress bars · Caught Up badges · confetti · silly stats · infinite scroll · grey hex values · Google Fonts links · CSS custom properties for tokens · hardcoded demo content in shipped components.

Each was specified in a prior document or shipped in the March build. Each either has no data behind it or has been superseded. **Reintroducing any of them requires a named decision recorded in §16 — not an inference from an old file.**

---

## 16. Open, and not decided here

These are product calls, not design calls. The system holds either way.

1. **Feed scope.** Ingest is general PL news; the product is transfer rumours. Narrow the pipeline or widen the product — but they must agree. The March build showed a Guardian local-history feature and a BBC quiz in the column.
2. **Hero descriptor.** Live copy reads *"Some of this is true. / Transfer gossip. Scored."* A proposed *"The latest news. Scored."* is unresolved and depends on (1).
3. **Facts-block window.** *"19,534 stories logged"* is the whole archive back to February and undercuts a transfer-rumour positioning. Window it to the current transfer window.
4. **Column display name.** *"Today's Gossip"* is used above — matches the descriptor and the `transfer gossip` target term.
5. **Relegated clubs** in the sitemap: coverage or noise.

---

## Changelog

| Version | Date | Change |
|---|---|---|
| 1.0 | 7 Aug 2026 | Initial. Consolidates and replaces four prior brand documents. Unit changed from article to rumour. Contrast floors measured and corrected. Light mode rebuilt — every previous light value failed AA. Publisher colour moved from label to border. Score badge deleted. Demo-content blocks removed from production. |

*Living document. It changes when the data changes, and only then.*
