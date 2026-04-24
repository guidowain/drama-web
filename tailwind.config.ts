import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        enriq: ['Enriq', 'Nunito', 'system-ui', 'sans-serif'],
      },
      colors: {
        'brand-pink': '#FF3E9E',
        'brand-orange': '#FFA24A',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(90deg, #FF3E9E 0%, #FFA24A 100%)',
      },
    },
  },
  plugins: [],
}

export default config
