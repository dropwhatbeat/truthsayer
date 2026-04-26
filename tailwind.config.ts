import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './data/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        caveat: ['var(--font-caveat)', 'cursive'],
        inter:  ['var(--font-inter)',  'system-ui'],
      },
      colors: {
        cream: '#FFFDF7',
        card:  '#FFF8EE',
      },
    },
  },
  plugins: [],
}
export default config
