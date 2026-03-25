import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#F8F9FA',
        surface: '#FFFFFF',
        primary: '#212529',
        muted: '#868E96',
        brand: {
          primary: '#FF6B6B',
          secondary: '#4ECDC4'
        }
      },
    },
  },
  plugins: [],
}
export default config
