# Editorial Principles

Product rules for The Football Hub. These outrank convenience and they outrank
coverage numbers. Implementation gaps are tracked as GitHub issues, not here.

## Relevance and classification are separate decisions

Two distinct questions, decided by different logic, with deliberately opposite
biases:

| Decision | Question | Bias |
|---|---|---|
| **Relevance** | Does this story appear on the site at all? | **Permissive** — when unsure, let it through |
| **Classification** | Which club does this story belong to? | **Strict** — when unsure, refuse to say |

Conflating the two is the mistake to avoid. Using "mentions a club" as a
relevance test, or treating a relevance keyword hit as an attribution, collapses
two different risk profiles into one.

**Mislabelled content on a club page costs more trust than missing content
does.** A thin club page is a gap. A club page carrying another club's story is a
reason to stop believing the ledger — and the ledger's entire value is being
believed.

## Club classification must never guess

### Banned match tokens

Never classify on ambiguous abbreviations:

`AFC` · `Saints` · `Reds` · `City` · `United`

`AFC` alone resolves to Arsenal, Bournemouth, or AFC Wimbledon. `City` and
`United` are worse. A token that maps to more than one club is not evidence, and
no amount of surrounding heuristics makes it evidence.

### Two independent signals required

Attribute a story to a club only on **two** of:

1. **Full club name** in the title or description
2. **Club in the source URL slug**
3. **Player name** matched against a squad list for that club
4. **Manager name**
5. **Stadium name**

Independent means genuinely separate — the same club name appearing in both title
and description is **one** signal, not two.

### `unclassified` is a valid state

Below two signals, a story is `unclassified`. This is expected, not a failure:

- It **still appears** in the general feed.
- It **never appears** on a club page.

Do not add a fallback that assigns a "best guess" club. Do not let a club page
fill space by relaxing the threshold. If a club page is sparse, the answer is
better signals, not a lower bar.

## Source scoring

Sources are scored on four axes, and all four are needed to avoid gaming:

- **Hit rate** — how often their claims resolve true
- **Volume** — how much they publish; a high hit rate on two claims is not a record
- **Originality** — did they break it, or echo someone who did
- **Specificity** — "a Premier League club" is not a prediction; a named fee and date is

**Verbatim hedging language matters as much as the outcome.** An outlet that
hedges everything and is technically never wrong is a different failure than one
that commits and misses. Record the hedge exactly as published; never paraphrase
it.
