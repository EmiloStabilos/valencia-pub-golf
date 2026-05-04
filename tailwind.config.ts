import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Surfaces — warm saffron
        'parchment':       '#FBE8C8',
        'parchment-light': '#FEF4E0',
        'parchment-dark':  '#F0D4A0',

        // Primary accents
        'terracotta':      '#C8381A',
        'terracotta-dark': '#9E2A10',
        'terracotta-light':'#E8714A',
        'cobalt':          '#1A3A7A',
        'cobalt-soft':     '#2B5BA8',
        'gold':            '#E8A020',
        'gold-soft':       '#F5C860',
        'sangria':         '#8B1A3A',
        'sun':             '#F5C518',

        // Score / status
        'olive':           '#3A6820',
        'wine':            '#8B1A1A',

        // Ink hierarchy
        'ink':             '#2A0A06',
        'ink-secondary':   '#5A2010',
        'ink-muted':       '#8A5030',
        'ink-faint':       '#C0906A',

        // Rules
        'rule':            '#D8B888',

        // Valencia orange
        'orange':          '#E86A10',
        'orange-soft':     '#F5903A',
      },
      fontFamily: {
        serif: ['"Bodoni Moda"', 'Georgia', 'serif'],
        sans:  ['"Playfair Display"', 'Georgia', 'serif'],
        label: ['"Nunito"', 'system-ui', 'sans-serif'],
        mono:  ['"JetBrains Mono"', 'monospace'],
      },
      letterSpacing: {
        widest: '0.18em',
        ultra: '0.32em',
      },
      boxShadow: {
        none: 'none',
        soft: '0 1px 0 rgba(26, 36, 56, 0.04)',
      },
      borderRadius: {
        none: '0',
        DEFAULT: '2px',
        md: '4px',
        lg: '6px',
      },
    },
  },
  plugins: [],
}

export default config
