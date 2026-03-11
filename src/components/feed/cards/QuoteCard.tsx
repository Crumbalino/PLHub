'use client';
import YourVerdict from '../YourVerdict';
import { type ReactionIdx } from '@/lib/reactions';

const WHITE = '#F8F9FB';
const W70 = 'rgba(248,249,251,0.7)';
const W50 = 'rgba(248,249,251,0.5)';

interface QuoteCardProps {
  id: string;
  quote: string;
  author: string;
  context?: string;
}

export default function QuoteCard({ id, quote, author, context }: QuoteCardProps) {
  const handleVote = (reactionIdx: ReactionIdx) => {
    console.log(`[QuoteCard] Voted with reaction ${reactionIdx}`);
  };

  return (
    <div
      style={{
        borderRadius: '10px',
        background: 'var(--plh-card)',
        border: '1px solid var(--plh-border)',
        overflow: 'hidden',
        animation: 'tfhSlideUp 0.5s ease-out',
      }}
    >
      <div style={{ padding: '24px' }}>
        {/* Quote Icon */}
        <div style={{ marginBottom: '16px', fontSize: '32px', lineHeight: 1 }}>
          "
        </div>

        {/* Quote Text */}
        <blockquote
          style={{
            fontFamily: "'Sora', sans-serif",
            fontSize: '15px',
            fontStyle: 'italic',
            color: WHITE,
            margin: '0 0 16px 0',
            lineHeight: 1.6,
            borderLeft: '3px solid rgba(248,249,251,0.2)',
            paddingLeft: '16px',
          }}
        >
          {quote}
        </blockquote>

        {/* Author */}
        <div style={{ marginBottom: context ? '12px' : '0' }}>
          <p
            style={{
              fontFamily: "'Sora', sans-serif",
              fontSize: '12px',
              fontWeight: 600,
              color: W70,
              margin: 0,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            — {author}
          </p>
        </div>

        {/* Context */}
        {context && (
          <p
            style={{
              fontFamily: "'Sora', sans-serif",
              fontSize: '11px',
              color: W50,
              margin: '0 0 16px 0',
              lineHeight: 1.4,
            }}
          >
            {context}
          </p>
        )}

        {/* Verdict */}
        <YourVerdict cardId={id} onVote={handleVote} />
      </div>
    </div>
  );
}
