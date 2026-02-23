import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar'
import ClubNav from '@/components/ClubNav'
import JsonLd from '@/components/JsonLd'
import GoogleAnalytics from '@/components/GoogleAnalytics'

const inter = Inter({ subsets: ['latin'] })

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://plhub.co.uk'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'PLHub — Premier League News Aggregator',
    template: '%s | PLHub',
  },
  description:
    'Latest Premier League news, transfer gossip and match updates from all 20 clubs aggregated from Reddit and BBC Sport.',
  openGraph: {
    type: 'website',
    url: siteUrl,
    siteName: 'PLHub',
  },
  twitter: {
    card: 'summary_large_image',
  },
  robots: {
    index: true,
    follow: true,
  },
}

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'PLHub',
  url: siteUrl,
  description:
    'Premier League news aggregator combining Reddit fan discussion and BBC Sport journalism.',
}

const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'PLHub',
  url: siteUrl,
  description: 'Latest Premier League news from all 20 clubs.',
  potentialAction: {
    '@type': 'SearchAction',
    target: `${siteUrl}/?q={search_term_string}`,
    'query-input': 'required name=search_term_string',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const gaMeasurementId = process.env.GA_MEASUREMENT_ID

  return (
    <html lang="en">
      <head>
        <JsonLd data={organizationSchema} />
        <JsonLd data={websiteSchema} />
      </head>
      <body className={`${inter.className} bg-[#0a0a0a] text-white antialiased`}>
        {gaMeasurementId && (
          <GoogleAnalytics measurementId={gaMeasurementId} />
        )}
        <Navbar />
        <ClubNav />
        <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
        <footer className="mt-16 border-t border-[#222] py-8 text-center text-sm text-gray-400">
          <p>
            PLHub — Premier League news aggregated from Reddit and BBC Sport.
          </p>
          <p className="mt-1">
            Not affiliated with the Premier League or its clubs.
          </p>
        </footer>
      </body>
    </html>
  )
}
