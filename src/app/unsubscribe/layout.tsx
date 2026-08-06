import type { Metadata } from 'next'

/**
 * page.tsx for this route is a client component and cannot export metadata,
 * so its canonical lives here. Without this the route inherits the root
 * layout's canonical and declares itself a duplicate of the homepage.
 */
export const metadata: Metadata = {
  alternates: { canonical: '/unsubscribe' },
  title: 'Unsubscribe',
}

export default function UnsubscribeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
