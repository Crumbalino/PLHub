'use client'

interface QuoteStripProps {
  quote: string
  attribution: string
  club?: string | null
  context?: string | null
}

export default function QuoteStrip({
  quote,
  attribution,
  club,
  context,
}: QuoteStripProps) {
  if (!quote || !attribution) {
    return null
  }

  return (
    <div
      className="text-center py-4"
      style={{ padding: '14px 20px' }}
    >
      {/* Quote text */}
      <p
        className="text-[14px] italic leading-[1.5] mb-3"
        style={{
          color: 'rgba(250, 245, 240, 0.85)',
          fontFamily: 'var(--font-sora)',
        }}
      >
        "{quote}"
      </p>

      {/* Attribution */}
      <p
        className="text-[11px] font-semibold text-white"
        style={{
          fontFamily: 'var(--font-sora)',
          marginBottom: context ? '4px' : 0,
        }}
      >
        — {attribution}
      </p>

      {/* Context (if available) */}
      {context && (
        <p
          className="text-[10px]"
          style={{
            color: 'rgba(250, 245, 240, 0.45)',
          }}
        >
          {context}
        </p>
      )}
    </div>
  )
}
