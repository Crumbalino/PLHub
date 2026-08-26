import { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';
import { clubSlugs } from '@/lib/entities';

/**
 * The sitemap is the entity pages: twenty clubs plus the homepage. Twenty-one
 * URLs, matching PAGE_SPEC §1's route table.
 *
 * The club slugs come from the entity registry, which reads the club registry,
 * so a relegated club leaves the sitemap the moment it leaves the league. There
 * is no second list here to forget to update — the previous version listed
 * `/clubs/{slug}` from a different registry, which is how the sitemap ended up
 * advertising four relegated clubs.
 *
 * NOTE — this deliberately no longer lists /about, /how-it-works, /principles,
 * /privacy or the /clubs/* pages. See the PR: dropping /how-it-works in
 * particular is worth a second opinion, since it is described as the site's
 * highest-originality asset.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = SITE_URL;
  const lastModified = new Date();

  // The homepage entity. `/` rather than `/premier-league`: the front door is
  // the canonical URL a reader and a crawler both arrive at.
  const homepage: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified,
      changeFrequency: 'hourly',
      priority: 1,
    },
  ];

  // Clubs live at the root — /tottenham, not /clubs/tottenham.
  const entities: MetadataRoute.Sitemap = clubSlugs().map((slug) => ({
    url: `${baseUrl}/${slug}`,
    lastModified,
    changeFrequency: 'hourly' as const,
    priority: 0.9,
  }));

  return [...homepage, ...entities];
}
