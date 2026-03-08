'use client'
import { useState } from 'react'

const SOURCE_COLORS: Record<string, string> = {
  'BBC Sport': '#D4A843',
  'BBC SPORT': '#D4A843',
  'Sky Sports': '#E84080',
  'SKY SPORTS': '#E84080',
  'The Guardian': '#3AAFA9',
  'THE GUARDIAN': '#3AAFA9',
  'talkSPORT': '#8AACCC',
  'TALKSPORT': '#8AACCC',
  'Goal': '#C084FC',
  'GOAL': '#C084FC',
  '90min': '#F97316',
  '90MIN': '#F97316',
  'ESPN FC': '#E8402A',
  'ESPN.COM': '#E8402A',
  'FourFourTwo': '#C084FC',
  'FOURFOURTWO': '#C084FC',
  'Football365': '#F97316',
  'FOOTBALL365': '#F97316',
  'The Independent': '#6B9E78',
  'THE INDEPENDENT': '#6B9E78',
}

function getColor(sourceName: string | null | undefined): string {
  if (!sourceName) return '#3AAFA9'
  return SOURCE_COLORS[sourceName] || SOURCE_COLORS[sourceName.toUpperCase()] || '#3AAFA9'
}

interface Story {
  id: string
  headline: string
  summary: string | null
  source: { name: string; url: string }
  clubs: Array<{ slug: string; shortName: string; code: string; badgeUrl: string }>
  plhub_index: number | null
  image_url: string | null
}

interface CardData {
  label: string
  story?: Story | null
  headline?: string | null
  imageUrl?: string | null
  source?: { name: string } | null
  plhubIndex?: number | null
}

function ScoreBadge({ score }: { score: number }) {
  return (
    <span style={{
      position: 'absolute',
      top: '8px',
      right: '8px',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '3px',
      background: 'rgba(13,27,42,0.75)',
      border: '1px solid rgba(250,245,240,0.12)',
      borderRadius: '5px',
      padding: '2px 6px',
      zIndex: 10,
    }}>
      <svg width="9" height="9" viewBox="0 0 24 24" fill="none">
        <path d="M2 14V2H14" stroke="#3AAFA9" strokeWidth="3.5" strokeLinecap="round"/>
      </svg>
      <span style={{
        fontSize: '13px',
        fontWeight: 700,
        fontFamily: "'JetBrains Mono','Consolas','Courier New',monospace",
        color: '#FAF5F0',
        lineHeight: 1,
      }}>
        {score}
      </span>
    </span>
  )
}

function GridCard({ label, story, headline, imageUrl, source, plhubIndex }: CardData) {
  const [hovered, setHovered] = useState(false)
  const displayHeadline = story?.headline || headline || ''
  const displayImage = story?.image_url || imageUrl || null
  const displaySource = story?.source?.name || source?.name || null
  const displayScore = story?.plhub_index ?? plhubIndex ?? null
  const sourceColor = getColor(displaySource)

  const handleClick = () => {
    if (story?.id) {
      const el = document.getElementById(`post-${story.id}`)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <div
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        aspectRatio: '4/3',
        borderRadius: '8px',
        overflow: 'hidden',
        cursor: 'pointer',
        background: 'var(--plh-elevated)',
        borderLeft: `3px solid ${sourceColor}`,
      }}
    >
      {/* Background image */}
      {displayImage && (
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url(${displayImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          transform: hovered ? 'scale(1.04)' : 'scale(1)',
          transition: 'transform 300ms ease',
        }} />
      )}

      {/* Gradient overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(to top, rgba(10,20,32,0.95) 0%, rgba(10,20,32,0.4) 55%, transparent 100%)',
      }} />

      {/* Score badge */}
      {displayScore !== null && <ScoreBadge score={displayScore} />}

      {/* Content */}
      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        padding: '12px',
      }}>
        {/* Label */}
        <span style={{
          fontSize: '9px',
          fontWeight: 700,
          letterSpacing: '1.5px',
          textTransform: 'uppercase',
          color: sourceColor,
          fontFamily: "'Sora', sans-serif",
          marginBottom: '5px',
        }}>
          {label}
        </span>

        {/* Headline — one line */}
        <p style={{
          fontSize: '13px',
          fontWeight: 600,
          lineHeight: 1.3,
          color: '#FAF5F0',
          fontFamily: "'Sora', sans-serif",
          margin: 0,
          marginBottom: '8px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {displayHeadline}
        </p>

        {/* Bottom row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
          {displaySource && (
            <span style={{
              fontSize: '9px',
              fontWeight: 600,
              letterSpacing: '1px',
              textTransform: 'uppercase',
              color: sourceColor,
              fontFamily: "'Sora', sans-serif",
            }}>
              {displaySource}
            </span>
          )}
          {story?.clubs && story.clubs.length > 0 && (
            <div style={{ display: 'flex', gap: '4px' }}>
              {story.clubs.slice(0, 2).map(club => (
                <span key={club.slug} style={{
                  fontSize: '9px',
                  fontWeight: 700,
                  letterSpacing: '0.5px',
                  textTransform: 'uppercase',
                  color: '#0D1B2A',
                  background: '#3AAFA9',
                  padding: '2px 5px',
                  borderRadius: '3px',
                  fontFamily: "'Sora', sans-serif",
                }}>
                  {club.code}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function SnapshotCardGrid({ cards }: { cards: CardData[] }) {
  if (!cards || cards.length === 0) return null
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
      {cards.map((card, idx) => (
        <GridCard key={idx} {...card} />
      ))}
    </div>
  )
}
