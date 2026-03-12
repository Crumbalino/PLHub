"use client";

import { useState } from "react";
import { useInView } from "@/hooks/useInView";
import { usePulse } from "@/hooks/usePulse";
import TypeLabel from "./TypeLabel";
import YourVerdict from "./YourVerdict";
import { useTheme } from "@/lib/theme-context";
import { FONT, SIZE, WEIGHT, RADIUS, SPACE, CARD_ACCENTS } from "@/lib/tokens";
import { hexToRgba } from "@/lib/utils";

type Phase = "q" | "thinking" | "a";

interface TriviaCardProps {
  question?: string;
  answer?: string;
  aside?: string;
  cardId?: string;
}

export default function TriviaCard({
  question = "Which club has been relegated from the Premier League the most times?",
  answer = "Sunderland — relegated 6 times",
  aside = "They've made the journey between the Premier League and the Championship so often they should have a loyalty card. They're back up now — which is either the punchline or the setup.",
  cardId = "trivia-001",
}: TriviaCardProps) {
  const [ref, inView] = useInView(0.15);
  const { tokens } = useTheme();
  const [phase, setPhase] = useState<Phase>("q");
  const accent = CARD_ACCENTS.trivia;

  const pulse = usePulse({ interval: 3000, duration: 600, active: phase === "q" && inView });

  const reveal = () => {
    setPhase("thinking");
    setTimeout(() => setPhase("a"), 850);
  };

  return (
    <div
      ref={ref}
      style={{
        background: tokens.card,
        border: `1px solid ${phase === "a" ? hexToRgba(accent, 0.22) : hexToRgba(accent, 0.09)}`,
        borderLeft: `3px solid ${accent}`,
        borderRadius: RADIUS.xl,
        padding: "18px 18px 16px",
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
          right: 8,
          top: "50%",
          fontFamily: FONT.mono,
          fontSize: SIZE.ghostQ,
          fontWeight: WEIGHT.bold,
          color: accent,
          opacity: inView ? (phase === "a" ? 0.04 : 0.10) : 0,
          lineHeight: 1,
          pointerEvents: "none",
          userSelect: "none",
          transform: `translateY(-50%) translateX(${inView ? "0" : "24px"})`,
          transition: "opacity 0.6s ease 0.2s, transform 0.6s ease 0.2s",
          animation: inView && phase === "q" ? "ghostFloat 4s ease-in-out infinite" : "none",
        }}
      >
        ?
      </div>

      <TypeLabel label="Trivia" color={accent} />

      <div
        style={{
          fontFamily: FONT.sora,
          fontSize: SIZE.bodyLg,
          fontWeight: WEIGHT.semibold,
          color: '#FFFFFF',
          lineHeight: 1.45,
          margin: "13px 0 15px",
          maxWidth: "78%",
        }}
      >
        {question}
      </div>

      {phase === "q" && (
        <button
          onClick={reveal}
          style={{
            background: pulse ? hexToRgba(accent, 0.14) : hexToRgba(accent, 0.08),
            border: `1px solid ${pulse ? hexToRgba(accent, 0.45) : hexToRgba(accent, 0.22)}`,
            borderRadius: RADIUS.md,
            padding: "9px 18px",
            fontFamily: FONT.mono,
            fontSize: SIZE.labelSm,
            letterSpacing: "1.5px",
            textTransform: "uppercase",
            color: accent,
            cursor: "pointer",
            transition: "all 0.3s",
            boxShadow: pulse ? `0 0 10px ${hexToRgba(accent, 0.2)}` : "none",
            minHeight: 44,
          }}
        >
          Reveal answer →
        </button>
      )}

      {phase === "thinking" && (
        <div style={{ display: "flex", gap: 6, alignItems: "center", height: 36 }}>
          {[0, 1, 2].map(i => (
            <div
              key={i}
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: accent,
                animation: `dotPulse 0.9s ${i * 0.2}s ease-in-out infinite`,
              }}
            />
          ))}
        </div>
      )}

      {phase === "a" && (
        <div
          style={{
            borderTop: `1px solid ${hexToRgba(accent, 0.1)}`,
            paddingTop: 11,
            animation: "fadeUp 0.3s ease",
          }}
        >
          <div
            style={{
              fontFamily: FONT.mono,
              fontSize: SIZE.labelXs,
              letterSpacing: "2px",
              textTransform: "uppercase",
              color: hexToRgba(accent, 0.5),
              marginBottom: 5,
            }}
          >
            Answer
          </div>
          <div
            style={{
              fontFamily: FONT.sora,
              fontSize: SIZE.headMd,
              fontWeight: WEIGHT.bold,
              color: accent,
              marginBottom: SPACE[2],
            }}
          >
            {answer}
          </div>
          <div
            style={{
              fontFamily: FONT.sora,
              fontSize: SIZE.bodySm,
              color: '#FFFFFF',
              lineHeight: 1.65,
            }}
          >
            {aside}
          </div>

          <YourVerdict accent={accent} cardId={cardId} />
        </div>
      )}
    </div>
  );
}
