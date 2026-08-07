'use client'

// The only interactive element in the hero. Kept as a small client island so
// everything around it stays server-rendered.
//
// Posts to /api/subscribe, which is deliberately untouched in this PR — the
// email provider is still undecided. Until one is configured that endpoint
// returns 500, so submissions will fail. The failure is handled and shown,
// not swallowed.

import { useState } from 'react'

type State = 'idle' | 'sending' | 'done' | 'error'

export default function SubscribeForm() {
  const [email, setEmail] = useState('')
  const [state, setState] = useState<State>('idle')

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || state === 'sending') return
    setState('sending')
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
      setState(res.ok ? 'done' : 'error')
    } catch {
      setState('error')
    }
  }

  return (
    <form onSubmit={onSubmit} className="tfh-hero-form" noValidate>
      <label htmlFor="hero-email" className="tfh-visually-hidden">
        Email address
      </label>
      <input
        id="hero-email"
        type="email"
        name="email"
        autoComplete="email"
        inputMode="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@email.com"
        aria-describedby="hero-form-status"
      />
      <button type="submit" disabled={state === 'sending'}>
        {state === 'sending' ? 'Sending' : 'Subscribe'}
      </button>
      <p id="hero-form-status" role="status" className="tfh-hero-form-status">
        {state === 'done' && 'Done. The Balloon Door Awards land in October.'}
        {state === 'error' && "That didn't work. Try again shortly."}
      </p>
    </form>
  )
}
