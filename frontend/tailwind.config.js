/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Monochrome + Hot Pink Color System
        main: '#111111',
        secondary: '#181818',
        card: '#202020',
        elevated: '#272727',
        border: '#353535',
        primaryText: '#F5F5F5',
        secondaryText: '#A6A3A5',
        mutedText: '#777477',
        // Signature Hot Pink
        pink: {
          DEFAULT: '#D9225C',
          hover: '#BA1B4E',
          active: '#9E1541',
          faint: 'rgba(217, 34, 92, 0.10)',
          subtle: 'rgba(217, 34, 92, 0.18)',
          border: 'rgba(217, 34, 92, 0.40)',
        },
        // Core structural aliases
        surface: {
          main: '#111111',
          secondary: '#181818',
          card: '#202020',
          elevated: '#272727',
          border: '#353535',
          borderLight: '#454545',
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
