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
        // Surfaces — reference CSS vars so retheme = edit :root only
        'parchment':       'var(--limestone)',
        'parchment-light': 'var(--limestone-light)',
        'parchment-dark':  'rgb(var(--limestone-dark-rgb) / <alpha-value>)',

        // Primary brand
        'cobalt':          'var(--cobalt)',
        'cobalt-soft':     'var(--cobalt-soft)',

        // Accents
        'gold':            'rgb(var(--gold-rgb) / <alpha-value>)',
        'gold-soft':       'var(--gold-soft)',
        'sangria':         'var(--sangria)',
        'sun':             '#F5C518',

        // Terracotta
        'terracotta':      'var(--terracotta)',
        'terracotta-dark': 'var(--terracotta-dark)',
        'terracotta-light':'#E8714A',

        // Score / status
        'olive':           'rgb(var(--olive-rgb) / <alpha-value>)',
        'wine':            'rgb(var(--wine-rgb) / <alpha-value>)',

        // Ink hierarchy
        'ink':             'rgb(var(--ink-rgb) / <alpha-value>)',
        'ink-secondary':   'var(--ink-secondary)',
        'ink-muted':       'var(--ink-muted)',
        'ink-faint':       'var(--ink-faint)',

        // Rules / borders
        'rule':            'rgb(var(--rule-rgb) / <alpha-value>)',

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
