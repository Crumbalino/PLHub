'use client'

import SnapshotContent from './SnapshotContent'

export default function SnapshotShell({ children }: { children?: React.ReactNode }) {
  return (
    <div className="relative mb-8">
      {/* Outer container with brackets */}
      <div className="relative px-4 sm:px-6 py-6 sm:py-8">
        {/* Top-left bracket */}
        <div className="absolute top-0 left-0 w-8 h-8">
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            style={{ opacity: 0.15 }}
          >
            <path
              d="M2 14V2H14"
              stroke="#E84080"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* Bottom-right bracket */}
        <div className="absolute bottom-0 right-0 w-8 h-8">
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            style={{ opacity: 0.15 }}
          >
            <path
              d="M22 10V22H10"
              stroke="#E84080"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* Header Section */}
        <div className="text-center mb-6">
          {/* Ticker line */}
          <div
            className="text-[13px] font-medium uppercase tracking-[2px] mb-3"
            style={{ color: '#3AAFA9' }}
          >
            p.100 · The Snapshot · Matchday 29
          </div>

          {/* Headline */}
          <h1
            className="text-[32px] font-bold mb-2"
            style={{ color: 'rgba(250, 245, 240, 1.0)', lineHeight: '1.2' }}
          >
            Your Premier League briefing
          </h1>

          {/* Subline */}
          <p
            className="text-[16px] font-normal"
            style={{ color: '#3AAFA9' }}
          >
            Today: 4 matches
          </p>
        </div>

        {/* Content Area */}
        {children ? (
          <div>{children}</div>
        ) : (
          <>
            <SnapshotContent />
          </>
        )}

        {/* Sign-off */}
        <div
          className="text-center text-[16px] font-medium mt-6"
          style={{ color: '#3AAFA9' }}
        >
          You're up to speed
        </div>
      </div>
    </div>
  )
}
