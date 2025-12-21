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
        nunito: ['Nunito', 'system-ui', 'sans-serif']
      },
      colors: {
        // Duolingo primary palette
        duo: {
          green: '#58CC02',
          'green-dark': '#58A700',
          'green-light': '#89E219',
          yellow: '#FFC800',
          'yellow-dark': '#CE9E00',
          blue: '#1CB0F6',
          'blue-dark': '#1899D6',
          'blue-light': '#7AC7FF',
          red: '#FF4B4B',
          'red-dark': '#EA2B2B',
          purple: '#CE82FF',
          'purple-dark': '#A560E8',
          orange: '#FF9600',
          'orange-dark': '#CD7900',
          pink: '#FF86D0',
          'pink-dark': '#E45BBF',
        },
        // Background colors
        snow: '#F7F7F7',
        eel: '#4B4B4B',
        wolf: '#777777',
        hare: '#AFAFAF',
        swan: '#E5E5E5',
        polar: '#FFFFFF',
        // Mascot/accent colors
        feather: '#1CB0F6',
        bee: '#FFC800',
        fox: '#FF9600',
        cardinal: '#FF4B4B',
        macaw: '#CE82FF',
      },
      borderRadius: {
        'duo': '16px',
        'duo-lg': '24px',
        'duo-xl': '32px',
      },
      boxShadow: {
        'duo': '0 4px 0 0 rgba(0, 0, 0, 0.2)',
        'duo-green': '0 4px 0 0 #58A700',
        'duo-blue': '0 4px 0 0 #1899D6',
        'duo-yellow': '0 4px 0 0 #CE9E00',
        'duo-red': '0 4px 0 0 #EA2B2B',
        'duo-purple': '0 4px 0 0 #A560E8',
        'duo-swan': '0 4px 0 0 #e4e4e4',
        'duo-inset': 'inset 0 2px 0 0 rgba(255, 255, 255, 0.2)',
        'card': '0 2px 4px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.1)',
        'card-hover': '0 4px 8px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.05)',
      },
      animation: {
        'bounce-in': 'bounceIn 0.5s ease-out',
        'shake': 'shake 0.5s ease-in-out',
        'pulse-green': 'pulseGreen 2s infinite',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'pop': 'pop 0.2s ease-out',
        'wiggle': 'wiggle 0.3s ease-in-out',
        'confetti': 'confetti 1s ease-out forwards',
        'progress': 'progress 0.5s ease-out',
        'glow': 'glow 2s infinite',
      },
      keyframes: {
        bounceIn: {
          '0%': { transform: 'scale(0.3)', opacity: '0' },
          '50%': { transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-4px)' },
          '20%, 40%, 60%, 80%': { transform: 'translateX(4px)' },
        },
        pulseGreen: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(88, 204, 2, 0.4)' },
          '50%': { boxShadow: '0 0 0 10px rgba(88, 204, 2, 0)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        pop: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.1)' },
          '100%': { transform: 'scale(1)' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        },
        confetti: {
          '0%': { transform: 'translateY(0) rotate(0deg)', opacity: '1' },
          '100%': { transform: 'translateY(-200px) rotate(720deg)', opacity: '0' },
        },
        progress: {
          '0%': { width: '0%' },
          '100%': { width: '100%' },
        },
        glow: {
          '0%, 100%': { boxShadow: '0 0 5px rgba(88, 204, 2, 0.5)' },
          '50%': { boxShadow: '0 0 20px rgba(88, 204, 2, 0.8)' },
        },
      },
    }
  },
  plugins: []
}

export default config
