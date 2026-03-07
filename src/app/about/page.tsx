import type { Metadata } from 'next'
import React from 'react'
import PageLayout from '@/components/PageLayout'

export const metadata: Metadata = {
  title: 'About PLHub — The Premier League Without the Noise',
  description:
    'PLHub is a Premier League news aggregator built by a Spurs fan. ' +
    'No popups, no paywalls, no gambling ads, no nonsense.',
}

export default function AboutPage() {
  return (
    <PageLayout
      headline="The Premier League. Without the noise."
      subheading="PLHub is a Premier League news aggregator. No popups. No paywalls. No gambling ads. No one screaming into a camera. Just the football, right now."
    >
      <Section>
        <P>
          I&apos;m Gautam. I&apos;m a Spurs fan. Last season we won the Europa League
          and finished seventeenth. In the same season. With, I want to be
          clear, the worst squad I&apos;d seen in decades.
        </P>
        <P strong>Only us.</P>
      </Section>

      <Section>
        <P>
          I built PLHub because I was tired. Tired of opening six different
          apps to get the full picture. Tired of paywalls appearing halfway
          through a match report. Tired of reaction channels making a living
          out of our misery. Tired of clickbait headlines that promise
          everything and deliver nothing. Tired of gambling ads on every
          single page, every single day.
        </P>
        <P>
          The Premier League is the best football competition in the world.
          The coverage of it is a mess.
        </P>
      </Section>

      <Section>
        <P>
          PLHub aggregates the best PL journalism from across the web —
          BBC Sport, The Guardian, Sky Sports, and more — runs it through
          an AI that reads like a person rather than a press release, ranks
          it by what actually matters, and puts it all in one place. No
          account needed. No subscription required. No nonsense.
        </P>
        <P>
          The voice you&apos;re reading was designed by me. The AI follows rules
          I set. The judgement about what matters is mine. I just don&apos;t have
          to type every word from scratch, which is good because there is,
          as mentioned, one of me.
        </P>
      </Section>

      <Section>
        <P>
          We cover the PL the way a proper fan watches football. With full
          attention. With genuine love. With no illusions whatsoever about
          how this is probably going to go.
        </P>
        <P>
          Unearned confidence. Bar comes up. We fall through. Hair
          dishevelled. Drink up Trig, we&apos;re going.
        </P>
        <P strong>Welcome to PLHub.</P>
      </Section>

      <BackLink />
    </PageLayout>
  )
}

// ── Local components ──────────────────────────────────────────────────

function Section({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        paddingBottom: '24px',
        borderBottom: '1px solid var(--plh-border)',
      }}
    >
      {children}
    </div>
  )
}

function P({
  children,
  strong,
}: {
  children: React.ReactNode
  strong?: boolean
}) {
  return (
    <p
      style={{
        fontSize: '17px',
        lineHeight: 1.75,
        color: strong ? 'var(--plh-text-100)' : 'rgba(250,245,240,0.8)',
        fontWeight: strong ? 600 : 300,
        fontFamily: "'Sora', sans-serif",
        margin: 0,
      }}
    >
      {children}
    </p>
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
