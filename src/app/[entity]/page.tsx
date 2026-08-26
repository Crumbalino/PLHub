/**
 * /{entity} — one page component, twenty-one URLs (PAGE_SPEC §1).
 *
 * §1: *the page is a client of the API, not a database consumer.* This
 * component fetches `GET /api/v1/snapshot/{entity}` and renders it. It touches
 * no adapter, no Supabase and no source directly — which is the decision that
 * makes React Native a port rather than a rebuild.
 *
 * Templating twenty clubs onto it was a routing change and two one-line fixes,
 * because the blocks consume the §14 payload rather than knowing whose page
 * they are on. The two that did know are recorded in the PR.
 *
 * CLUBS LIVE AT THE ROOT, so this dynamic segment sits alongside every
 * top-level route the site has. Next.js resolves a static segment before a
 * dynamic one, so /about wins over /[entity] — but a club slug that matched a
 * real route would still be unreachable. `src/lib/entities.ts` reserves those
 * names and a test asserts no club takes one.
 *
 * SCOPE. Six blocks: the match (all four phases), availability, referee, key
 * data, table, form. The centre column is out of scope entirely — no big story,
 * no developing, no confirmed, no worth your time, no fan pulse — and so is the
 * desktop three-column layout (§4). This is the §5 mobile stack at every width,
 * single column.
 *
 * The Numbers (§7.10) was here and is not any more; the note in blocks.tsx says
 * why. Its key is still in the payload.
 *
 * Sign-off (§7.17) is also absent. It is a centre-column block whose line is
 * human and whose counts come from clustering, so there is nothing yet for it
 * to render.
 */

import type { Metadata } from 'next'
import React from 'react'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { SITE_URL } from '@/lib/site'
import { CLUBS_BY_SLUG } from '@/lib/clubs'
import { entitySlugs, isEntity, isHomepageEntity } from '@/lib/entities'
import { tokens as t } from '@/lib/tokens'
import {
  Availability,
  Form,
  KeyData,
  LeagueTable,
  MatchBlock,
  RefereeBlock,
  relativeTime,
  type Snapshot,
} from './blocks'

/**
 * The payload turns over on the hour, so nothing here is prerendered. The page
 * reads `headers()`, which opts it into dynamic rendering on its own — no
 * `force-dynamic` needed, and leaving it off is what allows `dynamicParams`
 * below to do its job.
 */
export const revalidate = 0

/**
 * The twenty-one entities, declared to the router.
 *
 * WITH `dynamicParams = false` THIS IS THE 404. A slug outside the list is
 * rejected by the router before any rendering starts, which is the only place
 * a real 404 status can still be set.
 *
 * It cannot be done inside the component or in `generateMetadata`, because
 * `loading.tsx` makes this route stream: Next flushes the status line and the
 * skeleton first, then resolves the page. A `notFound()` after that renders the
 * 404 *UI* beneath a `200` that has already been sent — a soft 404, measured on
 * a production build, not assumed. With a dynamic segment at the root of an
 * indexable site that would have made /leicester, /not-a-club and every
 * reserved slug answer 200 and be indexable.
 */
export function generateStaticParams() {
  return entitySlugs().map((entity) => ({ entity }))
}

export const dynamicParams = false

/**
 * Per-entity metadata.
 *
 * Every route sets its own canonical or it silently inherits '/' and declares
 * itself a duplicate of the homepage — twenty-one pages sharing one canonical
 * is twenty wasted URLs.
 *
 * No public string says "Snapshot". It is internal wording (§1), and it does
 * not belong in a title, a description or a tab.
 */
export async function generateMetadata({
  params,
}: {
  params: { entity: string }
}): Promise<Metadata> {
  const entity = (params.entity ?? '').toLowerCase()

  /**
   * The 404 is decided HERE, not in the component, and that is load-bearing.
   *
   * `loading.tsx` makes this route stream: Next flushes the status line and the
   * skeleton immediately, then resolves the page. A `notFound()` in the
   * component therefore renders the 404 *UI* underneath a `200` that has
   * already gone out — a soft 404. With a dynamic segment at the root of an
   * indexable site, that means /leicester, /not-a-club and every reserved slug
   * would answer 200 and be indexable.
   *
   * `generateMetadata` is awaited before the first flush, because the head has
   * to exist before the body can be sent. Calling notFound() from here produces
   * a real 404 status.
   */
  if (!isEntity(entity)) notFound()

  const club = CLUBS_BY_SLUG[entity]
  const name = isHomepageEntity(entity) ? 'The Football Hub' : (club?.name ?? entity)

  return {
    alternates: { canonical: `/${entity}` },
    // The root layout templates titles as "%s | The Football Hub", which for
    // the league entity would read "The Football Hub | The Football Hub".
    title: isHomepageEntity(entity) ? { absolute: name } : name,
    description: isHomepageEntity(entity)
      ? 'Where every Premier League club stands, what has changed, and what is ' +
        'happening around the next round of matches. Updated through the day.'
      : `Where ${name} are, what has changed, and what is happening around the ` +
        'next match. Updated through the day.',
  }
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
async function getSnapshot(entity: string): Promise<Snapshot | null> {
  try {
    const h = headers()
    const host = h.get('host')
    const proto = h.get('x-forwarded-proto') ?? (host?.startsWith('localhost') ? 'http' : 'https')
    const origin = host ? `${proto}://${host}` : SITE_URL

    const res = await fetch(`${origin}/api/v1/snapshot/${entity}`, {
      cache: 'no-store',
    })
    if (!res.ok) {
      console.error(`[${entity}] snapshot API returned ${res.status}`)
      return null
    }
    return (await res.json()) as Snapshot
  } catch (err) {
    console.error(`[${entity}] snapshot fetch failed:`, err)
    return null
  }
}

export default async function EntityPage({
  params,
}: {
  params: { entity: string }
}) {
  const entity = (params.entity ?? '').toLowerCase()

  // A slug with no entity is a 404, not an empty page. Without this the
  // dynamic segment would answer for every unmatched path on the site.
  if (!isEntity(entity)) notFound()

  const snapshot = await getSnapshot(entity)
  const now = Date.now()
  const fallbackName = isHomepageEntity(entity)
    ? 'The Football Hub'
    : (CLUBS_BY_SLUG[entity]?.name ?? entity)

  // §15 empty(page): never blank. Email capture is a centre-column concern and
  // is out of scope here, so this is the line and the date.
  if (!snapshot) {
    const today = new Date(now).toISOString()
    return (
      <article className="mx-auto" style={{ maxWidth: t.measure.page, paddingLeft: t.space[4], paddingRight: t.space[4], paddingTop: t.space[10], paddingBottom: t.space[10] }}>
        <h1 style={{ fontSize: t.type.size.xl, lineHeight: t.type.leading.xl, fontWeight: t.type.weight.semibold }}>{fallbackName}</h1>
        <p style={{ marginTop: t.space[4] }}>Nothing worth logging today.</p>
        <p style={{ marginTop: t.space[1], fontSize: t.type.size.sm, lineHeight: t.type.leading.sm, opacity: t.colour.text.step.muted }}>
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

  const { entity: subject, phase, updated_at } = snapshot
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
   *   5  Table
   *   6  Form
   *
   * Two things about the off-week order are the spec's, not mine. §5 drops Key
   * Data from the BREAK stack, and Referee is `PRE` only by §7.5.
   *
   * The Numbers is absent from both. It sat last in each and showed position and
   * points, which the table immediately above already gives for seven clubs —
   * see the note in blocks.tsx. The key stays in the payload.
   */
  /**
   * The league entity has no squad, no fixture and no form, so the club blocks
   * have nothing to feed them and do not appear.
   *
   * This is not "blocks move" (§5) — the order is unchanged and every block
   * that has data is in its usual place. It is §22: a block the data cannot
   * feed does not render. Availability needs saying separately because it is
   * the one block allowed a message instead of a non-render, and "Nobody
   * unavailable" is a sentence about a squad. The league does not have one, so
   * the message would be false rather than merely empty.
   */
  const isClub = !isHomepageEntity(entity)

  const blocks = !isClub
    ? [<LeagueTable key="table" table={snapshot.table} />]
    : matchweek
    ? [
        <MatchBlock key="match" match={snapshot.match} entity={subject.name} />,
        <Availability
          key="availability"
          rows={snapshot.availability ?? []}
          now={now}
        />,
        phase === 'PRE' ? (
          <RefereeBlock key="referee" referee={snapshot.referee} club={subject.name} />
        ) : null,
        <KeyData key="key-data" data={snapshot.key_data ?? []} />,
        <LeagueTable key="table" table={snapshot.table} />,
        <Form key="form" form={snapshot.form ?? []} />,
      ]
    : [
        <MatchBlock key="match" match={snapshot.match} entity={subject.name} />,
        <Availability
          key="availability"
          rows={snapshot.availability ?? []}
          now={now}
        />,
        <LeagueTable key="table" table={snapshot.table} />,
        <Form key="form" form={snapshot.form ?? []} />,
      ]

  return (
    <article className="mx-auto" style={{ maxWidth: t.measure.page, paddingLeft: t.space[4], paddingRight: t.space[4], paddingTop: t.space[10], paddingBottom: t.space[10] }}>
      <header>
        {/* The club, nothing else. "Snapshot" is internal wording and the
            public name for this page is not settled. */}
        <h1 style={{ fontSize: t.type.size.xl, lineHeight: t.type.leading.xl, fontWeight: t.type.weight.semibold, letterSpacing: t.type.tracking.tight }}>{subject.name}</h1>
        {updated_at && (
          <p style={{ marginTop: t.space[1], fontSize: t.type.size.sm, lineHeight: t.type.leading.sm, opacity: t.colour.text.step.muted }}>
            updated{' '}
            <time dateTime={updated_at}>{relativeTime(updated_at, now)}</time>
          </p>
        )}
      </header>

      {/* Blocks never move. A block with no data returns null and its
          neighbours close the gap — no placeholder, no empty container. */}
      <div style={{ marginTop: t.space[8], display: 'flex', flexDirection: 'column', gap: t.space[6] }}>{blocks}</div>
    </article>
  )
}
