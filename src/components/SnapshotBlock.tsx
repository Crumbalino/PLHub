// ─────────────────────────────────────────────────────────────────
// The "Get Caught Up" module — top 5 stories by Hub Index score.
// Numbered list (01-05) with scores, scrolls to feed cards on click.
// ─────────────────────────────────────────────────────────────────

"use client";

import { useInView } from "@/hooks/useInView";
import { useTheme } from "@/lib/theme-context";
import { getPublisherColor, getPublisherName } from "@/lib/publisher-colors";
import { FONT, SIZE, WEIGHT, RADIUS, SPACE } from "@/lib/tokens";
import { hexToRgba } from "@/lib/utils";

interface SnapshotStory {
  id: string;
  rank: number;
  pub: string;
  score: number;
  headline: string;
  url?: string;
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
        padding: "16px",
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0)" : "translateY(12px)",
        transition: "opacity 0.5s ease, transform 0.5s ease",
      }}
    >
      {/* ── Snapshot Section Header ── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: "12px",
          paddingBottom: "8px",
          borderBottom: `1px solid ${hexToRgba(tokens.teal, 0.25)}`,
        }}
      >
        <span
          style={{
            fontFamily: FONT.sora,
            fontWeight: WEIGHT.bold,
            fontSize: "11px",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "#FFFFFF",
          }}
        >
          The Snapshot
        </span>
        <span
          style={{
            fontFamily: FONT.mono,
            fontSize: "10px",
            color: tokens.teal,
            opacity: 0.7,
          }}
        >
          Top 5 · Today
        </span>
      </div>

      {/* ── Stories List ── */}
      <div>
        {stories.map((s, i) => {
          const pubColor = getPublisherColor(s.pub);
          const pubName = s.url ? getPublisherName(s.url) : s.pub;
          return (
            <div
              key={s.id}
              onClick={() => scrollTo(s.id)}
              role="button"
              tabIndex={0}
              onKeyDown={e => e.key === "Enter" && scrollTo(s.id)}
              style={{
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "10px 0",
                borderBottom:
                  i < stories.length - 1
                    ? `1px solid ${'#FFFFFF'}`
                    : "none",
                opacity: inView ? 1 : 0,
                transform: inView ? "translateX(0)" : "translateX(-8px)",
                transition: `opacity 0.4s ease ${0.1 + i * 0.06}s, transform 0.4s ease ${0.1 + i * 0.06}s, background 0.15s ease`,
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#FFFFFF')}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >
              {/* ── Rank Number (teal, large) ── */}
              <span
                style={{
                  fontFamily: FONT.mono,
                  fontWeight: WEIGHT.bold,
                  fontSize: "28px",
                  color: tokens.teal,
                  lineHeight: 1,
                  minWidth: "36px",
                  opacity: 0.9,
                }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>

              {/* ── Headline + Publisher (middle) ── */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: FONT.sora,
                    fontWeight: WEIGHT.semibold,
                    fontSize: "14px",
                    color: "#FFFFFF",
                    lineHeight: 1.35,
                    marginBottom: "4px",
                    overflow: "hidden",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                  }}
                >
                  {s.headline}
                </div>
                <span
                  style={{
                    fontFamily: FONT.sora,
                    fontSize: "11px",
                    color: pubColor,
                    fontWeight: WEIGHT.semibold,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  {pubName}
                </span>
              </div>

              {/* ── Score Badge (right) ── */}
              {s.score > 0 && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "2px",
                    flexShrink: 0,
                  }}
                >
                  <span
                    style={{
                      fontFamily: FONT.mono,
                      fontWeight: WEIGHT.bold,
                      fontSize: "18px",
                      color: "#D4A843",
                      lineHeight: 1,
                    }}
                  >
                    {s.score}
                  </span>
                  <span
                    style={{
                      fontFamily: FONT.mono,
                      fontSize: "8px",
                      color: "#D4A843",
                      opacity: 0.6,
                      letterSpacing: "0.05em",
                      textTransform: "uppercase",
                    }}
                  >
                    INDEX
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
