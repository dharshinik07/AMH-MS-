import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    screens: {
      xs: "360px",
      sm: "480px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
    },
    extend: {
      backgroundImage: {
        'gold-gradient': 'linear-gradient(135deg, #D6AB47 0%, #E2BF6C 100%)',
        'gold-gradient-soft': 'linear-gradient(135deg, rgba(214,171,71,.18) 0%, rgba(226,191,108,.10) 100%)',
        'navy-gradient': 'linear-gradient(180deg, #0F243F 0%, #0A1B30 100%)',
      },
      colors: {
        navy: {
          950: '#0A1B30',
          900: '#0F243F',
          800: '#152A45',
          700: '#293C55',
          300: '#B8C4D4',
          200: '#C9D3E0',
        },
        gold: {
          500: '#D6AB47',
          400: '#E2BF6C',
          600: '#B8902F',
          700: '#8A6A1B',
          100: '#F8EDD0',
          50: '#FDF8EA',
        },
        rose: {
          50: '#FFF1F5',
          500: '#D6336C',
          700: '#A61E4D',
        },
      },
      spacing: {
        safe: "env(safe-area-inset-bottom, 0px)",
      },
    },
  },
  plugins: [],
};

export default config;
