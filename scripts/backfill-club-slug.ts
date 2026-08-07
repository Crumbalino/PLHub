/**
 * Reconcile posts.club_slug against the current two-signal club matcher.
 *
 * Not a one-way backfill. The matcher changes — dropping the manager signal
 * withdrew 487 classifications — and a row the code would no longer make must
 * be cleared, not left behind. A stale assignment is worse than no assignment:
 * it silently files a post on the wrong club page and nothing reports it.
 *
 * Scope: source = 'rss'. Reddit rows keep the slug derived from the subreddit
 * they were fetched from, which is stronger evidence than any text match and
 * is not this matcher's to overwrite.
 *
 * Dry run by default. --apply writes, but only after the drift guard passes.
 *
 *   npx tsx scripts/backfill-club-slug.ts
 *   npx tsx scripts/backfill-club-slug.ts --apply
 *
 * Needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 * (vercel env pull --environment=production).
 *
 * posts.club_slug is a FOREIGN KEY to clubs.slug. The matcher only emits the
 * 20 slugs in src/config/clubs.ts, all of which exist — including the four
 * relegated clubs, which keep their rows at in_scope = false.
 */

import { classifyClub } from '../src/lib/club-matcher'

const URL_BASE = process.env.NEXT_PUBLIC_SUPABASE_URL
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const APPLY = process.argv.includes('--apply')
const FORCE = process.argv.includes('--force')
const PAGE = 1000
const CHUNK = 200

/**
 * What the change is predicted to do, measured offline against a snapshot of
 * the corpus before running. The guard exists because the live table drifts —
 * the RSS cron writes every 15 minutes — and a reconcile that quietly nulls
 * ten times more than expected should stop and be looked at, not proceed.
 *
 * WHAT `moved` MEANS DEPENDS ON THE CHANGE, so it is not a fixed invariant.
 * Removing a signal can only lower a club's score, so it turns a win into a
 * tie (null) or leaves it alone, and `moved` is 0 by construction. ADDING a
 * club can make that club win outright, so `moved` is legitimately non-zero.
 * Either way the number is predicted offline first and asserted exactly — the
 * guard's job is to catch a run that does something other than what was
 * measured, not to encode one permanent truth.
 *
 * These figures are from the run that added Sunderland, Hull City, Leeds
 * United and Coventry City to the matcher. Re-measure before the next change.
 */
const EXPECT = { nulled: 170, moved: 10, gained: 48 }
const TOLERANCE = 0.15 // fractional, on nulled/gained
const MIN_ABS = 20 // absolute floor so small counts are not tripped by noise

if (!URL_BASE || !KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const headers = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' }

interface Row {
  id: string
  title: string | null
  content: string | null
  url: string | null
  club_slug: string | null
}

async function fetchAll(): Promise<Row[]> {
  const rows: Row[] = []
  for (let offset = 0; ; offset += PAGE) {
    const q =
      `${URL_BASE}/rest/v1/posts?select=id,title,content,url,club_slug` +
      `&source=eq.rss&order=id&limit=${PAGE}&offset=${offset}`
    const res = await fetch(q, { headers })
    if (!res.ok) throw new Error(`fetch failed ${res.status}: ${await res.text()}`)
    const page = (await res.json()) as Row[]
    if (page.length === 0) break
    rows.push(...page)
    process.stdout.write(`\r  fetched ${rows.length}`)
  }
  process.stdout.write('\n')
  return rows
}

async function write(slug: string | null, ids: string[]): Promise<void> {
  for (let i = 0; i < ids.length; i += CHUNK) {
    const batch = ids.slice(i, i + CHUNK)
    const res = await fetch(`${URL_BASE}/rest/v1/posts?id=in.(${batch.join(',')})`, {
      method: 'PATCH',
      headers: { ...headers, Prefer: 'return=minimal' },
      body: JSON.stringify({ club_slug: slug }),
    })
    if (!res.ok) throw new Error(`write ${slug} failed ${res.status}: ${await res.text()}`)
  }
}

function drifted(label: string, actual: number, expected: number): boolean {
  const allowed = Math.max(expected * TOLERANCE, MIN_ABS)
  const off = Math.abs(actual - expected)
  if (off <= allowed) return false
  console.error(
    `  DRIFT: ${label} = ${actual}, expected ~${expected} (tolerance ±${Math.round(allowed)})`,
  )
  return true
}

async function main() {
  console.log(APPLY ? 'MODE: APPLY (writes)' : 'MODE: dry run (no writes)')
  const rows = await fetchAll()

  const toNull: string[] = []
  const toSlug = new Map<string, string[]>()
  let unchanged = 0
  let moved = 0
  let gained = 0
  const before: Record<string, number> = {}
  const after: Record<string, number> = {}
  const movedExamples: string[] = []

  for (const r of rows) {
    const next = classifyClub(r.title, r.content, r.url)
    if (r.club_slug) before[r.club_slug] = (before[r.club_slug] ?? 0) + 1
    if (next) after[next] = (after[next] ?? 0) + 1

    if (next === r.club_slug) {
      unchanged++
      continue
    }
    if (r.club_slug && !next) {
      toNull.push(r.id)
    } else if (r.club_slug && next) {
      moved++
      if (movedExamples.length < 5) movedExamples.push(`${r.club_slug} -> ${next}: ${r.title}`)
      ;(toSlug.get(next) ?? toSlug.set(next, []).get(next)!).push(r.id)
    } else if (next) {
      gained++
      ;(toSlug.get(next) ?? toSlug.set(next, []).get(next)!).push(r.id)
    }
  }

  console.log(`\nrss rows scanned   ${rows.length}`)
  console.log(`  unchanged        ${unchanged}`)
  console.log(`  to be NULLED     ${toNull.length}   (expected ~${EXPECT.nulled})`)
  console.log(`  to CHANGE club   ${moved}   (expected ${EXPECT.moved})`)
  console.log(`  newly GAINED     ${gained}   (expected ~${EXPECT.gained})`)
  for (const m of movedExamples) console.log(`     moved: ${m}`)

  console.log(`\n${'club'.padEnd(20)} ${'before'.padStart(7)} ${'after'.padStart(7)} ${'delta'.padStart(7)}`)
  const slugs = [...new Set([...Object.keys(before), ...Object.keys(after)])].sort(
    (a, b) => (after[b] ?? 0) - (after[a] ?? 0),
  )
  for (const s of slugs) {
    const b = before[s] ?? 0
    const a = after[s] ?? 0
    console.log(`${s.padEnd(20)} ${String(b).padStart(7)} ${String(a).padStart(7)} ${String(a - b).padStart(7)}`)
  }
  const totB = Object.values(before).reduce((x, y) => x + y, 0)
  const totA = Object.values(after).reduce((x, y) => x + y, 0)
  console.log(`${'TOTAL'.padEnd(20)} ${String(totB).padStart(7)} ${String(totA).padStart(7)} ${String(totA - totB).padStart(7)}`)

  const bad =
    [
      drifted('nulled', toNull.length, EXPECT.nulled),
      drifted('gained', gained, EXPECT.gained),
    ].some(Boolean) || moved !== EXPECT.moved

  if (moved !== EXPECT.moved) {
    console.error(`  DRIFT: moved = ${moved}, expected exactly ${EXPECT.moved}`)
  }

  if (bad) {
    console.error(
      '\nSTOPPING. The live numbers differ materially from the offline estimate.\n' +
        'Report this rather than applying — either the corpus moved or an assumption broke.\n' +
        'Re-run with --force only after deciding the difference is understood.',
    )
    if (!FORCE) process.exit(2)
    console.error('--force given, proceeding anyway.\n')
  }

  if (!APPLY) {
    console.log('\nDry run — nothing written. Re-run with --apply.')
    return
  }

  if (toNull.length) await write(null, toNull)
  for (const [slug, ids] of toSlug) await write(slug, ids)
  console.log(`\nWrote ${toNull.length} nulls and ${gained + moved} assignments.`)
  console.log('Verify with a fresh count before trusting it.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
