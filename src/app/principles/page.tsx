import type { Metadata } from 'next'
import React from 'react'
import PageLayout from '@/components/PageLayout'

export const metadata: Metadata = {
  title: 'What PLHub Stands For — Our Principles',
  description:
    'Five things PLHub will never compromise on. Starting with: ' +
    'no gambling content, ever.',
}

const principles = [
  {
    number: '01',
    title: 'No gambling content. Full stop.',
    body: [
      'No ads. No sponsored content. No odds. No affiliate links. ' +
        'No "bet responsibly" small print that implies we have anything ' +
        "to do with betting. We don't. We won't.",
      "This isn't a policy position — it's personal. Football and " +
        'gambling have become inseparable in a way that genuinely ' +
        'worries me, and PLHub is a space where that stops.',
    ],
  },
  {
    number: '02',
    title: 'Respect your time.',
    body: [
      "You have a life. You don't need seventeen articles saying the " +
        "same thing, a popup asking for your email before you've read " +
        'a word, and an autoplaying video in the corner.',
      "You need the story, quickly, told well. That's what we're here for.",
    ],
  },
  {
    number: '03',
    title: 'Respect your intelligence.',
    body: [
      "You've been watching football for decades. You don't need us " +
        "to explain what a clean sheet is. You don't need manufactured " +
        "drama around a routine result. You don't need clickbait.",
      'You need someone to trust that you can handle the actual information.',
    ],
  },
  {
    number: '04',
    title: "No punching down.",
    body: [
      "We don't make content out of other fans' misery. We're not " +
        "posting a reaction video of someone crying. We're not " +
        "celebrating a relegation like it's a personal victory.",
      'Every club in this league has supporters who love them. We write for all of them.',
    ],
  },
  {
    number: '05',
    title: 'Joy is the point.',
    body: [
      'This is a hobby built out of love for football. The voice should ' +
        'feel like it was made by someone who genuinely enjoys this. ' +
        'Because I do. Even when Spurs finish seventeenth.',
      "The delusional optimism is not an affectation. It's a survival " +
        'mechanism. Next season, Rodney.',
    ],
  },
]

export default function PrinciplesPage() {
  return (
    <PageLayout
      headline="What we stand for"
      subheading="PLHub exists because the internet broke football coverage. These are the things that won't change, regardless of how big this gets."
    >
      {principles.map((p) => (
        <Principle key={p.number} {...p} />
      ))}
      <BackLink />
    </PageLayout>
  )
}

// ── Local components ──────────────────────────────────────────────────

function Principle({
  number,
  title,
  body,
}: {
  number: string
  title: string
  body: string[]
}) {
  return (
    <div
      style={{
        display: 'flex',
        gap: '20px',
        paddingBottom: '24px',
        borderBottom: '1px solid var(--plh-border)',
      }}
    >
      <span
        style={{
          fontSize: '13px',
          fontWeight: 700,
          color: 'var(--plh-pink)',
          flexShrink: 0,
          fontFamily: "'JetBrains Mono', monospace",
          paddingTop: '4px',
          letterSpacing: '1px',
        }}
      >
        {number}
      </span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <h2
          style={{
            fontSize: '20px',
            fontWeight: 700,
            color: 'var(--plh-text-100)',
            margin: 0,
            fontFamily: "'Sora', sans-serif",
            lineHeight: 1.3,
          }}
        >
          {title}
        </h2>
        {body.map((para, i) => (
          <p
            key={i}
            style={{
              fontSize: '16px',
              lineHeight: 1.75,
              color: 'rgba(250,245,240,0.8)',
              margin: 0,
              fontWeight: 300,
              fontFamily: "'Sora', sans-serif",
            }}
          >
            {para}
          </p>
        ))}
      </div>
    </div>
  )
}

function BackLink() {
  return (
    <a
      href="/"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '14px',
        color: 'var(--plh-teal)',
        textDecoration: 'none',
        fontFamily: "'Sora', sans-serif",
        marginTop: '8px',
      }}
    >
      ← Back to PLHub
    </a>
  )
}
