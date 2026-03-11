// ─────────────────────────────────────────────────────────────────
// The single bracket SVG primitive used everywhere.
//
// variant="tl" → top-left opening bracket  (logo, Hub Index, TypeLabel)
// variant="br" → bottom-right closing bracket (content frames, Quote card)
//
// GRAMMAR RULE (from brand doc §07):
//   1 bracket (TL only)  = data point  → Hub Index score, logo, TypeLabel
//   2 brackets (TL + BR) = content frame → Snapshot, Quote card brackets
//
// RN: replace with react-native-svg <Svg><Path>
// ─────────────────────────────────────────────────────────────────

interface BracketSVGProps {
  size?: number;
  color: string;
  variant?: "tl" | "br";
  strokeWidth?: number;
  style?: React.CSSProperties;
}

export default function BracketSVG({
  size = 24,
  color,
  variant = "tl",
  strokeWidth = 3,
  style,
}: BracketSVGProps) {
  const path = variant === "tl" ? "M2 14V2H14" : "M22 10V22H10";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      style={style}
      aria-hidden="true"
    >
      <path
        d={path}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </svg>
  );
}
