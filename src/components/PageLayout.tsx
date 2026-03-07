'use client'

interface PageLayoutProps {
  headline: string
  subheading?: string
  children: React.ReactNode
}

export default function PageLayout({
  headline,
  subheading,
  children,
}: PageLayoutProps) {
  return (
    <main
      style={{
        maxWidth: '700px',
        margin: '0 auto',
        padding: '48px 16px 80px',
      }}
    >
      {/* Page header */}
      <div style={{ marginBottom: '40px' }}>
        <div
          style={{
            width: '32px',
            height: '3px',
            background: 'var(--plh-pink)',
            marginBottom: '16px',
          }}
        />
        <h1
          style={{
            fontSize: '32px',
            fontWeight: 700,
            color: 'var(--plh-text-100)',
            lineHeight: 1.2,
            marginBottom: subheading ? '12px' : 0,
            fontFamily: "'Sora', sans-serif",
          }}
        >
          {headline}
        </h1>
        {subheading && (
          <p
            style={{
              fontSize: '18px',
              color: 'rgba(250,245,240,0.7)',
              lineHeight: 1.6,
              fontFamily: "'Sora', sans-serif",
              fontWeight: 300,
            }}
          >
            {subheading}
          </p>
        )}
      </div>

      {/* Divider */}
      <div
        style={{
          height: '1px',
          background: 'var(--plh-border)',
          marginBottom: '40px',
        }}
      />

      {/* Content */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
        }}
      >
        {children}
      </div>
    </main>
  )
}
