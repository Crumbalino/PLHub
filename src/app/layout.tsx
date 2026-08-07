import type { Metadata, Viewport } from 'next'
import { Sora, JetBrains_Mono } from 'next/font/google'
import { ThemeProvider } from '@/lib/theme-context'
import './globals.css'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { JsonLd, websiteSchema, organizationSchema } from '@/components/JsonLd'
import { NOINDEX } from '@/lib/seo'
import { SITE_URL } from '@/lib/site'
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

const siteUrl = SITE_URL

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
  robots: NOINDEX
    ? { index: false, follow: false }
    : { index: true, follow: true },
  // This canonical belongs to `/` only. src/app/page.tsx is a client component
  // and cannot export metadata itself, so the homepage's canonical has to live
  // on its layout — which is this one.
  //
  // EVERY other route MUST override `alternates.canonical` with its own path,
  // or it silently inherits '/' and declares itself a duplicate of the
  // homepage. That was the bug in #8. When adding a page, set its canonical.
  alternates: {
    canonical: '/',
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
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        {/* No-flash dark mode: applies .light class before paint if saved */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var m=localStorage.getItem('tfh-mode');if(m==='light')document.documentElement.classList.add('light');}catch(e){}})();`,
          }}
        />
        {/* No webfont <link> here. next/font (above) self-hosts Sora and
            JetBrains Mono from our own origin. A fonts.googleapis.com
            stylesheet would send every visitor's IP to Google for nothing. */}
        <JsonLd data={orgSchema} />
        <JsonLd data={webSchema} />
      </head>
      <body className={`${sora.variable} ${jetbrainsMono.variable} font-sora antialiased`}>
        <ThemeProvider>
          <main>{children}</main>
          <BackToTopButton />
          <Footer />
        </ThemeProvider>

        {/* NO ANALYTICS, NO SESSION RECORDING, NO PIXELS.
            Google Analytics (G-HKPQJ58BR1) and Microsoft Clarity
            (vn616wbelr) were loaded here on every page. Clarity records
            sessions — pointer movement, scrolling, clicks. Both set cookies,
            and neither had a consent gate, which UK GDPR/PECR requires before
            they load. /how-it-works promises "no cookie consent walls"; the
            way to keep that promise is to need no consent, not to skip it.
            Do not add a tracker back without a lawful basis and a banner. */}
      </body>
    </html>
  )
}
