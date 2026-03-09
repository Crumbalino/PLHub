import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import { Sora, JetBrains_Mono } from 'next/font/google'
import { themeInitScript } from '@/lib/theme-init'
import './globals.css'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { JsonLd, websiteSchema, organizationSchema } from '@/components/JsonLd'
import GoogleAnalytics from '@/components/GoogleAnalytics'
import BackToTopButton from '@/components/BackToTopButton'

const sora = Sora({
  subsets: ['latin'],
  variable: '--font-sora',
  display: 'swap',
  weight: ['200', '300', '400', '500', '600', '700', '800'],
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
  weight: ['400', '600', '700'],
})

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://plhub.co.uk'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'The Football Hub — Football. Framed. Fast.',
    template: '%s | The Football Hub',
  },
  description:
    'Football news from every angle. Results, transfers, analysis and debate from across Europe — ranked, filtered and always up to date.',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'The Football Hub',
  },
  manifest: '/manifest.json',
  openGraph: {
    type: 'website',
    url: siteUrl,
    siteName: 'The Football Hub',
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

const orgSchema = organizationSchema()
const webSchema = websiteSchema()

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
        <JsonLd data={orgSchema} />
        <JsonLd data={webSchema} />
      </head>
      <body className={`${sora.variable} ${jetbrainsMono.variable} font-sora antialiased`}>
        {gaMeasurementId && (
          <GoogleAnalytics measurementId={gaMeasurementId} />
        )}

        <Navbar />
        <main>{children}</main>
        <BackToTopButton />
        <Footer />

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
