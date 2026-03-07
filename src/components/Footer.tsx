'use client'

export default function Footer() {
  return (
    <footer style={{
      marginTop: '64px',
      borderTop: '1px solid var(--plh-border)',
      padding: '40px 16px 32px',
      backgroundColor: 'var(--plh-bg)',
    }}>
      <div style={{
        maxWidth: '700px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '32px',
      }}>
        {/* Logo & tagline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            backgroundColor: 'var(--plh-card)',
            padding: '6px 14px',
            borderRadius: '3px',
            width: 'fit-content',
            position: 'relative',
          }}>
            {/* TL bracket */}
            <svg
              width="12" height="12" viewBox="0 0 24 24" fill="none"
              aria-hidden="true"
              style={{ position: 'absolute', top: '-6px', left: '-6px', opacity: 0.85 }}
            >
              <path d="M2 14V2H14" stroke="var(--plh-pink)" strokeWidth="3.5" strokeLinecap="round" />
            </svg>

            {/* PL wordmark */}
            <span style={{
              fontWeight: 700,
              lineHeight: 1,
              color: 'var(--plh-text-100)',
              fontSize: '20px',
            }}>
              PL
            </span>
            {/* HUB wordmark */}
            <span style={{
              fontWeight: 300,
              lineHeight: 1,
              letterSpacing: '2px',
              color: 'var(--plh-text-100)',
              fontSize: '20px',
              fontFamily: "'Sora', sans-serif",
            }}>
              HUB
            </span>
          </div>
          <p style={{
            fontSize: '14px',
            color: 'rgba(250, 245, 240, 0.7)',
            fontStyle: 'italic',
            fontFamily: "'Sora', sans-serif",
            margin: 0,
          }}>
            Drink up Trig, we're going.
          </p>
        </div>

        {/* Navigation links */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '16px',
        }}>
          <a href="/about" style={{
            fontSize: '14px',
            color: 'var(--plh-teal)',
            textDecoration: 'none',
            fontFamily: "'Sora', sans-serif",
            fontWeight: 500,
            transition: 'opacity 200ms',
          }}
          onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.opacity = '0.7'}
          onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.opacity = '1'}
          >
            About
          </a>
          <a href="/how-it-works" style={{
            fontSize: '14px',
            color: 'var(--plh-teal)',
            textDecoration: 'none',
            fontFamily: "'Sora', sans-serif",
            fontWeight: 500,
            transition: 'opacity 200ms',
          }}
          onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.opacity = '0.7'}
          onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.opacity = '1'}
          >
            How It Works
          </a>
          <a href="/principles" style={{
            fontSize: '14px',
            color: 'var(--plh-teal)',
            textDecoration: 'none',
            fontFamily: "'Sora', sans-serif",
            fontWeight: 500,
            transition: 'opacity 200ms',
          }}
          onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.opacity = '0.7'}
          onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.opacity = '1'}
          >
            Our Principles
          </a>
          <a href="/contact" style={{
            fontSize: '14px',
            color: 'var(--plh-teal)',
            textDecoration: 'none',
            fontFamily: "'Sora', sans-serif",
            fontWeight: 500,
            transition: 'opacity 200ms',
          }}
          onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.opacity = '0.7'}
          onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.opacity = '1'}
          >
            Contact
          </a>
        </div>

        {/* Copyright & disclaimer */}
        <div style={{
          fontSize: '12px',
          color: 'rgba(250, 245, 240, 0.5)',
          fontFamily: "'Sora', sans-serif",
          borderTop: '1px solid var(--plh-border)',
          paddingTop: '16px',
        }}>
          <p style={{ margin: 0 }}>PLHub — Premier League news from BBC Sport, Sky Sports, The Guardian and more.</p>
          <p style={{ margin: '4px 0 0', opacity: 0.7 }}>Not affiliated with the Premier League or its clubs.</p>
        </div>
      </div>
    </footer>
  )
}
