'use client';
import { useEffect, useState } from 'react';

const TEAL = '#3AAFA9';
const PINK = '#E84080';
const GOLD = '#D4A843';
const WHITE = '#F8F9FB';

function useReadingProgress() {
  const [pct, setPct] = useState(0);
  const [caughtUp, setCaughtUp] = useState(false);
  const [label, setLabel] = useState('');

  useEffect(() => {
    function load() {
      try {
        const today = new Date().toDateString();
        const raw = localStorage.getItem('tfh_progress');
        const data = raw ? JSON.parse(raw) : null;
        if (!data || data.date !== today) return;
        const expanded: string[] = data.expanded || [];
        const total: number = data.total || 0;
        if (total === 0) return;
        const p = Math.min(100, Math.round((expanded.length / total) * 100));
        setPct(p);
        if (p >= 100) {
          setCaughtUp(true);
          const d = new Date();
          const days = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
          const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
          setLabel(`${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`);
        }
      } catch {}
    }
    load();
    window.addEventListener('tfh_progress_update', load);
    return () => window.removeEventListener('tfh_progress_update', load);
  }, []);

  return { pct, caughtUp, label };
}

export default function Navbar() {
  const { pct, caughtUp, label } = useReadingProgress();

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 50,
      backgroundColor: 'color-mix(in srgb, #0D1B2A 96%, transparent)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(58,175,169,0.15)',
      overflow: 'visible',
    }}>
      <div style={{
        maxWidth: '1400px', margin: '0 auto',
        paddingTop: '14px',
        paddingBottom: '14px',
        paddingLeft: '20px',
        paddingRight: '20px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative',
        overflow: 'visible',
      }}>
        <a href="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'flex-start', position: 'relative', padding: '16px 14px' }} aria-label="The Football Hub">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ position: 'absolute', top: 0, left: 2 }}>
            <path d="M2 14V2H14" stroke={PINK} strokeWidth="3.5" strokeLinecap="round" />
          </svg>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <span style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: '9px', letterSpacing: '3.5px', textTransform: 'uppercase', color: WHITE, opacity: 0.7, marginBottom: '2px', lineHeight: 1 }}>THE</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '7px' }}>
              <span style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: '26px', color: WHITE, letterSpacing: '-0.5px', lineHeight: 1 }}>FOOTBALL</span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 300, fontSize: '26px', color: WHITE, letterSpacing: '1px', lineHeight: 1 }}>HUB</span>
            </div>
          </div>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ position: 'absolute', bottom: 0, right: 2 }}>
            <path d="M22 10V22H10" stroke={PINK} strokeWidth="3.5" strokeLinecap="round" />
          </svg>
        </a>
      </div>

      <div style={{ height: '3px', background: 'rgba(58,175,169,0.12)' }}>
        <div style={{
          height: '100%', width: `${pct}%`,
          background: caughtUp ? GOLD : TEAL,
          transition: 'width 0.4s ease-out, background 0.6s ease',
        }} />
      </div>

      {caughtUp && (
        <div style={{
          textAlign: 'center',
          padding: '3px 0',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '9px',
          fontWeight: 700,
          letterSpacing: '0.12em',
          color: GOLD,
          background: 'rgba(212,168,67,0.06)',
          borderTop: '1px solid rgba(212,168,67,0.15)',
        }}>
          CAUGHT UP · {label}
        </div>
      )}
    </nav>
  );
}
