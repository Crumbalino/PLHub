import { test } from 'node:test';
import assert from 'node:assert/strict';

import type { StoryCluster, StoryEvent, StoryEventType } from '@/lib/movement/types';
import { precedenceRank, isEditorial } from '@/lib/movement/types';
import {
  movementScore,
  depthFor,
  rankClusters,
  CORROBORATION_CEILING,
} from '@/lib/movement/score';
import {
  computeCatchUp,
  openSession,
  commitSession,
  mergeSnapshotsOnSignIn,
  resolveSeenVersion,
  aggregate,
  type SessionState,
  type Snapshot,
} from '@/lib/movement/diff';

const NOW = new Date('2026-08-26T09:00:00Z');
const hoursAgo = (h: number) => new Date(NOW.getTime() - h * 3600_000).toISOString();

let v = 0;
function ev(type: StoryEventType, opts: Partial<StoryEvent> = {}): StoryEvent {
  return {
    clusterId: 'c1',
    entitySlug: 'tottenham',
    type,
    summary: `${type} happened`,
    versionAtEvent: ++v,
    occurredAt: hoursAgo(1),
    ...opts,
  };
}

function cluster(o: Partial<StoryCluster> = {}): StoryCluster {
  return {
    id: 'c1',
    entitySlug: 'tottenham',
    headline: 'Atlético open talks over Romero',
    stateVersion: 10,
    outletCount: 3,
    status: 'live',
    mergedInto: null,
    firstEventAt: hoursAgo(72),
    lastEventAt: hoursAgo(1),
    ...o,
  };
}

/* ---------------------------------------------------------- scoring --- */

test('a development outweighs two corroborations', () => {
  const dev = movementScore([ev('DEVELOPMENT')], NOW);
  const corr = movementScore([ev('CORROBORATION'), ev('CORROBORATION')], NOW);
  assert.ok(dev > corr, `${dev} should beat ${corr}`);
});

test('corroboration stops counting past the ceiling', () => {
  const many = Array.from({ length: 9 }, () => ev('CORROBORATION'));
  const score = movementScore(many, NOW, 0);
  assert.equal(score, CORROBORATION_CEILING, 'only the first five outlets score');
});

test('the ceiling respects outlets already banked before the window', () => {
  const two = [ev('CORROBORATION'), ev('CORROBORATION')];
  assert.equal(movementScore(two, NOW, 5), 0, 'already at ceiling — herding scores nothing');
  assert.equal(movementScore(two, NOW, 3), 2, 'room for two more');
});

test('past the ceiling a development still moves the story', () => {
  const events = [ev('CORROBORATION'), ev('DEVELOPMENT')];
  assert.equal(movementScore(events, NOW, 5), 3, 'information beats herding');
});

test('events outside the window are ignored', () => {
  assert.equal(movementScore([ev('DEVELOPMENT', { occurredAt: hoursAgo(30) })], NOW), 0);
});

test('MERGE never scores', () => {
  assert.equal(movementScore([ev('MERGE')], NOW), 0);
  assert.equal(isEditorial('MERGE'), false);
});

/* ------------------------------------------------------------ depth --- */

test('three points earns a full card', () => {
  assert.equal(depthFor(cluster(), [ev('DEVELOPMENT')], NOW), 'full');
});

test('one corroboration is thin, not full', () => {
  assert.equal(depthFor(cluster(), [ev('CORROBORATION')], NOW), 'thin');
});

test('nothing in 48h drops out', () => {
  const cold = cluster({ lastEventAt: hoursAgo(60) });
  assert.equal(depthFor(cold, [ev('CORROBORATION', { occurredAt: hoursAgo(60) })], NOW), 'dropped');
});

test('official is terminal and leaves the stream', () => {
  assert.equal(depthFor(cluster({ status: 'official' }), [ev('OFFICIAL')], NOW), 'terminal');
});

test('ranking is by score then recency, and never sees reader state', () => {
  const ranked = rankClusters(
    [
      { cluster: cluster({ id: 'a' }), events: [ev('CORROBORATION')] },
      { cluster: cluster({ id: 'b' }), events: [ev('DEVELOPMENT')] },
    ],
    NOW,
  );
  assert.equal(ranked[0].cluster.id, 'b');
});

/* ------------------------------------------------------ aggregation --- */

test('highest precedence supplies the line, corroborations collapse to a count', () => {
  const agg = aggregate([
    ev('CORROBORATION'),
    ev('DEVELOPMENT', { summary: 'A fee has been reported for the first time' }),
    ev('CORROBORATION'),
  ]);
  assert.equal(agg?.leadType, 'DEVELOPMENT');
  assert.equal(agg?.summary, 'A fee has been reported for the first time');
  assert.equal(agg?.corroborationCount, 2);
});

test('APPEARED outranks CORROBORATION but not DEVELOPMENT', () => {
  assert.ok(precedenceRank('APPEARED') < precedenceRank('CORROBORATION'));
  assert.ok(precedenceRank('DEVELOPMENT') < precedenceRank('APPEARED'));
});

/* --------------------------------------------------------- catch-up --- */

const freshSession = (o: Partial<SessionState> = {}): SessionState => ({
  seenSnapshot: { c1: 8 },
  sessionSeen: { c1: 8 },
  sessionObserved: null,
  sessionStartedAt: NOW.toISOString(),
  lastSeenAt: hoursAgo(13),
  ...o,
});

const since = (evts: StoryEvent[]) => () => evts;

test('a version bump since last seen counts as changed', () => {
  const r = computeCatchUp(
    [{ cluster: cluster({ stateVersion: 10 }), eventsSinceSeen: since([ev('DEVELOPMENT')]) }],
    freshSession(),
  );
  assert.equal(r.mode, 'DELTA');
  assert.equal(r.count, 1);
});

test('no version bump means caught up', () => {
  const r = computeCatchUp(
    [{ cluster: cluster({ stateVersion: 8 }), eventsSinceSeen: since([]) }],
    freshSession(),
  );
  assert.equal(r.mode, 'CAUGHT_UP');
});

test('no snapshot at all is a first visit, never a fabricated baseline', () => {
  const r = computeCatchUp(
    [{ cluster: cluster(), eventsSinceSeen: since([ev('APPEARED')]) }],
    freshSession({ seenSnapshot: null, sessionSeen: null }),
  );
  assert.equal(r.mode, 'FIRST_VISIT');
  assert.equal(r.count, 0);
});

test('pruning must not manufacture novelty', () => {
  // Cluster absent from the snapshot, but it first appeared BEFORE the
  // reader's last visit — so they saw it and the entry was pruned.
  const old = cluster({ id: 'pruned', firstEventAt: hoursAgo(200), stateVersion: 4 });
  const r = computeCatchUp(
    [{ cluster: old, eventsSinceSeen: since([ev('CORROBORATION')]) }],
    freshSession({ seenSnapshot: { other: 1 }, sessionSeen: { other: 1 } }),
  );
  assert.equal(r.mode, 'CAUGHT_UP', 'a pruned entry must not resurface as new');
});

test('a genuinely new cluster does count', () => {
  const brandNew = cluster({ id: 'new', firstEventAt: hoursAgo(2), stateVersion: 1 });
  const r = computeCatchUp(
    [{ cluster: brandNew, eventsSinceSeen: since([ev('APPEARED')]) }],
    freshSession({ seenSnapshot: { other: 1 }, sessionSeen: { other: 1 } }),
  );
  assert.equal(r.count, 1);
  assert.equal(r.changed[0].leadType, 'APPEARED');
});

test('more than thirty changed clusters reorients rather than walls', () => {
  const many = Array.from({ length: 31 }, (_, i) => ({
    cluster: cluster({ id: `c${i}`, stateVersion: 5, firstEventAt: hoursAgo(2) }),
    eventsSinceSeen: since([ev('DEVELOPMENT')]),
  }));
  const r = computeCatchUp(many, freshSession({ seenSnapshot: {}, sessionSeen: {} }));
  assert.equal(r.mode, 'REORIENT');
});

test('absorbed clusters never count', () => {
  const r = computeCatchUp(
    [{ cluster: cluster({ status: 'merged', stateVersion: 99 }), eventsSinceSeen: since([ev('DEVELOPMENT')]) }],
    freshSession(),
  );
  assert.equal(r.mode, 'CAUGHT_UP');
});

/* ---------------------------------------------------------- lineage --- */

test('lineage resolves to the lower seen version', () => {
  const survivor = cluster({ id: 'survivor' });
  const snapshot: Snapshot = { survivor: 9, absorbed: 4 };
  const seen = resolveSeenVersion(survivor, snapshot, () => ['absorbed']);
  assert.equal(seen, 4, 'lower wins — show twice rather than hide');
});

test('lineage returns null when no ancestor was ever seen', () => {
  assert.equal(resolveSeenVersion(cluster({ id: 'x' }), {}, () => ['y']), null);
});

/* --------------------------------------------------------- sessions --- */

test('an open session is not reopened, so refresh shows the same diff', () => {
  const s = freshSession({ sessionObserved: { c1: 10 } });
  const again = openSession(s, { c1: 12 }, new Date(NOW.getTime() + 5 * 60_000));
  assert.deepEqual(again.sessionSeen, { c1: 8 }, 'basis frozen');
  assert.deepEqual(again.sessionObserved, { c1: 10 }, 'commit target frozen');
});

test('a session older than the window reopens', () => {
  const s = freshSession({ sessionStartedAt: hoursAgo(2), sessionObserved: { c1: 10 } });
  const next = openSession(s, { c1: 12 }, NOW);
  assert.deepEqual(next.sessionObserved, { c1: 12 });
});

test('commit writes what was observed at session start, not what is live now', () => {
  const s = openSession(
    { seenSnapshot: { c1: 8 }, sessionSeen: null, sessionObserved: null, sessionStartedAt: null, lastSeenAt: null },
    { c1: 10 },
    NOW,
  );
  const committed = commitSession(s, NOW);
  assert.equal(committed.seenSnapshot?.c1, 10, 'anything arriving after start stays new');
});

test('concurrent commits take the higher version and cannot roll each other back', () => {
  const s: SessionState = {
    seenSnapshot: { c1: 12 },
    sessionSeen: { c1: 8 },
    sessionObserved: { c1: 10 },
    sessionStartedAt: NOW.toISOString(),
    lastSeenAt: null,
  };
  assert.equal(commitSession(s, NOW).seenSnapshot?.c1, 12);
});

test('sign-in merge takes the lower version', () => {
  assert.deepEqual(
    mergeSnapshotsOnSignIn({ a: 5, b: 2 }, { a: 3, c: 7 }),
    { a: 3, b: 2, c: 7 },
  );
});
