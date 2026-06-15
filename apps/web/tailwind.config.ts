import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/features/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-prompt)', 'Prompt', 'Noto Sans Thai', 'Sarabun', 'sans-serif'],
      },
      colors: {
        midnight: '#000B18',
        navy: '#001F3F',
        emerald: {
          DEFAULT: '#50C878',
          '400': '#66D18B',
          '500': '#50C878',
          '600': '#3EB867',
        },
        rose: {
          DEFAULT: '#E11D48',
          '400': '#F43F5E',
          '500': '#E11D48',
          '600': '#BE123C',
        },
        blue: {
          DEFAULT: '#60A5FA',
          '400': '#60A5FA',
          '500': '#3B82F6',
          '600': '#2563EB',
          '900': '#1E3A8A',
        },
        slate: '#708090',
        brand: {
          primary: '#001F3F',
          secondary: '#708090',
          accent: '#50C878',
          danger: '#E11D48',
          info: '#60A5FA',
        },
        surface: 'rgba(17, 34, 64, 0.7)',
        'text-primary': '#F8FAFC',
        'text-secondary': '#708090',
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
