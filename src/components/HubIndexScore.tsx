// ─────────────────────────────────────────────────────────────────
// Hub Index score pill — appears top-right of every NewsCard image zone.
// TL bracket (teal, 10px) + score number (JetBrains Mono 13px bold teal).
// Soft teal pill background at 10% opacity.
// Tooltip (4 pillars) is a future sprint — not implemented here.
//
// RN: swap div → View, span → Text.
// ─────────────────────────────────────────────────────────────────

import BracketSVG from "./BracketSVG";
import { useTheme } from "@/lib/theme-context";
import { FONT, SIZE, WEIGHT, RADIUS } from "@/lib/tokens";
import { hexToRgba } from "@/lib/utils";

interface HubIndexScoreProps {
  score: number;
}

export default function HubIndexScore({ score }: HubIndexScoreProps) {
  const { tokens } = useTheme();
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "4px 10px 4px 7px",
        borderRadius: RADIUS.sm,
        background: hexToRgba(tokens.teal, 0.10),
      }}
    >
      <BracketSVG size={10} color={tokens.teal} variant="tl" strokeWidth={3.5} />
      <span
        style={{
          fontFamily: FONT.mono,
          fontSize: SIZE.bodyLg,
          fontWeight: WEIGHT.bold,
          color: tokens.teal,
          lineHeight: 1,
        }}
      >
        {score}
      </span>
    </div>
  );
}
