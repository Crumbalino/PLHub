# BUILD_STATUS

**26 August 2026 · updated.** P0 state model, movement ledger and derivation engine.

**Scope caveat, stated first:** this was built in an isolated container with no access to `Crumbalino/PLHub`, Supabase or `pl-hub-webapp12`. Nothing here has touched the repo or run against a real database. "Working" below means *implemented, typechecked under `strict`, and passing tests I have actually executed* — not deployed.

---

## 1. What is actually working

**52 tests passing, `tsc --noEmit` clean under `strict`.**

| Module | Status |
|---|---|
| `src/lib/movement/types.ts` | Event types, precedence ordering, editorial/terminal predicates |
| `src/lib/movement/score.ts` | Movement scoring, the corroboration ceiling, depth thresholds, global ranking |
| `src/lib/movement/diff.ts` | Catch-up diff, lineage resolution, session open/commit, sign-in merge |
| `src/lib/design/tokens.ts` | Central tokens — every hex, font and spacing value in the system |
| `src/lib/derive/engine.ts` | Six derivation rules, refusals, suppression, audit, runner |
| `supabase/migrations/20260826010000_state_model.sql` | Eleven entities, bitemporal, one event log, staleness as data, `record_state_event()` |
| `supabase/migrations/20260826000000_movement_ledger.sql` | **Superseded** by the above. Keep for history, do not apply to a fresh database |

Behaviours verified by test rather than asserted in prose:

- A `DEVELOPMENT` outscores two `CORROBORATION`s
- Nine corroborations score five — the ceiling holds
- The ceiling respects outlets banked before the window opened
- Past the ceiling, a development still moves the story
- `MERGE` never scores and is excluded from precedence
- Official is terminal and leaves the stream
- Ranking takes no reader state as input
- Pruning cannot manufacture novelty
- Refresh inside the session window does not move the diff basis
- Commit writes `sessionObserved`, so anything arriving mid-visit stays new
- Concurrent commits take the higher version and cannot roll each other back
- Sign-in merge takes the lower version
- Lineage resolves to the lower seen version
- 31 changed clusters triggers `REORIENT`
- PL thresholds are 5 by match 19, 10 by 32, 15 by 38 — verified against regulations, not remembered
- **The cup trap:** a booking cannot cost a player a cup fixture, and the rule says so instead of asserting a ban
- Stale card data refuses rather than producing a confident wrong sentence
- Two bookings away is suppressed; only one away is consequential
- **Centre-back granularity is refused** — no source provides it, so it is never approximated
- A position change with no prior snapshot refuses rather than inventing a baseline
- Cross-club effect fires with no fixture of our own, and needs the full table
- More outlets with no new fields produces the coverage line; new facts suppress it
- Conflicting figures are stated, never adjudicated
- The runner partitions into published / suppressed / refused and drops nothing silently
- The three-line ceiling suppresses overflow rather than discarding it

---

## 2. What is mocked or stubbed

- **Everything above the pure logic.** No API route, no React component, no data fetching.
- **Test fixtures only.** No real cluster or event has ever been written.
- `ancestorsOf()` is injected as a function and defaults to returning nothing. The real implementation is a recursive walk of `merged_into`, unwritten.
- `eventsSinceSeen()` is injected. The real implementation is the indexed query on `(cluster_id, version_at_event)`.
- `font.text` and `font.mono` reference CSS variables that `next/font` must define. Not wired.

---

## 3. What remains unfinished

**P0 remainder**
- Clustering. Nothing here creates a cluster or decides two articles are the same story. Movement is exactly as good as this and it is the hardest part of the project.
- The ingest→extraction→event path. Something must call `record_story_event()` when an extraction field changes.
- The `outletCountBefore` derivation — currently a caller-supplied number; needs deriving from event history at window start.

**P1–2**
- `user_club_state` and `user_story_state` tables. Deliberately not written: they need Supabase Auth first, and writing empty auth-dependent tables now invites drift.
- The authenticated catch-up fetch endpoint.
- Save, remind, consumed.
- Email projection.

---

## 4. Implementation decisions taken

Reversible, taken rather than escalated:

1. **`state_version` is incremented inside a SQL function, never by application code.** A `SELECT`-then-`UPDATE` in TypeScript would race under concurrent ingest and silently corrupt every reader's diff. `record_story_event()` does the update and the insert in one statement, so the invariant cannot be broken from outside.
2. **A partial unique index enforces one corroboration per domain per cluster.** Retries and double-ingests cannot inflate an outlet count. It is a data integrity rule, so it lives in the database.
3. **`merge_story_clusters()` writes a `MERGE` row on both clusters.** Costs nothing, and makes the lineage legible from either side during an audit.
4. **Commit merges with `Math.max`, sign-in merges with `Math.min`.** These look inconsistent and are not. At commit both values are things this reader has genuinely seen, so the higher is correct and prevents a second device rolling the first back. At sign-in a version present in only one context may not have been seen in the other, so the lower is correct.
5. **Scoring functions take `now` as an argument.** No function reads the clock. Every time-dependent rule is testable at any instant.
6. **Movement logic is pure and framework-free.** No Supabase import, no React, no Next. It ports to React Native unchanged, which is the decision that makes the app a port rather than a rebuild.
7. **`APPEARED` weight 1, not 3.** A story existing is not the same as a story developing. It ranks above corroboration in precedence for the diff line, but does not earn full depth alone.
8. **Tokens carry contrast ratios as data.** So a future accent change has to state its measured ratio in the same edit, rather than being eyeballed.

---

## 5. Genuine blockers

**One.** **Clustering does not exist**, and movement is meaningless without it. Every rule here operates on a cluster; nothing decides what a cluster is. This is not a gap in tonight's work — it is the next substantial piece of engineering, and the architecture assumes it.

Everything else is sequencing rather than blockage.

Not a blocker but worth banking: **`record_story_event()` can start being called the moment clustering lands, and the log becomes valuable immediately.** No reader-facing feature has to exist for it to be worth running.

---

## 6. The three most important things to test tomorrow

1. **Run the migration against a real Supabase branch and hammer `record_story_event()` concurrently.** Fire fifty simultaneous corroborations at one cluster from separate connections. `state_version` must land at exactly fifty, `version_at_event` must be unique and gapless, and the partial unique index must reject the duplicate domains. If versioning races under real concurrency, every rule downstream is unsound.

2. **Prove `MERGE` produces no movement end to end.** Create two clusters with real events, merge them, then compute a catch-up for a reader whose snapshot predates the merge. They must see the underlying editorial events and nothing attributable to the merge itself. This is the correctness fix from v1.2 and it is the one most likely to be quietly wrong in the SQL rather than in the TypeScript.

3. **Replay a real week of ingest through the scorer and read the output as a human.** Take the busiest week available, generate events, and look at what reaches full depth. The question is not whether the code runs but whether the ranking is *editorially right* — whether the corroboration ceiling at five is the correct number, and whether a development genuinely outranking two rewrites produces a front page you would publish.
