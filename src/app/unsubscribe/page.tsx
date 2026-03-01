'use client'

import { useState } from 'react'
import Link from 'next/link'

type State = 'idle' | 'loading' | 'success' | 'error'

export default function UnsubscribePage() {
  const [email, setEmail] = useState('')
  const [state, setState] = useState<State>('idle')
  const [message, setMessage] = useState('')

  const handleUnsubscribe = async () => {
    if (!email || state === 'loading') return
    setState('loading')

    try {
      const res = await fetch(`/api/subscribe?email=${encodeURIComponent(email)}`, {
        method: 'DELETE',
      })
      const data = await res.json()

      if (data.success) {
        setState('success')
        setMessage(data.message)
      } else {
        setState('error')
        setMessage(data.error || 'Something went wrong.')
      }
    } catch {
      setState('error')
      setMessage('Network error. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-[var(--plh-bg)] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <h1 className="text-2xl font-bold text-[var(--plh-text-100)] mb-4">Unsubscribe</h1>

        {state === 'success' ? (
          <div>
            <p className="text-[var(--plh-text-70)] mb-6">{message}</p>
            <Link
              href="/"
              className="text-[var(--plh-teal)] hover:text-[var(--plh-pink)] text-sm font-medium transition-colors"
            >
              ← Back to PLHub
            </Link>
          </div>
        ) : (
          <div>
            <p className="text-[var(--plh-text-50)] text-sm mb-6">
              Enter your email to unsubscribe from the PLHub Breakfast Digest.
            </p>

            <div className="flex gap-2 mb-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleUnsubscribe()}
                placeholder="your@email.com"
                className="flex-1 bg-[var(--plh-card)] text-[var(--plh-text-100)] text-sm rounded-lg px-4 py-2.5 border border-[var(--plh-border)] focus:border-[var(--plh-teal)] focus:outline-none placeholder:text-[var(--plh-text-40)]"
              />
              <button
                onClick={handleUnsubscribe}
                disabled={state === 'loading' || !email}
                className="bg-[var(--plh-elevated)] hover:bg-[var(--plh-border-hover)] text-[var(--plh-text-100)] text-sm font-medium rounded-lg px-5 py-2.5 transition-colors disabled:opacity-50"
              >
                {state === 'loading' ? '...' : 'Unsubscribe'}
              </button>
            </div>

            {state === 'error' && (
              <p className="text-xs text-red-400 mb-4">{message}</p>
            )}

            <Link
              href="/"
              className="text-[var(--plh-text-40)] hover:text-[var(--plh-text-70)] text-xs transition-colors"
            >
              ← Back to PLHub
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
