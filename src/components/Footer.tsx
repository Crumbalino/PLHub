'use client'

export default function Footer() {
  const links = [
    { href: '/about', label: 'About' },
    { href: '/how-it-works', label: 'How It Works' },
    { href: '/principles', label: 'Our Principles' },
    { href: '/contact', label: 'Contact' },
  ]

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

        {/* Tagline */}
        <p
          style={{
            marginTop: '20px',
            fontSize: '12px',
            color: '#FAF5F0',
            fontFamily: "'Sora', sans-serif",
            margin: '20px 0 0',
          }}
        >
          Drink up Trig, we&apos;re going.
        </p>
      </div>
    </footer>
  )
}
