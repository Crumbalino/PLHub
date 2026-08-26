/**
 * The catch-up window.
 *
 * PERSONAL layer. It decides what is NEW to a reader and nothing else.
 * It never scores, ranks or reorders — see Decision 1 and 9. The output
 * is a set of cluster ids plus a line of copy; ordering is supplied by
 * score.ts, which cannot see any of this.
 */

import type { StoryCluster, StoryEvent, StoryEventType } from './types';
import { isEditorial, precedenceRank } from './types';

/** `{ clusterId: versionSeen }` */
export type Snapshot = Record<string, number>;

export interface SessionState {
  seenSnapshot: Snapshot | null; // null = never visited
  sessionSeen: Snapshot | null; // frozen diff basis
  sessionObserved: Snapshot | null; // commit target
  sessionStartedAt: string | null;
  lastSeenAt: string | null;
}

export const SESSION_WINDOW_MINUTES = 30;
export const REORIENT_CLUSTER_COUNT = 30; // Decision 19 — volume, never elapsed time

export type CatchUpMode = 'FIRST_VISIT' | 'CAUGHT_UP' | 'DELTA' | 'REORIENT';

export interface ChangedCluster {
  clusterId: string;
  seenVersion: number | null; // null = new to this reader
  currentVersion: number;
  leadType: StoryEventType;
  summary: string;
  corroborationCount: number;
}

export interface CatchUp {
  mode: CatchUpMode;
  changed: ChangedCluster[];
  count: number;
}

/* ------------------------------------------------------------------ */
/* Lineage                                                             */
/* ------------------------------------------------------------------ */

/**
 * Decision 11 and 12. A reader's snapshot may name a cluster since absorbed.
 * Walk the lineage and take the LOWER of any candidate seen versions, so we
 * bias toward showing a change twice rather than silently hiding one.
 *
 * Returns null when the reader has seen no ancestor of this cluster.
 */
export function resolveSeenVersion(
  cluster: StoryCluster,
  snapshot: Snapshot,
  ancestorsOf: (clusterId: string) => string[],
): number | null {
  const ids = [cluster.id, ...ancestorsOf(cluster.id)];
  const seen = ids.map((id) => snapshot[id]).filter((v): v is number => typeof v === 'number');
  if (seen.length === 0) return null;
  return Math.min(...seen);
}

/* ------------------------------------------------------------------ */
/* Aggregation                                                         */
/* ------------------------------------------------------------------ */

/**
 * Decision 15. One cluster is one thing that moved, however many events.
 * The highest-precedence event supplies the line; corroborations collapse
 * into a count.
 */
export function aggregate(events: readonly StoryEvent[]): {
  leadType: StoryEventType;
  summary: string;
  corroborationCount: number;
} | null {
  const editorial = events.filter((e) => isEditorial(e.type));
  if (editorial.length === 0) return null;

  const lead = [...editorial].sort((a, b) => {
    const p = precedenceRank(a.type) - precedenceRank(b.type);
    return p !== 0 ? p : b.versionAtEvent - a.versionAtEvent;
  })[0];

  return {
    leadType: lead.type,
    summary: lead.summary,
    corroborationCount: editorial.filter((e) => e.type === 'CORROBORATION').length,
  };
}

/* ------------------------------------------------------------------ */
/* The diff                                                            */
/* ------------------------------------------------------------------ */

/**
 * Decision 13. Absence from a snapshot means "new to this reader" ONLY if
 * the cluster's first event post-dates lastSeenAt. Otherwise the entry was
 * pruned and the reader has in fact seen it — pruning must never
 * manufacture novelty.
 */
function absenceIsGenuinelyNew(cluster: StoryCluster, lastSeenAt: string | null): boolean {
  if (lastSeenAt === null) return true; // no history at all
  if (!cluster.firstEventAt) return true;
  return Date.parse(cluster.firstEventAt) > Date.parse(lastSeenAt);
}

export function computeCatchUp(
  clusters: readonly {
    cluster: StoryCluster;
    eventsSinceSeen: (seenVersion: number | null) => readonly StoryEvent[];
  }[],
  session: SessionState,
  ancestorsOf: (clusterId: string) => string[] = () => [],
): CatchUp {
  if (session.seenSnapshot === null) {
    return { mode: 'FIRST_VISIT', changed: [], count: 0 };
  }

  const basis = session.sessionSeen ?? session.seenSnapshot;
  const changed: ChangedCluster[] = [];

  for (const { cluster, eventsSinceSeen } of clusters) {
    if (cluster.status === 'merged') continue; // absorbed clusters never count

    const seenVersion = resolveSeenVersion(cluster, basis, ancestorsOf);

    if (seenVersion === null) {
      if (!absenceIsGenuinelyNew(cluster, session.lastSeenAt)) continue;
    } else if (cluster.stateVersion <= seenVersion) {
      continue;
    }

    const agg = aggregate(eventsSinceSeen(seenVersion));
    if (!agg) continue;

    changed.push({
      clusterId: cluster.id,
      seenVersion,
      currentVersion: cluster.stateVersion,
      ...agg,
    });
  }

  if (changed.length === 0) return { mode: 'CAUGHT_UP', changed, count: 0 };
  if (changed.length > REORIENT_CLUSTER_COUNT) {
    return { mode: 'REORIENT', changed, count: changed.length };
  }
  return { mode: 'DELTA', changed, count: changed.length };
}

/* ------------------------------------------------------------------ */
/* Session                                                             */
/* ------------------------------------------------------------------ */

export function isSessionOpen(session: SessionState, now: Date): boolean {
  if (!session.sessionStartedAt) return false;
  const age = now.getTime() - Date.parse(session.sessionStartedAt);
  return age <= SESSION_WINDOW_MINUTES * 60_000;
}

/**
 * Decision 7. Opening a session freezes the diff basis and captures the
 * commit target. An already-open session is returned untouched, which is
 * what makes refresh and cross-device arrival show the same thing.
 */
export function openSession(
  session: SessionState,
  liveVersions: Snapshot,
  now: Date,
): SessionState {
  if (isSessionOpen(session, now)) return session;
  return {
    ...session,
    sessionSeen: session.seenSnapshot,
    sessionObserved: { ...liveVersions },
    sessionStartedAt: now.toISOString(),
  };
}

/**
 * Commit on a qualifying visit. Writes sessionObserved — the world as it
 * was at session start — so anything that arrived while the reader was on
 * the page is still new next time.
 *
 * Decision 12: merging with existing seen state takes the HIGHER version
 * per cluster here, because both values are things this reader has
 * genuinely seen; concurrent devices must not roll each other back.
 */
export function commitSession(session: SessionState, now: Date): SessionState {
  if (!session.sessionObserved) return session;
  const merged: Snapshot = { ...(session.seenSnapshot ?? {}) };
  for (const [id, v] of Object.entries(session.sessionObserved)) {
    merged[id] = Math.max(merged[id] ?? 0, v);
  }
  return {
    ...session,
    seenSnapshot: merged,
    lastSeenAt: now.toISOString(),
    sessionSeen: null,
    sessionObserved: null,
    sessionStartedAt: null,
  };
}

/**
 * Decision 12, sign-in. Local and account state merge taking the LOWER
 * version, because a version present in only one of them may not have been
 * seen in the other context.
 */
export function mergeSnapshotsOnSignIn(local: Snapshot, account: Snapshot): Snapshot {
  const out: Snapshot = {};
  for (const id of new Set([...Object.keys(local), ...Object.keys(account)])) {
    const a = local[id];
    const b = account[id];
    out[id] = a === undefined ? b : b === undefined ? a : Math.min(a, b);
  }
  return out;
}
