/**
 * Movement scoring and depth.
 *
 * This is the GLOBAL editorial layer (Decision 1). It knows nothing about
 * any reader. Personal state must never reach this file.
 */

import type { StoryCluster, StoryEvent, StoryEventType } from './types';
import { isEditorial, isTerminal } from './types';

export const WEIGHTS: Record<StoryEventType, number> = {
  DEVELOPMENT: 3,
  CONFLICT: 2,
  APPEARED: 1,
  CORROBORATION: 1,
  OFFICIAL: 0, // terminal — leaves the stream, so scoring is moot
  CORRECTION: 0,
  MERGE: 0, // administrative
};

/**
 * The rule that stops herding beating information.
 * Corroboration stops counting once a cluster has this many outlets.
 * Beyond it, only DEVELOPMENT and CONFLICT can move a story.
 */
export const CORROBORATION_CEILING = 5;

export const WINDOW_HOURS = 24;
export const FULL_DEPTH_THRESHOLD = 3;
export const STALE_HOURS = 48;
export const THIN_DAYS = 7;

export type Depth = 'full' | 'thin' | 'dropped' | 'terminal';

/**
 * Score a cluster's movement over the trailing window.
 * `outletCountBefore` is the cluster's outlet count as it was at the start
 * of the window, so the ceiling is applied to the right baseline.
 */
export function movementScore(
  events: readonly StoryEvent[],
  now: Date,
  outletCountBefore = 0,
  windowHours: number = WINDOW_HOURS,
): number {
  const cutoff = now.getTime() - windowHours * 3600_000;
  let score = 0;
  let outlets = outletCountBefore;

  const inWindow = events
    .filter((e) => isEditorial(e.type))
    .filter((e) => new Date(e.occurredAt).getTime() > cutoff)
    .sort((a, b) => a.versionAtEvent - b.versionAtEvent);

  for (const e of inWindow) {
    if (e.type === 'CORROBORATION') {
      outlets += 1;
      if (outlets > CORROBORATION_CEILING) continue; // ceiling reached
    }
    score += WEIGHTS[e.type];
  }
  return score;
}

/** Hours since the cluster's most recent editorial event. */
export function hoursSinceLastEvent(cluster: StoryCluster, now: Date): number {
  if (!cluster.lastEventAt) return Number.POSITIVE_INFINITY;
  return (now.getTime() - new Date(cluster.lastEventAt).getTime()) / 3600_000;
}

/**
 * How much of a story the reader sees.
 * Terminal clusters leave the stream entirely — official items live in
 * Confirmed, which is why nothing can appear in both places.
 */
export function depthFor(
  cluster: StoryCluster,
  events: readonly StoryEvent[],
  now: Date,
  outletCountBefore = 0,
): Depth {
  if (cluster.status === 'merged') return 'dropped';
  if (cluster.status === 'official' || cluster.status === 'corrected') return 'terminal';

  const score = movementScore(events, now, outletCountBefore);
  if (score >= FULL_DEPTH_THRESHOLD) return 'full';

  const idle = hoursSinceLastEvent(cluster, now);
  if (idle > STALE_HOURS) return 'dropped';
  if (score > 0 || idle <= THIN_DAYS * 24) return 'thin';
  return 'dropped';
}

export interface RankedCluster {
  cluster: StoryCluster;
  score: number;
  depth: Depth;
}

/**
 * Global ordering: movement descending, then most recent event descending.
 * Decision 1 — no reader state is an input here and none ever may be.
 */
export function rankClusters(
  input: readonly {
    cluster: StoryCluster;
    events: readonly StoryEvent[];
    outletCountBefore?: number;
  }[],
  now: Date,
): RankedCluster[] {
  return input
    .map(({ cluster, events, outletCountBefore = 0 }) => ({
      cluster,
      score: movementScore(events, now, outletCountBefore),
      depth: depthFor(cluster, events, now, outletCountBefore),
    }))
    .filter((r) => r.depth !== 'dropped')
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const at = a.cluster.lastEventAt ? Date.parse(a.cluster.lastEventAt) : 0;
      const bt = b.cluster.lastEventAt ? Date.parse(b.cluster.lastEventAt) : 0;
      return bt - at;
    });
}

export { isTerminal };
