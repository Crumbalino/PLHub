'use client'

import ModuleTile from './ModuleTile'

interface QuoteData {
  text: string
  attribution: string
  context: string
  editorialFrame?: string
}

interface TheQuoteProps {
  quote: QuoteData | null
}

export default function TheQuote({ quote }: TheQuoteProps) {
  // Don't render if quote is null (MVP doesn't have quote extraction yet)
  if (!quote) {
    return null
  }

  return (
    <ModuleTile icon="🎙️" label="The Quote">
      <div className="px-4 py-3">
        {/* Quote text */}
        <p
          className="text-[16px] font-light italic leading-[1.5] mb-2"
          style={{ color: 'rgba(250, 245, 240, 0.8)' }}
        >
          "{quote.text}"
        </p>

        {/* Attribution */}
        <p
          className="text-[11px] mb-1"
          style={{ color: 'rgba(250, 245, 240, 0.5)' }}
        >
          {quote.attribution}
        </p>

        {/* Context */}
        <p
          className="text-[10px] mb-2"
          style={{ color: 'rgba(250, 245, 240, 0.3)' }}
        >
          {quote.context}
        </p>

        {/* Editorial frame (if provided) */}
        {quote.editorialFrame && (
          <p
            className="text-[12px] font-light italic"
            style={{ color: 'rgba(250, 245, 240, 0.4)' }}
          >
            {quote.editorialFrame}
          </p>
        )}
      </div>
    </ModuleTile>
  )
}
