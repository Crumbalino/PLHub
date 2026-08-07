import type { Metadata } from 'next'
import React from 'react'
import PageLayout from '@/components/PageLayout'

export const metadata: Metadata = {
  alternates: { canonical: '/privacy' },
  title: 'Privacy',
  description:
    'What The Football Hub collects, which is almost nothing: no cookies, ' +
    'no analytics, no session recording, no personal data in the database.',
}

/**
 * FACTUAL SECTIONS ARE WRITTEN. FRAMING IS NOT.
 *
 * Every statement of fact below was verified against the codebase on
 * 7 August 2026 — the cookie and analytics claims against src/app/layout.tsx
 * after the trackers were removed, the storage list against the components
 * that write each key, the database claim against the live schema, and the
 * reactions claim against the increment_reaction RPC.
 *
 * Anything that frames, introduces or characterises is a [[COPY: ...]]
 * placeholder for the owner. This is one person's voice and generic text
 * would be worse than none.
 *
 * If any of these facts stops being true, this page is wrong and must change
 * in the same commit. That is the whole point of writing it from an audit
 * rather than from a template.
 */

const P: React.CSSProperties = {
  fontSize: '16px',
  lineHeight: 1.7,
  color: 'var(--plh-text-70)',
  fontFamily: "'Sora', sans-serif",
}

const H: React.CSSProperties = {
  fontSize: '20px',
  fontWeight: 700,
  color: 'var(--plh-text-100)',
  fontFamily: "'Sora', sans-serif",
  marginTop: '16px',
}

const LI: React.CSSProperties = { ...P, marginBottom: '8px' }

export default function PrivacyPage() {
  return (
    <PageLayout
      headline="Privacy"
      subheading="[[COPY: privacy subheading — one line]]"
    >
      <p style={P}>[[COPY: intro paragraph]]</p>

      {/* ── FACT ── */}
      <h2 style={H}>[[COPY: heading — cookies]]</h2>
      <p style={P}>
        This site sets no cookies. There is no cookie banner because there is
        nothing to consent to.
      </p>
      <p style={P}>
        Until 6 August 2026 the site loaded Google Analytics and Microsoft
        Clarity, a session-recording tool, on every page. Both set cookies and
        neither asked permission. Both have been removed.
      </p>

      {/* ── FACT ── */}
      <h2 style={H}>[[COPY: heading — analytics]]</h2>
      <p style={P}>
        There is no analytics, no session recording, no heatmapping, no
        advertising pixel and no tag manager. Nothing measures you, and nothing
        reports your visit to a third party.
      </p>
      <p style={P}>
        Web fonts are served from this domain. No request is made to Google
        Fonts or any other font host, so no font provider receives your IP
        address.
      </p>

      {/* ── FACT ── */}
      <h2 style={H}>[[COPY: heading — what your browser stores]]</h2>
      <p style={P}>
        Four things are saved in your own browser so the site behaves the way
        you left it. All four stay on your device. None is transmitted to this
        site or to anyone else, and none identifies you.
      </p>
      <ul style={{ paddingLeft: '20px', margin: 0 }}>
        <li style={LI}>Whether you chose light or dark mode.</li>
        <li style={LI}>Which club you last filtered the feed to.</li>
        <li style={LI}>Which stories you have expanded today, to show reading progress.</li>
        <li style={LI}>Which cards you have already reacted to, so you are not asked twice.</li>
      </ul>
      <p style={P}>
        Clearing your browser data removes all of it. Nothing is restored,
        because we never had a copy.
      </p>

      {/* ── FACT ── */}
      <h2 style={H}>[[COPY: heading — the database]]</h2>
      <p style={P}>
        The database holds football articles, clubs, and the transfer claims
        made in those articles. It holds nothing about visitors. There are no
        accounts, no profiles, no session records and no stored IP addresses.
      </p>
      <p style={P}>
        Reactions on a card increment a counter. The counter records the card
        and the reaction, and nothing about who pressed it.
      </p>
      <p style={P}>
        The personal data the site does hold is about journalists: names and
        bylines already published under their own byline, recorded so a
        transfer claim can be attributed to whoever made it.
      </p>

      {/* ── FACT ── */}
      <h2 style={H}>[[COPY: heading — what our host sees]]</h2>
      <p style={P}>
        This site runs on Vercel. Like any web host, Vercel records standard
        server access logs, which include the IP address the request came from,
        the page requested, and the time. Those logs exist so the site can be
        run and kept secure. They are not used to build a profile of you and
        they are not combined with anything else.
      </p>

      {/* ── FACT ── */}
      <h2 style={H}>[[COPY: heading — images from other sites]]</h2>
      <p style={P}>
        Article thumbnails are loaded directly from the publisher that
        published the article — the BBC, Sky Sports, the Guardian and others.
        Your browser requests those images from those publishers, so they see
        the request in the ordinary way any website you visit does. We do not
        send them anything about you.
      </p>

      {/* ── FACT ── */}
      <h2 style={H}>[[COPY: heading — the newsletter]]</h2>
      <p style={P}>
        The newsletter is not running yet. When it is, signing up stores your
        email address, and your first name if you give one, with the email
        provider that sends it. That is the only personal information this site
        will ask you for.
        {/* [[FACT-PENDING: name the provider. The code currently calls Resend;
            beehiiv is under consideration. Whichever ships, name it here and
            say where it stores data, since a US provider is an international
            transfer.]] */}
      </p>
      <p style={P}>
        You can unsubscribe at any time from a link in any email, and your
        address is deleted when you do.
      </p>

      {/* ── FACT ── */}
      <h2 style={H}>[[COPY: heading — your rights]]</h2>
      <p style={P}>
        UK GDPR gives you the right to ask what personal data an organisation
        holds about you, to have it corrected, and to have it deleted. If you
        have never given us your email address, the answer is that we hold
        nothing about you, and there is nothing to delete.
      </p>
      <p style={P}>
        If you have subscribed, you can ask for your address and name to be
        removed and it will be. You also have the right to complain to the
        Information Commissioner&rsquo;s Office.
      </p>

      {/* ── FACT ── */}
      <h2 style={H}>[[COPY: heading — contact]]</h2>
      <p style={P}>
        Email <a href="mailto:contact@thefootballhub.uk">contact@thefootballhub.uk</a>.
      </p>

      <p style={{ ...P, fontSize: '14px', color: 'var(--plh-text-50)' }}>
        Last updated 7 August 2026.
      </p>
    </PageLayout>
  )
}
