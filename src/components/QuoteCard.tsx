"use client";

import { useInView } from "@/hooks/useInView";
import TypeLabel from "./TypeLabel";
import BracketSVG from "./BracketSVG";
import YourVerdict from "./YourVerdict";
import { useTheme } from "@/lib/theme-context";
import { FONT, SIZE, WEIGHT, RADIUS, CARD_ACCENTS } from "@/lib/tokens";
import { hexToRgba } from "@/lib/utils";

interface QuoteCardProps {
  quote?: string;
  attribution?: string;
  cardId?: string;
}

export default function QuoteCard({
  quote = "We have no more excuses. We knew what was at stake and we didn't deliver.",
  attribution = "DOMINIC SOLANKE · ATLÉTICO 5–2 SPURS",
  cardId = "quote-001",
}: QuoteCardProps) {
  const [ref, inView] = useInView(0.15);
  const { tokens } = useTheme();
  const accent = CARD_ACCENTS.quote;

  return (
    <div
      ref={ref}
      style={{
        background: tokens.card,
        border: `1px solid ${hexToRgba(accent, 0.08)}`,
        borderLeft: `3px solid ${accent}`,
        borderRadius: RADIUS.xl,
        padding: "18px 18px 16px",
        userSelect: "none",
        position: "relative",
        overflow: "hidden",
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0)" : "translateY(16px)",
        transition: "opacity 0.45s ease, transform 0.45s ease",
      }}
    >
      <TypeLabel label="Quote" color={accent} />

      <div style={{ position: "relative", margin: "14px 0 10px", padding: "8px 14px" }}>
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            opacity: inView ? 0.25 : 0,
            transform: inView ? "translate(0,0)" : "translate(-8px,-8px)",
            transition: "opacity 0.5s ease 0.15s, transform 0.5s ease 0.15s",
          }}
        >
          <BracketSVG size={22} color={accent} variant="tl" />
        </div>

        <div
          style={{
            position: "absolute",
            bottom: 0,
            right: 0,
            opacity: inView ? 0.25 : 0,
            transform: inView ? "translate(0,0)" : "translate(8px,8px)",
            transition: "opacity 0.5s ease 0.2s, transform 0.5s ease 0.2s",
          }}
        >
          <BracketSVG size={22} color={accent} variant="br" />
        </div>

        <blockquote
          style={{
            fontFamily: FONT.sora,
            fontSize: SIZE.bodyLg,
            fontWeight: WEIGHT.medium,
            fontStyle: "italic",
            color: hexToRgba(tokens.text100, 0.9),
            lineHeight: 1.6,
            margin: 0,
            padding: 0,
          }}
        >
          "{quote}"
        </blockquote>
      </div>

      <div
        style={{
          fontFamily: FONT.mono,
          fontSize: SIZE.labelXs,
          color: hexToRgba(accent, 0.55),
          letterSpacing: "1.5px",
          textTransform: "uppercase",
          marginBottom: 14,
        }}
      >
        — {attribution}
      </div>

      <YourVerdict accent={accent} cardId={cardId} />
    </div>
  );
}
