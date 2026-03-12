"use client";

import { useState } from "react";
import { useInView } from "@/hooks/useInView";
import { usePulse } from "@/hooks/usePulse";
import TypeLabel from "./TypeLabel";
import YourVerdict from "./YourVerdict";
import { useTheme } from "@/lib/theme-context";
import { FONT, SIZE, WEIGHT, RADIUS, SPACE, CARD_ACCENTS } from "@/lib/tokens";
import { hexToRgba } from "@/lib/utils";

interface OnThisDayCardProps {
  dateLabel?: string;
  year?: string;
  headline?: string;
  story?: string;
  cardId?: string;
}

export default function OnThisDayCard({
  dateLabel = "10 MAR 2012",
  year = "2012",
  headline = "Agüero scored twice as City dismantled United 6–1 at Old Trafford",
  story = "City's first title in 44 years was still two months away but this was the moment the balance of power in Manchester shifted for good. Ferguson called it the worst day of his career. City fans have been replaying Balotelli's shirt reveal ever since. As is their right.",
  cardId = "otd-001",
}: OnThisDayCardProps) {
  const [ref, inView] = useInView(0.15);
  const { tokens } = useTheme();
  const [open, setOpen] = useState(false);
  const [verdictUnlocked, setVerdictUnlocked] = useState(false);
  const accent = CARD_ACCENTS.onThisDay;

  const pulse = usePulse({ interval: 3500, duration: 600, active: !open && inView });

  const handleToggle = () => {
    setOpen(o => !o);
    if (!open) setVerdictUnlocked(true);
  };

  return (
    <div
      ref={ref}
      onClick={handleToggle}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === "Enter" && handleToggle()}
      style={{
        background: tokens.card,
        border: `1px solid ${open ? hexToRgba(accent, 0.2) : hexToRgba(accent, 0.08)}`,
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
          right: 10,
          ...(open ? { top: 10 } : { bottom: 10 }),
          fontFamily: FONT.mono,
          fontSize: SIZE.ghostSm,
          fontWeight: WEIGHT.bold,
          color: accent,
          opacity: inView ? (open ? 0.06 : 0.11) : 0,
          letterSpacing: -2,
          pointerEvents: "none",
          lineHeight: 1,
          transform: `translateX(${inView ? "0" : "20px"})`,
          transition: "opacity 0.5s ease 0.15s, transform 0.5s ease 0.15s, top 0.3s, bottom 0.3s",
          animation: inView && !open ? "ghostFloatStatic 5s ease-in-out infinite" : "none",
        }}
      >
        {year}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <TypeLabel label="On This Day" color={accent} />
        <div
          style={{
            fontFamily: FONT.mono,
            fontSize: SIZE.labelXs,
            color: hexToRgba(accent, 0.4),
            letterSpacing: "1px",
          }}
        >
          {dateLabel}
        </div>
      </div>

      <div
        style={{
          fontFamily: FONT.sora,
          fontSize: SIZE.bodyLg,
          fontWeight: WEIGHT.semibold,
          color: '#FFFFFF',
          lineHeight: 1.45,
          margin: "13px 0 0",
          maxWidth: "80%",
        }}
      >
        {headline}
      </div>

      <div
        style={{
          overflow: "hidden",
          maxHeight: open ? 160 : 0,
          opacity: open ? 1 : 0,
          transition: "max-height 0.35s ease, opacity 0.3s ease",
        }}
      >
        <div
          style={{
            borderTop: `1px solid ${hexToRgba(accent, 0.1)}`,
            marginTop: 13,
            paddingTop: 11,
            fontFamily: FONT.sora,
            fontSize: SIZE.bodySm,
            color: '#FFFFFF',
            lineHeight: 1.65,
          }}
        >
          {story}
        </div>
      </div>

      <div
        style={{
          marginTop: 10,
          fontFamily: FONT.mono,
          fontSize: SIZE.labelXs,
          letterSpacing: "1.5px",
          textTransform: "uppercase",
          color: pulse && !open
            ? accent
            : hexToRgba(accent, open ? 0.5 : 0.28),
          transition: "color 0.3s",
        }}
      >
        {open ? "↑ collapse" : "↓ read the story"}
      </div>

      {verdictUnlocked && (
        <div onClick={e => e.stopPropagation()}>
          <YourVerdict accent={accent} cardId={cardId} />
        </div>
      )}
    </div>
  );
}
