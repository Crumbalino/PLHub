'use client'

import { useState } from 'react'

interface ModuleTileProps {
  icon: string
  label: string
  defaultOpen?: boolean
  compact?: boolean
  children: React.ReactNode
}

export default function ModuleTile({
  icon,
  label,
  defaultOpen = false,
  compact = false,
  children,
}: ModuleTileProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const [isHovering, setIsHovering] = useState(false)

  const handleToggle = () => {
    setIsOpen(!isOpen)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleToggle()
    }
  }

  // Size values
  const iconSize = compact ? 12 : 14
  const labelSize = compact ? 11 : 12
  const chevronSize = compact ? 9 : 10
  const bracketSize = compact ? 8 : 10
  const bracketOffset = compact ? 4 : 6
  const headerCollapsedPadding = compact ? '9px 12px' : '12px 16px'
  const headerExpandedPadding = compact ? '10px 12px 6px' : '14px 16px 8px'
  const contentPadding = compact ? '0 12px 10px' : '0 16px 14px'
  const radius = compact ? '8px' : '10px'

  // Border opacity states
  const borderColor = isOpen
    ? 'rgba(250, 245, 240, 0.06)'
    : 'rgba(250, 245, 240, 0.04)'

  // Label color
  const labelColor = isOpen
    ? 'rgba(250, 245, 240, 0.9)'
    : 'rgba(250, 245, 240, 0.65)'

  // Bracket opacity
  const bracketOpacity = isHovering ? 0.5 : isOpen ? 0.2 : 0.3

  // Respect reduced motion
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const transitionDuration = prefersReducedMotion ? '0ms' : '200ms'
  const transitionTiming = isOpen ? 'ease-out' : 'ease-in'

  return (
    <div
      className="overflow-hidden transition-all"
      style={{
        background: 'var(--plh-card)',
        border: `1px solid ${borderColor}`,
        borderRadius: radius,
        transitionDuration,
        transitionProperty: 'border-color, background-color',
      }}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Header */}
      <button
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        aria-expanded={isOpen}
        className="w-full text-left cursor-pointer relative transition-all"
        style={{
          padding: isOpen ? headerExpandedPadding : headerCollapsedPadding,
          transitionDuration,
          transitionProperty: 'padding',
        }}
      >
        {/* TL Bracket */}
        <div
          className="absolute transition-opacity"
          style={{
            top: bracketOffset,
            left: bracketOffset,
            opacity: bracketOpacity,
            transitionDuration,
          }}
        >
          <svg
            width={bracketSize}
            height={bracketSize}
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M2 14V2H14"
              stroke="#E84080"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* BR Bracket */}
        <div
          className="absolute transition-opacity"
          style={{
            bottom: bracketOffset,
            right: bracketOffset,
            opacity: bracketOpacity,
            transitionDuration,
          }}
        >
          <svg
            width={bracketSize}
            height={bracketSize}
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M22 10V22H10"
              stroke="#E84080"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* Header content */}
        <div className="flex items-center justify-between">
          {/* Left: Icon + Label */}
          <div
            className="flex items-center gap-2 transition-colors"
            style={{
              gap: compact ? 6 : 8,
              transitionDuration,
            }}
          >
            <span style={{ fontSize: `${iconSize}px` }}>{icon}</span>
            <span
              className="font-semibold transition-colors"
              style={{
                fontSize: `${labelSize}px`,
                color: labelColor,
                transitionDuration,
              }}
            >
              {label}
            </span>
          </div>

          {/* Right: Chevron */}
          <span
            className="flex-shrink-0 transition-all"
            style={{
              fontSize: `${chevronSize}px`,
              color: 'rgba(250, 245, 240, 0.3)',
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transitionDuration,
              transitionProperty: 'transform, color',
            }}
          >
            ▾
          </span>
        </div>
      </button>

      {/* Content area */}
      {isOpen && (
        <div
          className="overflow-hidden transition-all"
          style={{
            padding: contentPadding,
            animation: prefersReducedMotion
              ? 'none'
              : `fadeIn ${transitionDuration} ease-out`,
          }}
        >
          {children}
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}
