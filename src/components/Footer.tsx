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
          {/* Wordmark */}
          <a
            href="/"
            style={{
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '2px',
            }}
          >
            <span
              style={{
                fontSize: '16px',
                fontWeight: 700,
                color: 'var(--plh-text-100)',
                fontFamily: "'Sora', sans-serif",
              }}
            >
              PL
            </span>
            <span
              style={{
                fontSize: '16px',
                fontWeight: 300,
                color: 'var(--plh-text-100)',
                fontFamily: "'Sora', sans-serif",
                letterSpacing: '2px',
              }}
            >
              HUB
            </span>
          </a>

          {/* Nav links */}
          <nav style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                style={{
                  fontSize: '13px',
                  color: 'rgba(250,245,240,0.5)',
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
                    'rgba(250,245,240,0.5)'
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
            color: 'rgba(250,245,240,0.3)',
            fontFamily: "'Sora', sans-serif",
            fontStyle: 'italic',
            margin: '20px 0 0',
          }}
        >
          Drink up Trig, we&apos;re going.
        </p>
      </div>
    </footer>
  )
}
