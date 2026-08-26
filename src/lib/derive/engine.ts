/**
 * The derivation engine.
 *
 * Pure. No database, no framework, no clock. Every function takes `now`
 * explicitly so every time-dependent rule is testable at any instant.
 *
 * THREE HARD PROPERTIES
 *
 * 1. Every output carries the inputs that produced it. A claim of
 *    consequence that can't be audited doesn't ship.
 * 2. A rule REFUSES rather than guesses. Stale input, missing input or
 *    insufficient data granularity all produce a refusal, not a
 *    hedged sentence. Flat factual tone makes a wrong statement worse,
 *    not better.
 * 3. Generation and SUPPRESSION are separate. A rule can be true and
 *    not worth stating. Scarcity is the value of a derivation.
 *
 * The `lens` field is here because the engine is being written now.
 * Per the parked-FPL rule: free in the first draft, forbidden later.
 */

export type Lens = 'football' | 'fpl' | 'both';
export type Competition = 'PL' | 'FAC' | 'EFL' | 'UCL' | 'UEL' | 'UECL' | 'OTHER';
export type PositionBucket = 'GKP' | 'DEF' | 'MID' | 'FWD';

export interface Derivation {
  ruleId: string;
  text: string;
  inputs: Record<string, unknown>;
  lens: Lens;
}

export interface Refusal {
  ruleId: string;
  refused: true;
  reason: 'stale' | 'missing_input' | 'insufficient_granularity' | 'not_applicable';
  detail: string;
}

export interface Suppressed {
  ruleId: string;
  suppressed: true;
  reason: string;
  derivation: Derivation;
}

export type RuleResult = Derivation | Refusal | Suppressed | null;

export const isDerivation = (r: RuleResult): r is Derivation =>
  r !== null && !('refused' in r) && !('suppressed' in r);
export const isRefusal = (r: RuleResult): r is Refusal =>
  r !== null && 'refused' in r;
export const isSuppressed = (r: RuleResult): r is Suppressed =>
  r !== null && 'suppressed' in r;

/* ------------------------------------------------------------------ */
/* Staleness — mirrors the staleness_limit table                       */
/* ------------------------------------------------------------------ */

export const STALENESS_MINS: Record<string, number> = {
  table_position: 120,
  availability: 720,
  discipline: 1440,
  fixture: 1440,
  result: 15,
  claim: 2880,
};

export function isStale(state: keyof typeof STALENESS_MINS, recordedAt: string, now: Date): boolean {
  const limit = STALENESS_MINS[state];
  if (limit === undefined) return true;
  return now.getTime() - Date.parse(recordedAt) > limit * 60_000;
}

/* ------------------------------------------------------------------ */
/* Disciplinary rules — verified against PL regulations 26 Aug 2026    */
/* ------------------------------------------------------------------ */

/**
 * PL accumulation thresholds. Verified, not remembered:
 *   5 yellows within a club's first 19 PL matches  -> 1 match ban
 *   10 yellows up to and including the 32nd        -> 2 match ban
 *   15 in the season                               -> 3 match ban
 *
 * CRITICAL: PL yellow cards do NOT carry into the FA Cup or EFL Cup.
 * Red-card suspensions DO carry across competitions. A "one booking from
 * missing the next match" derivation is therefore only valid when the
 * next fixture is a Premier League fixture.
 */
export const PL_THRESHOLDS = [
  { cards: 5, byMatch: 19, ban: 1 },
  { cards: 10, byMatch: 32, ban: 2 },
  { cards: 15, byMatch: 38, ban: 3 },
] as const;

export function nextPlThreshold(yellows: number, matchesPlayed: number) {
  for (const t of PL_THRESHOLDS) {
    if (yellows < t.cards && matchesPlayed < t.byMatch) return t;
  }
  return null;
}

export interface DisciplineInput {
  playerName: string;
  yellowCards: number;
  clubMatchesPlayed: number;
  competition: Competition;
  recordedAt: string;
  nextFixture: {
    competition: Competition;
    opponent: string;
    kickoffAt: string;
    isDerby?: boolean;
  } | null;
}

/**
 * RULE: suspension distance.
 * The flagship derivation. Refuses on stale card data, refuses when the
 * next fixture is a cup tie, suppresses when the player isn't close.
 */
export function ruleSuspensionDistance(i: DisciplineInput, now: Date): RuleResult {
  const ruleId = 'discipline.suspension_distance';

  if (i.competition !== 'PL') {
    return { ruleId, refused: true, reason: 'not_applicable',
      detail: `accumulation rules modelled for PL only, got ${i.competition}` };
  }
  if (isStale('discipline', i.recordedAt, now)) {
    return { ruleId, refused: true, reason: 'stale',
      detail: `card data older than ${STALENESS_MINS.discipline} minutes` };
  }
  if (!i.nextFixture) {
    return { ruleId, refused: true, reason: 'missing_input', detail: 'no next fixture known' };
  }

  const threshold = nextPlThreshold(i.yellowCards, i.clubMatchesPlayed);
  if (!threshold) {
    return { ruleId, suppressed: true, reason: 'past every accumulation threshold',
      derivation: { ruleId, text: '', inputs: { ...i }, lens: 'both' } };
  }

  const away = threshold.cards - i.yellowCards;

  // Not close enough to be worth stating.
  if (away > 1) {
    return { ruleId, suppressed: true, reason: `${away} bookings away, only 1 is consequential`,
      derivation: { ruleId, text: '', inputs: { ...i }, lens: 'both' } };
  }

  const inputs = {
    yellowCards: i.yellowCards,
    threshold: threshold.cards,
    byMatch: threshold.byMatch,
    clubMatchesPlayed: i.clubMatchesPlayed,
    nextFixtureCompetition: i.nextFixture.competition,
    nextOpponent: i.nextFixture.opponent,
  };

  // The cup boundary. A booking cannot cost a player a non-PL fixture.
  if (i.nextFixture.competition !== 'PL') {
    return {
      ruleId,
      text: `${i.playerName.toLowerCase()} is one booking from a suspension, but the next fixture is not a league game.`,
      inputs,
      lens: 'both',
    };
  }

  const what = i.nextFixture.isDerby ? 'missing the derby' : `missing the ${i.nextFixture.opponent.toLowerCase()} game`;
  return {
    ruleId,
    text: `${i.playerName.toLowerCase()} is one booking from ${what}.`,
    inputs,
    lens: 'both',
  };
}

/* ------------------------------------------------------------------ */
/* Table rules                                                         */
/* ------------------------------------------------------------------ */

export interface PositionSnapshot {
  clubSlug: string;
  clubName: string;
  position: number;
  points: number;
  goalDiff: number;
  played: number;
  recordedAt: string;
}

/**
 * RULE: position change.
 * Requires the previous snapshot. Without history there is no rule —
 * which is the entire argument for snapshotting from day one.
 */
export function rulePositionChange(
  before: PositionSnapshot | null,
  after: PositionSnapshot,
  passed: PositionSnapshot | null,
  now: Date,
): RuleResult {
  const ruleId = 'table.position_change';

  if (!before) {
    return { ruleId, refused: true, reason: 'missing_input',
      detail: 'no prior snapshot — cannot state a change without a previous value' };
  }
  if (isStale('table_position', after.recordedAt, now)) {
    return { ruleId, refused: true, reason: 'stale', detail: 'table older than 2 hours' };
  }

  const inputs = { from: before.position, to: after.position, points: after.points };

  if (before.position === after.position) {
    return { ruleId, suppressed: true, reason: 'position unchanged; only worth stating in context',
      derivation: { ruleId, text: `${after.position}th, unchanged.`, inputs, lens: 'football' } };
  }

  const improved = after.position < before.position;
  if (improved && passed) {
    return {
      ruleId,
      text: `${after.clubName.toLowerCase()} have moved above ${passed.clubName.toLowerCase()}.`,
      inputs: { ...inputs, passed: passed.clubSlug },
      lens: 'football',
    };
  }
  return {
    ruleId,
    text: `${after.clubName.toLowerCase()} have dropped to ${after.position}th.`,
    inputs,
    lens: 'football',
  };
}

/**
 * RULE: cross-club effect. The differentiator — a result involving
 * neither of our clubs changing our state. Requires all 20 positions.
 */
export function ruleCrossClubEffect(
  subject: PositionSnapshot,
  before: PositionSnapshot[],
  after: PositionSnapshot[],
  now: Date,
): RuleResult {
  const ruleId = 'table.cross_club_effect';

  if (before.length < 20 || after.length < 20) {
    return { ruleId, refused: true, reason: 'missing_input',
      detail: 'cross-club effect requires the full table' };
  }
  const b = before.find((r) => r.clubSlug === subject.clubSlug);
  const a = after.find((r) => r.clubSlug === subject.clubSlug);
  if (!b || !a) {
    return { ruleId, refused: true, reason: 'missing_input', detail: 'subject club absent from a snapshot' };
  }
  if (b.position === a.position) return null;

  const dropped = a.position > b.position;
  return {
    ruleId,
    text: dropped
      ? `${subject.clubName.toLowerCase()} have dropped to ${a.position}th without playing.`
      : `${subject.clubName.toLowerCase()} have moved to ${a.position}th without playing.`,
    inputs: { from: b.position, to: a.position, causedByOtherResult: true },
    lens: 'football',
  };
}

/* ------------------------------------------------------------------ */
/* Availability                                                        */
/* ------------------------------------------------------------------ */

export interface AvailabilityRow {
  playerName: string;
  positionBucket: PositionBucket;
  status: 'available' | 'doubtful' | 'out' | 'suspended' | 'unavailable';
  recordedAt: string;
}

/**
 * RULE: defensive availability count.
 * Bucket granularity only. A request for a finer position is REFUSED,
 * not approximated — FPL provides four buckets and no free source
 * provides centre-back, so "no senior centre-back available" cannot be
 * derived and must not be invented.
 */
export function ruleAvailabilityCount(
  rows: AvailabilityRow[],
  bucket: PositionBucket,
  now: Date,
  granularity: 'bucket' | 'specific' = 'bucket',
): RuleResult {
  const ruleId = 'availability.count_by_bucket';

  if (granularity === 'specific') {
    return { ruleId, refused: true, reason: 'insufficient_granularity',
      detail: 'no source provides positions finer than GKP/DEF/MID/FWD' };
  }
  const stale = rows.find((r) => isStale('availability', r.recordedAt, now));
  if (stale) {
    return { ruleId, refused: true, reason: 'stale',
      detail: `availability for ${stale.playerName} is older than 12 hours` };
  }

  const inBucket = rows.filter((r) => r.positionBucket === bucket);
  const fit = inBucket.filter((r) => r.status === 'available');

  const NOUN: Record<PositionBucket, [string, string]> = {
    DEF: ['defender', 'defenders'],
    MID: ['midfielder', 'midfielders'],
    FWD: ['forward', 'forwards'],
    GKP: ['goalkeeper', 'goalkeepers'],
  };
  const label = NOUN[bucket][fit.length === 1 ? 0 : 1];

  const inputs = { bucket, squad: inBucket.length, available: fit.length,
    unavailable: inBucket.filter((r) => r.status !== 'available').map((r) => r.playerName) };

  // Only worth stating when depth is actually a problem.
  if (fit.length > 3) {
    return { ruleId, suppressed: true, reason: `${fit.length} available is not a shortage`,
      derivation: { ruleId, text: '', inputs, lens: 'football' } };
  }

  return {
    ruleId,
    text: `${fit.length === 1 ? 'one' : fit.length === 0 ? 'no' : String(fit.length)} senior ${label} ${fit.length === 1 ? 'is' : 'are'} available.`,
    inputs,
    lens: 'both',
  };
}

/* ------------------------------------------------------------------ */
/* Evidence                                                            */
/* ------------------------------------------------------------------ */

export interface ClaimEvidence {
  outletCountBefore: number;
  outletCountAfter: number;
  fieldsChanged: string[];
  citesOtherOutlet: number; // sources naming another outlet
  totalSources: number;
}

/**
 * RULE: coverage without information.
 * The cheapest distinctive line in the product. More outlets, no new
 * fields — a judgement about the shape of the evidence rather than a count.
 */
export function ruleCoverageWithoutInformation(e: ClaimEvidence): RuleResult {
  const ruleId = 'evidence.coverage_without_information';
  const added = e.outletCountAfter - e.outletCountBefore;

  if (added <= 0) return null;
  if (e.fieldsChanged.length > 0) {
    return { ruleId, suppressed: true, reason: 'new facts arrived, so coverage is not the story',
      derivation: { ruleId, text: '', inputs: { ...e }, lens: 'football' } };
  }

  const mostlyRewrites = e.citesOtherOutlet / Math.max(e.totalSources, 1) >= 0.5;
  return {
    ruleId,
    text: mostlyRewrites
      ? 'more coverage, same information — most of it citing the original report.'
      : 'more coverage, same information.',
    inputs: { added, fieldsChanged: e.fieldsChanged, citing: e.citesOtherOutlet },
    lens: 'football',
  };
}

/**
 * RULE: conflicting values. States both, adjudicates neither.
 */
export function ruleConflict(field: string, values: { value: string; outlet: string }[]): RuleResult {
  const ruleId = 'evidence.conflict';
  const distinct = new Set(values.map((v) => v.value));
  if (distinct.size < 2) return null;

  const list = values.map((v) => `${v.value} (${v.outlet.toLowerCase()})`).join(' · ');
  return {
    ruleId,
    text: `${distinct.size === 2 ? 'two' : String(distinct.size)} figures are in circulation: ${list}. neither has been confirmed.`,
    inputs: { field, values },
    lens: 'football',
  };
}

/* ------------------------------------------------------------------ */
/* The runner                                                          */
/* ------------------------------------------------------------------ */

export interface EngineOutput {
  published: Derivation[];
  suppressed: Suppressed[];
  refused: Refusal[];
}

/**
 * Partitions results. Nothing is silently dropped — a refusal is a
 * recorded outcome, because "why did the page not say anything about
 * Van de Ven" needs an answer too.
 *
 * `maxPublished` is the suppression backstop. Scarcity is the value:
 * past a handful, derived lines become furniture.
 */
export function run(results: RuleResult[], maxPublished = 3): EngineOutput {
  const out: EngineOutput = { published: [], suppressed: [], refused: [] };
  for (const r of results) {
    if (r === null) continue;
    if (isRefusal(r)) out.refused.push(r);
    else if (isSuppressed(r)) out.suppressed.push(r);
    else out.published.push(r);
  }
  if (out.published.length > maxPublished) {
    const overflow = out.published.slice(maxPublished);
    out.published = out.published.slice(0, maxPublished);
    for (const d of overflow) {
      out.suppressed.push({ ruleId: d.ruleId, suppressed: true,
        reason: `over the ${maxPublished}-line ceiling`, derivation: d });
    }
  }
  return out;
}
