// ─────────────────────────────────────────────────────────────────
// Site navigation bar.
// LEFT:  Logo tier="nav"
// RIGHT: Dark/light mode toggle (☀ / ☾)
//
// Sticky, backdrop blur, 56px height.
// Toggle icon: sun when in dark mode (tap = go light), moon when light (tap = go dark).
// Persists to localStorage. No flash: script in layout <head> applies class before paint.
//
// RN: this becomes a native navigation header — structure is similar.
// ─────────────────────────────────────────────────────────────────

"use client";

import Logo from "./Logo";
import { useTheme } from "@/lib/theme-context";
import { FONT, SIZE, WEIGHT, DURATION, RADIUS } from "@/lib/tokens";

export default function Navbar() {
  const { tokens, mode, toggle } = useTheme();

  return (
    <nav
      style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        height: 56,
        display: "flex",
        alignItems: "center",
        background: tokens.navBg,
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: `1px solid ${tokens.navBorder}`,
        padding: "0 24px",
        transition: `background ${DURATION.normal}ms ease, border-color ${DURATION.normal}ms ease`,
      }}
    >
      <div
        style={{
          maxWidth: 1400,
          width: "100%",
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Logo tier="nav" />

        <button
          onClick={toggle}
          aria-label={mode === "light" ? "Switch to dark mode" : "Switch to light mode"}
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            fontSize: SIZE.headLg,
            color: tokens.text40,
            lineHeight: 1,
            padding: 8,
            borderRadius: RADIUS.sm,
            transition: `color ${DURATION.fast}ms ease`,
            minHeight: 44,
            minWidth: 44,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onMouseEnter={e => (e.currentTarget.style.color = tokens.teal)}
          onMouseLeave={e => (e.currentTarget.style.color = tokens.text40)}
        >
          {mode === "light" ? "☾" : "☀"}
        </button>
      </div>
    </nav>
  );
}
