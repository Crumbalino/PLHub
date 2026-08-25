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
 * 1 → 1st, 2 → 2nd, 3 → 3rd, 4 → 4th.
 *
 * A bare `${n}th` reads "1th" at the top of the table, which is where the
 * league leaders are and therefore the most-read case.
 */
function ordinal(n: number): string {
  const mod100 = n % 100
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`
  const suffix = ['th', 'st', 'nd', 'rd'][n % 10] ?? 'th'
  return `${n}${n % 10 <= 3 ? suffix : 'th'}`
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
    <section className="border-t border-white/15 pt-5">
      <h2 className="font-mono text-[0.7rem] uppercase tracking-[0.15em] opacity-60">
        {title}
      </h2>
      <div className="mt-3">{children}</div>
    </section>
  )
}

/** A secondary line: present, quieter, never a different colour. */
function Meta({ children }: { children: React.ReactNode }) {
  return <p className="mt-1 text-sm opacity-70">{children}</p>
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
        <p className="text-2xl font-semibold">
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
          <p className="text-sm opacity-70">
            <time dateTime={match.kickoff}>{kickoffLabel(match.kickoff)}</time>
          </p>
        )}
        <p className="mt-1 text-2xl font-semibold">
          {score && score.home !== null && score.away !== null
            ? `${homeName} ${score.home} — ${score.away} ${awayName}`
            : fixture}
        </p>

        {match.xg && (
          <p className="mt-2 text-sm">
            <abbr title="Expected goals">xG</abbr> {match.xg.home.toFixed(2)} —{' '}
            {match.xg.away.toFixed(2)}
          </p>
        )}

        {scorers.length > 0 && (
          <ul className="mt-2 flex flex-wrap gap-x-3 text-sm">
            {scorers.map((s, i) => (
              <li key={`${s.player}-${s.minute}-${i}`}>{scorerLabel(s)}</li>
            ))}
          </ul>
        )}

        {reds.length > 0 && (
          <ul className="mt-2 text-sm">
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
        <p className="text-2xl font-semibold">{fixture}</p>
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
        <p className="text-sm opacity-70">
          <time dateTime={match.kickoff}>{kickoffLabel(match.kickoff)}</time>
        </p>
      )}
      <p className="mt-1 text-2xl font-semibold">{fixture}</p>
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
 * The `detail` string is the club's own wording and renders verbatim. It is not
 * rewritten, summarised or embellished anywhere on the way to the screen. It
 * already carries the chance of playing where the club stated one, which is why
 * the numeric `chance` is not also printed — that would show the same fact
 * twice in two voices.
 *
 * This is the one block permitted a message rather than a non-render (§7.4,
 * and §15 names it as the exception): nobody being unavailable is genuinely
 * good news and worth stating.
 */
export function Availability({ rows }: { rows: AvailabilityRow[] }) {
  if (!rows.length) {
    return (
      <Block title="Availability">
        <p>Nobody unavailable.</p>
      </Block>
    )
  }

  return (
    <Block title="Availability">
      <ul className="space-y-2">
        {rows.map((r) => (
          <li key={r.player}>
            <span className="font-medium">{r.player}</span>{' '}
            <span className="font-mono text-[0.7rem] uppercase tracking-wider opacity-70">
              {r.status}
            </span>
            {r.detail && <span className="block text-sm opacity-70">{r.detail}</span>}
          </li>
        ))}
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
      <p className="text-lg font-medium">{referee.name}</p>
      {referee.cards_per_game !== null && (
        <Meta>{referee.cards_per_game} cards per game</Meta>
      )}
      {referee.club_record && <Meta>Tottenham record: {referee.club_record}</Meta>}
      {referee.fact && <p className="mt-2 text-sm">{referee.fact}</p>}
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
      <dl className="space-y-2">
        {data.map((d) => (
          <div key={d.label}>
            <dt className="font-mono text-[0.7rem] uppercase tracking-wider opacity-60">
              {d.label}
            </dt>
            <dd>
              {d.value}
              {d.detail && <span className="opacity-70"> · {d.detail}</span>}
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
      <table className="w-full text-sm tabular-nums">
        <caption className="sr-only">
          Premier League table, Tottenham and the clubs either side
        </caption>
        <thead>
          <tr className="text-left font-mono text-[0.7rem] uppercase tracking-wider opacity-60">
            <th scope="col" className="py-1 pr-2 font-normal">
              Pos
            </th>
            <th scope="col" className="py-1 pr-2 font-normal">
              Club
            </th>
            <th scope="col" className="py-1 pr-2 text-right font-normal">
              Pl
            </th>
            <th scope="col" className="py-1 pr-2 text-right font-normal">
              GD
            </th>
            <th scope="col" className="py-1 text-right font-normal">
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
                <td className="py-1 pr-2">{row.position ?? ''}</td>
                <td className="py-1 pr-2">
                  {isUs ? <strong>{row.name}</strong> : row.name}
                </td>
                <td className="py-1 pr-2 text-right">{row.played ?? ''}</td>
                <td className="py-1 pr-2 text-right">
                  {typeof row.gd === 'number' && row.gd > 0 ? `+${row.gd}` : (row.gd ?? '')}
                </td>
                <td className="py-1 text-right">{row.points ?? ''}</td>
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
      <ol className="flex gap-2 font-mono">
        {form.map((letter, i) => (
          <li key={`${letter}-${i}`} className="text-lg">
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

const NUMBER_LABELS: Array<[keyof Numbers, string]> = [
  ['position', 'Position'],
  ['points', 'Points'],
  ['gd', 'Goal difference'],
  ['goals_for', 'Goals scored'],
  ['goals_against', 'Goals conceded'],
  ['xg_for', 'xG for'],
  ['xg_against', 'xG against'],
]

/**
 * §7.10 — collapsed by default, one line visible, expands to six. The slowest
 * moving block on the page, and never above the fold on mobile.
 *
 * `<details>` does the collapsing with no JavaScript and no client component,
 * which keeps the whole page a server render.
 */
export function NumbersBlock({ numbers }: { numbers: Numbers | null }) {
  if (!numbers) return null

  const present = NUMBER_LABELS.filter(
    ([key]) => typeof numbers[key] === 'number'
  )
  if (!present.length) return null

  const summary = [
    typeof numbers.position === 'number' ? ordinal(numbers.position) : null,
    typeof numbers.points === 'number' ? `${numbers.points} pts` : null,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <Block title="The numbers">
      <details>
        <summary className="cursor-pointer">
          {summary || `${present.length} numbers`}
        </summary>
        <dl className="mt-3 space-y-1 text-sm">
          {present.map(([key, label]) => (
            <div key={key} className="flex justify-between gap-4">
              <dt className="opacity-70">{label}</dt>
              <dd className="tabular-nums">{numbers[key]}</dd>
            </div>
          ))}
        </dl>
      </details>
    </Block>
  )
}
