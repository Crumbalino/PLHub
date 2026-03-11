// ─────────────────────────────────────────────────────────────────
// Family A — the ONLY RSS/external story template.
// One design. No variations except the BREAKING state.
// ─────────────────────────────────────────────────────────────────

"use client";

import { useInView } from "@/hooks/useInView";
import HubIndexScore from "./HubIndexScore";
import { useTheme } from "@/lib/theme-context";
import { getPublisherColor } from "@/lib/publisher-colors";
import { FONT, SIZE, WEIGHT, RADIUS, DURATION, SPACE } from "@/lib/tokens";
import { hexToRgba } from "@/lib/utils";

interface NewsCardProps {
  id: string;
  publisher: string;
  headline: string;
  summary?: string | null;
  score: number;
  time: string;
  imgSrc?: string;
  articleUrl?: string;
  breaking?: boolean;
}

export default function NewsCard({
  id,
  publisher,
  headline,
  summary,
  score,
  time,
  imgSrc,
  articleUrl,
  breaking = false,
}: NewsCardProps) {
  const [ref, inView] = useInView(0.1);
  const { tokens } = useTheme();
  const pubColor = getPublisherColor(publisher);
  const borderColor = breaking ? tokens.pink : pubColor;

  const handleClick = () => {
    if (articleUrl) window.open(articleUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div
      id={id}
      ref={ref}
      onClick={handleClick}
      role={articleUrl ? "button" : undefined}
      tabIndex={articleUrl ? 0 : undefined}
      onKeyDown={e => e.key === "Enter" && handleClick()}
      style={{
        background: tokens.card,
        border: `1px solid ${tokens.borderCard}`,
        borderLeft: `3px solid ${borderColor}`,
        borderRadius: RADIUS.xl,
        overflow: "hidden",
        cursor: articleUrl ? "pointer" : "default",
        boxShadow: tokens.shadowCard,
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0)" : "translateY(16px)",
        transition: `opacity ${DURATION.slow}ms ease, transform ${DURATION.slow}ms ease`,
      }}
    >
      {/* ── Image zone ── */}
      <div
        style={{
          position: "relative",
          height: 158,
          background: tokens.elevated,
          overflow: "hidden",
        }}
      >
        {imgSrc && (
          <img
            src={imgSrc}
            alt=""
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              filter: "brightness(0.8) saturate(0.85)",
              transform: inView ? "scale(1.0)" : "scale(1.06)",
              transition: "transform 1200ms ease",
            }}
          />
        )}

        {/* Gradient overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: tokens.imageOverlay,
          }}
        />

        {/* BREAKING pill */}
        {breaking && (
          <div
            style={{
              position: "absolute",
              top: 10,
              left: 14,
              background: tokens.pink,
              borderRadius: RADIUS.sm - 2,
              padding: "3px 8px",
              fontFamily: FONT.mono,
              fontSize: SIZE.label2xs,
              letterSpacing: "2px",
              textTransform: "uppercase",
              color: "#ffffff",
              fontWeight: WEIGHT.bold,
            }}
          >
            Breaking
          </div>
        )}

        {/* Publisher name — always pub colour, never overridden by breaking */}
        <div
          style={{
            position: "absolute",
            bottom: 10,
            left: 16,
            fontFamily: FONT.mono,
            fontSize: SIZE.labelXs,
            letterSpacing: "2px",
            textTransform: "uppercase",
            color: pubColor,
            fontWeight: WEIGHT.bold,
          }}
        >
          {publisher}
        </div>

        {/* Hub Index score */}
        <div style={{ position: "absolute", top: 10, right: 14 }}>
          <HubIndexScore score={score} />
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ padding: "13px 16px 15px" }}>
        {/* Headline */}
        <div
          style={{
            fontFamily: FONT.sora,
            fontSize: SIZE.bodyLg,
            fontWeight: WEIGHT.bold,
            color: hexToRgba(tokens.text100, 0.95),
            lineHeight: 1.4,
            marginBottom: SPACE[1] + 3,
            letterSpacing: "-0.2px",
          }}
        >
          {headline}
        </div>

        {/* Summary OR "read →" fallback */}
        {summary ? (
          <div
            style={{
              fontFamily: FONT.sora,
              fontSize: SIZE.bodySm,
              color: tokens.text50,
              lineHeight: 1.6,
              marginBottom: SPACE[2],
            }}
          >
            {summary}
          </div>
        ) : articleUrl ? (
          <div style={{ marginBottom: SPACE[2] }}>
            <a
              href={articleUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              style={{
                fontFamily: FONT.sora,
                fontSize: SIZE.bodySm,
                color: tokens.teal,
                textDecoration: "none",
                transition: `color ${DURATION.fast}ms ease`,
              }}
              onMouseEnter={e => (e.currentTarget.style.color = tokens.pink)}
              onMouseLeave={e => (e.currentTarget.style.color = tokens.teal)}
            >
              read →
            </a>
          </div>
        ) : null}

        {/* Timestamp */}
        <div
          style={{
            fontFamily: FONT.mono,
            fontSize: SIZE.labelXs,
            color: hexToRgba(tokens.text100, 0.20),
            letterSpacing: "1px",
          }}
        >
          {time}
        </div>
      </div>
    </div>
  );
}
