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

        {/* Logo — centred, The Football Hub wordmark */}
        <a
          href="/"
          className="inline-flex items-center select-none group"
          aria-label="The Football Hub home"
        >
          <div style={{
            display: 'inline-flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            position: 'relative',
            paddingLeft: '6px',
            paddingTop: '16px',
          }}>
            {/* TL bracket */}
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
              style={{
                position: 'absolute',
                top: '0px',
                left: '-6px',
                opacity: 0.9,
              }}
            >
              <path d="M2 14V2H14" stroke="var(--plh-teal)" strokeWidth="3.5" strokeLinecap="round" />
            </svg>

            {/* THE */}
            <span style={{
              fontWeight: 700,
              lineHeight: 1,
              color: 'var(--plh-text-100)',
              fontSize: '10px',
              fontFamily: "'Sora', sans-serif",
              letterSpacing: '3.5px',
              textTransform: 'uppercase',
              marginBottom: '3px',
              opacity: 0.85,
            }}>
              THE
            </span>

            {/* FOOTBALL HUB */}
            <div style={{ display: 'flex', alignItems: 'baseline' }}>
              <span style={{
                fontWeight: 700,
                lineHeight: 1,
                color: 'var(--plh-text-100)',
                fontSize: '27px',
                fontFamily: "'Sora', sans-serif",
                letterSpacing: '-0.5px',
              }}>
                FOOTBALL
              </span>
              <span style={{
                fontWeight: 300,
                lineHeight: 1,
                color: 'var(--plh-text-100)',
                fontSize: '27px',
                fontFamily: "'JetBrains Mono', 'Consolas', monospace",
                letterSpacing: '1px',
                marginLeft: '7px',
              }}>
                HUB
              </span>
            </div>
          </div>
        </a>

        {/* Right spacer — for layout balance */}
        <div className="w-20 sm:w-24" />
      </div>
    </nav>
  );
}
