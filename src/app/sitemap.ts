import { MetadataRoute } from 'next';
import { getAllClubSlugs } from '@/config/clubs';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://pl-hub-webapp12.vercel.app';

  // Static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 1,
    },
  ];

  // Dynamic club routes
  const clubSlugs = getAllClubSlugs();
  const clubRoutes: MetadataRoute.Sitemap = clubSlugs.map((slug) => ({
    url: `${baseUrl}/clubs/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }));

  return [...staticRoutes, ...clubRoutes];
}
