import { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'
import { NOINDEX } from '@/lib/seo'

const siteUrl = SITE_URL

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
