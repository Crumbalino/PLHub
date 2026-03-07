import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sora: ['var(--font-sora)', 'sans-serif'],
        mono: ['JetBrains Mono', 'var(--font-mono)', 'monospace'],
      },
      colors: {
        // v2.2 — Navy system (replaces old green-teal)
        background: '#0D1B2A',
        surface: '#112238',
        'surface-hover': '#162D45',
        'surface-raised': '#112238',
        border: 'rgba(250, 245, 240, 0.05)',

        // Brand
        'brand-pink': '#E84080',
        'brand-teal': '#3AAFA9',
        'brand-gold': '#D4A843',
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
