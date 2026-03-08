/** @type {import('next').NextConfig} */
const nextConfig = {
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
