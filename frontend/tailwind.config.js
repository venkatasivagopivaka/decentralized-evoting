/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        porcelain: '#F7F6F1',
        ink: {
          DEFAULT: '#202B2A',
          primary: '#202B2A',
          secondary: '#737B78',
          muted: '#8E9693',
          faint: '#C2C9C6',
        },
        // Base borders
        appBorder: {
          DEFAULT: '#E8E8E2',
          subtle: '#F0F0EA',
          strong: '#D0D0C8',
        },
        // Pale background fills
        pale: {
          mint: '#E6F3ED',
          lavender: '#EEECFA',
          coral: '#FCECE7',
          blue: '#E8F2F7',
          amber: '#FAF1DF',
          rose: '#F8EAF0',
        },
        // Rich accent colors
        emerald: {
          DEFAULT: '#087F6A',
          light: '#E6F3ED',
          border: '#A3D9C9',
          hover: '#066B59',
          dark: '#055446',
        },
        indigo: {
          DEFAULT: '#4959C8',
          light: '#EEECFA',
          border: '#BDC4EE',
          hover: '#3D4BAF',
          dark: '#2B3580',
        },
        coral: {
          DEFAULT: '#E77D68',
          light: '#FCECE7',
          border: '#F6BEB4',
          hover: '#D46853',
          dark: '#A6412D',
        },
        violet: {
          DEFAULT: '#9367C7',
          light: '#F3ECFA',
          border: '#D3BEEA',
          hover: '#7E52B4',
          dark: '#5C3888',
        },
        ocean: {
          DEFAULT: '#3998B5',
          light: '#E8F2F7',
          border: '#A8D6E2',
          hover: '#2E819B',
          dark: '#1C596B',
        },
        amber: {
          DEFAULT: '#D99A35',
          light: '#FAF1DF',
          border: '#F0D49B',
          hover: '#BE8327',
          dark: '#875C17',
        },
        sage: {
          DEFAULT: '#8BAA63',
          light: '#EDF4E7',
          border: '#C7DCAD',
          hover: '#759350',
          dark: '#4B622F',
        },
        rose: {
          DEFAULT: '#D987A5',
          light: '#F8EAF0',
          border: '#EBBFCE',
          hover: '#C26F8D',
          dark: '#8C3D5A',
        },
        // Backwards compatibility tokens
        mint: {
          DEFAULT: '#E6F3ED',
          subtle: '#F2F8F5',
          border: '#A3D9C9',
          dark: '#055446',
        },
        sand: {
          DEFAULT: '#FAF1DF',
          subtle: '#FDF7EB',
          border: '#F0D49B',
          dark: '#875C17',
        },
        crimson: {
          DEFAULT: '#D13838',
          light: '#FCEBEB',
          border: '#F4B0B0',
          hover: '#B52828',
        },
        surface: {
          card: '#FFFFFF',
          subtle: '#FAF9F5',
          inset: '#F1EFE8',
          border: '#E8E8E2',
          borderLight: '#F0F0EA',
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
        subtle: '0 1px 2px 0 rgba(32, 43, 42, 0.04)',
        card: '0 1px 3px 0 rgba(32, 43, 42, 0.05), 0 1px 2px -1px rgba(32, 43, 42, 0.03)',
        cardHover: '0 4px 12px 0 rgba(32, 43, 42, 0.08), 0 2px 4px -1px rgba(32, 43, 42, 0.03)',
        popover: '0 10px 25px -4px rgba(32, 43, 42, 0.08), 0 4px 6px -2px rgba(32, 43, 42, 0.03)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.25rem',
      },
    },
  },
  plugins: [],
}
