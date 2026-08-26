import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  ruleSuspensionDistance, rulePositionChange, ruleCrossClubEffect,
  ruleAvailabilityCount, ruleCoverageWithoutInformation, ruleConflict,
  nextPlThreshold, isStale, run,
  isDerivation, isRefusal, isSuppressed,
  type DisciplineInput, type PositionSnapshot, type AvailabilityRow,
} from '@/lib/derive/engine';

const NOW = new Date('2026-08-26T12:00:00Z');
const minsAgo = (m: number) => new Date(NOW.getTime() - m * 60_000).toISOString();

/* ---------------------------------------------------- thresholds --- */

test('PL thresholds are 5 by match 19, 10 by 32, 15 by 38', () => {
  assert.equal(nextPlThreshold(4, 7)?.cards, 5);
  assert.equal(nextPlThreshold(4, 7)?.ban, 1);
  assert.equal(nextPlThreshold(6, 22)?.cards, 10);
  assert.equal(nextPlThreshold(12, 34)?.cards, 15);
  assert.equal(nextPlThreshold(16, 37), null);
});

/* ----------------------------------------------------- staleness --- */

test('staleness limits bite per state type', () => {
  assert.equal(isStale('result', minsAgo(20), NOW), true, 'results must be fresh in a live window');
  assert.equal(isStale('result', minsAgo(5), NOW), false);
  assert.equal(isStale('discipline', minsAgo(600), NOW), false);
  assert.equal(isStale('discipline', minsAgo(2000), NOW), true);
});

/* ------------------------------------------- suspension distance --- */

const disc = (o: Partial<DisciplineInput> = {}): DisciplineInput => ({
  playerName: 'Van de Ven',
  yellowCards: 4,
  clubMatchesPlayed: 7,
  competition: 'PL',
  recordedAt: minsAgo(60),
  nextFixture: { competition: 'PL', opponent: 'Arsenal', kickoffAt: minsAgo(-2880), isDerby: true },
  ...o,
});

test('one booking away, next fixture is league — publishes', () => {
  const r = ruleSuspensionDistance(disc(), NOW);
  assert.ok(isDerivation(r));
  assert.equal((r as any).text, 'van de ven is one booking from missing the derby.');
  assert.equal((r as any).inputs.threshold, 5);
});

test('THE CUP TRAP — next fixture is a cup tie, so the ban cannot apply to it', () => {
  const r = ruleSuspensionDistance(
    disc({ nextFixture: { competition: 'EFL', opponent: 'Brentford', kickoffAt: minsAgo(-2880) } }),
    NOW,
  );
  assert.ok(isDerivation(r));
  assert.match((r as any).text, /not a league game/);
  assert.equal((r as any).inputs.nextFixtureCompetition, 'EFL');
});

test('stale card data refuses rather than guessing', () => {
  const r = ruleSuspensionDistance(disc({ recordedAt: minsAgo(2000) }), NOW);
  assert.ok(isRefusal(r));
  assert.equal((r as any).reason, 'stale');
});

test('two bookings away is suppressed, not published', () => {
  const r = ruleSuspensionDistance(disc({ yellowCards: 3 }), NOW);
  assert.ok(isSuppressed(r));
  assert.match((r as any).reason, /2 bookings away/);
});

test('no next fixture refuses', () => {
  assert.ok(isRefusal(ruleSuspensionDistance(disc({ nextFixture: null }), NOW)));
});

test('non-PL competition is out of scope, stated as such', () => {
  const r = ruleSuspensionDistance(disc({ competition: 'UCL' }), NOW);
  assert.ok(isRefusal(r));
  assert.equal((r as any).reason, 'not_applicable');
});

/* --------------------------------------------------------- table --- */

const snap = (o: Partial<PositionSnapshot> = {}): PositionSnapshot => ({
  clubSlug: 'tottenham', clubName: 'Tottenham', position: 4,
  points: 16, goalDiff: 5, played: 7, recordedAt: minsAgo(30), ...o,
});

test('no prior snapshot means no change can be stated', () => {
  const r = rulePositionChange(null, snap(), null, NOW);
  assert.ok(isRefusal(r));
  assert.match((r as any).detail, /previous value/);
});

test('moving up names the club passed', () => {
  const r = rulePositionChange(
    snap({ position: 5 }), snap({ position: 4 }),
    snap({ clubSlug: 'brighton', clubName: 'Brighton', position: 5 }), NOW,
  );
  assert.ok(isDerivation(r));
  assert.equal((r as any).text, 'tottenham have moved above brighton.');
});

test('unchanged position is suppressed but retained', () => {
  const r = rulePositionChange(snap({ position: 5 }), snap({ position: 5 }), null, NOW);
  assert.ok(isSuppressed(r));
  assert.equal((r as any).derivation.text, '5th, unchanged.');
});

test('cross-club effect requires the full table', () => {
  const r = ruleCrossClubEffect(snap(), [snap()], [snap()], NOW);
  assert.ok(isRefusal(r));
  assert.match((r as any).detail, /full table/);
});

test('cross-club effect fires with no fixture of our own', () => {
  const before = Array.from({ length: 20 }, (_, i) =>
    snap({ clubSlug: `c${i}`, position: i + 1 }));
  const after = before.map((s) => ({ ...s }));
  before[3] = snap({ clubSlug: 'tottenham', clubName: 'Tottenham', position: 4 });
  after[3] = snap({ clubSlug: 'tottenham', clubName: 'Tottenham', position: 5 });
  const r = ruleCrossClubEffect(snap(), before, after, NOW);
  assert.ok(isDerivation(r));
  assert.match((r as any).text, /without playing/);
  assert.equal((r as any).inputs.causedByOtherResult, true);
});

/* -------------------------------------------------- availability --- */

const av = (name: string, status: AvailabilityRow['status'], bucket: AvailabilityRow['positionBucket'] = 'DEF'): AvailabilityRow =>
  ({ playerName: name, positionBucket: bucket, status, recordedAt: minsAgo(120) });

test('THE GRANULARITY REFUSAL — centre-back is not derivable from any source', () => {
  const r = ruleAvailabilityCount([av('a', 'available')], 'DEF', NOW, 'specific');
  assert.ok(isRefusal(r));
  assert.equal((r as any).reason, 'insufficient_granularity');
});

test('a shortage of defenders publishes', () => {
  const rows = [av('romero', 'out'), av('dragusin', 'out'), av('van de ven', 'available'), av('porro', 'available')];
  const r = ruleAvailabilityCount(rows, 'DEF', NOW);
  assert.ok(isDerivation(r));
  assert.equal((r as any).text, '2 senior defenders are available.');
});

test('one available defender reads as a word, not a numeral', () => {
  const r = ruleAvailabilityCount([av('a', 'available'), av('b', 'out'), av('c', 'out')], 'DEF', NOW);
  assert.equal((r as any).text, 'one senior defender is available.');
});

test('a full complement is suppressed', () => {
  const rows = ['a','b','c','d','e'].map((n) => av(n, 'available'));
  assert.ok(isSuppressed(ruleAvailabilityCount(rows, 'DEF', NOW)));
});

test('stale availability refuses and names the player', () => {
  const r = ruleAvailabilityCount([av('romero', 'out'), { ...av('porro', 'available'), recordedAt: minsAgo(900) }], 'DEF', NOW);
  assert.ok(isRefusal(r));
  assert.match((r as any).detail, /porro/);
});

/* ------------------------------------------------------ evidence --- */

test('more outlets and no new fields is the coverage line', () => {
  const r = ruleCoverageWithoutInformation({
    outletCountBefore: 3, outletCountAfter: 5, fieldsChanged: [],
    citesOtherOutlet: 1, totalSources: 5,
  });
  assert.ok(isDerivation(r));
  assert.equal((r as any).text, 'more coverage, same information.');
});

test('mostly rewrites earns the stronger sentence', () => {
  const r = ruleCoverageWithoutInformation({
    outletCountBefore: 3, outletCountAfter: 6, fieldsChanged: [],
    citesOtherOutlet: 4, totalSources: 6,
  });
  assert.match((r as any).text, /citing the original report/);
});

test('new facts suppress the coverage line', () => {
  const r = ruleCoverageWithoutInformation({
    outletCountBefore: 3, outletCountAfter: 6, fieldsChanged: ['fee_stated'],
    citesOtherOutlet: 0, totalSources: 6,
  });
  assert.ok(isSuppressed(r));
});

test('conflict states both figures and adjudicates neither', () => {
  const r = ruleConflict('fee_stated', [
    { value: '£42m', outlet: 'Marca' }, { value: '£55m', outlet: 'The Athletic' },
  ]);
  assert.ok(isDerivation(r));
  assert.match((r as any).text, /two figures are in circulation/);
  assert.match((r as any).text, /neither has been confirmed/);
});

test('agreeing sources are not a conflict', () => {
  assert.equal(ruleConflict('fee_stated', [
    { value: '£42m', outlet: 'Marca' }, { value: '£42m', outlet: 'AS' },
  ]), null);
});

/* -------------------------------------------------------- runner --- */

test('the runner partitions and never silently drops', () => {
  const out = run([
    ruleSuspensionDistance(disc(), NOW),
    ruleSuspensionDistance(disc({ yellowCards: 2 }), NOW),
    ruleSuspensionDistance(disc({ recordedAt: minsAgo(3000) }), NOW),
    null,
  ]);
  assert.equal(out.published.length, 1);
  assert.equal(out.suppressed.length, 1);
  assert.equal(out.refused.length, 1);
});

test('the ceiling suppresses overflow rather than truncating it away', () => {
  const many = Array.from({ length: 6 }, (_, i) =>
    rulePositionChange(snap({ position: 5 }), snap({ position: 4, clubName: `Club${i}` }),
      snap({ clubSlug: 'x', clubName: 'Brighton', position: 5 }), NOW));
  const out = run(many, 3);
  assert.equal(out.published.length, 3);
  assert.equal(out.suppressed.length, 3);
  assert.match(out.suppressed[0].reason, /ceiling/);
});
