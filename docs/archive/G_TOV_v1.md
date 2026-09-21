# G tone of voice, v1

Built 17 August 2026 from a six-pair forced-choice test plus every correction G has made across this project. Where this conflicts with `G_voice_profile.md`, this wins. That file covers first-person writing only and it has a wrong line in it (see Corrections at the end).

Two registers. They are not the same voice and the old file only had one of them.

---

## Register 1: CV bullets

**1. Verb first, past tense or participle.** Built, Grew, Moved, Rebuilt, Led, Designed, Delivered, Ran, Stood up, Recovered, Relaunched. No "Responsible for", no gerund openers.

**2. The metric leads. Mitigating context trails or goes.**
Chosen: "Grew marketing-sourced pipeline 45% quarter on quarter in the first full quarter after taking the function over."
Rejected: "Took over the marketing function mid-leadership transition and grew marketing-sourced pipeline 45%..."
The transition context can sit behind the number. It cannot sit in front of it. Reading it as an explanation before the result makes it sound like a caveat.

**3. Purpose clauses take "to". They never take contrast.**
Chosen: "...commissioned a multi-touch attribution build in BigQuery and Metabase to judge channel spend on opportunities and revenue."
Rejected: "...so spend is judged on revenue rather than form fills."
This is the single biggest tell in everything I have written for you. In your own writing the count of contrastive constructions is zero. In mine it was 3.7 per thousand words. Every "rather than", every "not X but Y", every "X, not Y" closer. All out.

**4. Participle chains, not colon punches.**
Chosen: "Rebuilt paid media, restructuring Google Ads, fixing LinkedIn server-side conversion tracking, introducing Microsoft Ads as a new channel and running Reddit as a test-and-learn."
Rejected: "Rebuilt paid media myself: restructured Google Ads, fixed..."
The colon-then-list is a rhetorical move. It reads as someone building to a point rather than reporting what happened.

**5. No bravado markers.** "myself", "with my hands on the controls", "not a PowerPoint general", "I still write the ad copy" belong in a letter if anywhere. Never in a bullet.

**6. Compound sentences that carry information beat short ones that carry attitude.** And-chains are fine, and preferred over three-item lists chosen for rhythm. Length is not the enemy. Emptiness is.

**7. No editorial asides.** Anything that comments on the work rather than describing it gets cut. Test: does this clause tell the reader a fact, or tell them how to feel about the fact? Examples out: "so the quality bar never shows", "so it survives interview follow-ups", "which is the harder part", "actually", "genuinely".

**8. Where a claim has a control on it, name the control.** You chose "with human editorial sign-off on everything" over a longer tool list. Governance clauses earn their space, especially given the regulated categories on your record.

**9. UK English, no exceptions except employer-specified job titles.** optimisation, organisation, programme, prioritise, analyse. Your own writing runs 11:1 British.

**10. No em dashes.** Commas and full stops.

---

## Register 2: First person

Cover letters, LinkedIn DMs, recruiter email, the Loom script.

**1. Default to compound and specific, then land one blunt declarative.**
Chosen: "Fifteen years building demand across paid, owned and earned, delivered hands-on: I lead the function and still write the ad copy, build the landing page and read the attribution."
Rejected: "Fifteen years building demand, most of it with my hands on the controls."
The aphorism on its own is thin. The informative version with a blunt line after it works.

**2. "I" lives here and only here.** Banned in bullets, wanted in letters.

**3. Blunt declaratives must be falsifiable claims about your practice, never personality claims.**
Allowed: "I have never confused traffic with revenue."
Banned: "I thrive in ambiguity." "I am a hands-on, execution-focused leader."
The first one can be checked against your record. The second is a horoscope.

**4. Carried over from v0 and still right:** no throat-clearing openers, no opening with a quote from the job description, no mirroring the JD back, no flattering the employer, no "eats its own cooking". Sign off human. You write your own closes.

---

## Banned vocabulary

Your words: no one talks like that, it is archaic and redundant.

**moat** and the family it belongs to: defensibility, flywheel, north star, unlock, superpower, secret sauce, table stakes, 10x, best-in-class, world-class, thought leader, learnings, journey, "the AI space", leverage as a verb, passionate, results-driven, ownership as a virtue noun.

These are borrowed from strategy decks and VC memos. You have never used one of them in anything you have written in this project.

**Banned constructions:** rather than · not X but Y · X, not Y · actually · genuinely · "the thing is" · "and that is the hard part" · triads for rhythm ("faster, smarter, stronger").

---

## The one test

Read the sentence. Is it describing work, or commenting on work? Commenting gets cut. That single question catches most of what has been going wrong.

---

## Open item, needs one word from you

Pair 4 had a confound I should not paper over. You picked "an in-house AI content agent connected to the marketing stack, cutting production time 60 to 70% with human editorial sign-off on everything" over the version that named Connie plus Webflow, HubSpot, Ahrefs and Metabase.

You may have picked it for the sign-off clause rather than against the tool names, and your standing instruction is to list tools freely. Until you say otherwise I am keeping **both**: name Connie, name the stack, keep the governance clause. Tell me if that is wrong.

---

## Corrections to existing project files

- `G_voice_profile.md` line 15 says "US English, sentence case. optimize, program, prioritize." That is wrong and it is where the optimize/operationalized leakage in the master CV comes from. Should read UK English.
- `master_final.html` still carries Pharmica, the old "Content and Communication Marketing Team Lead" title with the word Team in it, and five US spellings. Separate fix, flagged not forgotten.

---

## Appendix: gate additions

Bolt onto the existing CV gating system alongside the two-page and fill checks.

```python
BANNED_TERMS = [
    r"\bmoat\b", r"\bdefensibilit", r"\bflywheel\b", r"\bnorth star\b",
    r"\bunlock\b", r"\bsuperpower\b", r"\bsecret sauce\b", r"\btable stakes\b",
    r"\b10x\b", r"\bbest-in-class\b", r"\bworld-class\b", r"\bthought leader",
    r"\blearnings\b", r"\bpassionate\b", r"\bresults-driven\b",
    r"\bleverag(e|ing)\b", r"\bthe AI space\b",
]
BANNED_CONSTRUCTIONS = [
    r"rather than", r"\bnot\b[^.]{0,40}\bbut\b", r",\s*not\s+\w+\s*[.,]",
    r"\bactually\b", r"\bgenuinely\b",
]
US_SPELLINGS = [
    r"i[sz]ed?\b(?<!ised)", r"\boptimiz", r"\borganiz", r"\bprioritiz",
    r"\banaly[sz]e?d?\b(?<!analyse)(?<!analysed)", r"\bprogram\b", r"\bcenter\b",
]
# fail the build on any hit, same as the US-spelling gate already does
```

Note the `\bprogram\b` rule needs a carve-out for employer-specified titles such as "AI Content Optimization Lead", which keep the employer's own spelling.
