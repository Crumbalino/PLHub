import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import { Sora } from 'next/font/google'
import { themeInitScript } from '@/lib/theme-init'
import './globals.css'
import Navbar from '@/components/Navbar'
import JsonLd from '@/components/JsonLd'
import GoogleAnalytics from '@/components/GoogleAnalytics'
import BackToTopButton from '@/components/BackToTopButton'

const sora = Sora({
  subsets: ['latin'],
  variable: '--font-sora',
  display: 'swap',
  weight: ['200', '300', '400', '500', '600', '700', '800'],
})

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
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'PLHub',
  },
  manifest: '/manifest.json',
  openGraph: {
    type: 'website',
    url: siteUrl,
    siteName: 'PLHub',
    locale: 'en_GB',
    images: [{ url: '/logo.png', width: 4000, height: 1000 }],
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

export const viewport: Viewport = {
  themeColor: '#0D1B2A',
  width: 'device-width',
  initialScale: 1,
}

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'PLHub',
  url: siteUrl,
  description:
    'Premier League news aggregator bringing together BBC Sport, Sky Sports, The Guardian and more editorial sources.',
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
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        {/* Blocking script: reads localStorage before paint to prevent flash-of-wrong-theme */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <JsonLd data={organizationSchema} />
        <JsonLd data={websiteSchema} />
      </head>
      <body className={`${sora.variable} font-sora antialiased`}>
        {gaMeasurementId && (
          <GoogleAnalytics measurementId={gaMeasurementId} />
        )}

        <Navbar />
        <main>{children}</main>
        <BackToTopButton />

        {/* Footer — uses brand variables, works in both modes */}
        <footer className="mt-16 border-t border-[var(--plh-border)] px-4 py-10 text-center">
          <p className="text-sm text-[var(--plh-text-40)]">
            PLHub — Premier League news from BBC Sport, Sky Sports, The Guardian and more.
          </p>
          <p className="text-xs text-[var(--plh-text-40)] mt-2" style={{ opacity: 0.6 }}>
            Not affiliated with the Premier League or its clubs.
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
