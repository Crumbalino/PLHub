/**
 * Blocks for the Tottenham snapshot page.
 *
 * PAGE_SPEC §7 is the per-block lookup and this file follows it block for
 * block. Three rules from §0 govern everything here:
 *
 *   - Blocks never move. Content changes. The order lives in page.tsx, is
 *     identical every day, and no block ever swaps position.
 *   - Nothing renders that the data cannot feed. Every component returns null
 *     when it has nothing to say. §15: the block does not render, its
 *     neighbours close the gap, and there is no message — with exactly one
 *     exception, Availability (§7.4), which §15 names.
 *   - No emoji. Mono uppercase labels do the same job (§9, §16).
 *
 * Styling is deliberately minimal: type scale, weight, spacing and one hairline
 * rule. No colour system and no design tokens — the page inherits its ground
 * and text colour from `body`, and hierarchy is opacity, never a grey. The
 * design system arrives later and should not be guessed at here.
 */

import React from 'react'
import { tokens as t } from '@/lib/tokens'

// ---------------------------------------------------------------------------
// The §14 payload, narrowed to the keys these blocks consume
// ---------------------------------------------------------------------------

export type Phase = 'LIVE' | 'POST' | 'PRE' | 'BREAK'

export interface ClubRef {
  slug: string | null
  name: string
  badge: string
}

export interface Scorer {
  player: string
  minute: string
  assist: string | null
  kind: 'GOAL' | 'PENALTY' | 'OWN_GOAL'
}

export interface RedCard {
  player: string
  minute: string
}

export interface Match {
  phase: Phase
  opponent: ClubRef | null
  home: boolean | null
  kickoff: string | null
  competition: string
  venue: string | null
  broadcaster: string | null
  difficulty: number | null
  score?: { home: number | null; away: number | null }
  minute?: number | null
  xg?: { home: number; away: number } | null
  scorers?: Scorer[]
  red_cards?: RedCard[]
  attendance?: number | null
}

export interface AvailabilityRow {
  player: string
  status: string
  detail: string
  chance: number | null
  news_added: string | null
}

export interface KeyDatum {
  label: string
  value: string
  detail: string
}

export interface TableRow {
  position?: number
  slug?: string | null
  name?: string
  played?: number
  gd?: number
  points?: number
}

export interface Numbers {
  position?: number
  points?: number
  gd?: number
  goals_for?: number
  goals_against?: number
  xg_for?: number
  xg_against?: number
}

export interface Referee {
  name: string
  cards_per_game: number | null
  club_record: string | null
  fact: string | null
}

export interface Snapshot {
  entity: { slug: string; name: string; badge: string | null; accent: string | null }
  updated_at: string
  phase: Phase
  match: Match | null
  availability: AvailabilityRow[]
  referee: Referee | null
  key_data: KeyDatum[]
  table: { rows: TableRow[]; highlight: string } | null
  form: string[]
  numbers: Numbers | null
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

/**
 * Kick-off times render in UK time regardless of where the reader is.
 *
 * §7.1 asks for a localised kick-off, and for a Premier League audience the
 * meaningful locale is the one the fixture list is published in — a 16:30 kick
 * off is "half four" to everyone talking about it. A fixed zone also keeps the
 * server render stable, which a reader-local time could not be.
 */
const UK = 'Europe/London'

const DAY_TIME = new Intl.DateTimeFormat('en-GB', {
  timeZone: UK,
  weekday: 'short',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

const DAY_DATE = new Intl.DateTimeFormat('en-GB', {
  timeZone: UK,
  weekday: 'short',
  day: 'numeric',
  month: 'short',
})

/** "SAT 17:30" — the §7.1 form. */
function kickoffLabel(iso: string): string {
  return DAY_TIME.format(new Date(iso)).replace(',', '').toUpperCase()
}

/** "SAT 29 AUG" — §3 BREAK renders the date without a time. */
function dateLabel(iso: string): string {
  return DAY_DATE.format(new Date(iso)).replace(',', '').toUpperCase()
}

/** "14 min ago", for the §4 header line. */
export function relativeTime(iso: string, now: number): string {
  const mins = Math.floor((now - Date.parse(iso)) / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.floor(hours / 24)
  return `${days} day${days === 1 ? '' : 's'} ago`
}

/** A goal as §7.2 renders it: scorer, minute, and the assister in brackets. */
function scorerLabel(s: Scorer): string {
  const mark = s.kind === 'OWN_GOAL' ? ' (og)' : s.kind === 'PENALTY' ? ' (pen)' : ''
  const assist = s.assist ? ` (${s.assist})` : ''
  return `${s.player} ${s.minute}'${mark}${assist}`
}

const FORM_WORD: Record<string, string> = { W: 'Win', D: 'Draw', L: 'Loss' }

/**
 * Expected goals, to one decimal place.
 *
 * The payload carries full precision; rendering two decimals would be false
 * precision on a modelled quantity. One decimal is also what the derivation can
 * actually support: xG against is a goalkeeper-minutes sum that runs about 1%
 * under the exact per-fixture figure, and rounding here absorbs that difference
 * rather than displaying it. Rounding is a render concern, so it lives here and
 * not in the adapter.
 */
function xg(value: number): string {
  return value.toFixed(1)
}

/**
 * FPL's separator between the injury and the return date.
 *
 * The string is always two parts: what is wrong, then when he is back — or a
 * marker standing in for the fact that nobody knows.
 */
const NEWS_SEPARATOR = ' - '

/**
 * Return-date markers that mean "no date", not a date.
 *
 * These are FPL's null values written as English. Dropping one is not rewriting
 * the club's wording; it is declining to render an absence as though it were
 * content.
 */
const NO_RETURN_DATE = /^(unknown|unknown return date|no return date|tbc|tba|n\/a|unknown expected return( date)?)$/i

/** "50% chance of playing" → "50%". The label already says it is a doubt. */
const CHANCE_OF_PLAYING = /^(\d{1,3})\s*%\s*chance of playing$/i

/**
 * PAGE_SPEC §7.4 — the availability detail line.
 *
 * The injury description is the club's own wording and passes through
 * verbatim, always. What changes is only what follows it:
 *
 *   "Knee injury - Unknown return date"      → "Knee injury"
 *   "Thigh injury - 50% chance of playing"   → "Thigh injury · 50%"
 *   "Ankle injury - Expected back 19 Sep"    → "Ankle injury · Expected back 19 Sep"
 *   "Suspended until 19 Sep"                 → "Suspended until 19 Sep"
 *
 * Two rules and nothing else. A missing value does not render — "unknown
 * return date" is the absence of information, and printing it fills a line
 * with the fact that we have nothing. And "chance of playing" is the block's
 * own label repeated in every row: under DOUBTFUL, 50% can only mean one thing.
 *
 * Everything else is left exactly as the club published it. Only the part after
 * the separator is ever touched, and only to drop a null marker or a phrase the
 * label already carries.
 */
export function availabilityDetail(detail: string): string {
  // A trailing separator with nothing after it is the same empty return date,
  // just badly punctuated. Strip it before splitting or it survives as "Knee
  // injury -".
  const raw = (detail ?? '').trim().replace(/\s*-\s*$/, '').trim()
  if (!raw) return ''

  const at = raw.indexOf(NEWS_SEPARATOR)
  if (at === -1) return raw

  const injury = raw.slice(0, at).trim()
  const rest = raw.slice(at + NEWS_SEPARATOR.length).trim()

  if (!rest || NO_RETURN_DATE.test(rest)) return injury

  const chance = CHANCE_OF_PLAYING.exec(rest)
  if (chance) return `${injury} · ${chance[1]}%`

  return `${injury} · ${rest}`
}

/**
 * True when FPL gave a null marker where the return date belongs.
 *
 * This, not the status, is what qualifies a row for a days-out count. Measured
 * against live data on 25 Aug 2026, the only suspended player in the league
 * reads `"Suspended until 19 Sep"` — no separator, and a return date already in
 * the sentence. Gating on status alone would append "2 days" to a line that
 * already says when he is back.
 */
function hasNoReturnDate(detail: string): boolean {
  const raw = (detail ?? '').trim().replace(/\s*-\s*$/, '').trim()
  const at = raw.indexOf(NEWS_SEPARATOR)
  if (at === -1) return false
  const rest = raw.slice(at + NEWS_SEPARATOR.length).trim()
  return !rest || NO_RETURN_DATE.test(rest)
}

/** Statuses where a days-out count is the useful thing to say. */
const DAYS_OUT_STATUSES = new Set(['OUT', 'SUSPENDED'])

/**
 * Whole days elapsed since an ISO timestamp, or null.
 *
 * Rounded down, and null below a day — "0 days" is a worse answer than
 * silence, and a fresh injury reads as news on its own.
 */
export function daysSince(iso: string | null | undefined, now: number): number | null {
  if (!iso) return null
  const then = Date.parse(iso)
  if (Number.isNaN(then) || then > now) return null
  const days = Math.floor((now - then) / 86_400_000)
  return days >= 1 ? days : null
}

/**
 * PAGE_SPEC §7.4 — the finished availability line.
 *
 * `availabilityDetail` decides what of the club's wording survives; this adds
 * the one thing FPL knows that the club's sentence does not. When there is no
 * return date, how long he has already been out is the only remaining fact, and
 * FPL stamps `news_added` on every item.
 *
 *   OUT       "Groin injury - Unknown return date"    → Groin injury · 33 days
 *   OUT       "Leg injury - Expected back 28 Nov"     → Leg injury · Expected back 28 Nov
 *   SUSPENDED "Suspended until 19 Sep"                → Suspended until 19 Sep
 *   DOUBTFUL  "Thigh injury - 75% chance of playing"  → Thigh injury · 75%
 *
 * DOUBTFUL never gets a day count: it already carries a percentage, and two
 * numbers in one line is the block competing with itself.
 */
export function availabilityLine(row: AvailabilityRow, now: number): string {
  const base = availabilityDetail(row.detail)
  if (!DAYS_OUT_STATUSES.has(row.status)) return base
  if (!hasNoReturnDate(row.detail)) return base

  const days = daysSince(row.news_added, now)
  if (days === null) return base

  const count = `${days} day${days === 1 ? '' : 's'}`
  return base ? `${base} · ${count}` : count
}

// ---------------------------------------------------------------------------
// Shared shell
// ---------------------------------------------------------------------------

/**
 * One block: a section, a mono uppercase heading, and its content.
 *
 * The heading is always an h2 — the page has a single h1 (§4's page title) and
 * every block sits at the same level beneath it.
 */
function Block({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section style={{ borderTopWidth: t.border.hairline, borderTopStyle: 'solid', borderTopColor: t.colour.rule, paddingTop: t.space[5] }}>
      <h2 className="uppercase" style={{ fontFamily: t.type.family.mono, fontSize: t.type.size.xs, letterSpacing: t.type.tracking.widest, opacity: t.colour.text.step.faint }}>
        {title}
      </h2>
      <div style={{ marginTop: t.space[3] }}>{children}</div>
    </section>
  )
}

/** A secondary line: present, quieter, never a different colour. */
function Meta({ children }: { children: React.ReactNode }) {
  return <p style={{ marginTop: t.space[1], fontSize: t.type.size.sm, lineHeight: t.type.leading.sm, opacity: t.colour.text.step.muted }}>{children}</p>
}

// ---------------------------------------------------------------------------
// 1–3. THE MATCH — §7.1–3, phase-aware per §3
// ---------------------------------------------------------------------------

/**
 * The single highest-value mechanic on the page (§3): the same slot leads with
 * a different thing depending on where in the week we are.
 *
 * LIVE  score and minute
 * POST  score, xG, scorers, red cards, attendance
 * PRE   opponent, kick-off, competition, venue, broadcaster, difficulty
 * BREAK the same block reduced to opponent and date
 */
export function MatchBlock({ match, entity }: { match: Match | null; entity: string }) {
  if (!match) return null

  const opponent = match.opponent?.name
  if (!opponent) return null

  // Home side first, always — the score columns are home/away, not us/them.
  const home = match.home === true
  const homeName = home ? entity : opponent
  const awayName = home ? opponent : entity

  const heading =
    match.phase === 'LIVE'
      ? `Live · ${match.minute ?? 0}'`
      : match.phase === 'POST'
        ? 'Full time'
        : 'Next up'

  const fixture = `${homeName} v ${awayName}`

  // ---- LIVE ----------------------------------------------------------------
  if (match.phase === 'LIVE') {
    const score = match.score
    return (
      <Block title={heading}>
        <p style={{ fontSize: t.type.size.xl, lineHeight: t.type.leading.xl, fontWeight: t.type.weight.semibold }}>
          {score && score.home !== null && score.away !== null
            ? `${homeName} ${score.home} — ${score.away} ${awayName}`
            : fixture}
        </p>
      </Block>
    )
  }

  // ---- POST ----------------------------------------------------------------
  if (match.phase === 'POST') {
    const score = match.score
    const scorers = match.scorers ?? []
    const reds = match.red_cards ?? []
    return (
      <Block title={heading}>
        {match.kickoff && (
          <p style={{ fontSize: t.type.size.sm, lineHeight: t.type.leading.sm, opacity: t.colour.text.step.muted }}>
            <time dateTime={match.kickoff}>{kickoffLabel(match.kickoff)}</time>
          </p>
        )}
        <p style={{ marginTop: t.space[1], fontSize: t.type.size.xl, lineHeight: t.type.leading.xl, fontWeight: t.type.weight.semibold }}>
          {score && score.home !== null && score.away !== null
            ? `${homeName} ${score.home} — ${score.away} ${awayName}`
            : fixture}
        </p>

        {match.xg && (
          <p style={{ marginTop: t.space[2], fontSize: t.type.size.sm, lineHeight: t.type.leading.sm }}>
            <abbr title="Expected goals">xG</abbr> {xg(match.xg.home)} —{' '}
            {xg(match.xg.away)}
          </p>
        )}

        {scorers.length > 0 && (
          <ul className="flex flex-wrap" style={{ marginTop: t.space[2], columnGap: t.space[3], fontSize: t.type.size.sm, lineHeight: t.type.leading.sm }}>
            {scorers.map((s, i) => (
              <li key={`${s.player}-${s.minute}-${i}`}>{scorerLabel(s)}</li>
            ))}
          </ul>
        )}

        {reds.length > 0 && (
          <ul style={{ marginTop: t.space[2], fontSize: t.type.size.sm, lineHeight: t.type.leading.sm }}>
            {reds.map((r, i) => (
              <li key={`${r.player}-${r.minute}-${i}`}>
                Red card — {r.player} {r.minute}&apos;
              </li>
            ))}
          </ul>
        )}

        {match.venue && <Meta>{match.venue}</Meta>}
        {typeof match.attendance === 'number' && (
          <Meta>Attendance {match.attendance.toLocaleString('en-GB')}</Meta>
        )}
      </Block>
    )
  }

  // ---- BREAK: reduced to opponent and date (§3) ----------------------------
  if (match.phase === 'BREAK') {
    return (
      <Block title={heading}>
        <p style={{ fontSize: t.type.size.xl, lineHeight: t.type.leading.xl, fontWeight: t.type.weight.semibold }}>{fixture}</p>
        {match.kickoff && (
          <Meta>
            <time dateTime={match.kickoff}>{dateLabel(match.kickoff)}</time>
          </Meta>
        )}
      </Block>
    )
  }

  // ---- PRE -----------------------------------------------------------------
  const detail = [match.competition, match.venue].filter(Boolean).join(' · ')
  return (
    <Block title={heading}>
      {match.kickoff && (
        <p style={{ fontSize: t.type.size.sm, lineHeight: t.type.leading.sm, opacity: t.colour.text.step.muted }}>
          <time dateTime={match.kickoff}>{kickoffLabel(match.kickoff)}</time>
        </p>
      )}
      <p style={{ marginTop: t.space[1], fontSize: t.type.size.xl, lineHeight: t.type.leading.xl, fontWeight: t.type.weight.semibold }}>{fixture}</p>
      {detail && <Meta>{detail}</Meta>}
      {/* §18 open question 1: no free API carries UK rights, so this is absent
          until it is entered by hand rather than guessed at. */}
      {match.broadcaster && <Meta>{match.broadcaster}</Meta>}
      {/* FPL's difficulty rating stays in the §14 payload but is not rendered.
          §7.1 lists it as a colour-coded 1–5, and there is no colour system to
          code it against yet; as a bare number it reads as a score the page has
          not earned the right to state. */}
    </Block>
  )
}

// ---------------------------------------------------------------------------
// 4. AVAILABILITY — §7.4
// ---------------------------------------------------------------------------

/**
 * §7.4. Two things here are rules, not choices.
 *
 * The status word is text, never colour alone (WCAG 1.4.1) — so it is a word,
 * and there is no dot and no colour at all in this build.
 *
 * The injury description is the club's own wording and renders verbatim. It is
 * not rewritten, summarised or embellished anywhere on the way to the screen.
 * `availabilityDetail` trims only the return-date half of the string, and only
 * to drop a null marker or a phrase the status label already carries — see the
 * note there. The numeric `chance` is never printed separately, because the
 * string already carries it and two voices for one fact is one too many.
 *
 * This is the one block permitted a message rather than a non-render (§7.4,
 * and §15 names it as the exception): nobody being unavailable is genuinely
 * good news and worth stating.
 */
export function Availability({ rows, now }: { rows: AvailabilityRow[]; now: number }) {
  if (!rows.length) {
    return (
      <Block title="Availability">
        <p>Nobody unavailable.</p>
      </Block>
    )
  }

  return (
    <Block title="Availability">
      <ul>
        {rows.map((r, i) => {
          const detail = availabilityLine(r, now)
          return (
            <li key={r.player} style={{ marginTop: i === 0 ? undefined : t.space[2] }}>
              <span style={{ fontWeight: t.type.weight.medium }}>{r.player}</span>{' '}
              <span className="uppercase" style={{ fontFamily: t.type.family.mono, fontSize: t.type.size.xs, letterSpacing: t.type.tracking.wide, opacity: t.colour.text.step.muted }}>
                {r.status}
              </span>
              {detail && <span className="block" style={{ fontSize: t.type.size.sm, lineHeight: t.type.leading.sm, opacity: t.colour.text.step.muted }}>{detail}</span>}
            </li>
          )
        })}
      </ul>
    </Block>
  )
}

// ---------------------------------------------------------------------------
// 5. THE REFEREE — §7.5
// ---------------------------------------------------------------------------

/**
 * §7.5, `PRE` only, sitting under Availability.
 *
 * Card averages and the club record come from accumulated fixture history, and
 * the one interesting fact is hand-written per official. None of that exists
 * yet, so those lines are absent rather than invented — and if there is no
 * appointment either, the block does not render at all.
 */
export function RefereeBlock({ referee }: { referee: Referee | null }) {
  if (!referee?.name) return null

  return (
    <Block title="The referee">
      <p style={{ fontSize: t.type.size.lg, lineHeight: t.type.leading.lg, fontWeight: t.type.weight.medium }}>{referee.name}</p>
      {referee.cards_per_game !== null && (
        <Meta>{referee.cards_per_game} cards per game</Meta>
      )}
      {referee.club_record && <Meta>Tottenham record: {referee.club_record}</Meta>}
      {referee.fact && <p style={{ marginTop: t.space[2], fontSize: t.type.size.sm, lineHeight: t.type.leading.sm }}>{referee.fact}</p>}
    </Block>
  )
}

// ---------------------------------------------------------------------------
// 6. KEY DATA — §7.6
// ---------------------------------------------------------------------------

/**
 * §7.6 — four compact cards, no tables. A description list is the honest
 * markup: each row is a label and its value.
 *
 * IN FORM is absent by construction, not by omission here: it renders the Hub
 * Rating and §11 says the block does not render until the rating is built. The
 * API never sends it.
 */
export function KeyData({ data }: { data: KeyDatum[] }) {
  if (!data.length) return null

  return (
    <Block title="Key data">
      <dl>
        {data.map((d, i) => (
          <div key={d.label} style={{ marginTop: i === 0 ? undefined : t.space[2] }}>
            <dt className="uppercase" style={{ fontFamily: t.type.family.mono, fontSize: t.type.size.xs, letterSpacing: t.type.tracking.wide, opacity: t.colour.text.step.faint }}>
              {d.label}
            </dt>
            <dd>
              {d.value}
              {d.detail && <span style={{ opacity: t.colour.text.step.muted }}> · {d.detail}</span>}
            </dd>
          </div>
        ))}
      </dl>
    </Block>
  )
}

// ---------------------------------------------------------------------------
// 7. TABLE — §7.7
// ---------------------------------------------------------------------------

/**
 * §7.7 — three above, the club, three below. The window is the API's decision;
 * this renders whatever rows arrive and marks the highlighted one.
 *
 * A real table, with real header cells and scopes, because it is real tabular
 * data. The *View full table* link §7.7 mentions is not here: there is no full
 * table route yet and a link to nothing is worse than no link.
 */
export function LeagueTable({
  table,
}: {
  table: { rows: TableRow[]; highlight: string } | null
}) {
  if (!table?.rows?.length) return null

  return (
    <Block title="Table">
      <table className="w-full tabular-nums" style={{ fontSize: t.type.size.sm, lineHeight: t.type.leading.sm }}>
        <caption className="sr-only">
          Premier League table, Tottenham and the clubs either side
        </caption>
        <thead>
          <tr className="text-left uppercase" style={{ fontFamily: t.type.family.mono, fontSize: t.type.size.xs, letterSpacing: t.type.tracking.wide, opacity: t.colour.text.step.faint }}>
            <th scope="col" style={{ paddingTop: t.space[1], paddingBottom: t.space[1], paddingRight: t.space[2], fontWeight: t.type.weight.regular }}>
              Pos
            </th>
            <th scope="col" style={{ paddingTop: t.space[1], paddingBottom: t.space[1], paddingRight: t.space[2], fontWeight: t.type.weight.regular }}>
              Club
            </th>
            <th scope="col" className="text-right" style={{ paddingTop: t.space[1], paddingBottom: t.space[1], paddingRight: t.space[2], fontWeight: t.type.weight.regular }}>
              Pl
            </th>
            <th scope="col" className="text-right" style={{ paddingTop: t.space[1], paddingBottom: t.space[1], paddingRight: t.space[2], fontWeight: t.type.weight.regular }}>
              GD
            </th>
            <th scope="col" className="text-right" style={{ paddingTop: t.space[1], paddingBottom: t.space[1], fontWeight: t.type.weight.regular }}>
              Pts
            </th>
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, i) => {
            const isUs = Boolean(row.slug && row.slug === table.highlight)
            return (
              <tr
                key={row.slug ?? row.name ?? i}
                {...(isUs ? { 'aria-current': 'true' as const } : {})}
              >
                <td style={{ paddingTop: t.space[1], paddingBottom: t.space[1], paddingRight: t.space[2] }}>{row.position ?? ''}</td>
                <td style={{ paddingTop: t.space[1], paddingBottom: t.space[1], paddingRight: t.space[2] }}>
                  {isUs ? <strong>{row.name}</strong> : row.name}
                </td>
                <td className="text-right" style={{ paddingTop: t.space[1], paddingBottom: t.space[1], paddingRight: t.space[2] }}>{row.played ?? ''}</td>
                <td className="text-right" style={{ paddingTop: t.space[1], paddingBottom: t.space[1], paddingRight: t.space[2] }}>
                  {typeof row.gd === 'number' && row.gd > 0 ? `+${row.gd}` : (row.gd ?? '')}
                </td>
                <td className="text-right" style={{ paddingTop: t.space[1], paddingBottom: t.space[1] }}>{row.points ?? ''}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </Block>
  )
}

// ---------------------------------------------------------------------------
// 8. FORM — §7.8
// ---------------------------------------------------------------------------

/** Below this many results, form is noise rather than a trend. */
const MIN_FORM_RESULTS = 3

/**
 * §7.8 — last five, most recent left. Letters, not colour alone.
 *
 * The letter carries the meaning visually and the full word is exposed to
 * assistive technology, so the block does not depend on knowing that L is bad.
 * An ordered list, because the order is the information.
 *
 * Fewer than three results and the block does not render. One letter is not
 * form, it is a result — and the match block already said it. In August that
 * means the block appears in the third week of the season.
 */
export function Form({ form }: { form: string[] }) {
  if (form.length < MIN_FORM_RESULTS) return null

  return (
    <Block title="Form">
      <ol className="flex" style={{ gap: t.space[2], fontFamily: t.type.family.mono }}>
        {form.map((letter, i) => (
          <li key={`${letter}-${i}`} style={{ fontSize: t.type.size.lg, lineHeight: t.type.leading.lg }}>
            <span aria-hidden="true">{letter}</span>
            <span className="sr-only">{FORM_WORD[letter] ?? letter}</span>
          </li>
        ))}
      </ol>
    </Block>
  )
}

// ---------------------------------------------------------------------------
// 10. THE NUMBERS — §7.10
// ---------------------------------------------------------------------------
//
// Not rendered on this page, and there is no component here.
//
// The block showed position and points above four more numbers. The table sits
// directly above it and already shows position and points for seven clubs
// including this one, so the two lines a reader actually saw were the two the
// table had just given them — copy rule 2, if every row says it, delete it.
//
// The `numbers` key stays in the §14 payload. The data is sound and a client
// with no table has something to render; this page is not that client.
