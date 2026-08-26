/**
 * The provenance contract.
 *
 * Every number that reaches a block resolves to a record here saying where it
 * came from, how it was worked out, and what period it covers. A metric with no
 * definition does not render — `attach()` returns null and the value never
 * leaves the adapter.
 *
 * WHY THIS IS THE FIRST FILE. A referee statistic is a claim about a named
 * person's professional conduct. "4.8 cards per game" with no stated source, no
 * formula and no period is not a fact, it is an assertion — and the one the
 * subject would dispute first. The product is credibility (THE_FOOTBALL_HUB §8:
 * a site that filters out the shit cannot itself make things up), so the
 * accounting comes before the arithmetic, not after it.
 *
 * ONE ROW PER DEFINITION, NOT PER VALUE. Every official's cards-per-game
 * inherits the single `referee.cards_per_game.season` definition. Thirty-nine
 * officials do not produce thirty-nine provenance rows; they produce one.
 *
 * The same rows are seeded into `metric_definitions` by
 * migrations/2026-08-26-referee-provenance.sql. This file is the compile-time
 * copy so the runtime check needs no database round trip and cannot be defeated
 * by an unapplied migration; the table is the durable, queryable record.
 */

/** The season the site is currently reporting on. */
export const CURRENT_SEASON = '2026/27'

/**
 * First season a referee figure can cover.
 *
 * NOT the first season of the archive, and the difference is the correction.
 * football-data.co.uk publishes E0 back to 1993/94, and the backfill reads all
 * 34 files — but the seven oldest carry only Div, Date, HomeTeam, AwayTeam,
 * FTHG, FTAG and FTR. No Referee column, no card columns. Measured, not
 * assumed: the Referee column first appears in 2000/01.
 *
 * So MATCH coverage reaches 1993/94 and REFEREE coverage starts 2000/01. Those
 * are different claims and conflating them would have a career figure implying
 * seven seasons it cannot see. Every definition below is a referee metric, so
 * every one of them starts here.
 *
 * This was '2014/15' — the window the first implementation actually loaded. The
 * backfill widened the data and left this behind, which is the kind of stale
 * default that turns a provenance record into decoration.
 */
export const CAREER_FROM_SEASON = '2000/01'


const CAREER_COVERAGE = `Premier League, ${CAREER_FROM_SEASON} to ${CURRENT_SEASON}`
const SEASON_COVERAGE = `Premier League, ${CURRENT_SEASON}`

const FOOTBALL_DATA_CO_UK = {
  source_name: 'football-data.co.uk',
  source_url: 'https://www.football-data.co.uk/englandm.php',
} as const

export interface MetricDefinition {
  /** Stable identifier. The key a value is tagged with at the point it is computed. */
  metric_key: string
  source_name: string
  source_url: string
  /** How the number is produced, in terms a reader could reproduce. */
  formula: string
  coverage_period: string
  /** False for a figure read straight from the source, true for one we derive. */
  calculated: boolean
  /** When the underlying data was last pulled. Null on the static definition. */
  last_refreshed: string | null
}

/**
 * Every metric this build is allowed to publish.
 *
 * Adding a number to a block means adding a row here first. That is the whole
 * mechanism: there is no path from an adapter to a block that does not pass
 * through this list.
 */
export const METRIC_DEFINITIONS: readonly MetricDefinition[] = [
  {
    metric_key: 'referee.matches.season',
    ...FOOTBALL_DATA_CO_UK,
    formula: 'Count of rows in the E0 results file where Referee matches the official.',
    coverage_period: SEASON_COVERAGE,
    calculated: true,
    last_refreshed: null,
  },
  {
    metric_key: 'referee.matches.career',
    ...FOOTBALL_DATA_CO_UK,
    formula: 'Count of rows across all loaded E0 seasons where Referee matches the official.',
    coverage_period: CAREER_COVERAGE,
    calculated: true,
    last_refreshed: null,
  },
  {
    metric_key: 'referee.yellow_cards.season',
    ...FOOTBALL_DATA_CO_UK,
    formula: 'Sum of HY + AY over the official’s matches.',
    coverage_period: SEASON_COVERAGE,
    calculated: true,
    last_refreshed: null,
  },
  {
    metric_key: 'referee.yellow_cards.career',
    ...FOOTBALL_DATA_CO_UK,
    formula: 'Sum of HY + AY over the official’s matches, all loaded seasons.',
    coverage_period: CAREER_COVERAGE,
    calculated: true,
    last_refreshed: null,
  },
  {
    metric_key: 'referee.red_cards.season',
    ...FOOTBALL_DATA_CO_UK,
    formula: 'Sum of HR + AR over the official’s matches.',
    coverage_period: SEASON_COVERAGE,
    calculated: true,
    last_refreshed: null,
  },
  {
    metric_key: 'referee.red_cards.career',
    ...FOOTBALL_DATA_CO_UK,
    formula: 'Sum of HR + AR over the official’s matches, all loaded seasons.',
    coverage_period: CAREER_COVERAGE,
    calculated: true,
    last_refreshed: null,
  },
  {
    metric_key: 'referee.cards_per_game.season',
    ...FOOTBALL_DATA_CO_UK,
    formula:
      'Sum of HY + AY + HR + AR divided by matches refereed. A second yellow is ' +
      'counted by the source as both a yellow and a red, and is not deduplicated here.',
    coverage_period: SEASON_COVERAGE,
    calculated: true,
    last_refreshed: null,
  },
  {
    metric_key: 'referee.cards_per_game.career',
    ...FOOTBALL_DATA_CO_UK,
    formula:
      'Sum of HY + AY + HR + AR divided by matches refereed, all loaded seasons. ' +
      'A second yellow is counted by the source as both a yellow and a red, and is ' +
      'not deduplicated here.',
    coverage_period: CAREER_COVERAGE,
    calculated: true,
    last_refreshed: null,
  },
  {
    metric_key: 'referee.club_record.career',
    ...FOOTBALL_DATA_CO_UK,
    formula:
      'Wins, draws and losses for one club in matches refereed by the official, ' +
      'from the FTR column, read from the club’s side.',
    coverage_period: CAREER_COVERAGE,
    calculated: true,
    last_refreshed: null,
  },
]

const BY_KEY: ReadonlyMap<string, MetricDefinition> = new Map(
  METRIC_DEFINITIONS.map((d) => [d.metric_key, d])
)

/** The definition for a key, or null if the metric is not one we may publish. */
export function metricDefinition(key: string): MetricDefinition | null {
  return BY_KEY.get(key) ?? null
}

/** A value and the record that licenses it. */
export interface Provenanced<T> {
  value: T
  provenance: MetricDefinition
}

/**
 * Tag a value with its provenance.
 *
 * Returns null when the key has no definition, or when the value is null or
 * undefined — in both cases nothing reaches the block, which is §15's
 * non-render rather than a placeholder.
 *
 * `lastRefreshed` is when this particular read was taken. The static definition
 * carries null; freshness is a property of the read, not of the definition.
 */
export function attach<T>(
  key: string,
  value: T | null | undefined,
  lastRefreshed?: string | null
): Provenanced<T> | null {
  const definition = metricDefinition(key)
  if (!definition) {
    console.error(`[provenance] refusing to publish "${key}" — no metric definition`)
    return null
  }
  if (value === null || value === undefined) return null
  return {
    value,
    provenance: { ...definition, last_refreshed: lastRefreshed ?? null },
  }
}

/** Every key currently defined. Used by the contract test. */
export function definedMetricKeys(): string[] {
  return METRIC_DEFINITIONS.map((d) => d.metric_key).sort()
}
