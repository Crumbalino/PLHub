'use client'
import { useState, useRef } from 'react'
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

interface HeroGridProps {
  stories?: SnapshotStory[]
  isLoading?: boolean
}

function ScoreBadge({ score, hovered }: { score: number; hovered?: boolean }) {
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
      filter: hovered ? 'drop-shadow(0 0 8px rgba(212, 168, 67, 0.7))' : 'none',
      transition: 'filter 300ms ease',
    }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <path d="M2 14V2H14" stroke="var(--plh-gold)" strokeWidth="3.5" strokeLinecap="round"/>
      </svg>
      {score}
    </span>
  )
}

function SummaryReveal({ summary }: { summary: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ marginTop: '8px' }} onClick={(e) => e.stopPropagation()}>
      <button
        onClick={(e) => { e.stopPropagation(); e.preventDefault(); setOpen(!open) }}
        style={{
          fontSize: '10px',
          fontWeight: 600,
          letterSpacing: '1px',
          textTransform: 'uppercase',
          color: 'rgba(250,245,240,0.45)',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
          fontFamily: "'Sora', sans-serif",
          transition: 'color 0.2s',
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--plh-gold)' }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'rgba(250,245,240,0.45)' }}
      >
        {open ? 'Hide ▴' : 'Summary ▾'}
      </button>
      {open && (
        <p style={{
          marginTop: '6px',
          fontSize: '12px',
          lineHeight: 1.6,
          color: 'rgba(250,245,240,0.75)',
          fontFamily: "'Sora', sans-serif",
          fontWeight: 300,
        }}>
          {summary}
        </p>
      )}
    </div>
  )
}

function ClubTag({ slug }: { slug?: string }) {
  if (!slug) return null
  return (
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
      {slug.replace('-', ' ').substring(0, 10).toUpperCase()}
    </span>
  )
}

function HeroTile({ story }: { story: SnapshotStory }) {
  const sourceColor = getSourceColor(story.source.name)
  const [hovered, setHovered] = useState(false)
  return (
    <a
      href={story.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block"
      style={{ textDecoration: 'none', height: '100%' }}
    >
      <div
        className="relative rounded-lg overflow-hidden cursor-pointer h-full"
        style={{
          background: 'linear-gradient(135deg, #1c2c3a 0%, #0f1820 100%)',
          minHeight: '360px',
          border: '1px solid var(--plh-border)',
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Background image */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: story.image_url ? `url(${story.image_url})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            overflow: 'hidden',
            borderRadius: 'inherit',
            transform: hovered ? 'scale(1.04)' : 'scale(1)',
            transition: 'transform 300ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          }}
        />

        {/* Gradient overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, rgba(10,20,32,0.97) 0%, rgba(10,20,32,0.55) 45%, transparent 100%)',
          }}
        />

        {story.plhub_index != null && <ScoreBadge score={story.plhub_index} hovered={hovered} />}
        <div
          className="absolute bottom-0 left-0 right-0"
          style={{ padding: '20px' }}
          onClick={(e) => e.stopPropagation()}
        >
          <h2 style={{
            fontSize: '22px',
            fontWeight: 700,
            lineHeight: 1.2,
            color: 'var(--plh-text-100)',
            fontFamily: "'Sora', sans-serif",
            margin: '0 0 10px 0',
          }}>
            {story.headline}
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{
              fontSize: '10px',
              fontWeight: 600,
              letterSpacing: '1px',
              textTransform: 'uppercase',
              color: sourceColor,
              fontFamily: "'Sora', sans-serif",
            }}>
              {story.source.name}
            </span>
            <ClubTag slug={story.clubs?.[0]?.slug} />
          </div>
          {story.summary && <SummaryReveal summary={story.summary} />}
        </div>
      </div>
    </a>
  )
}

function SidekickTile({ story }: { story: SnapshotStory }) {
  const sourceColor = getSourceColor(story.source.name)
  const [hovered, setHovered] = useState(false)
  return (
    <a
      href={story.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block"
      style={{ textDecoration: 'none', height: '100%' }}
    >
      <div
        className="relative rounded-lg overflow-hidden cursor-pointer h-full"
        style={{
          background: 'linear-gradient(135deg, #1c2c3a 0%, #0f1820 100%)',
          minHeight: '160px',
          border: '1px solid var(--plh-border)',
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Background image */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: story.image_url ? `url(${story.image_url})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            overflow: 'hidden',
            borderRadius: 'inherit',
            transform: hovered ? 'scale(1.04)' : 'scale(1)',
            transition: 'transform 300ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          }}
        />

        {/* Gradient overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, rgba(10,20,32,0.97) 0%, rgba(10,20,32,0.45) 50%, transparent 100%)',
          }}
        />

        {story.plhub_index != null && <ScoreBadge score={story.plhub_index} hovered={hovered} />}
        <div
          className="absolute bottom-0 left-0 right-0"
          style={{ padding: '14px' }}
          onClick={(e) => e.stopPropagation()}
        >
          <h3 style={{
            fontSize: '14px',
            fontWeight: 600,
            lineHeight: 1.3,
            color: 'var(--plh-text-100)',
            fontFamily: "'Sora', sans-serif",
            margin: '0 0 8px 0',
          }}>
            {story.headline}
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
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
            <ClubTag slug={story.clubs?.[0]?.slug} />
          </div>
          {story.summary && <SummaryReveal summary={story.summary} />}
        </div>
      </div>
    </a>
  )
}

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4" style={{ marginBottom: '4px' }}>
      <div className="rounded-lg animate-pulse" style={{ background: 'var(--plh-elevated)', minHeight: '360px' }} />
      <div className="grid grid-rows-2 gap-4">
        <div className="rounded-lg animate-pulse" style={{ background: 'var(--plh-elevated)', minHeight: '160px' }} />
        <div className="rounded-lg animate-pulse" style={{ background: 'var(--plh-elevated)', minHeight: '160px' }} />
      </div>
    </div>
  )
}

export default function HeroGrid({ stories = [], isLoading = false }: HeroGridProps) {
  if (isLoading) return <LoadingSkeleton />
  if (!stories.length) return null

  const [hero, ...rest] = stories
  const sidekicks = rest.slice(0, 2)

  return (
    <div className="grid grid-cols-2 gap-4" style={{ marginBottom: '4px' }}>
      {/* Hero — left column, full height */}
      <HeroTile story={hero} />

      {/* Sidekicks — right column, stacked */}
      <div className="grid grid-rows-2 gap-4">
        {sidekicks.map((story) => (
          <SidekickTile key={story.id} story={story} />
        ))}
      </div>
    </div>
  )
}
