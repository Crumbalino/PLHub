// ─────────────────────────────────────────────────────────────────
// Site navigation bar — centered masthead with bigger logo.
// CENTER: Logo (responsive size)
// RIGHT: Dark/light mode toggle (☀ / ☾)
//
// Sticky, backdrop blur, centered layout with breathing room.
// Toggle icon: sun when in dark mode (tap = go light), moon when light (tap = go dark).
// Persists to localStorage. No flash: script in layout <head> applies class before paint.
// Progress bar at bottom: 3px teal strip, fills left-to-right.
//
// RN: this becomes a native navigation header — structure is similar.
// ─────────────────────────────────────────────────────────────────

"use client";

import { useState, useEffect } from "react";
import Logo from "./Logo";
import { useTheme } from "@/lib/theme-context";
import { FONT, SIZE, WEIGHT, DURATION, RADIUS } from "@/lib/tokens";
import { hexToRgba } from "@/lib/utils";

export default function Navbar() {
  const { tokens, mode, toggle } = useTheme();
  const [progress, setProgress] = useState(0);

  // Track scroll progress
  useEffect(() => {
    const handleScroll = () => {
      const windowHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrolled = windowHeight > 0 ? (window.scrollY / windowHeight) * 100 : 0;
      setProgress(Math.min(scrolled, 100));
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        display: "flex",
        flexDirection: "column",
        background: tokens.navBg,
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: `1px solid ${tokens.navBorder}`,
        transition: `background ${DURATION.normal}ms ease, border-color ${DURATION.normal}ms ease`,
      }}
    >
      {/* ── Logo + Nav Actions ── */}
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          padding: "20px 16px 24px",
        }}
      >
        {/* Centered Logo — responsive size via clamp */}
        <div style={{ flex: 1 }}>
          <Logo tier="primary" />
        </div>

        {/* Dark Mode Toggle Button — absolutely positioned right */}
        <button
          onClick={toggle}
          aria-label={mode === "light" ? "Switch to dark mode" : "Switch to light mode"}
          style={{
            position: "absolute",
            right: 16,
            top: "50%",
            transform: "translateY(-50%)",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            fontSize: SIZE.headLg,
            color: hexToRgba(tokens.text100, 0.4),
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
          onMouseLeave={e => (e.currentTarget.style.color = hexToRgba(tokens.text100, 0.4))}
        >
          {mode === "light" ? "☾" : "☀"}
        </button>
      </div>

      {/* ── Progress Bar (3px teal strip at bottom) ── */}
      <div
        style={{
          height: "3px",
          background: hexToRgba(tokens.teal, 0.2),
          width: "100%",
        }}
      >
        <div
          style={{
            height: "100%",
            background: tokens.teal,
            width: `${progress}%`,
            transition: `width ${DURATION.fast}ms ease`,
          }}
        />
      </div>
    </nav>
  );
}
