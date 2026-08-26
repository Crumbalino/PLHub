/**
 * Movement — shared types.
 * Pure. No database, no framework, no I/O. Ports to React Native unchanged.
 */

export type StoryEventType =
  | 'APPEARED'
  | 'CORROBORATION'
  | 'DEVELOPMENT'
  | 'CONFLICT'
  | 'OFFICIAL'
  | 'CORRECTION'
  | 'MERGE';

export type ClusterStatus = 'live' | 'official' | 'corrected' | 'merged';

export interface StoryEvent {
  clusterId: string;
  entitySlug: string;
  type: StoryEventType;
  field?: string | null;
  previousValue?: string | null;
  newValue?: string | null;
  sourceDomain?: string | null;
  sourceUrl?: string | null;
  summary: string;
  versionAtEvent: number;
  occurredAt: string; // ISO. Display and ordering only — never the diff.
}

export interface StoryCluster {
  id: string;
  entitySlug: string;
  headline: string | null;
  stateVersion: number;
  outletCount: number;
  status: ClusterStatus;
  mergedInto: string | null;
  firstEventAt: string | null;
  lastEventAt: string | null;
}

/**
 * Decision 14. Aggregation precedence, highest first.
 * The highest-precedence event supplies the reader-facing diff line.
 */
export const EVENT_PRECEDENCE: readonly StoryEventType[] = [
  'CORRECTION',
  'OFFICIAL',
  'DEVELOPMENT',
  'CONFLICT',
  'APPEARED',
  'CORROBORATION',
] as const;

/** MERGE is administrative and is absent from precedence by design (Decision 10). */
export function precedenceRank(type: StoryEventType): number {
  const i = EVENT_PRECEDENCE.indexOf(type);
  return i === -1 ? Number.MAX_SAFE_INTEGER : i;
}

export function isEditorial(type: StoryEventType): boolean {
  return type !== 'MERGE';
}

export function isTerminal(type: StoryEventType): boolean {
  return type === 'OFFICIAL' || type === 'CORRECTION';
}
