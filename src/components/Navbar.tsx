'use client';
import { useEffect, useState } from 'react';

export default function Navbar() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setTheme(isDark ? 'dark' : 'light');
  }, []);

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.classList.remove('dark', 'light');
    document.documentElement.classList.add(next);
    localStorage.setItem('plh-theme', next);
  }

  return (
    <nav
      className="sticky top-0 z-50 h-auto border-b border-[var(--plh-border)] transition-colors duration-300"
      style={{
        backgroundColor: 'color-mix(in srgb, var(--plh-bg) 95%, transparent)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      <div className="max-w-[700px] mx-auto py-3 px-4 sm:px-6 flex items-center justify-between">

        {/* Left — PLHub Index link */}
        <div className="w-20 sm:w-24 flex items-center">
          <a
            href="/how-it-works"
            className="flex items-center gap-1.5 transition-colors duration-200"
            style={{ color: 'rgba(250,245,240,0.45)', textDecoration: 'none' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--plh-gold)' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'rgba(250,245,240,0.45)' }}
            aria-label="How the PLHub Index works"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M22 10V22H10" stroke="var(--plh-gold)" strokeWidth="3.5" strokeLinecap="round" />
            </svg>
            <span
              className="text-[12px] font-semibold uppercase tracking-[1px] hidden sm:inline"
              style={{ fontFamily: "'Sora', sans-serif" }}
            >
              Index
            </span>
          </a>
        </div>

        {/* Logo — centred, Brand v3.1 Tier 2 Inline */}
        <a href="/" className="inline-flex items-center select-none group" aria-label="PLHub home">
          {/* TL bracket */}
          <svg
            width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"
            style={{ position: 'relative', top: '-8px', marginRight: '8px' }}
          >
            <path d="M2 14V2H14" stroke="var(--plh-pink)" strokeWidth="3.5" strokeLinecap="round" />
          </svg>

          {/* Wordmark */}
          <div className="inline-flex items-center gap-1">
            <span className="font-bold leading-none" style={{ color: 'var(--plh-text-100)', fontSize: '36px' }}>
              PL
            </span>
            <span
              className="font-light leading-none tracking-[3px]"
              style={{ color: 'var(--plh-text-100)', fontSize: '36px', marginRight: '-3px' }}
            >
              HUB
            </span>
          </div>

          {/* BR bracket */}
          <svg
            width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"
            style={{ position: 'relative', top: '8px', marginLeft: '8px' }}
          >
            <path d="M22 10V22H10" stroke="var(--plh-pink)" strokeWidth="3.5" strokeLinecap="round" />
          </svg>
        </a>

        {/* Right — theme toggle + sign in */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="flex items-center justify-center text-[var(--plh-text-100)] transition-all duration-200 opacity-85 hover:opacity-100"
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = '1' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = '0.85' }}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--plh-gold)" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            )}
          </button>
          <div className="hidden sm:block w-px h-5" style={{ backgroundColor: 'var(--plh-border)' }} />
          <button
            className="hidden sm:flex items-center text-[13px] font-medium tracking-wide border border-[var(--plh-border)] rounded px-3 py-1 transition-all duration-200"
            style={{ color: 'rgba(250, 245, 240, 0.85)' }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.borderColor = 'var(--plh-border-hover)';
              el.style.background = 'color-mix(in srgb, var(--plh-text-100) 3%, transparent)';
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.borderColor = 'var(--plh-border)';
              el.style.background = 'transparent';
            }}
            aria-label="Sign in (coming soon)"
          >
            Sign in
          </button>
        </div>
      </div>
    </nav>
  );
}
