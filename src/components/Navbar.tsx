'use client';

export default function Navbar() {

  return (
    <nav
      className="sticky top-0 z-50 h-auto transition-colors duration-300"
      style={{
        backgroundColor: 'color-mix(in srgb, var(--plh-bg) 95%, transparent)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid #3AAFA9',
        boxShadow: '0 2px 20px rgba(58,175,169,0.25)',
      }}
    >
      <div className="max-w-[700px] mx-auto pt-5 pb-3 px-4 sm:px-6 flex items-center justify-between">

        {/* Left spacer — About link */}
        <div className="w-20 sm:w-24 flex items-center">
          <a
            href="/about"
            style={{
              fontSize: '13px',
              color: 'rgba(250,245,240,0.5)',
              textDecoration: 'none',
              fontFamily: "'Sora', sans-serif",
              transition: 'color 0.15s',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--plh-teal)' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'rgba(250,245,240,0.5)' }}
          >
            About
          </a>
        </div>

        {/* Logo — centred, Brand v3.1 Tier 2 Inline */}
        <a href="/" className="inline-flex items-center select-none group" aria-label="PLHub home">
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            backgroundColor: 'var(--plh-card)',
            padding: '6px 14px',
            borderRadius: '6px',
            width: 'fit-content',
            position: 'relative',
          }}>
            {/* TL bracket */}
            <svg
              width="22" height="22" viewBox="0 0 24 24" fill="none"
              aria-hidden="true"
              style={{ position: 'absolute', top: '-11px', left: '-11px', opacity: 0.85 }}
            >
              <path d="M2 14V2H14" stroke="var(--plh-pink)" strokeWidth="3.5" strokeLinecap="round" />
            </svg>

            {/* PL wordmark */}
            <span style={{
              fontWeight: 700,
              lineHeight: 1,
              color: 'var(--plh-text-100)',
              fontSize: '36px',
              fontFamily: "'Sora', sans-serif",
            }}>
              PL
            </span>
            {/* HUB wordmark */}
            <span style={{
              fontWeight: 300,
              lineHeight: 1,
              letterSpacing: '2px',
              color: 'var(--plh-text-100)',
              fontSize: '36px',
              fontFamily: "'Sora', sans-serif",
            }}>
              HUB
            </span>
          </div>
        </a>

        {/* Right spacer — for layout balance */}
        <div className="w-20 sm:w-24" />
      </div>
    </nav>
  );
}
