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
          secondary: '#556361',
          muted: '#84918F',
          faint: '#B2BDBB',
        },
        jade: {
          DEFAULT: '#087F6A',
          light: '#E6F4F1',
          border: '#A7DDD2',
          hover: '#066B59',
          dark: '#044C3F',
        },
        indigo: {
          DEFAULT: '#4959C8',
          light: '#EEF0FA',
          border: '#C0C7F0',
          hover: '#3D4BAF',
          dark: '#2E3987',
        },
        saffron: {
          DEFAULT: '#D99A35',
          light: '#FDF6EB',
          border: '#F2D39E',
          hover: '#BE8327',
          dark: '#936317',
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
          border: '#E5E3DA',
          borderLight: '#ECE9E0',
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
