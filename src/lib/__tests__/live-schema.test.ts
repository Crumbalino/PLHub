/**
 * The live schema, checked against the code.
 *
 * WHAT THIS CATCHES THAT NOTHING ELSE DOES. `provenance.test.ts` asserts that
 * `migrations/2026-08-26-referee-provenance.sql` seeds exactly the keys
 * declared in `provenance.ts`. Both of those are files in this repository, so
 * that test passes even when the database agrees with neither.
 *
 * The database is edited by hand. Someone adds a metric in the Supabase SQL
 * editor, or renames one, or corrects a formula there and not here, and every
 * test in the repo still passes while a number renders with a definition that
 * no longer describes it. This is the only check that reads the live table.
 *
 * SKIPPED WITHOUT CREDENTIALS, and that is the normal case: `npm test` loads no
 * environment, so an ordinary run reports the skip and passes. Give it
 * NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY and it checks for
 * real. This mirrors the football-data adapter, which returns null rather than
 * throwing when its key is absent — a missing credential is a configuration
 * state, not a failure.
 *
 *   export $(grep -E '^(NEXT_PUBLIC_SUPABASE_URL|SUPABASE_SERVICE_ROLE_KEY|NEXT_PUBLIC_SUPABASE_ANON_KEY)=' .env.local | xargs)
 *   npx tsx --test src/lib/__tests__/live-schema.test.ts
 *
 * READ-ONLY, DELIBERATELY. An earlier version of this check also inserted a row
 * with a bad foreign key and a bad `kmi_verdict` to prove the constraints bite.
 * Those inserts are correct only while the constraints exist: the moment one is
 * dropped — the exact regression worth catching — the test writes junk into
 * production instead of reporting it. Nothing here writes.
 */

import { test, describe, before } from 'node:test'
import assert from 'node:assert/strict'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { METRIC_DEFINITIONS, definedMetricKeys } from '@/lib/provenance'

const LIVE_TIMEOUT = 30_000

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()

/** Whether this run can reach the database at all. */
const configured = Boolean(SUPABASE_URL && SERVICE_KEY)

/**
 * The columns each table is declared with, by name.
 *
 * Selected explicitly rather than with `*`, so a column that was renamed or
 * never created fails here instead of turning into an undefined at runtime.
 */
const DECLARED_COLUMNS: Record<string, string[]> = {
  metric_definitions: [
    'metric_key',
    'source_name',
    'source_url',
    'formula',
    'coverage_period',
    'calculated',
    'last_refreshed',
    'created_at',
  ],
  match_officials: [
    'id',
    'name',
    'first_name',
    'last_name',
    'fa_association',
    'pl_debut',
    'active',
    'created_at',
    'updated_at',
  ],
  match_official_appointments: ['id', 'match_id', 'official_id', 'role', 'created_at'],
  kmi_incidents: [
    'id',
    'match_id',
    'matchweek',
    'date',
    'minute',
    'period',
    'incident_type',
    'club_involved',
    'player_involved',
    'referee_id',
    'var_id',
    'original_decision',
    'var_intervention',
    'final_decision',
    'kmi_verdict',
    'kmi_reason',
    'source_url',
    'source_published_at',
    'created_at',
  ],
}

const TABLES = Object.keys(DECLARED_COLUMNS)

interface MetricRow {
  metric_key: string
  source_name: string | null
  source_url: string | null
  formula: string | null
  coverage_period: string | null
  calculated: boolean | null
}

let service: SupabaseClient | null = null
let metrics: MetricRow[] = []

/**
 * Prove a table exists with a real read.
 *
 * A HEAD count can return no error and a null count for a table that does not
 * exist, which reads as success. Absence has to be proven by reading a row.
 */
async function tableExists(client: SupabaseClient, table: string) {
  const { data, count, error } = await client.from(table).select('*', { count: 'exact' }).limit(1)
  return { ok: !error && count !== null && data !== null, count, error }
}

describe('live schema', { concurrency: false }, () => {
  before(async () => {
    if (!configured) {
      console.log(
        '[live-schema] no Supabase credentials — skipping. Export ' +
          'NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to run it.'
      )
      return
    }
    service = createClient(SUPABASE_URL as string, SERVICE_KEY as string, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
    const { data } = await service
      .from('metric_definitions')
      .select('metric_key, source_name, source_url, formula, coverage_period, calculated')
    metrics = (data ?? []) as MetricRow[]
    console.log(
      `[live-schema] ${new URL(SUPABASE_URL as string).host} — ${metrics.length} metric definitions`
    )
  }, { timeout: LIVE_TIMEOUT })

  /** The skip is a state, not a failure. This asserts it stays deliberate. */
  test('without credentials the suite skips rather than failing', () => {
    if (configured) return
    assert.equal(service, null)
    assert.deepEqual(metrics, [])
  })

  test('every table the migration declares exists', { timeout: LIVE_TIMEOUT }, async () => {
    if (!configured || !service) return
    for (const table of TABLES) {
      const { ok, error } = await tableExists(service, table)
      assert.ok(
        ok,
        `${table} is not readable — ${error?.code ?? 'null count'}. ` +
          'If the migration was just applied, PostgREST may still be holding a ' +
          "stale schema cache; NOTIFY pgrst, 'reload schema' clears it."
      )
    }
  })

  test('every declared column exists, by name', { timeout: LIVE_TIMEOUT }, async () => {
    if (!configured || !service) return
    for (const [table, columns] of Object.entries(DECLARED_COLUMNS)) {
      const { error } = await service.from(table).select(columns.join(',')).limit(1)
      assert.ok(!error, `${table}: ${error?.message ?? ''}`)
    }
  })

  /**
   * The one this file exists for. Drift in either direction is a failure: a key
   * in the database that the code cannot explain, or a key in the code the
   * database has no record of.
   */
  test('metric_definitions matches provenance.ts exactly', { timeout: LIVE_TIMEOUT }, () => {
    if (!configured) return
    const live = metrics.map((r) => r.metric_key).sort()
    const code = definedMetricKeys()

    const missingFromDatabase = code.filter((k) => !live.includes(k))
    const missingFromCode = live.filter((k) => !code.includes(k))

    assert.deepEqual(
      missingFromDatabase,
      [],
      `declared in provenance.ts but absent from metric_definitions: ${missingFromDatabase.join(', ')}`
    )
    assert.deepEqual(
      missingFromCode,
      [],
      `in metric_definitions but not declared in provenance.ts: ${missingFromCode.join(', ')}`
    )
    assert.deepEqual(live, code)
  })

  /**
   * Keys matching is not enough. A coverage period corrected in the code and
   * not in the database leaves every key present and every published figure
   * claiming a span the durable record contradicts — which is exactly what
   * happened when the backfill widened the data from 2014/15 to 2000/01.
   */
  test('every live coverage period matches the code', { timeout: LIVE_TIMEOUT }, () => {
    if (!configured) return
    const byKey = new Map(metrics.map((r) => [r.metric_key, r]))
    const drift: string[] = []
    for (const d of METRIC_DEFINITIONS) {
      const live = byKey.get(d.metric_key)
      if (!live) continue
      if (live.coverage_period !== d.coverage_period) {
        drift.push(`${d.metric_key}: database "${live.coverage_period}" vs code "${d.coverage_period}"`)
      }
    }
    assert.deepEqual(drift, [], `coverage period drift:\n  ${drift.join('\n  ')}`)
  })

  test('every live source and formula matches the code', { timeout: LIVE_TIMEOUT }, () => {
    if (!configured) return
    const byKey = new Map(metrics.map((r) => [r.metric_key, r]))
    for (const d of METRIC_DEFINITIONS) {
      const live = byKey.get(d.metric_key)
      if (!live) continue
      assert.equal(live.source_name, d.source_name, d.metric_key)
      assert.equal(live.formula, d.formula, d.metric_key)
    }
  })

  test('no live definition has a blank source, formula or period', { timeout: LIVE_TIMEOUT }, () => {
    if (!configured) return
    for (const row of metrics) {
      for (const field of ['source_name', 'source_url', 'formula', 'coverage_period'] as const) {
        assert.ok(
          row[field] && String(row[field]).trim().length > 0,
          `${row.metric_key}.${field} is blank in the database`
        )
      }
      assert.match(String(row.source_url), /^https:\/\//, row.metric_key)
      assert.equal(typeof row.calculated, 'boolean', row.metric_key)
    }
  })

  test('every live coverage period names a season', { timeout: LIVE_TIMEOUT }, () => {
    if (!configured) return
    for (const row of metrics) {
      assert.match(
        String(row.coverage_period),
        /\d{4}\/\d{2}/,
        `${row.metric_key} coverage period does not name a season`
      )
    }
  })

  /**
   * These tables are server-read only and carry claims about named officials.
   * RLS is on with no policies, so the anon key must see nothing. Checked
   * because it is a property of the live database, not of the migration file —
   * a policy added by hand would open them and no other test would notice.
   */
  test('anonymous access is denied on every table', { timeout: LIVE_TIMEOUT }, async () => {
    if (!configured || !ANON_KEY) {
      if (configured) console.log('[live-schema] no anon key — RLS check skipped')
      return
    }
    const anon = createClient(SUPABASE_URL as string, ANON_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
    for (const table of TABLES) {
      const { data, error } = await anon.from(table).select('*').limit(1)
      assert.ok(
        error || (data?.length ?? 0) === 0,
        `${table} is readable with the anon key — RLS is not denying public access`
      )
    }
  })
})
