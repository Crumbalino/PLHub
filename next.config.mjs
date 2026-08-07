/** @type {import('next').NextConfig} */
const nextConfig = {
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
