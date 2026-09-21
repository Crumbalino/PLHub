# GVsEverything + The Football Hub — Project Handover

**Prepared:** 27 Aug 2026  
**From:** Project-based organization  
**To:** Personal Claude workspace  
**Status:** Ready to move, two MD files exported separately

---

## What You're Moving

This project contains **three interconnected properties** and the complete operational documentation for them:

1. **GVsEverything** — YouTube/TikTok/IG channel. Tagline: "G vs Everything. Everything wins."
2. **The Football Hub** — thefootballhub.uk transfer rumour aggregator, rebranded from PLHub
3. **Stand-up** — live gigging; filmed sets are channel content

The two markdown files exported here are your ground truth:
- `g-comedy-handoff-v2.md` — complete guide for working with G on stand-up comedy
- `CURRENT_STATE-1.md` — operational status, ship order, and technical spec for the site and channel

---

## Why Separate from the Project

The Shared Project structure was useful for multi-session context, but you're the single operator and personal Claude is where your work lives. Moving here means:

- **Faster context loading** — no project read/search latency, just paste the content into new conversations
- **Single source of truth** — these docs don't fork; you update one version
- **Portable** — easy to version, reference, and hand to future collaborators or yourself on different devices
- **Native to how you work** — terse, no UI overhead, direct access

---

## Three Things to Preserve

### 1. The Comedy Guide — `g-comedy-handoff-v2.md`

This is a **living reference**, not a handoff. It's the complete system for writing G's stand-up:

- **Frame → Justify → Pivot → Land Cold** — the formula that drives every bit
- **Ten named mechanisms** — engines he runs (the rule-follower's catastrophe, the price tag, the self-diagnosis, etc.)
- **Two failure modes** — surface observation (never implicates him) and landing on the environment (hits someone else)
- **Material inventory** — proven bankers, in development, rebuild candidates, and rejected premises
- **Button construction rules** — granular craft that makes a landing work
- **How to work with G** — his input patterns, delivery expectations, triage system

**Use this:**
- Paste the "PASTE-IN PROMPT BLOCK" (§12) into new comedy-writing conversations
- Reference the mechanisms by name when diagnosing a premise
- Check the two failure modes before delivering any draft
- Treat his marked "LOCKED" material as permanent — rebuilds have been rejected

**When it changes:**
- New material he's staged or developed → add to inventory (§9)
- New mechanism discovered → document with worked example from the archive
- New failure mode pattern → add to §7 with the repair procedure

### 2. The Operational Guide — `CURRENT_STATE-1.md`

This is **ground truth as of 7 Aug 2026**. It contains:

- **The deadline: 1 September.** Transfer window closes; everything else is flexible.
- **The ship order** — what must happen before filming, what films before Session 2, what Session 2 requires
- **The site (thefootballhub.uk):** rebrand status, scoring inputs, SEO/AEO strategy, build order for pages
- **The channel:** gossip column format (video 1 anchor), Vs format (seasonless), Project Hail Mary (deferred to September)
- **Search data** — KD, volume, CPC — which pages to build, in which order
- **Constraints:** seasonality, rights issues, reputational cost of source pages, treadmill risk
- **Five open items** — decisions needed before 1 Sep, decisions after

**Use this:**
- Reference the search data table when prioritizing site work
- Check §5 (Session 1 brief) before code work — it's the exact spec
- Consult §4 for channel format decisions and footage rights
- Watch the "open items" (§12) — these are genuinely open, not decided

**When it changes:**
- Decisions on open items → update the relevant section with the decision and date
- Session 1 or 2 completion → move from "to-do" to "done" with the result
- New material or findings → add to the relevant section with date and context

### 3. Working Preferences (from the original docs)

These patterns are in both files but worth calling out:

**How to brief Claude for work on this:**
- Terse. Context is assumed held.
- Instinct first, constraints second.
- Deliverables ship; explorations are flagged as displacement.
- Research rabbit holes get named and stopped.
- Plan before code work; flag ambiguity rather than guess; small commits, single PR.
- Voice for ideation, text for structured outputs.

**Specific to G's work:**
- Deliver structural diagnosis first, then ranked options, then the pick
- Honest verdict every time: stage-ready / needs X / discard
- Never rewrite something he's marked finished
- Never soften dark material or add disclaimers
- Ratings only count after a room — desk assessment is provisional

---

## How to Use These in Personal Claude

### Starting a New Conversation

**For stand-up work:**
Copy the PASTE-IN PROMPT BLOCK from §12 of the comedy guide into your new chat. It's self-contained and loads G's system directly.

**For site/channel work:**
Reference CURRENT_STATE-1.md by section number. Paste the relevant table or spec when context is needed. The document is designed for that.

**For decisions:**
Check the "open items" section of CURRENT_STATE-1.md. If your question is there, you're on the right track.

### Updating the Guides

When you make a decision, complete work, or discover something new:

1. **Update the relevant guide** (which one? see §3 above)
2. **Add date and context** so future-you knows when and why
3. **Keep the structure** — don't fragment or reorganize, just update in place
4. **Note if something moves to LOCKED** — once decided, it shouldn't reopen

Example:
```
### Before
**Should source pages ship without the balloon column at launch?** ...decided later

### After
**Balloon column at launch: NO** (Decided 1 Sep 2026 — ship source pages showing only claims, outlets, origin, verbatim hedging. Balloons switch on after one window. Removes reputational read-as-scorecard problem — no balloons means nothing to score visually.)
```

### Linking Between Work

When a conversation references something in the guides, cite it:
- Comedy work → "from the comedy guide, mechanism #3: the self-diagnosis"
- Site work → "per CURRENT_STATE §3, build order is Ornstein → Chelsea → indykaila…"
- Channel work → "the open question is whether source pages ship with balloon ratings; see CURRENT_STATE §12"

This keeps everything traceable.

---

## What Isn't Here (And Doesn't Need to Be)

**PDFs:** 5 company-related documents are in the project. Copy them if you need them; this handover focuses on the operational guides.

**Full scripts:** Stand-up bits and full scripts live in conversation archives, not here. The comedy guide references them by search term — find them by conversation search if you need the line-per-breath version.

**Confluence/GitHub:** 
- Repo: github.com/Crumbalino/PLHub (code, issues, PRs)
- Domain: thefootballhub.uk (hosted on Vercel; deploy on push from GitHub)
- CI/CD: Vercel auto-deploys

Those are still your sources for code state, not this document. CURRENT_STATE-1.md is the *business* state, CLAUDE.md in the repo root is the *technical* context.

---

## The One Thing to Do First

**Before you delete the project:**

Save these two files to your personal system somewhere you'll find them — cloud storage, git repo, a note system, wherever your other reference docs live. They're portable and valuable.

The project files can be deleted; these guides are what travel with you.

---

## Quick Reference

**Deadline:** 1 September (transfer window closes)

**In progress:**
- Session 1 (rebrand + metadata) — residual only
- Re-enable summary job — small fix, high priority
- Video 1 spec — "here we go fabrizio romano", 500/mo KD 2

**Three properties, one voice:**
- Channel: solo deadpan, narrator loses
- Site: transfer rumours scored by sourcing
- Stand-up: Frame → Justify → Pivot → Land Cold, always convict the narrator

**Two md files you have:**
1. Comedy guide — paste the prompt block for any stand-up work
2. Operational guide — reference by section number for decisions, status, specs

**Most important constraint:** The comedy guide rules out observation (if the bit could be delivered by anyone, it's not written); it rules out punching down as the landing; it rules out him ending up superior to anyone. That's what makes the system work.

---

## Notes for Future You

When you're starting a new conversation months from now and need context:

1. **Which guide do I need?** Check the table in §3 (what's here) — comedy or operations.
2. **What's the status?** Search CURRENT_STATE-1.md for the section (§1–13 map directly to the topics).
3. **Is this decided or open?** Search "§12. Open items" — if it's listed there, it's genuinely open.
4. **Has this been tried before?** The comedy guide §9 has "rejected" and "rebuild candidates" — check there first.
5. **Am I overthinking this?** Read the "working preferences" section again. You prefer terse, instinct-first, and shipping over exploring.

---

Good luck. Both guides are complete, coherent, and designed to travel. Don't overthink the move.
