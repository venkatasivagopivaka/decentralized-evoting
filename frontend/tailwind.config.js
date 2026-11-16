/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Contemporary Editorial Minimalism — Earth & Ink Palette
        ivory: {
          DEFAULT: '#F1EFE8',
          secondary: '#E8E6DE',
          light: '#F8F7F3',
        },
        stone: {
          DEFAULT: '#DCDAD1',
          light: '#E4E2D9',
          deep: '#CCCBC1',
        },
        border: {
          subtle: '#CCCBC1',
          focus: '#425B49',
        },
        ink: {
          primary: '#292E2A',
          secondary: '#70736C',
          muted: '#9A9C96',
        },
        forest: {
          DEFAULT: '#425B49',
          hover: '#354B3C',
          active: '#2A3C30',
          light: '#E0E8DF',
          border: '#BDCEBC',
        },
        clay: {
          DEFAULT: '#A77D60',
          hover: '#8F694F',
          active: '#7A5740',
          light: '#F4EEE8',
          border: '#DFCEBF',
        },
        lavender: {
          DEFAULT: '#B7A6C2',
          light: '#F1ECF5',
        },
        status: {
          success: '#425B49',
          successBg: '#E0E8DF',
          error: '#A77D60',
          errorBg: '#F4EEE8',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
        mono: [
          '"JetBrains Mono"',
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'monospace',
        ],
      },
      boxShadow: {
        subtle: '0 1px 2px 0 rgba(41, 46, 42, 0.04)',
        card: '0 1px 3px 0 rgba(41, 46, 42, 0.05), 0 1px 2px -1px rgba(41, 46, 42, 0.03)',
        cardHover: '0 4px 12px 0 rgba(41, 46, 42, 0.06), 0 2px 4px -1px rgba(41, 46, 42, 0.03)',
        popover: '0 10px 25px -4px rgba(41, 46, 42, 0.08), 0 4px 6px -2px rgba(41, 46, 42, 0.03)',
      },
      borderRadius: {
        'md': '0.375rem',
        'lg': '0.5rem',
        'xl': '0.75rem',
        '2xl': '1rem',
      },
    },
  },
  plugins: [],
}
