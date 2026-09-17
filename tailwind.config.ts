import type { Config } from 'tailwindcss'

export default {
  darkMode: 'class',
  content: [
    './app/**/*.{js,vue,ts}',
    './components/**/*.{js,vue,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './plugins/**/*.{js,ts}',
    './app.vue',
    './error.vue'
  ],
  theme: {
    extend: {
      colors: {
        bambu: {
          50: '#ecfdf3',
          100: '#d1fae1',
          200: '#a7f3c6',
          300: '#6ee7a3',
          400: '#34d37c',
          500: '#00AE42', // Bambu Official Green
          600: '#009a3a',
          700: '#007b2f',
          800: '#066127',
          900: '#075023',
          950: '#022d12'
        }
      }
    }
  },
  plugins: []
} satisfies Config
