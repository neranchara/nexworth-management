import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'media',
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#001F3F',    // Midnight Navy
          secondary: '#708090',  // Slate Silver
          accent: '#50C878',     // Emerald Green
        }
      }
    },
  },
  plugins: [],
};

export default config;
