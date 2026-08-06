/**
 * Resend email client — uses the REST API directly.
 * No npm package required.
 *
 * Environment variables:
 *   RESEND_API_KEY — your Resend API key
 *   RESEND_AUDIENCE_ID — the audience/list ID for PLHub subscribers
 *   RESEND_FROM_EMAIL — sender address, required (e.g. digest@thefootballhub.uk)
 */

const RESEND_BASE = 'https://api.resend.com'

function getApiKey(): string {
  const key = process.env.RESEND_API_KEY
  if (!key) throw new Error('RESEND_API_KEY not set')
  return key
}

/**
 * Sender address. No fallback: a wrong From on a real send is worse than a
 * failed send, and a hardcoded default silently mails from a dead domain.
 *
 * Thrown at call time rather than module scope — matching getApiKey() above —
 * because this module is imported by route handlers that are evaluated during
 * `next build`, and RESEND_FROM_EMAIL is not currently set in any environment.
 * A module-scope throw would fail every build rather than only failing sends.
 */
function getFromAddress(): string {
  const from = process.env.RESEND_FROM_EMAIL
  if (!from) throw new Error('RESEND_FROM_EMAIL not set')
  return from
}

async function resendFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`${RESEND_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  const data = await res.json()

  if (!res.ok) {
    throw new Error(`Resend API error: ${res.status} ${JSON.stringify(data)}`)
  }

  return data
}

/* ── Send an email ── */
export async function sendEmail({
  to,
  subject,
  html,
  from,
}: {
  to: string | string[]
  subject: string
  html: string
  from?: string
}) {
  const fromAddress = from || getFromAddress()

  return resendFetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
      from: fromAddress,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
    }),
  })
}

/* ── Send batch emails (up to 100 per call) ── */
export async function sendBatchEmails(
  emails: Array<{
    to: string
    subject: string
    html: string
  }>
) {
  const fromAddress = getFromAddress()

  return resendFetch('/emails/batch', {
    method: 'POST',
    body: JSON.stringify(
      emails.map((e) => ({
        from: fromAddress,
        to: [e.to],
        subject: e.subject,
        html: e.html,
      }))
    ),
  })
}

/* ── Add a contact to the PLHub audience ── */
export async function addContact(email: string, firstName?: string) {
  const audienceId = process.env.RESEND_AUDIENCE_ID
  if (!audienceId) throw new Error('RESEND_AUDIENCE_ID not set')

  return resendFetch(`/audiences/${audienceId}/contacts`, {
    method: 'POST',
    body: JSON.stringify({
      email,
      first_name: firstName || undefined,
      unsubscribed: false,
    }),
  })
}

/* ── Remove/unsubscribe a contact ── */
export async function removeContact(email: string) {
  const audienceId = process.env.RESEND_AUDIENCE_ID
  if (!audienceId) throw new Error('RESEND_AUDIENCE_ID not set')

  return resendFetch(`/audiences/${audienceId}/contacts/${email}`, {
    method: 'DELETE',
  })
}

/* ── List all contacts (for digest sending) ── */
export async function listContacts(): Promise<Array<{ id: string; email: string; unsubscribed: boolean }>> {
  const audienceId = process.env.RESEND_AUDIENCE_ID
  if (!audienceId) throw new Error('RESEND_AUDIENCE_ID not set')

  const data = await resendFetch(`/audiences/${audienceId}/contacts`)
  return data.data || []
}
