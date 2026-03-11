import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import { Sora, JetBrains_Mono } from 'next/font/google'
import { ThemeProvider } from '@/lib/theme-context'
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

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://thefootballhub.uk'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'The Football Hub',
    template: '%s | The Football Hub',
  },
  description:
    'Football. Framed. Fast.',
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
    site: '@thefootballhub',
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
        {/* No-flash dark mode: applies .light class before paint if saved */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var m=localStorage.getItem('tfh-mode');if(m==='light')document.documentElement.classList.add('light');}catch(e){}})();`,
          }}
        />
        {/* Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Sora:wght@200;300;400;500;600;700;800&family=JetBrains+Mono:wght@300;400;600;700&display=swap"
          rel="stylesheet"
        />
        <JsonLd data={orgSchema} />
        <JsonLd data={webSchema} />
      </head>
      <body className={`${sora.variable} ${jetbrainsMono.variable} font-sora antialiased`}>
        <ThemeProvider>
          {gaMeasurementId && (
            <GoogleAnalytics measurementId={gaMeasurementId} />
          )}

          <Navbar />
          <main>{children}</main>
          <BackToTopButton />
          <Footer />
        </ThemeProvider>

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
