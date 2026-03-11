"use client";

import { useState } from "react";
import { useInView } from "@/hooks/useInView";
import { usePulse } from "@/hooks/usePulse";
import TypeLabel from "./TypeLabel";
import YourVerdict from "./YourVerdict";
import { useTheme } from "@/lib/theme-context";
import { FONT, SIZE, WEIGHT, RADIUS, SPACE, CARD_ACCENTS } from "@/lib/tokens";
import { hexToRgba } from "@/lib/utils";

interface StatCardProps {
  value?: number;
  label?: string;
  team?: string;
  season?: string;
  context?: string;
  cardId?: string;
}

export default function StatCard({
  value = 14,
  label = "clean sheets this season",
  team = "Nottingham Forest",
  season = "2025–26",
  context = "Most in the league. More than Arsenal. More than City. Nuno's back line has conceded in just four home games all season — which either means they're genuinely good or the fixture list has been kind. Probably both.",
  cardId = "stat-001",
}: StatCardProps) {
  const [ref, inView] = useInView(0.15);
  const { tokens } = useTheme();
  const [revealed, setReveal] = useState(false);
  const accent = CARD_ACCENTS.byTheNumbers;

  const pulse = usePulse({ interval: 3000, duration: 600, active: !revealed && inView });

  return (
    <div
      ref={ref}
      onClick={() => !revealed && setReveal(true)}
      role={!revealed ? "button" : undefined}
      tabIndex={!revealed ? 0 : undefined}
      onKeyDown={e => e.key === "Enter" && !revealed && setReveal(true)}
      style={{
        background: tokens.card,
        border: `1px solid ${revealed ? hexToRgba(accent, 0.28) : hexToRgba(accent, 0.10)}`,
        borderLeft: `3px solid ${accent}`,
        borderRadius: RADIUS.xl,
        padding: "18px 18px 16px",
        cursor: revealed ? "default" : "pointer",
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
          right: -4,
          top: "50%",
          fontFamily: FONT.mono,
          fontSize: SIZE.ghost,
          fontWeight: WEIGHT.bold,
          color: accent,
          opacity: inView ? (revealed ? 0.05 : 0.10) : 0,
          lineHeight: 1,
          letterSpacing: -6,
          pointerEvents: "none",
          userSelect: "none",
          transform: `translateY(-50%) translateX(${inView ? "0" : "20px"})`,
          transition: "opacity 0.6s ease 0.2s, transform 0.6s ease 0.2s",
          animation: inView && !revealed ? "ghostFloat 5s ease-in-out infinite" : "none",
        }}
      >
        {value}
      </div>

      <div
        style={{
          position: "absolute",
          right: 14,
          bottom: 14,
          fontFamily: FONT.mono,
          fontSize: 9,
          color: accent,
          opacity: inView ? (revealed ? 0.04 : 0.13) : 0,
          lineHeight: 1.7,
          letterSpacing: 3,
          pointerEvents: "none",
          userSelect: "none",
          textAlign: "right",
          transition: "opacity 0.5s ease 0.3s",
        }}
      >
        <div>0 1 2 3 4</div>
        <div>5 6 7 8 9</div>
      </div>

      <TypeLabel label="By The Numbers" color={accent} />

      <div style={{ display: "flex", alignItems: "flex-end", gap: SPACE[2] + 2, margin: "14px 0 6px" }}>
        <div
          style={{
            fontFamily: FONT.mono,
            fontSize: SIZE.display,
            fontWeight: WEIGHT.bold,
            color: accent,
            lineHeight: 1,
            letterSpacing: -3,
          }}
        >
          {value}
        </div>
        <div style={{ paddingBottom: 6 }}>
          <div
            style={{
              fontFamily: FONT.sora,
              fontSize: SIZE.bodySm,
              fontWeight: WEIGHT.semibold,
              color: hexToRgba(tokens.text100, 0.85),
              lineHeight: 1.3,
            }}
          >
            {label}
          </div>
        </div>
      </div>

      <div
        style={{
          fontFamily: FONT.sora,
          fontSize: SIZE.labelSm,
          color: hexToRgba(tokens.text100, 0.28),
          marginBottom: revealed ? 14 : 0,
        }}
      >
        {team} · {season}
      </div>

      <div
        style={{
          overflow: "hidden",
          maxHeight: revealed ? 130 : 0,
          opacity: revealed ? 1 : 0,
          transition: "max-height 0.35s ease, opacity 0.3s ease",
        }}
      >
        <div
          style={{
            borderTop: `1px solid ${hexToRgba(accent, 0.1)}`,
            paddingTop: 11,
            marginTop: 2,
            fontFamily: FONT.sora,
            fontSize: SIZE.bodySm,
            color: hexToRgba(tokens.text100, 0.62),
            lineHeight: 1.65,
          }}
        >
          {context}
        </div>
      </div>

      {revealed && <YourVerdict accent={accent} cardId={cardId} />}

      {!revealed && (
        <div
          style={{
            marginTop: 11,
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontFamily: FONT.mono,
            fontSize: SIZE.label2xs,
            letterSpacing: "1.5px",
            color: pulse ? accent : hexToRgba(accent, 0.38),
            textTransform: "uppercase",
            transition: "color 0.3s",
          }}
        >
          <span
            style={{
              width: 16,
              height: 16,
              border: `1px solid ${pulse ? hexToRgba(accent, 0.70) : hexToRgba(accent, 0.22)}`,
              borderRadius: 3,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: SIZE.labelSm,
              transition: "border-color 0.3s",
              boxShadow: pulse ? `0 0 8px ${hexToRgba(accent, 0.3)}` : "none",
            }}
          >
            +
          </span>
          tap for context
        </div>
      )}
    </div>
  );
}
