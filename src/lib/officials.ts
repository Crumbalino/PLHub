/**
 * Match officials and their appointments.
 *
 * Reads the pulselive match detail feed, which already names every official and
 * their role, and shapes it for `match_officials` and
 * `match_official_appointments`.
 *
 * THE TABLES ARE NOT APPLIED YET. migrations/2026-08-26-referee-provenance.sql
 * is written and unrun, so `persistAppointments()` will find no table and
 * return null. It is written now because the mapping is the part worth getting
 * right while the live payload is in front of me, and because the alternative
 * is discovering the role vocabulary again later.
 *
 * The mappers are pure and tested. The writer is fail-soft like every other
 * database call in this codebase: it logs and returns null rather than throwing
 * into a request.
 */

import { createServerClient } from '@/lib/supabase'
import type { PulseMatchDetail, PulseOfficial } from '@/lib/sources/pulselive'

/** The roles `match_official_appointments.role` permits. */
export type AppointmentRole =
  | 'REFEREE'
  | 'VAR'
  | 'AVAR'
  | 'FOURTH_OFFICIAL'
  | 'ASSISTANT_REFEREE'

/**
 * pulselive role → ours. Measured against live payloads on 26 August 2026.
 *
 * The absent-role case is the fragile one and is handled below rather than
 * here: assistant referees carry NO role field at all, so they are identified
 * by absence. Every match in the sample had exactly two of them.
 */
const ROLE_MAP: Record<string, AppointmentRole> = {
  MAIN: 'REFEREE',
  VAR: 'VAR',
  ASSISTANT_VAR: 'AVAR',
  FOURTH_OFFICIAL: 'FOURTH_OFFICIAL',
}

/**
 * Map one official's role.
 *
 * Returns null for a role pulselive has invented since this was written, which
 * is dropped and logged rather than guessed into the nearest enum value — a
 * mislabelled VAR is worse than a missing one.
 */
export function appointmentRole(official: PulseOfficial): AppointmentRole | null {
  const raw = official.role?.trim()
  if (!raw) return 'ASSISTANT_REFEREE'
  const mapped = ROLE_MAP[raw]
  if (!mapped) {
    console.error(`[officials] unknown pulselive role "${raw}" — appointment dropped`)
    return null
  }
  return mapped
}

export interface OfficialRow {
  id: number
  name: string
  first_name: string | null
  last_name: string | null
}

export interface AppointmentRow {
  match_id: number
  official_id: number
  role: AppointmentRole
}

/**
 * Split a display name.
 *
 * Everything before the last space is the first name, so `Michael Oliver` and
 * `Jarred Gillett` both work, and a double-barrelled surname keeps its parts
 * together in `last_name`. Not clever, and it does not need to be — the only
 * consumer is the `M Oliver` join key, which uses the first initial and the
 * last word.
 */
export function splitName(display: string): { first: string | null; last: string | null } {
  const parts = (display ?? '').trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return { first: null, last: null }
  if (parts.length === 1) return { first: null, last: parts[0] }
  return { first: parts[0], last: parts.slice(1).join(' ') }
}

/** Officials named in a match, deduplicated by id. */
export function toOfficialRows(detail: PulseMatchDetail): OfficialRow[] {
  const seen = new Map<number, OfficialRow>()
  for (const o of detail.matchOfficials ?? []) {
    const display = o?.name?.display?.trim()
    if (!display || o.id == null) continue
    const { first, last } = splitName(display)
    seen.set(o.id, { id: o.id, name: display, first_name: first, last_name: last })
  }
  return [...seen.values()]
}

/** Appointments for a match. An official with an unmappable role is dropped. */
export function toAppointmentRows(
  matchId: number,
  detail: PulseMatchDetail
): AppointmentRow[] {
  const rows: AppointmentRow[] = []
  for (const o of detail.matchOfficials ?? []) {
    if (o?.id == null) continue
    const role = appointmentRole(o)
    if (!role) continue
    rows.push({ match_id: matchId, official_id: o.id, role })
  }
  return rows
}

/**
 * Write officials and their appointments.
 *
 * Officials first, because appointments reference them. Returns null on any
 * failure, including the table not existing — which is the current state, and
 * is why this is safe to call before the migration is applied.
 */
export async function persistAppointments(
  matchId: number,
  detail: PulseMatchDetail
): Promise<{ officials: number; appointments: number } | null> {
  const officials = toOfficialRows(detail)
  const appointments = toAppointmentRows(matchId, detail)
  if (!officials.length) return null

  try {
    const supabase = createServerClient()

    const { error: officialsError } = await supabase
      .from('match_officials')
      .upsert(officials, { onConflict: 'id' })
    if (officialsError) {
      console.error('[officials] upsert failed:', officialsError.message)
      return null
    }

    const { error: appointmentsError } = await supabase
      .from('match_official_appointments')
      .upsert(appointments, { onConflict: 'match_id,official_id,role' })
    if (appointmentsError) {
      console.error('[officials] appointment upsert failed:', appointmentsError.message)
      return null
    }

    return { officials: officials.length, appointments: appointments.length }
  } catch (err) {
    console.error('[officials] persist failed:', err)
    return null
  }
}
