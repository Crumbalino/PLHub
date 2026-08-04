/**
 * Sitewide indexing switch.
 *
 * Single source of truth for whether search engines may index the site.
 * Consumed by:
 *   - src/app/layout.tsx  -> metadata.robots (the <meta name="robots"> tag)
 *   - src/app/robots.ts   -> /robots.txt rules
 *
 * Set SITE_NOINDEX=true to noindex the entire site. Anything else (unset,
 * empty, "false", "1") leaves indexing enabled.
 *
 * NOTE: this is read at build time, not per request. Both consumers are
 * statically generated, so changing SITE_NOINDEX requires a redeploy to
 * take effect. It is deliberately not NEXT_PUBLIC_ -- both consumers are
 * server-side, so there is no reason to ship it in the client bundle.
 */
export const NOINDEX = process.env.SITE_NOINDEX === 'true'
