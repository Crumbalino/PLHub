// ─────────────────────────────────────────────────────────────────
// Shared utility functions.
// Pure functions — no DOM, no RN APIs. Import in both platforms.
// ─────────────────────────────────────────────────────────────────

/**
 * Convert a 6-digit hex colour + alpha to rgba() string.
 * Used everywhere YourVerdict renders with the card's accent colour.
 * Works in web (CSS) and RN (StyleSheet values).
 */
export function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/**
 * Format a total reaction count for display.
 * e.g. 8148 → "8,148 reactions"
 */
export function formatReactions(count: number): string {
  return `${count.toLocaleString()} reactions`;
}

/**
 * Get the top N reactions sorted by vote count.
 */
export function getTopReactions(
  votes: Record<number, number>,
  reactions: readonly { id: number; emoji: string; label: string }[],
  n = 5
) {
  return Object.entries(votes)
    .map(([idx, count]) => ({ ...reactions[Number(idx)], count, idx: Number(idx) }))
    .sort((a, b) => b.count - a.count)
    .slice(0, n);
}

/**
 * Session storage wrapper — safe to call in SSR (no window crash).
 * Returns null on server. Returns null if storage is unavailable.
 * On RN: swap this for AsyncStorage.
 */
export const storage = {
  get(key: string): string | null {
    if (typeof window === "undefined") return null;
    try { return sessionStorage.getItem(key); } catch { return null; }
  },
  set(key: string, value: string): void {
    if (typeof window === "undefined") return;
    try { sessionStorage.setItem(key, value); } catch {}
  },
};
