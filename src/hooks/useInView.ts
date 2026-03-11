// ─────────────────────────────────────────────────────────────────
// Web-only hook: fires once when element enters viewport.
// RN replacement: use Animated with onLayout + scrollview offset,
// or the react-native-intersection-observer library.
// The component interface (inView: boolean) is identical either way.
// ─────────────────────────────────────────────────────────────────

import { useRef, useState, useEffect } from "react";

export function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);

  return [ref, inView] as const;
}
