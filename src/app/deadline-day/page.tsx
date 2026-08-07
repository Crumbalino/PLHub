import type { Metadata } from 'next'
import React from 'react'
import PageLayout from '@/components/PageLayout'
import { JsonLd, breadcrumbSchema } from '@/components/JsonLd'
import { SITE_URL } from '@/lib/site'

/**
 * STRUCTURE AND SCHEMA ONLY — NO BODY COPY YET.
 *
 * Created 7 August 2026 as a stub, deliberately. Every section below is an empty
 * shell with a TODO for the copy, because:
 *
 *   - EDITORIAL_VOICE governs every string that ships and nothing here has been
 *     written by G yet. Placeholder prose is what PR #33 spent a pass removing;
 *     re-adding it to a new page would undo that work.
 *   - The page cannot say what deadline day coverage IS until the column exists.
 *     That is blocked on ten hand-written items.
 *
 * NOINDEX AND NOT IN THE SITEMAP, on purpose. The site went indexable on
 * 7 Aug 2026, and an empty page in the index is a thin-content page competing
 * with the pages that are finished. Both come off in the same commit that adds
 * the copy — not before, and not separately.
 *
 * NOTE: this is the first page in the app to override `robots`. CLAUDE.md's SEO
 * section says "No page overrides robots", which is now one page out of date.
 *
 * What must NOT happen here: nobody should fill these sections with generic
 * transfer-window filler to make the page look finished. An empty shell is
 * honest; invented copy on a scoring methodology page is not.
 */

export const metadata: Metadata = {
  alternates: { canonical: '/deadline-day' },
  title: 'Deadline Day',
  // Describes the page's purpose, not its (unwritten) contents. Rewrite when
  // the copy lands so the description matches what is actually on the page.
  description: 'Transfer deadline day on The Football Hub.',
  // Comes off with the TODOs below, in the same commit. See the note above.
  robots: { index: false, follow: true },
}

export default function DeadlineDayPage() {
  const breadcrumbs = breadcrumbSchema([
    { name: 'The Football Hub', url: SITE_URL },
    { name: 'Deadline Day', url: `${SITE_URL}/deadline-day` },
  ])

  // A WebPage node, inline rather than in JsonLd.tsx: the existing helpers are
  // sportsEventSchema (home/away fixture shape — wrong for a day, not a match)
  // and articleSchema (needs a headline, byline and date that do not exist yet).
  // No startDate here: the 2026 summer window's closing date has not been
  // verified against a source, and an invented date in schema is worse than an
  // absent one. Add `SportsEvent` with a real date when the copy lands.
  const pageSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Deadline Day',
    url: `${SITE_URL}/deadline-day`,
    isPartOf: {
      '@type': 'WebSite',
      name: 'The Football Hub',
      url: SITE_URL,
    },
  }

  return (
    <>
      <JsonLd data={breadcrumbs} />
      <JsonLd data={pageSchema} />

      {/* No subheading prop: it is optional, and one line of invented copy is
          still invented copy. */}
      {/* The fragment is load-bearing: PageLayout requires `children`, and JSX
          comments are not children, so an empty shell needs something real to
          pass. It renders nothing. Replace it with the sections themselves. */}
      <PageLayout headline="Deadline Day">
        <>
        {/* TODO(copy): what deadline day is on this site — that claims are
            scored the same way on the day as on any other day, and that volume
            going up does not mean sourcing gets better. EDITORIAL_VOICE §4
            (Frame -> Justify -> Pivot -> Land Cold). */}

        {/* TODO(copy): what happens to the balloon count when a claim resolves
            inside a few hours instead of a few weeks. This is the one genuinely
            new thing the page has to say and it needs G's judgement, not a
            paraphrase of /how-it-works. */}

        {/* TODO(copy): corrections on the day. /how-it-works already commits to
            dated corrections that are never quietly edited — link to it rather
            than restating it, per the no-duplication rule that /privacy and
            /principles already follow. */}

        {/* TODO(structure): decide whether the day's claims render inline here
            or whether this page points at the column's permanent URL. That
            depends on the block rhythm, which is unanswerable until ten real
            items exist on a page. Do not build both. */}
        </>
      </PageLayout>
    </>
  )
}
