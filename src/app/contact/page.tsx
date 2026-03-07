import type { Metadata } from 'next'
import PageLayout from '@/components/PageLayout'

export const metadata: Metadata = {
  title: 'Get In Touch — PLHub',
  description: 'PLHub is a one-person operation. That person reads everything.',
}

const sections = [
  {
    title: 'Found something broken?',
    body: 'Please tell me. I\'m not precious about it. If something '
      + 'doesn\'t work, isn\'t loading, looks wrong on your phone, or is '
      + 'showing content it shouldn\'t — I want to know.',
  },
  {
    title: 'Story missing? Source you\'d like added?',
    body: 'The source list is curated and deliberately not exhaustive. If '
      + 'there\'s a publication covering the PL well that isn\'t in the '
      + 'feed, suggest it. If it\'s good, I\'ll add it. If it isn\'t, '
      + 'I\'ll be polite about why.',
  },
  {
    title: 'Feedback on the voice or the product?',
    body: 'Also welcome. PLHub is a living thing. The voice evolves. The '
      + 'product improves. Genuine feedback from people who use it is '
      + 'the only way that happens.',
  },
  {
    title: 'What I\'m not looking for.',
    body: 'Sponsored content. Link insertion. Anyone who has read nothing '
      + 'on the site and just found my email. Gambling companies. '
      + 'Especially gambling companies.',
  },
]

export default function ContactPage() {
  return (
    <PageLayout
      headline="Get in touch"
      subheading="PLHub is a one-person operation. That person is me, Gautam. I read everything."
    >
      {sections.map((s) => (
        <Section key={s.title} title={s.title} body={s.body} />
      ))}

      {/* Email CTA */}
      <div style={{
        padding: '24px',
        background: 'color-mix(in srgb, var(--plh-teal) 8%, transparent)',
        border: '1px solid color-mix(in srgb, var(--plh-teal) 20%, transparent)',
        borderRadius: '8px',
      }}>
        <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--plh-teal)',
          letterSpacing: '1.5px', textTransform: 'uppercase',
          fontFamily: "'Sora', sans-serif", margin: '0 0 8px' }}>
          How to reach me
        </p>
        <a href="mailto:hi@plhub.co.uk" style={{
          fontSize: '22px', fontWeight: 600,
          color: 'var(--plh-text-100)',
          textDecoration: 'none',
          fontFamily: "'Sora', sans-serif",
          display: 'block', marginBottom: '12px',
        }}>
          hi@plhub.co.uk
        </a>
        <p style={{ fontSize: '15px', color: 'rgba(250,245,240,0.6)',
          fontWeight: 300, fontFamily: "'Sora', sans-serif", margin: 0,
          fontStyle: 'italic' }}>
          I'll get back to you. It might take a day or two because there
          is, as mentioned, one of me. But I will.
        </p>
      </div>

      <BackLink />
    </PageLayout>
  )
}

function Section({ title, body }: { title: string; body: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px',
      paddingBottom: '24px',
      borderBottom: '1px solid var(--plh-border)' }}>
      <h2 style={{ fontSize: '18px', fontWeight: 700,
        color: 'var(--plh-text-100)', margin: 0,
        fontFamily: "'Sora', sans-serif" }}>{title}</h2>
      <p style={{ fontSize: '16px', lineHeight: 1.75,
        color: 'rgba(250,245,240,0.8)', fontWeight: 300, margin: 0,
        fontFamily: "'Sora', sans-serif" }}>{body}</p>
    </div>
  )
}

function BackLink() {
  return (
    <a href="/" style={{ display: 'inline-flex', alignItems: 'center',
      gap: '6px', fontSize: '14px', color: 'var(--plh-teal)',
      textDecoration: 'none', fontFamily: "'Sora', sans-serif",
      marginTop: '8px' }}>
      ← Back to PLHub
    </a>
  )
}
