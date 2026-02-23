import { MetadataRoute } from 'next'
import { CLUBS } from '@/lib/clubs'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://plhub.co.uk'

export default function sitemap(): MetadataRoute.Sitemap {
  const clubUrls: MetadataRoute.Sitemap = CLUBS.map((club) => ({
    url: `${siteUrl}/clubs/${club.slug}`,
    lastModified: new Date(),
    changeFrequency: 'hourly',
    priority: 0.8,
  }))

  return [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 1.0,
    },
    ...clubUrls,
  ]
}
