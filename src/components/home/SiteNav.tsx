// Below-the-fold navigation. Plain server-rendered <a href> tags, no client
// JavaScript, nothing that needs hydration.
//
// The hero above is locked to four elements, which left the homepage a dead
// end: no route to a club page, no route to how-it-works, and — the part that
// matters for search — no internal links to the twenty club pages, so nothing
// pointed at them from the site's most linked page.
//
// This sits AFTER the facts block, so the hero is untouched.
//
// Deliberately <a> and not next/link: these are ordinary document links, they
// must work with JavaScript off, and prefetching twenty club pages from the
// homepage would be a lot of requests for no gain.

import type { NavClub } from '@/lib/stats'

const PAGES = [
  { href: '/how-it-works', label: 'How It Works' },
  { href: '/principles', label: 'Our Principles' },
  { href: '/about', label: 'About' },
  { href: '/privacy', label: 'Privacy' },
]

export default function SiteNav({ clubs }: { clubs: NavClub[] }) {
  return (
    <nav className="tfh-nav" aria-label="Site">
      {clubs.length > 0 && (
        <>
          <h2 className="tfh-nav-title">
            Clubs
          </h2>
          <ul className="tfh-nav-clubs">
            {clubs.map((c) => (
              <li key={c.slug}>
                <a href={`/${c.slug}`}>{c.name}</a>
              </li>
            ))}
          </ul>
        </>
      )}

      <h2 className="tfh-nav-title">
        More
      </h2>
      <ul className="tfh-nav-pages">
        {PAGES.map((p) => (
          <li key={p.href}>
            <a href={p.href}>{p.label}</a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
