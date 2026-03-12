// ─────────────────────────────────────────────────────────────────
// Family A — the ONLY RSS/external story template.
// Expand in-place interaction. Right-aligned 112×84 thumbnail.
// ─────────────────────────────────────────────────────────────────

"use client";

import { useState } from "react";
import { useInView } from "@/hooks/useInView";
import HubIndexScore from "./HubIndexScore";
import { useTheme } from "@/lib/theme-context";
import { getPublisherColor, getPublisherName, getPublisherColorFromUrl } from "@/lib/publisher-colors";
import { FONT, SIZE, WEIGHT, RADIUS, DURATION, SPACE } from "@/lib/tokens";
import { hexToRgba } from "@/lib/utils";

interface NewsCardProps {
  id: string;
  publisher: string;
  headline: string;
  summary?: string | null;
  content?: string | null;
  score: number;
  time: string;
  imgSrc?: string;
  articleUrl?: string;
  breaking?: boolean;
}

function getFirstSentence(text: string): string {
  if (!text) return "";
  const match = text.match(/^[^.!?]*[.!?]/);
  return match ? match[0].trim() : text.split(" ").slice(0, 20).join(" ");
}

export default function NewsCard({
  id,
  publisher,
  headline,
  summary,
  content,
  score,
  time,
  imgSrc,
  articleUrl,
  breaking = false,
}: NewsCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [ref, inView] = useInView(0.1);
  const { tokens } = useTheme();
  const pubColor = getPublisherColor(publisher);
  const borderColor = breaking ? tokens.pink : pubColor;
  const publisherName = articleUrl ? getPublisherName(articleUrl) : publisher;
  const linkColor = articleUrl ? getPublisherColorFromUrl(articleUrl) : pubColor;

  // Get expandable content: summary > first sentence of content > nothing
  const expandableContent = summary || (content ? getFirstSentence(content) : null);

  const handleHeaderClick = () => {
    setExpanded(!expanded);
  };

  return (
    <div
      id={id}
      ref={ref}
      style={{
        background: tokens.card,
        border: `1px solid ${tokens.borderCard}`,
        borderLeft: `3px solid ${borderColor}`,
        borderRadius: RADIUS.xl,
        overflow: "hidden",
        boxShadow: tokens.shadowCard,
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0)" : "translateY(16px)",
        transition: `opacity ${DURATION.slow}ms ease, transform ${DURATION.slow}ms ease`,
      }}
    >
      {/* ── Card Header (clickable to expand) ── */}
      <div
        onClick={handleHeaderClick}
        role="button"
        tabIndex={0}
        onKeyDown={e => e.key === "Enter" && handleHeaderClick()}
        style={{
          padding: "13px 16px",
          display: "flex",
          gap: "12px",
          alignItems: "flex-start",
          cursor: "pointer",
          background: hexToRgba(tokens.text100, 0.01),
          transition: `background ${DURATION.fast}ms ease`,
        }}
        onMouseEnter={e => (e.currentTarget.style.background = hexToRgba(tokens.text100, 0.025))}
        onMouseLeave={e => (e.currentTarget.style.background = hexToRgba(tokens.text100, 0.01))}
      >
        {/* Left: text content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* BREAKING pill */}
          {breaking && (
            <div
              style={{
                display: "inline-block",
                background: tokens.pink,
                borderRadius: RADIUS.sm - 2,
                padding: "2px 6px",
                fontFamily: FONT.mono,
                fontSize: "7px",
                letterSpacing: "1px",
                textTransform: "uppercase",
                color: "#ffffff",
                fontWeight: WEIGHT.bold,
                marginBottom: 4,
              }}
            >
              Breaking
            </div>
          )}

          {/* Headline */}
          <div
            style={{
              fontFamily: FONT.sora,
              fontSize: SIZE.bodyLg,
              fontWeight: WEIGHT.bold,
              color: "#FFFFFF",
              lineHeight: 1.4,
              marginBottom: SPACE[1],
              letterSpacing: "-0.2px",
            }}
          >
            {headline}
          </div>

          {/* Publisher badge */}
          <div
            style={{
              fontFamily: FONT.mono,
              fontSize: SIZE.label2xs,
              letterSpacing: "1px",
              textTransform: "uppercase",
              color: pubColor,
              fontWeight: WEIGHT.bold,
            }}
          >
            {publisher}
          </div>
        </div>

        {/* Right: thumbnail (if image exists) */}
        {imgSrc && (
          <div
            style={{
              flexShrink: 0,
              width: "112px",
              height: "84px",
              borderRadius: RADIUS.sm - 1,
              overflow: "hidden",
              position: "relative",
              background: tokens.elevated,
              border: `1px solid ${tokens.borderCard}`,
            }}
          >
            <img
              src={imgSrc}
              alt=""
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                filter: "brightness(0.8) saturate(0.85)",
              }}
            />
          </div>
        )}

        {/* Chevron (right side) */}
        <div
          style={{
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 24,
            height: 24,
            color: tokens.teal,
            transition: `transform ${DURATION.normal}ms ease`,
            transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
          }}
        >
          ▼
        </div>
      </div>

      {/* ── Hub Index Score (always visible, on right of header) ── */}
      <div
        style={{
          position: "absolute",
          top: 16,
          right: 16,
        }}
      >
        <HubIndexScore score={score} />
      </div>

      {/* ── Expanded content zone ── */}
      <div
        style={{
          maxHeight: expanded ? "500px" : 0,
          overflow: "hidden",
          opacity: expanded ? 1 : 0,
          transition: `max-height ${DURATION.normal}ms ease, opacity ${DURATION.normal}ms ease`,
        }}
      >
        <div
          style={{
            padding: "0 16px 13px",
            borderTop: `1px solid ${'#FFFFFF'}`,
          }}
        >
          {/* Summary or first sentence */}
          {expandableContent && (
            <div
              style={{
                fontFamily: FONT.sora,
                fontSize: SIZE.bodySm,
                color: "#FFFFFF",
                lineHeight: 1.6,
                marginBottom: SPACE[2],
                marginTop: SPACE[2],
              }}
            >
              {expandableContent}
            </div>
          )}

          {/* Read link */}
          {articleUrl && (
            <a
              href={articleUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              style={{
                fontFamily: FONT.sora,
                fontSize: SIZE.bodySm,
                color: linkColor,
                textDecoration: "none",
                opacity: 0.85,
                transition: `opacity ${DURATION.fast}ms ease, text-decoration ${DURATION.fast}ms ease`,
                display: "inline-block",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.opacity = "1";
                e.currentTarget.style.textDecoration = "underline";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.opacity = "0.85";
                e.currentTarget.style.textDecoration = "none";
              }}
            >
              Read on {publisherName} →
            </a>
          )}

          {/* Timestamp */}
          <div
            style={{
              fontFamily: FONT.mono,
              fontSize: SIZE.labelXs,
              color: '#FFFFFF',
              letterSpacing: "1px",
              marginTop: SPACE[2],
            }}
          >
            {time}
          </div>
        </div>
      </div>
    </div>
  );
}
