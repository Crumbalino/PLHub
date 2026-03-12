'use client';
import { useCallback } from 'react';
import Logo from '@/components/Logo';

export default function Footer() {
  const links = [
    { href: '/about', label: 'About' },
    { href: '/how-it-works', label: 'How It Works' },
    { href: '/principles', label: 'Our Principles' },
    { href: '/contact', label: 'Contact' },
  ];

  const handleBackToTop = useCallback(() => {
    const startY = window.scrollY;
    const duration = 320;
    const startTime = performance.now();
    const easeOutExpo = (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      window.scrollTo(0, startY * (1 - easeOutExpo(progress)));
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        const bar = document.createElement('div');
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
        ].join(';');
        document.body.appendChild(bar);
        setTimeout(() => bar.remove(), 500);
      }
    };
    requestAnimationFrame(animate);
  }, []);

  return (
    <footer
      style={{
        borderTop: '1px solid rgba(250,245,240,0.05)',
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
          <a href="/" style={{ textDecoration: 'none' }} aria-label="The Football Hub home">
            <Logo tier="nav" />
          </a>

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
                  (e.currentTarget as HTMLElement).style.color = '#3AAFA9';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.color = '#FAF5F0';
                }}
              >
                {l.label}
              </a>
            ))}
          </nav>
        </div>

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
              border: '1px solid rgba(250,245,240,0.15)',
              background: 'transparent',
              color: '#FFFFFF',
              fontSize: '16px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              const btn = e.currentTarget as HTMLElement;
              btn.style.borderColor = 'rgba(58,175,169,0.6)';
              btn.style.color = '#3AAFA9';
              btn.style.background = 'rgba(58,175,169,0.08)';
            }}
            onMouseLeave={(e) => {
              const btn = e.currentTarget as HTMLElement;
              btn.style.borderColor = '#FFFFFF';
              btn.style.color = '#FFFFFF';
              btn.style.background = 'transparent';
            }}
          >
            ↑
          </button>
        </div>
      </div>
    </footer>
  );
}
