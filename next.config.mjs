/** @type {import('next').NextConfig} */
const nextConfig = {
  // ESLint is a gate you run, NOT a gate that blocks deploys — for now.
  //
  // .eslintrc.json was added 7 Aug 2026 so `npm run lint` finally works; before
  // that there was no config at all and `next lint` sat waiting on an
  // interactive prompt, which is why CLAUDE.md called build "the only working
  // gate". Turning it on surfaced 7 errors and 7 warnings that already existed:
  // 7x react/no-unescaped-entities and 7x @next/next/no-img-element across 8
  // files. Fixing them was explicitly out of scope.
  //
  // Next runs ESLint during `next build` by default, and those 7 errors fail the
  // build — which would have blocked every deploy on an indexed site to fix
  // straight quotes. So linting is decoupled from the build until the backlog is
  // cleared. FLIP THIS TO false once `npm run lint` is clean; that is the point
  // at which the gate starts earning its keep.
  eslint: {
    ignoreDuringBuilds: true,
  },

  // The vercel.app alias served the whole site at 200 alongside the apex —
  // measured 7 Aug 2026, every path, on an indexed site. A canonical tag was
  // the only thing pointing home, and a canonical is a hint, not a rule.
  //
  // Matches the STABLE production alias only. Per-deployment preview hosts
  // (pl-hub-webapp12-<hash>-crumbalinos-projects.vercel.app) are left alone, or
  // previews would redirect to production and stop being testable.
  //
  // In next.config.mjs, not vercel.json — vercel.json declared 5 crons that
  // never registered on Hobby and was deleted in 332cfa9. Do not recreate it.
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'pl-hub-webapp12.vercel.app' }],
        destination: 'https://thefootballhub.uk/:path*',
        permanent: true, // 308
      },
      // Clubs are canonical at the root — PAGE_SPEC §1, THE_FOOTBALL_HUB §5.
      // Twenty clubs answered at both /tottenham and /clubs/tottenham, which is
      // duplicate content on twenty pages and leaves Google to pick a canonical
      // for us.
      //
      // A redirect rather than a 404: the /clubs/* URLs are indexed, and a
      // redirect passes the accumulated signal to the root slug where a 404
      // discards it.
      //
      // 301, not `permanent: true`, which Next emits as 308. Both are permanent
      // and Google treats them alike, but 301 is the conventional signal for a
      // moved page and what SEO tooling reports on. The host rule above stays
      // 308 — it is a host swap, not a page move.
      //
      // ONE WILDCARD RULE, NOT TWENTY EXPLICIT ONES. Enumerating the clubs here
      // would be a fourth club list in this repo, and the three that already
      // exist have drifted from each other twice. The cost is that a relegated
      // club's old URL redirects to a root slug that 404s — /clubs/leicester ->
      // /leicester -> 404. That is a hop to the same destination a direct 404
      // would reach, and it is worth one hop to avoid another list.
      {
        source: '/clubs/:slug',
        destination: '/:slug',
        statusCode: 301,
      },
    ]
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.redd.it',
      },
      {
        protocol: 'https',
        hostname: '*.bbci.co.uk',
      },
      {
        protocol: 'https',
        hostname: 'ichef.bbci.co.uk',
      },
      {
        protocol: 'https',
        hostname: 'resources.premierleague.com',
      },
      {
        protocol: 'https',
        hostname: 'upload.wikimedia.org',
      },
      {
        protocol: 'https',
        hostname: 'www.redditinc.com',
      },
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
      },
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
      },
      {
        protocol: 'https',
        hostname: 'yt3.ggpht.com',
      },
      {
        protocol: 'https',
        hostname: '*.365dm.com',
      },
      {
        protocol: 'https',
        hostname: '*.guim.co.uk',
      },
      {
        protocol: 'https',
        hostname: '*.talksport.com',
      },
      {
        protocol: 'https',
        hostname: 'images.goal.com',
      },
      {
        protocol: 'https',
        hostname: '*.90min.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.theathletic.com',
      },
    ],
  },
}

export default nextConfig
