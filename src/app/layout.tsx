import type { Metadata } from 'next'
import Script from 'next/script'
import { Atkinson_Hyperlegible } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar'
import MatchTicker from '@/components/MatchTicker'
import JsonLd from '@/components/JsonLd'
import GoogleAnalytics from '@/components/GoogleAnalytics'
import BackToTopButton from '@/components/BackToTopButton'

const atkinson = Atkinson_Hyperlegible({ subsets: ['latin'], weight: ['400', '700'] })

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://plhub.co.uk'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'PLHub — Premier League News. Right Now.',
    template: '%s | PLHub',
  },
  description:
    'The pulse of the Premier League. News and views from all 20 clubs, ranked by the community. Transfer rumours, match reports and fan discussion. Constantly updated.',
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.png',
    apple: '/favicon.png',
  },
  openGraph: {
    type: 'website',
    url: siteUrl,
    siteName: 'PLHub',
    locale: 'en_GB',
    images: [{ url: '/PLHlogowhite_1x1.png', width: 1000, height: 1000 }],
  },
  twitter: {
    card: 'summary',
    site: '@plhub',
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: siteUrl,
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
  description: 'Premier League news and views ranked by the community',
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
    <html lang="en" className="bg-[#0B1F21]">
      <head>
        <JsonLd data={organizationSchema} />
        <JsonLd data={websiteSchema} />
      </head>
      <body className={`${atkinson.className} bg-[#0B1F21] text-white antialiased`} style={{ fontSize: '18px', lineHeight: '1.65', letterSpacing: '0.01em' }}>
        {gaMeasurementId && (
          <GoogleAnalytics measurementId={gaMeasurementId} />
        )}
        <Navbar />
        <MatchTicker />
        <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
        <BackToTopButton />
        <footer className="mt-16 border-t border-[#222] px-4 py-8 text-center text-sm text-white">
          <p>
            PLHub — Premier League news aggregated from Reddit and BBC Sport.
            <span className="hidden sm:inline"> Not affiliated with the Premier League or its clubs.</span>
          </p>
        </footer>

        {/* Google Analytics GA4 */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-HKPQJ58BR1"
          strategy="afterInteractive"
        />
        <Script id="ga4" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-HKPQJ58BR1');
          `}
        </Script>

        {/* Microsoft Clarity */}
        <Script id="clarity" strategy="afterInteractive">
          {`
            (function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "vn616wbelr");
          `}
        </Script>
      </body>
    </html>
  )
}
