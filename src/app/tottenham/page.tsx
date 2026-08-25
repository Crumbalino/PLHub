/**
 * /tottenham — the Tottenham snapshot (PAGE_SPEC §1, route table).
 *
 * §1: *the page is a client of the API, not a database consumer.* This
 * component fetches `GET /api/v1/snapshot/tottenham` and renders it. It touches
 * no adapter, no Supabase and no source directly — which is the decision that
 * makes React Native a port rather than a rebuild.
 *
 * SCOPE. Seven blocks: the match (all four phases), availability, referee, key
 * data, table, form, the numbers. The centre column is out of scope entirely —
 * no big story, no developing, no confirmed, no worth your time, no fan pulse —
 * and so is the desktop three-column layout (§4). This is the §5 mobile stack
 * at every width, single column.
 *
 * Sign-off (§7.17) is also absent. It is a centre-column block whose line is
 * human and whose counts come from clustering, so there is nothing yet for it
 * to render.
 */

import type { Metadata } from 'next'
import React from 'react'
import { headers } from 'next/headers'
import { SITE_URL } from '@/lib/site'
import {
  Availability,
  Form,
  KeyData,
  LeagueTable,
  MatchBlock,
  NumbersBlock,
  RefereeBlock,
  relativeTime,
  type Snapshot,
} from './blocks'

/**
 * The API route is `force-dynamic` and the payload turns over on the hour, so
 * there is nothing to prerender. This also keeps `headers()` legal.
 */
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  // Every route sets its own canonical or it silently inherits '/' and declares
  // itself a duplicate of the homepage.
  alternates: { canonical: '/tottenham' },
  title: 'Tottenham Snapshot',
  description:
    'Where Tottenham are, what has changed, and what is happening around the ' +
    'next match. Updated through the day.',
}

/**
 * Fetch the snapshot from our own API.
 *
 * The origin comes from the incoming request rather than SITE_URL so that a
 * local dev server calls itself instead of production. SITE_URL is the fallback
 * for any context with no request headers.
 *
 * §15 error(page): never a 500. A failure here returns null and the page
 * renders the empty state.
 */
async function getSnapshot(): Promise<Snapshot | null> {
  try {
    const h = headers()
    const host = h.get('host')
    const proto = h.get('x-forwarded-proto') ?? (host?.startsWith('localhost') ? 'http' : 'https')
    const origin = host ? `${proto}://${host}` : SITE_URL

    const res = await fetch(`${origin}/api/v1/snapshot/tottenham`, {
      cache: 'no-store',
    })
    if (!res.ok) {
      console.error(`[tottenham] snapshot API returned ${res.status}`)
      return null
    }
    return (await res.json()) as Snapshot
  } catch (err) {
    console.error('[tottenham] snapshot fetch failed:', err)
    return null
  }
}

export default async function TottenhamSnapshotPage() {
  const snapshot = await getSnapshot()
  const now = Date.now()

  // §15 empty(page): never blank. Email capture is a centre-column concern and
  // is out of scope here, so this is the line and the date.
  if (!snapshot) {
    const today = new Date(now).toISOString()
    return (
      <article className="mx-auto max-w-xl px-4 py-10">
        <h1 className="text-2xl font-semibold">Tottenham Snapshot</h1>
        <p className="mt-4">Nothing worth logging today.</p>
        <p className="mt-1 text-sm opacity-70">
          <time dateTime={today}>
            {new Intl.DateTimeFormat('en-GB', {
              timeZone: 'Europe/London',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            }).format(new Date(now))}
          </time>
        </p>
      </article>
    )
  }

  const { entity, phase, updated_at } = snapshot
  const matchweek = phase === 'PRE' || phase === 'LIVE' || phase === 'POST'

  /**
   * §5 mobile stack. The blocks in scope, in the spec's order, with the
   * out-of-scope centre-column positions closed up.
   *
   *   Matchweek (PRE/LIVE/POST)      Off-week (BREAK)
   *   1  Match (phase-appropriate)   1  Match (reduced)
   *   2  Availability                2  Availability
   *   3  Referee (PRE only)          3  Table
   *   4  Key data                    4  Form
   *   5  Table                       5  The numbers
   *   6  Form
   *   7  The numbers
   *
   * Two things about the off-week order are the spec's, not mine. §5 drops Key
   * Data from the BREAK stack, and Referee is `PRE` only by §7.5. The Numbers is
   * not listed in either stack; §7.10 says never above the fold on mobile, so
   * it goes last in both.
   */
  const blocks = matchweek
    ? [
        <MatchBlock key="match" match={snapshot.match} entity={entity.name} />,
        <Availability key="availability" rows={snapshot.availability ?? []} />,
        phase === 'PRE' ? (
          <RefereeBlock key="referee" referee={snapshot.referee} />
        ) : null,
        <KeyData key="key-data" data={snapshot.key_data ?? []} />,
        <LeagueTable key="table" table={snapshot.table} />,
        <Form key="form" form={snapshot.form ?? []} />,
        <NumbersBlock key="numbers" numbers={snapshot.numbers} />,
      ]
    : [
        <MatchBlock key="match" match={snapshot.match} entity={entity.name} />,
        <Availability key="availability" rows={snapshot.availability ?? []} />,
        <LeagueTable key="table" table={snapshot.table} />,
        <Form key="form" form={snapshot.form ?? []} />,
        <NumbersBlock key="numbers" numbers={snapshot.numbers} />,
      ]

  return (
    <article className="mx-auto max-w-xl px-4 py-10">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          {entity.name} Snapshot
        </h1>
        {updated_at && (
          <p className="mt-1 text-sm opacity-70">
            updated{' '}
            <time dateTime={updated_at}>{relativeTime(updated_at, now)}</time>
          </p>
        )}
      </header>

      {/* Blocks never move. A block with no data returns null and its
          neighbours close the gap — no placeholder, no empty container. */}
      <div className="mt-8 space-y-6">{blocks}</div>
    </article>
  )
}
