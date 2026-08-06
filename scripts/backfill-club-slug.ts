/**
 * One-off backfill of posts.club_slug using the two-signal club matcher.
 *
 * Scope: rows where club_slug IS NULL. Existing values are never overwritten —
 * the 498 rows that already carry a slug came from the subreddit a post was
 * fetched from, which is stronger evidence than anything a text matcher can
 * produce, and re-running the matcher over them could only null them.
 *
 * Dry run by default. Pass --apply to write.
 *
 *   npx tsx scripts/backfill-club-slug.ts
 *   npx tsx scripts/backfill-club-slug.ts --apply
 *
 * Needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the
 * environment (vercel env pull --environment=production).
 *
 * posts.club_slug is a FOREIGN KEY to clubs.slug, so every value written here
 * must exist in that table. The matcher only ever emits the 20 slugs in
 * src/config/clubs.ts, all of which do — including the four relegated clubs,
 * which keep their rows at in_scope = false.
 */

import { classifyClub } from '../src/lib/club-matcher'

const URL_BASE = process.env.NEXT_PUBLIC_SUPABASE_URL
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const APPLY = process.argv.includes('--apply')
const PAGE = 1000
const CHUNK = 200 // ids per PATCH; keeps the query string well inside limits

if (!URL_BASE || !KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const headers = {
  apikey: KEY,
  Authorization: `Bearer ${KEY}`,
  'Content-Type': 'application/json',
}

interface Row {
  id: string
  title: string | null
  content: string | null
  url: string | null
  source: string | null
}

async function fetchAll(): Promise<Row[]> {
  const rows: Row[] = []
  for (let offset = 0; ; offset += PAGE) {
    const q =
      `${URL_BASE}/rest/v1/posts?select=id,title,content,url,source` +
      `&club_slug=is.null&order=id&limit=${PAGE}&offset=${offset}`
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

async function patch(slug: string, ids: string[]): Promise<void> {
  for (let i = 0; i < ids.length; i += CHUNK) {
    const batch = ids.slice(i, i + CHUNK)
    const q = `${URL_BASE}/rest/v1/posts?id=in.(${batch.join(',')})`
    const res = await fetch(q, {
      method: 'PATCH',
      headers: { ...headers, Prefer: 'return=minimal' },
      body: JSON.stringify({ club_slug: slug }),
    })
    if (!res.ok) throw new Error(`patch ${slug} failed ${res.status}: ${await res.text()}`)
  }
}

async function main() {
  console.log(APPLY ? 'MODE: APPLY (writes)' : 'MODE: dry run (no writes)')
  const rows = await fetchAll()
  console.log(`candidates with club_slug IS NULL: ${rows.length}`)

  const bySlug = new Map<string, string[]>()
  let classified = 0
  const bySource = new Map<string, number>()

  for (const r of rows) {
    const slug = classifyClub(r.title, r.content, r.url)
    if (!slug) continue
    classified++
    bySource.set(r.source ?? 'null', (bySource.get(r.source ?? 'null') ?? 0) + 1)
    const list = bySlug.get(slug) ?? []
    list.push(r.id)
    bySlug.set(slug, list)
  }

  const pct = ((classified / Math.max(rows.length, 1)) * 100).toFixed(1)
  console.log(`classified (>=2 signals, no tie): ${classified}  (${pct}%)`)
  console.log(`left NULL:                        ${rows.length - classified}`)
  console.log(`by source: ${JSON.stringify(Object.fromEntries(bySource))}`)
  console.log('')
  for (const [slug, ids] of [...bySlug].sort((a, b) => b[1].length - a[1].length)) {
    console.log(`  ${slug.padEnd(20)} ${String(ids.length).padStart(6)}`)
  }
  console.log('')

  if (!APPLY) {
    console.log('Dry run — nothing written. Re-run with --apply.')
    return
  }

  let done = 0
  for (const [slug, ids] of bySlug) {
    await patch(slug, ids)
    done += ids.length
    process.stdout.write(`\r  written ${done}/${classified}`)
  }
  process.stdout.write('\n')
  console.log('Backfill complete. Verify with a fresh count before trusting it.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
