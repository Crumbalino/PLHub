import { ImageResponse } from 'next/og'

// Placeholder share image. /logo.png was deleted long ago and layout.tsx still
// pointed at it, so every og:image was a 404. Social crawlers do not render
// SVG, so this is generated as a PNG. Replace with real brand art when it exists.
export const alt = 'The Football Hub'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0D1B2A',
          color: '#3AAFA9',
        }}
      >
        <div style={{ fontSize: 96, fontWeight: 700 }}>The Football Hub</div>
        <div style={{ fontSize: 40, color: '#FAF5F0', marginTop: 24 }}>
          Transfer gossip. Scored.
        </div>
      </div>
    ),
    size
  )
}
