'use client'

import { useState, useEffect, useRef } from 'react'

interface IndexScoreTooltipProps {
  totalScore: number
  scoreCredibility: number
  scoreRecency: number
  scoreEngagement: number
  scoreSignificance: number
  isOpen: boolean
  onClose: () => void
}

export default function IndexScoreTooltip({
  totalScore,
  scoreCredibility,
  scoreRecency,
  scoreEngagement,
  scoreSignificance,
  isOpen,
  onClose,
}: IndexScoreTooltipProps) {
  const tooltipRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [showBars, setShowBars] = useState(false)

  // Determine color tier based on total score
  const getTierColor = () => {
    if (totalScore >= 70) return '#C4A23E' // Gold
    if (totalScore >= 50) return 'white'
    return '#9CA3AF' // gray-400
  }

  const tierColor = getTierColor()
  const trackBg = 'bg-white/10'

  const bars = [
    { label: 'Source', value: scoreCredibility },
    { label: 'Freshness', value: scoreRecency },
    { label: 'Buzz', value: scoreEngagement },
    { label: 'Significance', value: scoreSignificance },
  ]

  // Handle click outside to close tooltip
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  // Trigger bar animation on open
  useEffect(() => {
    if (isOpen) {
      setShowBars(true)
    } else {
      setShowBars(false)
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div
      ref={tooltipRef}
      onClick={(e) => e.stopPropagation()}
      className="fixed z-50 w-[220px] animate-in fade-in-0 zoom-in-95 duration-200"
      style={{
        bottom: 'auto',
        left: '50%',
        transform: 'translateX(-50%) translateY(-8px)',
        top: 'var(--tooltip-top)',
      }}
    >
      {/* Tooltip background with arrow */}
      <div className="relative">
        {/* Arrow pointing down */}
        <div
          className="absolute -bottom-1 left-1/2 w-2 h-2 transform -translate-x-1/2 rotate-45"
          style={{
            backgroundColor: '#1A2A2B',
            borderRight: '1px solid rgba(255,255,255,0.1)',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
          }}
        />

        {/* Tooltip content */}
        <div className="bg-[#1A2A2B] border border-white/10 rounded-xl p-4 shadow-xl shadow-black/30">
          {/* Four pillar bars */}
          <div className="space-y-3">
            {bars.map((bar, idx) => (
              <div key={bar.label} className="flex items-center gap-3">
                {/* Label */}
                <span className="text-xs text-gray-300 w-[100px] flex-shrink-0">
                  {bar.label}
                </span>

                {/* Progress bar */}
                <div className={`flex-1 h-1.5 rounded-full ${trackBg} overflow-hidden`}>
                  <div
                    className="h-full rounded-full transition-all duration-500 ease-out"
                    style={{
                      width: showBars ? `${(bar.value / 25) * 100}%` : '0%',
                      backgroundColor: tierColor,
                      transitionDelay: `${idx * 50}ms`,
                    }}
                  />
                </div>

                {/* Score number */}
                <span
                  className="text-xs font-bold w-6 text-right"
                  style={{ color: tierColor }}
                >
                  {bar.value}
                </span>
              </div>
            ))}
          </div>

          {/* Divider */}
          <div className="border-t border-white/5 mt-3 pt-3">
            {/* Total score */}
            <div className="flex items-center justify-between">
              <span className="text-[9px] uppercase tracking-widest text-gray-400">
                INDEX
              </span>
              <span
                className="text-base font-bold"
                style={{ color: tierColor }}
              >
                {totalScore}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
