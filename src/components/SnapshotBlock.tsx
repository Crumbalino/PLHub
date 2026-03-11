// ─────────────────────────────────────────────────────────────────
// The "Get Caught Up" module — top 5 stories by Hub Index score.
// First element in the feed. Links down to the corresponding news card.
// ─────────────────────────────────────────────────────────────────

"use client";

import { useInView } from "@/hooks/useInView";
import TypeLabel from "./TypeLabel";
import { useTheme } from "@/lib/theme-context";
import { getPublisherColor } from "@/lib/publisher-colors";
import { FONT, SIZE, WEIGHT, RADIUS, SPACE } from "@/lib/tokens";
import { hexToRgba } from "@/lib/utils";

interface SnapshotStory {
  id: string;
  rank: number;
  pub: string;
  score: number;
  thumb: string;
  headline: string;
}

interface SnapshotBlockProps {
  stories: SnapshotStory[];
  gameweek?: string;
}

export default function SnapshotBlock({
  stories,
  gameweek = "GW29",
}: SnapshotBlockProps) {
  const [ref, inView] = useInView(0.1);
  const { tokens } = useTheme();

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div
      ref={ref}
      style={{
        background: tokens.card,
        border: `1px solid ${tokens.borderCard}`,
        borderRadius: RADIUS.xxl,
        overflow: "hidden",
        marginBottom: SPACE[4],
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0)" : "translateY(12px)",
        transition: "opacity 0.5s ease, transform 0.5s ease",
      }}
    >
      {/* Header row */}
      <div
        style={{
          padding: "12px 16px 11px",
          borderBottom: `1px solid ${tokens.border}`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: hexToRgba(tokens.text100, 0.015),
        }}
      >
        <TypeLabel label="Get Caught Up" color={tokens.teal} />
        <div
          style={{
            fontFamily: FONT.mono,
            fontSize: SIZE.label2xs,
            color: hexToRgba(tokens.text100, 0.22),
            letterSpacing: "1px",
          }}
        >
          {gameweek} · TOP 5
        </div>
      </div>

      {/* Story rows */}
      {stories.map((s, i) => {
        const isTop = i === 0;
        const pubColor = getPublisherColor(s.pub);
        return (
          <div
            key={s.id}
            onClick={() => scrollTo(s.id)}
            role="button"
            tabIndex={0}
            onKeyDown={e => e.key === "Enter" && scrollTo(s.id)}
            style={{
              padding: "9px 14px",
              borderBottom: i < 4 ? `1px solid ${hexToRgba(tokens.text100, 0.04)}` : "none",
              display: "flex",
              alignItems: "center",
              gap: SPACE[2] + 2,
              cursor: "pointer",
              opacity: inView ? 1 : 0,
              transform: inView ? "translateX(0)" : "translateX(-8px)",
              transition: `opacity 0.4s ease ${0.1 + i * 0.06}s, transform 0.4s ease ${0.1 + i * 0.06}s, background 0.15s`,
            }}
            onMouseEnter={e => (e.currentTarget.style.background = hexToRgba(tokens.text100, 0.025))}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
          >
            {/* Rank number */}
            <div
              style={{
                fontFamily: FONT.mono,
                fontSize: SIZE.labelSm,
                fontWeight: WEIGHT.bold,
                color: isTop ? tokens.teal : hexToRgba(tokens.text100, 0.18),
                minWidth: 14,
                textAlign: "center",
                flexShrink: 0,
              }}
            >
              {s.rank}
            </div>

            {/* Publisher name in source colour */}
            <div
              style={{
                fontFamily: FONT.mono,
                fontSize: SIZE.label2xs,
                fontWeight: WEIGHT.bold,
                letterSpacing: "2px",
                textTransform: "uppercase",
                color: pubColor,
                flexShrink: 0,
              }}
            >
              {s.pub}
            </div>

            {/* Headline */}
            <div
              style={{
                fontFamily: FONT.sora,
                fontSize: SIZE.bodySm,
                fontWeight: isTop ? WEIGHT.bold : WEIGHT.medium,
                color: isTop
                  ? hexToRgba(tokens.text100, 0.92)
                  : hexToRgba(tokens.text100, 0.60),
                flex: 1,
                lineHeight: 1.3,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {s.headline}
            </div>

            {/* Thumbnail */}
            <div
              style={{
                width: 48,
                height: 34,
                borderRadius: RADIUS.sm - 1,
                overflow: "hidden",
                flexShrink: 0,
                background: tokens.elevated,
                border: isTop
                  ? `1px solid ${hexToRgba(tokens.teal, 0.3)}`
                  : `1px solid ${tokens.borderCard}`,
              }}
            >
              <img
                src={s.thumb}
                alt=""
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  filter: isTop
                    ? "brightness(0.9) saturate(0.8)"
                    : "brightness(0.7) saturate(0.8)",
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
