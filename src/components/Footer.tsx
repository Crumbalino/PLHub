'use client'

import { useCallback } from 'react'

export default function Footer() {
  const links = [
    { href: '/about', label: 'About' },
    { href: '/how-it-works', label: 'How It Works' },
    { href: '/principles', label: 'Our Principles' },
    { href: '/contact', label: 'Contact' },
  ]

  const handleBackToTop = useCallback(() => {
    const startY = window.scrollY
    const duration = 320
    const startTime = performance.now()
    const easeOutExpo = (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t))

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      window.scrollTo(0, startY * (1 - easeOutExpo(progress)))

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        // Bounce: flash a teal bar at the top of the screen
        const bar = document.createElement('div')
        bar.style.cssText = [
          'position:fixed',
          'top:0',
          'left:0',
          'right:0',
          'height:4px',
          'background:#3AAFA9',
          'z-index:9999',
          'transform-origin:top center',
          'animation:topBounce 0.45s cubic-bezier(0.36,0.07,0.19,0.97) forwards',
        ].join(';')
        document.body.appendChild(bar)
        setTimeout(() => bar.remove(), 500)
      }
    }

    requestAnimationFrame(animate)
  }, [])

  return (
    <footer
      style={{
        borderTop: '1px solid var(--plh-border)',
        marginTop: '80px',
        padding: '32px 16px',
      }}
    >
      <div style={{ maxWidth: '700px', margin: '0 auto' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          {/* Wordmark — THE FOOTBALL HUB with chevron frame */}
          <a
            href="/"
            style={{
              textDecoration: 'none',
              display: 'inline-flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              position: 'relative',
              paddingTop: '8px',
              paddingBottom: '8px',
              paddingLeft: '8px',
              paddingRight: '8px',
            }}
          >
            {/* TL bracket */}
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
              style={{
                position: 'absolute',
                top: '0px',
                left: '0px',
                opacity: 0.9,
              }}
            >
              <path d="M2 14V2H14" stroke="var(--plh-teal)" strokeWidth="3.5" strokeLinecap="round" />
            </svg>

            {/* THE */}
            <span
              style={{
                fontWeight: 700,
                lineHeight: 1,
                color: '#FAF5F0',
                fontSize: '8px',
                fontFamily: "'Sora', sans-serif",
                letterSpacing: '2px',
                textTransform: 'uppercase',
                marginBottom: '1px',
              }}
            >
              THE
            </span>

            {/* FOOTBALL HUB */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
              <span
                style={{
                  fontWeight: 700,
                  lineHeight: 1,
                  color: '#FAF5F0',
                  fontSize: '13px',
                  fontFamily: "'Sora', sans-serif",
                  letterSpacing: '-0.5px',
                }}
              >
                FOOTBALL
              </span>
              <span
                style={{
                  fontWeight: 300,
                  lineHeight: 1,
                  color: '#FAF5F0',
                  fontSize: '13px',
                  fontFamily: "'JetBrains Mono', 'Consolas', monospace",
                  letterSpacing: '0.5px',
                }}
              >
                HUB
              </span>
            </div>

            {/* BR bracket */}
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
              style={{
                position: 'absolute',
                bottom: '0px',
                right: '0px',
                opacity: 0.9,
              }}
            >
              <path d="M22 10V22H10" stroke="var(--plh-teal)" strokeWidth="3.5" strokeLinecap="round" />
            </svg>
          </a>

          {/* Nav links */}
          <nav style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                style={{
                  fontSize: '13px',
                  color: '#FAF5F0',
                  textDecoration: 'none',
                  fontFamily: "'Sora', sans-serif",
                  transition: 'color 0.15s',
                }}
                onMouseEnter={(e) => {
                  ;(e.currentTarget as HTMLElement).style.color =
                    'var(--plh-teal)'
                }}
                onMouseLeave={(e) => {
                  ;(e.currentTarget as HTMLElement).style.color =
                    '#FAF5F0'
                }}
              >
                {l.label}
              </a>
            ))}
          </nav>
        </div>

        {/* Back to top button */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '24px' }}>
          <button
            onClick={handleBackToTop}
            aria-label="Back to top"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              border: '1px solid rgba(250, 245, 240, 0.15)',
              background: 'transparent',
              color: 'rgba(250, 245, 240, 0.4)',
              fontSize: '16px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              const btn = e.currentTarget as HTMLElement
              btn.style.borderColor = 'rgba(58, 175, 169, 0.6)'
              btn.style.color = '#3AAFA9'
              btn.style.background = 'rgba(58, 175, 169, 0.08)'
            }}
            onMouseLeave={(e) => {
              const btn = e.currentTarget as HTMLElement
              btn.style.borderColor = 'rgba(250, 245, 240, 0.15)'
              btn.style.color = 'rgba(250, 245, 240, 0.4)'
              btn.style.background = 'transparent'
            }}
          >
            ↑
          </button>
        </div>
      </div>
    </footer>
  )
}
