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
        surface: '#1a1a1a',
        border: '#222222',
        'brand-teal': '#00555A',
        'brand-gold': '#C4A23E',
      },
    },
  },
  plugins: [],
}

export default config
