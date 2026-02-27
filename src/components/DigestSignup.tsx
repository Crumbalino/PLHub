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
      <div className="bg-[#183538] rounded-xl p-6 border border-[#C4A23E]/20 text-center">
        <div className="text-2xl mb-2">⚡</div>
        <p className="text-sm text-white font-medium">{message}</p>
      </div>
    )
  }

  return (
    <div className="bg-[#183538] rounded-xl p-6 border border-white/5">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <PulseIcon size={16} />
        <span className="text-sm font-bold text-white">Breakfast Digest</span>
      </div>

      <p className="text-sm text-white/60 mb-4 leading-relaxed">
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
          className="flex-1 bg-[#0B1F21] text-white text-sm rounded-lg px-4 py-2.5 border border-white/10 focus:border-[#C4A23E] focus:outline-none placeholder:text-white/30 transition-colors"
        />
        <button
          onClick={handleSubmit}
          disabled={state === 'loading' || !email}
          className="bg-[#C4A23E] hover:bg-[#d4b24e] text-[#0B1F21] text-sm font-semibold rounded-lg px-5 py-2.5 transition-colors disabled:opacity-50 shrink-0"
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
