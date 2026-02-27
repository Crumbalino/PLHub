import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#0B1F21',
        surface: '#183538',
        'surface-hover': '#1c3d41',
        'surface-raised': '#152B2E',
        border: '#222222',
        'brand-teal': '#00555A',
        'brand-gold': '#C4A23E',
      },
      animation: {
        'card-enter': 'cardEnter 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'feed-enter': 'feedFadeIn 0.3s ease-out forwards',
      },
    },
  },
  plugins: [],
}

export default config
