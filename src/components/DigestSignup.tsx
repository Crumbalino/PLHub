'use client'

import { useState } from 'react'
import PulseIcon from './feed/PulseIcon'

type SignupState = 'idle' | 'loading' | 'success' | 'error'

export default function DigestSignup() {
  const [email, setEmail] = useState('')
  const [state, setState] = useState<SignupState>('idle')
  const [message, setMessage] = useState('')

  const handleSubmit = async () => {
    if (!email || state === 'loading') return

    setState('loading')
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()

      if (data.success) {
        setState('success')
        setMessage(data.message)
        setEmail('')
      } else {
        setState('error')
        setMessage(data.error || 'Something went wrong.')
      }
    } catch {
      setState('error')
      setMessage('Network error. Please try again.')
    }
  }

  if (state === 'success') {
    return (
      <div
        className="rounded-xl p-6 text-center"
        style={{
          background: 'var(--plh-card)',
          border: '1px solid color-mix(in srgb, var(--plh-gold) 20%, transparent)',
        }}
      >
        <div className="text-2xl mb-2">⚡</div>
        <p className="text-sm text-[var(--plh-text-100)] font-medium">{message}</p>
      </div>
    )
  }

  return (
    <div className="bg-[var(--plh-card)] rounded-xl p-6 border border-[var(--plh-border)]">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <PulseIcon size={16} />
        <span className="text-sm font-bold text-[var(--plh-text-100)]">Breakfast Digest</span>
      </div>

      <p className="text-sm text-[var(--plh-text-70)] mb-4 leading-relaxed">
        The top Premier League stories in your inbox every morning at 7am.
        Free, no spam, unsubscribe anytime.
      </p>

      {/* Input + Button */}
      <div className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            if (state === 'error') setState('idle')
          }}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          placeholder="your@email.com"
          className="flex-1 bg-[var(--plh-bg)] text-[var(--plh-text-100)] text-sm rounded-lg px-4 py-2.5 border border-[var(--plh-border)] focus:border-[var(--plh-teal)] focus:outline-none placeholder:text-[var(--plh-text-40)] transition-colors"
        />
        <button
          onClick={handleSubmit}
          disabled={state === 'loading' || !email}
          className="bg-[var(--plh-pink)] hover:bg-[var(--plh-pink-hover)] text-white text-sm font-semibold rounded-lg px-5 py-2.5 transition-colors disabled:opacity-50 shrink-0"
        >
          {state === 'loading' ? '...' : 'Subscribe'}
        </button>
      </div>

      {/* Error message */}
      {state === 'error' && (
        <p className="text-xs text-red-400 mt-2">{message}</p>
      )}
    </div>
  )
}
