// ─────────────────────────────────────────────────────────────────
// Used on all Family B (Content) cards — top of card.
// TL bracket SVG (size 10) + uppercase label text.
// Color = card's accent colour, always passed as prop.
// RN: swap div → View, span → Text.
// ─────────────────────────────────────────────────────────────────

import BracketSVG from "./BracketSVG";
import { FONT, SIZE, WEIGHT } from "@/lib/tokens";

interface TypeLabelProps {
  label: string;
  color: string;
}

export default function TypeLabel({ label, color }: TypeLabelProps) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontFamily: FONT.mono,
        fontSize: SIZE.labelXs,
        letterSpacing: "2px",
        textTransform: "uppercase",
        color,
        fontWeight: WEIGHT.semibold,
      }}
    >
      <BracketSVG size={10} color={color} variant="tl" strokeWidth={3.5} />
      {label}
    </div>
  );
}
