import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/features/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'media',
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-prompt)', 'Prompt', 'Noto Sans Thai', 'Sarabun', 'sans-serif'],
      },
      colors: {
        midnight: '#000B18',
        navy: '#001F3F',
        emerald: '#50C878',
        rose: '#E11D48',
        slate: '#708090',
        brand: {
          primary: '#001F3F',    // Midnight Navy
          secondary: '#708090',  // Slate Silver
          accent: '#50C878',     // Emerald Green
        },
        ops: {
          primary: 'var(--ops-primary, #6366f1)',
          dark: 'var(--ops-dark, #4f46e5)',
          bg: 'var(--ops-bg, #0a0a0a)',
          sidebar: 'var(--ops-sidebar, #111111)',
          border: 'var(--ops-border, #1e1e1e)',
        }
      }
    },
  },
  plugins: [],
};

export default config;
