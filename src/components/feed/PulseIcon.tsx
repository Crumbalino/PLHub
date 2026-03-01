/** The PLHub pulse icon — heartbeat line SVG. Used in score badges, trending, expand buttons. */
export default function PulseIcon({
  size = 14,
  className = '',
  color = 'var(--plh-gold)',
}: {
  size?: number
  className?: string
  /** Stroke color. Defaults to brand gold via CSS variable. */
  color?: string
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={className}
    >
      <path
        d="M4 16h7l2.5-7 5 14 2.5-7H28"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
