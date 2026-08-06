/**
 * Single source of truth for the site's public origin.
 *
 * Every absolute URL the app emits — canonicals, metadataBase, sitemap entries,
 * JSON-LD, breadcrumbs, email links — must derive from this. Do not hardcode a
 * hostname anywhere, and do not add a fallback here.
 *
 * There is deliberately no default. A missing NEXT_PUBLIC_SITE_URL fails the
 * build rather than silently serving a wrong domain: a fallback that is quietly
 * wrong publishes canonicals pointing at someone else's origin, which is worse
 * than not building at all.
 *
 * Set in all three Vercel environments. See .env.local.example.
 */
const url = process.env.NEXT_PUBLIC_SITE_URL

if (!url) {
  throw new Error(
    'NEXT_PUBLIC_SITE_URL is not set. Refusing to build with a guessed domain — ' +
      'set it in your environment (see .env.local.example).'
  )
}

/** Public origin, no trailing slash. e.g. https://thefootballhub.uk */
export const SITE_URL = url.replace(/\/+$/, '')

/** Absolute URL for a site-relative path. `abs('/clubs/arsenal')`. */
export function abs(path: string): string {
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`
}
