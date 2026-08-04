import { MetadataRoute } from 'next'
import { NOINDEX } from '@/lib/seo'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://plhub.co.uk'

export default function robots(): MetadataRoute.Robots {
  // Sitewide noindex: disallow everything and advertise no sitemap.
  if (NOINDEX) {
    return {
      rules: {
        userAgent: '*',
        disallow: '/',
      },
    }
  }

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/'],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  }
}
