import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        paper: { DEFAULT: '#FAF8F4', 2: '#F3F0EB', 3: '#EAE6E0' },
        ink: { DEFAULT: '#2C2C2C', dark: '#1A1A1A', black: '#0D0D0D', muted: '#6B6560', faint: '#9E9890' },
        rule: { DEFAULT: '#C8C2BA', dark: '#8A847C' },
        accent: { DEFAULT: '#C0392B', dark: '#922B21' },
        mining: '#7D5A00',
        energy: '#1A5C3A',
        dc: '#1A3A5C',
        institutional: '#3D1A6E',
        press: '#6E3D1A',
      },
      fontFamily: {
        // Direct font names — Tailwind generates correct CSS without variable wrapping
        display: ['"Playfair Display"', 'Georgia', '"Times New Roman"', 'serif'],
        body:    ['"Source Serif 4"', '"Georgia"', '"Times New Roman"', 'serif'],
        sans:    ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono:    ['"JetBrains Mono"', '"Courier New"', 'monospace'],
      },
      screens: {
        xs:   '375px',
        sm:   '640px',
        md:   '768px',
        lg:   '1024px',
        xl:   '1280px',
        '2xl':'1536px',
        '3xl':'2048px',
        '4xl':'2560px',
      },
      fontSize: {
        xxs:  ['0.625rem', { lineHeight: '1rem' }],
        xs:   ['0.75rem',  { lineHeight: '1.125rem' }],
        sm:   ['0.875rem', { lineHeight: '1.375rem' }],
        base: ['1rem',     { lineHeight: '1.6rem' }],
        lg:   ['1.125rem', { lineHeight: '1.75rem' }],
        xl:   ['1.25rem',  { lineHeight: '1.875rem' }],
        '2xl':['1.5rem',   { lineHeight: '2rem' }],
        '3xl':['1.875rem', { lineHeight: '2.375rem' }],
        '4xl':['2.25rem',  { lineHeight: '2.75rem' }],
        '5xl':['3rem',     { lineHeight: '3.5rem' }],
        '6xl':['3.75rem',  { lineHeight: '4.25rem' }],
      },
    },
  },
  plugins: [],
}
export default config
