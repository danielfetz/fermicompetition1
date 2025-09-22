import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './pages/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      fontFamily: {
        nunito: ['var(--font-nunito)', 'system-ui', 'sans-serif']
      },
      colors: {
        duolingo: {
          green: '#58CC02',
          dark: '#2E7D32',
          yellow: '#FFC800',
          blue: '#1CB0F6',
          red: '#FF4B4B'
        }
      }
    }
  },
  plugins: []
}

export default config
