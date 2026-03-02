'use client'

import GetCaughtUp from './GetCaughtUp'
import TheTable from './TheTable'
import FixtureFocus from './FixtureFocus'
import TransfersContracts from './TransfersContracts'
import BeyondBigSix from './BeyondBigSix'

interface SnapshotContainerProps {
  matchday?: string
  club?: string | null
  children?: React.ReactNode
}

export default function SnapshotContainer({
  matchday = 'Matchday 30',
  club = null,
  children,
}: SnapshotContainerProps) {
  const placeholderModules = [
    'The Quote',
    'By The Numbers',
    'And Finally',
  ]

  return (
    <div
      className="relative w-full mb-8 rounded-lg overflow-hidden"
      style={{
        background: 'var(--plh-card)',
      }}
    >
      {/* Top-left bracket */}
      <div className="absolute top-0 left-0 w-6 h-6 pointer-events-none sm:w-8 sm:h-8">
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          style={{ opacity: 0.14 }}
        >
          <path
            d="M2 14V2H14"
            stroke="var(--plh-pink)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Bottom-right bracket */}
      <div className="absolute bottom-0 right-0 w-6 h-6 pointer-events-none sm:w-8 sm:h-8">
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          style={{ opacity: 0.14 }}
        >
          <path
            d="M22 10V22H10"
            stroke="var(--plh-pink)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Main content area with padding */}
      <div className="relative px-4 pt-6 pb-6 sm:px-6 sm:pt-8 sm:pb-8">
        {/* Header Row */}
        <div className="mb-8 flex items-baseline justify-between gap-4">
          {/* Left: Title and subtitle */}
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-3">
              <h1
                className="text-2xl sm:text-3xl font-bold leading-tight"
                style={{ color: 'var(--plh-text-100)', fontFamily: 'Sora, sans-serif' }}
              >
                The Snapshot
              </h1>
              <span
                className="text-xs sm:text-sm font-mono flex-shrink-0"
                style={{ color: 'var(--plh-text-40)', opacity: 0.4 }}
              >
                P.302
              </span>
            </div>
          </div>

          {/* Right: Matchday indicator */}
          <div
            className="text-sm sm:text-base font-semibold flex-shrink-0"
            style={{ color: 'var(--plh-text-75)', fontFamily: 'Sora, sans-serif' }}
          >
            {matchday}
          </div>
        </div>

        {/* Children or Modules */}
        {children ? (
          <div>{children}</div>
        ) : (
          <div className="space-y-8">
            {/* Get Caught Up Module (S4) */}
            <GetCaughtUp club={club} />

            {/* The Table Module (S5) */}
            <TheTable club={club} />

            {/* Fixture Focus Module (S5) */}
            <FixtureFocus club={club} />

            {/* Transfers & Contracts Module (S6) */}
            <TransfersContracts club={club} />

            {/* Beyond the Big Six Module (S6) */}
            <BeyondBigSix club={club} />

            {/* Other module placeholders */}
            {placeholderModules.map((moduleName) => (
              <div key={moduleName}>
                <h2
                  className="text-[11px] font-semibold uppercase tracking-[2px] mb-4"
                  style={{ color: 'var(--plh-teal)' }}
                >
                  {moduleName}
                </h2>
                <div
                  className="border border-dashed rounded-lg p-4 sm:p-5 min-h-24 flex items-center justify-center"
                  style={{
                    borderColor: 'var(--plh-border)',
                    backgroundColor: 'transparent',
                  }}
                >
                  <span
                    className="text-xs sm:text-sm text-center"
                    style={{ color: 'var(--plh-text-40)' }}
                  >
                    {moduleName} content coming soon
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
