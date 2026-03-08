'use client';

import { useEffect, useRef, useState } from 'react';

interface MessagePill {
  id: number;
  text: string;
  readCount: number;
}

const MESSAGES: Record<number, string> = {
  1: 'Way to go',
  2: "You're nearly all caught up",
  3: 'Smashing it',
  4: 'Steady on',
  5: "Ok that's probably enough now",
  6: "Shouldn't you be working?",
  7: 'Your family miss you',
  8: 'Remember sunlight?',
  9: "Get you, you now know more than Martin Keown",
  10: "Wow, you're one of the Invincibles, without all the draws",
  11: 'Expect a call from Gary any time now',
  12: 'You remind me of a young Jamie O\'Hara',
  13: "You're someone who knows who Cherno Samba is, aren't you?",
  14: 'You remember when you signed Taribo West on a free?',
  15: 'Did you ever dress in a suit for a cup final in Footy Manager?',
};

export default function ReadingProgress({ readCount }: { readCount: number }) {
  const fadeRef = useRef<HTMLDivElement>(null);
  const [isSticky, setIsSticky] = useState(false);
  const [pillQueue, setPillQueue] = useState<MessagePill[]>([]);
  const [drips, setDrips] = useState<Array<{ id: number }>>([]);
  const [burst, setBurst] = useState(false);
  const previousReadCount = useRef(0);

  // Stage determination
  const stage =
    readCount === 0
      ? 'idle'
      : readCount <= 6
        ? 'breathing'
        : readCount <= 9
          ? 'wobbling'
          : readCount === 10
            ? 'hit'
            : readCount <= 14
              ? 'dripping'
              : 'burst';

  // Show message pill on milestone
  useEffect(() => {
    if (readCount > previousReadCount.current && MESSAGES[readCount]) {
      const pillId = Date.now();
      setPillQueue((q) => [...q, { id: pillId, text: MESSAGES[readCount], readCount }]);
      setTimeout(() => {
        setPillQueue((q) => q.filter((p) => p.id !== pillId));
      }, 3200);
    }
    previousReadCount.current = readCount;
  }, [readCount]);

  // Hit animation (readCount === 10)
  useEffect(() => {
    if (readCount === 10 && stage === 'hit') {
      // Squish happens via CSS animation, no state needed
    }
  }, [readCount, stage]);

  // Drips (readCount 11-14)
  useEffect(() => {
    if (readCount >= 11 && readCount <= 14) {
      const dripCount = readCount - 10; // 1-4 drips
      const newDrips = Array.from({ length: dripCount }, (_, i) => ({
        id: Date.now() + i,
      }));
      setDrips(newDrips);
      // Auto-clear drips after animation
      setTimeout(() => setDrips([]), 1500);
    }
  }, [readCount]);

  // Burst (readCount >= 15)
  useEffect(() => {
    if (readCount >= 15 && !burst) {
      setBurst(true);
      setTimeout(() => setBurst(false), 850);
    }
  }, [readCount, burst]);

  // Sticky scroll listener
  useEffect(() => {
    const handleScroll = () => {
      if (!fadeRef.current) return;
      const rect = fadeRef.current.getBoundingClientRect();
      setIsSticky(rect.top < 0);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fill percentage
  const fillPercentage = Math.min((readCount / 10) * 100, 100);

  // Label text
  const labelText =
    readCount === 0 ? "Today's stories" : readCount >= 10 ? "You're caught up" : 'Getting there';

  // Label opacity (ramp from 0.28 to 0.6 at full)
  const labelOpacity = 0.28 + (fillPercentage / 100) * (0.6 - 0.28);

  // Glow color opacity (ramp from transparent to full at 100)
  const glowOpacity = fillPercentage / 100;

  return (
    <>
      <style>{`
        @keyframes wave {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        @keyframes breathe {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 1; }
        }

        @keyframes wobble {
          0% { transform: scaleY(1) skewX(0deg); }
          25% { transform: scaleY(1.35) skewX(-1deg); }
          50% { transform: scaleY(0.8) skewX(1deg); }
          75% { transform: scaleY(1.2) skewX(-0.5deg); }
          100% { transform: scaleY(1) skewX(0deg); }
        }

        @keyframes squish {
          0% { scaleX: 1; scaleY: 1; }
          50% { scaleX: 0.9; scaleY: 1.1; }
          100% { scaleX: 1; scaleY: 1; }
        }

        @keyframes dripFall {
          0% { transform: translateY(0) scaleY(1) scaleX(1); opacity: 1; }
          70% { transform: translateY(45px) scaleY(1.3) scaleX(0.8); opacity: 1; }
          100% { transform: translateY(58px) scaleY(0.6) scaleX(0.5); opacity: 0; }
        }

        @keyframes burstRadiate {
          0% { transform: translate(0, 0) scale(1); opacity: 1; }
          100% { transform: translate(var(--tx), var(--ty)) scale(0); opacity: 0; }
        }

        @keyframes glowPulse {
          0%, 100% { box-shadow: 0 0 8px rgba(255, 158, 200, 0.9); }
          50% { box-shadow: 0 0 16px rgba(255, 158, 200, 0.6); }
        }

        @keyframes pillFloat {
          0% { transform: translateY(20px); opacity: 0; }
          15% { transform: translateY(0); opacity: 1; }
          85% { transform: translateY(0); opacity: 1; }
          100% { transform: translateY(-20px); opacity: 0; }
        }

        .reading-progress-fill {
          width: ${fillPercentage}%;
          transition: width 0.65s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .reading-progress-fill.breathing {
          animation: breathe 2s ease-in-out infinite;
        }

        .reading-progress-fill.wobbling {
          animation: wobble 0.55s ease-in-out infinite;
        }

        .reading-progress-fill.hit {
          animation: squish 0.9s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }

        .reading-progress-wave {
          animation: wave 2.5s linear infinite;
        }

        .reading-progress-glow {
          animation: glowPulse 1s ease-in-out infinite;
        }

        .reading-progress-drip {
          animation: dripFall 1.5s ease-in;
        }

        .reading-progress-pill {
          animation: pillFloat 3.2s ease-in-out forwards;
        }
      `}</style>

      {/* MAIN FADE ZONE */}
      <div
        ref={fadeRef}
        style={{
          position: 'relative',
          width: '100%',
          height: '88px',
          overflow: 'visible',
          background: 'linear-gradient(to bottom, rgba(13,27,42,1), rgba(13,27,42,0))',
        }}
      >
        {/* PINK FILL */}
        <div
          className={`reading-progress-fill ${stage === 'breathing' ? 'breathing' : stage === 'wobbling' ? 'wobbling' : stage === 'hit' ? 'hit' : ''}`}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            height: '100%',
            background: 'linear-gradient(to bottom, transparent, rgba(232,64,128,0.7))',
            overflow: 'hidden',
            transformOrigin: stage === 'hit' ? 'right center' : 'center',
          }}
        >
          {/* WAVE ANIMATION */}
          <div
            className="reading-progress-wave"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '200%',
              height: '100%',
              background:
                'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.2) 25%, transparent 50%)',
            }}
          />

          {/* GLOW EDGE */}
          {readCount > 0 && (
            <div
              className="reading-progress-glow"
              style={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: '4px',
                height: '100%',
                background: `rgba(255,158,200,${glowOpacity * 0.9})`,
                filter: 'blur(2.5px)',
                boxShadow: `0 0 12px rgba(232,64,128,${glowOpacity})`,
              }}
            />
          )}

          {/* DRIPS */}
          {drips.map((drip, idx) => (
            <div
              key={drip.id}
              className="reading-progress-drip"
              style={{
                position: 'absolute',
                right: `${idx * 8 - 12}px`,
                bottom: '-14px',
                width: '9px',
                height: '14px',
                background: 'linear-gradient(to bottom, #FF9EC8, #E84080)',
                borderRadius: '50% 50% 50% 0',
                transform: 'rotate(-45deg)',
                boxShadow: '0 2px 6px rgba(232,64,128,0.6)',
              }}
            />
          ))}
        </div>

        {/* BURST PARTICLES */}
        {burst &&
          Array.from({ length: 24 }).map((_, i) => {
            const angle = (i / 24) * Math.PI * 2;
            const distance = 80;
            const tx = Math.cos(angle) * distance;
            const ty = Math.sin(angle) * distance;
            const colors = ['#E84080', '#FF9EC8', '#D4A843', '#FF6BA8'];
            const color = colors[i % colors.length];
            const size = 3 + (i % 6);

            return (
              <div
                key={i}
                className="reading-progress-burst"
                style={{
                  position: 'absolute',
                  right: '0',
                  bottom: '44px',
                  width: `${size}px`,
                  height: `${size}px`,
                  background: color,
                  borderRadius: '50%',
                  animation: `burstRadiate 0.85s ease-out forwards`,
                  '--tx': `${tx}px`,
                  '--ty': `${ty}px`,
                } as React.CSSProperties & { '--tx': string; '--ty': string }}
              />
            );
          })}

        {/* FLOAT LABELS */}
        <div
          style={{
            position: 'absolute',
            bottom: '8px',
            left: '16px',
            fontSize: '10px',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            fontFamily: "'Sora', sans-serif",
            color: `rgba(248,249,251,${labelOpacity})`,
          }}
        >
          {labelText}
        </div>

        <div
          style={{
            position: 'absolute',
            bottom: '8px',
            right: '16px',
            fontSize: '10px',
            fontFamily: "'JetBrains Mono', monospace",
            color:
              fillPercentage === 100
                ? '#E84080'
                : `rgba(248,249,251,${0.25 + (fillPercentage / 100) * 0.65})`,
          }}
        >
          {readCount >= 10 ? `${readCount}/${readCount}` : `${readCount}/10`}
        </div>

        {/* MESSAGE PILLS */}
        {pillQueue.map((pill) => (
          <div
            key={pill.id}
            className="reading-progress-pill"
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(13,27,42,0.88)',
              padding: '6px 14px',
              borderRadius: '20px',
              border: '1px solid rgba(232,64,128,0.4)',
              backdropFilter: 'blur(10px)',
              fontSize: '12px',
              fontWeight: 600,
              color: '#FAF5F0',
              fontFamily: "'Sora', sans-serif",
              whiteSpace: 'nowrap',
            }}
          >
            {pill.text}
          </div>
        ))}
      </div>

      {/* STICKY STRIP */}
      {isSticky && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: '50%',
            height: '5px',
            background: 'linear-gradient(to right, rgba(232,64,128,0), rgba(232,64,128,0.6), rgba(232,64,128,0))',
            width: `min(${fillPercentage}%, 660px)`,
            transition: 'width 0.65s cubic-bezier(0.4, 0, 0.2, 1)',
            opacity: 1,
            zIndex: 200,
            pointerEvents: 'none',
            transform: 'translateX(-50%)',
          }}
          className={stage === 'breathing' ? 'breathing' : stage === 'wobbling' ? 'wobbling' : ''}
        />
      )}
    </>
  );
}
