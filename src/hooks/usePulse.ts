// ─────────────────────────────────────────────────────────────────
// Fires a short boolean pulse on a regular interval.
// Used for: "tap for context" CTA, trivia reveal button, fixture CTA.
// RN: works identically — no DOM dependency.
// ─────────────────────────────────────────────────────────────────

import { useState, useEffect } from "react";

interface UsePulseOptions {
  interval: number;
  duration: number;
  active: boolean;
}

export function usePulse({ interval, duration, active }: UsePulseOptions) {
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => {
      setPulse(true);
      setTimeout(() => setPulse(false), duration);
    }, interval);
    return () => clearInterval(id);
  }, [active, interval, duration]);

  return pulse;
}
