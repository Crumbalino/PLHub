'use client'
import { getSourceColor } from '@/lib/theme'

interface SnapshotStory {
  id: string
  headline: string
  summary?: string | null
  source: { name: string; url: string }
  url: string
  clubs: Array<{ slug: string; shortName: string; code: string; badgeUrl: string }>
  plhub_index?: number | null
  image_url?: string | null
  published_at?: string | null
}

interface BottomCardsProps {
  transferStory: SnapshotStory | null
  beyondBigSixStory: SnapshotStory | null
  fplStory: SnapshotStory | null
  andFinallyData: { has_content: boolean; headline: string | null; colour_line: string | null; image_url?: string | null } | null
}

function ScoreBadge({ score }: { score: number }) {
  return (
    <span style={{
      position: 'absolute',
      top: '8px',
      right: '8px',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      color: 'var(--plh-gold)',
      fontWeight: 700,
      fontSize: '16px',
      fontFamily: "'Consolas','Courier New',monospace",
      lineHeight: 1,
      zIndex: 10,
    }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <path d="M22 10V22H10" stroke="var(--plh-gold)" strokeWidth="3.5" strokeLinecap="round"/>
      </svg>
      {score}
    </span>
  )
}

function PhotoCard({ story, label, labelColor }: {
  story: SnapshotStory
  label: string
  labelColor: string
}) {
  const sourceColor = getSourceColor(story.source.name)
  return (
    <a
      href={story.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block h-full rounded-lg overflow-visible cursor-pointer"
      style={{ position: 'relative', textDecoration: 'none' }}
    >
      <div
        className="relative h-full rounded-lg overflow-hidden"
        style={{
          background: story.image_url
            ? `linear-gradient(to top, rgba(10,20,32,0.95) 0%, rgba(10,20,32,0.4) 60%, transparent 100%), url(${story.image_url}) center/cover no-repeat`
            : 'var(--plh-elevated)',
          minHeight: '160px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          padding: '12px',
          border: '1px solid var(--plh-border)',
        }}
      >
        {story.plhub_index != null && <ScoreBadge score={story.plhub_index} />}
        <div>
          <span style={{
            display: 'inline-block',
            fontSize: '9px',
            fontWeight: 700,
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
            color: labelColor,
            fontFamily: "'Sora', sans-serif",
            marginBottom: '6px',
          }}>
            {label}
          </span>
          <p style={{
            fontSize: '13px',
            fontWeight: 600,
            lineHeight: 1.35,
            color: 'var(--plh-text-100)',
            fontFamily: "'Sora', sans-serif",
            margin: 0,
          }}>
            {story.headline}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
            <span style={{
              fontSize: '9px',
              fontWeight: 600,
              letterSpacing: '1px',
              textTransform: 'uppercase',
              color: sourceColor,
              fontFamily: "'Sora', sans-serif",
            }}>
              {story.source.name}
            </span>
            {story.clubs?.[0]?.slug && (
              <span style={{
                fontSize: '9px',
                fontWeight: 700,
                letterSpacing: '1px',
                textTransform: 'uppercase',
                color: 'var(--plh-bg)',
                background: 'var(--plh-teal)',
                padding: '2px 6px',
                borderRadius: '3px',
                fontFamily: "'Sora', sans-serif",
              }}>
                {story.clubs[0].slug.toUpperCase().substring(0, 3)}
              </span>
            )}
          </div>
        </div>
      </div>
    </a>
  )
}

function AndFinallyCard({ headline, imagUrl, colourLine }: { headline: string; imagUrl?: string; colourLine?: string | null }) {
  return (
    <div
      className="relative h-full rounded-lg overflow-hidden"
      style={{
        background: imagUrl
          ? `linear-gradient(to top, rgba(10,20,32,0.95) 0%, rgba(10,20,32,0.4) 60%, transparent 100%), url(${imagUrl}) center/cover no-repeat`
          : 'var(--plh-elevated)',
        minHeight: '160px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        padding: '12px',
        border: '1px solid var(--plh-border)',
        borderLeft: colourLine ? `3px solid ${colourLine}` : '3px solid var(--plh-gold)',
      }}
    >
      <span style={{
        display: 'inline-block',
        fontSize: '9px',
        fontWeight: 700,
        letterSpacing: '1.5px',
        textTransform: 'uppercase',
        color: colourLine || 'var(--plh-gold)',
        fontFamily: "'Sora', sans-serif",
        marginBottom: '6px',
      }}>
        And Finally
      </span>
      <p style={{
        fontSize: '13px',
        fontWeight: 600,
        lineHeight: 1.35,
        color: 'var(--plh-text-100)',
        fontFamily: "'Sora', sans-serif",
        margin: 0,
      }}>
        {headline}
      </p>
    </div>
  )
}

export default function BottomCards({ transferStory, beyondBigSixStory, fplStory, andFinallyData }: BottomCardsProps) {
  return (
    <div className="grid grid-cols-3 gap-4" style={{ marginTop: '4px' }}>
      {transferStory && (
        <PhotoCard
          story={transferStory}
          label="Transfers"
          labelColor="var(--plh-teal)"
        />
      )}
      {beyondBigSixStory && (
        <PhotoCard
          story={beyondBigSixStory}
          label="Beyond Big Six"
          labelColor="var(--plh-teal)"
        />
      )}
      {fplStory && (
        <PhotoCard
          story={fplStory}
          label="FPL"
          labelColor="var(--plh-teal)"
        />
      )}
      {andFinallyData?.has_content && andFinallyData.headline && (
        <AndFinallyCard
          headline={andFinallyData.headline}
          imagUrl={andFinallyData.image_url}
          colourLine={andFinallyData.colour_line}
        />
      )}
    </div>
  )
}
