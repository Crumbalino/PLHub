import React from 'react';

export interface JsonLdProps {
  data: Record<string, any>;
}

export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/**
 * Website schema - root level schema for the entire site
 */
export function websiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'PLHub',
    description: 'Premier League news, fixtures, stats and insights',
    url: 'https://pl-hub-webapp12.vercel.app',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://pl-hub-webapp12.vercel.app?q={search_term_string}',
      },
      query_input: 'required name=search_term_string',
    },
  };
}

/**
 * Organization schema - core organizational information
 */
export function organizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'PLHub',
    description: 'Your Premier League insight hub',
    url: 'https://pl-hub-webapp12.vercel.app',
    logo: 'https://pl-hub-webapp12.vercel.app/logo.svg',
    sameAs: [
      'https://twitter.com/plhub',
      'https://github.com/Crumbalino/PLHub',
    ],
  };
}

/**
 * Sports team schema - for individual club pages
 */
export function sportsTeamSchema(
  clubName: string,
  clubCode: string,
  founded: number,
  city: string,
  stadium: string,
  manager: string,
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SportsTeam',
    name: clubName,
    alternateName: clubCode,
    url: `https://pl-hub-webapp12.vercel.app/clubs/${clubCode.toLowerCase()}`,
    foundingDate: `${founded}-01-01`,
    location: {
      '@type': 'Place',
      name: city,
    },
    homeVenue: {
      '@type': 'StadiumOrArena',
      name: stadium,
      address: {
        '@type': 'PostalAddress',
        addressLocality: city,
        addressCountry: 'GB',
      },
    },
    coach: {
      '@type': 'Person',
      name: manager,
      jobTitle: 'Manager',
    },
    sport: 'Football',
    league: {
      '@type': 'SportsLeague',
      name: 'Premier League',
    },
  };
}

/**
 * Breadcrumb schema - for navigation hierarchy
 */
export function breadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/**
 * FAQ schema - for frequent questions
 */
export function faqSchema(
  faqs: Array<{ question: string; answer: string }>,
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

/**
 * Sports event schema - for upcoming fixtures
 */
export function sportsEventSchema(
  homeTeam: string,
  awayTeam: string,
  eventDate: string,
  venue: string,
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SportsEvent',
    name: `${homeTeam} vs ${awayTeam}`,
    description: `Premier League match between ${homeTeam} and ${awayTeam}`,
    startDate: eventDate,
    endDate: eventDate,
    location: {
      '@type': 'Place',
      name: venue,
    },
    homeTeam: {
      '@type': 'SportsTeam',
      name: homeTeam,
    },
    awayTeam: {
      '@type': 'SportsTeam',
      name: awayTeam,
    },
    competition: {
      '@type': 'SportsLeague',
      name: 'Premier League',
    },
  };
}

/**
 * Article schema - for individual news articles/stories
 */
export function articleSchema(
  headline: string,
  description: string,
  imageUrl: string,
  datePublished: string,
  dateModified?: string,
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline,
    description,
    image: imageUrl,
    datePublished,
    dateModified: dateModified || datePublished,
    author: {
      '@type': 'Organization',
      name: 'PLHub',
    },
  };
}

/**
 * News article schema - for news-specific content with more metadata
 */
export function newsArticleSchema(
  headline: string,
  description: string,
  imageUrl: string,
  datePublished: string,
  dateModified?: string,
  articleBody?: string,
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline,
    description,
    image: imageUrl,
    datePublished,
    dateModified: dateModified || datePublished,
    articleBody: articleBody || description,
    author: {
      '@type': 'Organization',
      name: 'PLHub',
      url: 'https://pl-hub-webapp12.vercel.app',
    },
    publisher: {
      '@type': 'Organization',
      name: 'PLHub',
      logo: {
        '@type': 'ImageObject',
        url: 'https://pl-hub-webapp12.vercel.app/logo.svg',
      },
    },
  };
}
