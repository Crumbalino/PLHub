"use client";

import { useState } from "react";
import { useInView } from "@/hooks/useInView";
import { usePulse } from "@/hooks/usePulse";
import TypeLabel from "./TypeLabel";
import { useTheme } from "@/lib/theme-context";
import { FONT, SIZE, WEIGHT, RADIUS, SPACE, CARD_ACCENTS } from "@/lib/tokens";
import { hexToRgba } from "@/lib/utils";

interface FixtureCardProps {
  homeTeam?: string;
  awayTeam?: string;
  homeForm?: string;
  awayForm?: string;
  time?: string;
  stakes?: string;
  deepContext?: string;
}

export default function FixtureCard({
  homeTeam = "Liverpool",
  awayTeam = "Spurs",
  homeForm = "W W W D W",
  awayForm = "L L D L L",
  time = "TODAY · 17:30",
  stakes = "Liverpool 8pts clear at top · Spurs 2pts above the drop",
  deepContext = "Liverpool haven't lost at Anfield in 19 league games. Spurs haven't won away from home since November. Last five meetings: Liverpool 4, Spurs 1.",
}: FixtureCardProps) {
  const [ref, inView] = useInView(0.15);
  const { tokens } = useTheme();
  const [open, setOpen] = useState(false);
  const accent = CARD_ACCENTS.fixture;

  const pulse = usePulse({ interval: 3200, duration: 600, active: !open && inView });

  return (
    <div
      ref={ref}
      onClick={() => setOpen(o => !o)}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === "Enter" && setOpen(o => !o)}
      style={{
        background: tokens.card,
        border: `1px solid ${open ? hexToRgba(accent, 0.18) : hexToRgba(accent, 0.08)}`,
        borderLeft: `3px solid ${accent}`,
        borderRadius: RADIUS.xl,
        padding: "18px 18px 14px",
        cursor: "pointer",
        userSelect: "none",
        position: "relative",
        overflow: "hidden",
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0)" : "translateY(16px)",
        transition: "opacity 0.45s ease, transform 0.45s ease, border-color 0.3s",
      }}
    >
      <div
        style={{
          position: "absolute",
          right: 14,
          top: "50%",
          fontFamily: FONT.mono,
          fontSize: SIZE.ghostMd,
          fontWeight: WEIGHT.bold,
          color: accent,
          opacity: inView ? (open ? 0.04 : 0.08) : 0,
          lineHeight: 1,
          pointerEvents: "none",
          letterSpacing: -2,
          transform: `translateY(-50%) translateX(${inView ? "0" : "20px"})`,
          transition: "opacity 0.5s ease 0.2s, transform 0.5s ease 0.2s",
          animation: inView && !open ? "ghostFloat 4s ease-in-out infinite" : "none",
        }}
      >
        vs
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <TypeLabel label="Next Up" color={accent} />
        <div
          style={{
            fontFamily: FONT.mono,
            fontSize: SIZE.labelXs,
            color: hexToRgba(accent, 0.5),
            letterSpacing: "1px",
          }}
        >
          {time}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "15px 0 9px" }}>
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontFamily: FONT.sora,
              fontSize: SIZE.headSm,
              fontWeight: WEIGHT.bold,
              color: hexToRgba(tokens.text100, 0.95),
            }}
          >
            {homeTeam}
          </div>
          <div
            style={{
              fontFamily: FONT.mono,
              fontSize: SIZE.label2xs,
              color: hexToRgba(tokens.text100, 0.28),
              letterSpacing: "1.5px",
              marginTop: 3,
            }}
          >
            {homeForm}
          </div>
        </div>

        <div
          style={{
            fontFamily: FONT.mono,
            fontSize: SIZE.labelSm,
            color: hexToRgba(accent, 0.4),
            letterSpacing: "2px",
            padding: "4px 10px",
            border: `1px solid ${hexToRgba(accent, 0.1)}`,
            borderRadius: RADIUS.sm,
            textAlign: "center",
          }}
        >
          vs
        </div>

        <div style={{ flex: 1, textAlign: "right" }}>
          <div
            style={{
              fontFamily: FONT.sora,
              fontSize: SIZE.headSm,
              fontWeight: WEIGHT.bold,
              color: hexToRgba(tokens.text100, 0.95),
            }}
          >
            {awayTeam}
          </div>
          <div
            style={{
              fontFamily: FONT.mono,
              fontSize: SIZE.label2xs,
              color: hexToRgba(tokens.text100, 0.28),
              letterSpacing: "1.5px",
              marginTop: 3,
            }}
          >
            {awayForm}
          </div>
        </div>
      </div>

      <div
        style={{
          fontFamily: FONT.sora,
          fontSize: SIZE.bodySm,
          color: hexToRgba(tokens.text100, 0.42),
          lineHeight: 1.5,
          marginBottom: SPACE[2],
        }}
      >
        {stakes}
      </div>

      <div
        style={{
          overflow: "hidden",
          maxHeight: open ? 140 : 0,
          opacity: open ? 1 : 0,
          transition: "max-height 0.35s ease, opacity 0.3s ease",
        }}
      >
        <div
          style={{
            borderTop: `1px solid ${hexToRgba(accent, 0.08)}`,
            paddingTop: 11,
            marginTop: 5,
            fontFamily: FONT.sora,
            fontSize: SIZE.bodySm,
            color: hexToRgba(tokens.text100, 0.58),
            lineHeight: 1.65,
          }}
        >
          {deepContext}
        </div>
      </div>

      <div
        style={{
          marginTop: SPACE[2],
          fontFamily: FONT.mono,
          fontSize: SIZE.labelXs,
          letterSpacing: "1.5px",
          textTransform: "uppercase",
          color: pulse && !open
            ? accent
            : hexToRgba(accent, open ? 0.52 : 0.27),
          transition: "color 0.3s",
        }}
      >
        {open ? "↑ less" : "↓ what's at stake"}
      </div>
    </div>
  );
}
