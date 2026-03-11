// ─────────────────────────────────────────────────────────────────
// The Football Hub wordmark — two tiers:
//
// tier="nav"     → navbar, footer. FOOTBALL + HUB at 14px.
// tier="primary" → hero use, large displays. FOOTBALL + HUB at 52px.
//
// RULES (from brand doc §03, never deviate):
//   - "THE"      = Sora 700, letter-spacing +0.55em, all-caps, centred above FOOTBALL HUB
//   - "FOOTBALL" = Sora 700, letter-spacing -0.01em, all-caps
//   - "HUB"      = JetBrains Mono 300, letter-spacing +0.18em, all-caps
//   - FOOTBALL and HUB are the SAME point size — weight contrast only
//   - THE's wide tracking optically matches the FOOTBALL HUB width below
//   - Bracket = TL only, teal (on-site always), position absolute top-left
//   - NEVER a BR bracket on the logo
//   - NEVER pink brackets on-site (pink = off-site/social variant only)
//
// RN: swap div → View, span → Text, remove SVG web import.
// ─────────────────────────────────────────────────────────────────

"use client";

import BracketSVG from "./BracketSVG";
import { useTheme } from "@/lib/theme-context";
import { FONT, SIZE, WEIGHT } from "@/lib/tokens";

type LogoTier = "nav" | "primary";

interface LogoProps {
  tier?: LogoTier;
}

const TIER_SPEC = {
  nav: {
    bracketSize: 9,
    bracketStroke: 3.5,
    padding: "3px 8px 3px 14px",
    theSize: 7,
    theTracking: "0.5em",
    wordSize: 14,
    lineHeight: 1 as number,
  },
  primary: {
    bracketSize: 26,
    bracketStroke: 2.8,
    padding: "20px 30px 18px 36px",
    theSize: 18,
    theTracking: "0.55em",
    wordSize: 52,
    lineHeight: 0.95 as number,
  },
} as const;

export default function Logo({ tier = "nav" }: LogoProps) {
  const { tokens } = useTheme();
  const S = TIER_SPEC[tier];

  return (
    <div
      style={{
        position: "relative",
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "center",
        padding: S.padding,
      }}
    >
      {/* TL bracket — anchored absolute top-left */}
      <BracketSVG
        size={S.bracketSize}
        color={tokens.logoBracket}
        variant="tl"
        strokeWidth={S.bracketStroke}
        style={{ position: "absolute", top: 0, left: 0 }}
      />

      {/* THE — wide tracked, sits centred above FOOTBALL HUB */}
      <span
        style={{
          fontFamily: FONT.sora,
          fontSize: S.theSize,
          fontWeight: WEIGHT.bold,
          letterSpacing: S.theTracking,
          color: tokens.logoText,
          lineHeight: 1,
          textTransform: "uppercase",
        }}
      >
        THE
      </span>

      {/* FOOTBALL HUB — inline, aligned at baseline */}
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: "0.15em",
          marginTop: "0.05em",
        }}
      >
        {/* FOOTBALL = Sora 700 */}
        <span
          style={{
            fontFamily: FONT.sora,
            fontSize: S.wordSize,
            fontWeight: WEIGHT.bold,
            letterSpacing: "-0.01em",
            color: tokens.logoText,
            lineHeight: S.lineHeight,
            textTransform: "uppercase",
          }}
        >
          FOOTBALL
        </span>
        {/* HUB = JetBrains Mono 300 — same size, weight contrast only */}
        <span
          style={{
            fontFamily: FONT.mono,
            fontSize: S.wordSize,
            fontWeight: WEIGHT.light,
            letterSpacing: "0.18em",
            color: tokens.logoText,
            lineHeight: S.lineHeight,
            textTransform: "uppercase",
          }}
        >
          HUB
        </span>
      </div>
    </div>
  );
}
