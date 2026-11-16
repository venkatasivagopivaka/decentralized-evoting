/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Neo-Lime Editorial Palette
        ivory: {
          DEFAULT: '#F3F0E6',
          surface: '#EAE6DA',
          border: '#D8D3C4',
          muted: '#6B7066',
        },
        midnight: {
          DEFAULT: '#08090B',
          surface: '#0F1115',
          elevated: '#16191F',
          hover: '#1D212A',
        },
        lime: {
          DEFAULT: '#C6FF00',
          hover: '#D4FF33',
          active: '#B0E600',
          dim: 'rgba(198, 255, 0, 0.12)',
          border: 'rgba(198, 255, 0, 0.35)',
        },
        border: {
          subtle: '#232730',
          hover: '#353B49',
          focus: '#C6FF00',
        },
        ink: {
          primary: '#FFFFFF',
          secondary: '#8B909D',
          muted: '#525765',
        },
        status: {
          success: '#C6FF00',
          successBg: 'rgba(198, 255, 0, 0.1)',
          error: '#FF5C5C',
          errorBg: 'rgba(255, 92, 92, 0.1)',
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
        subtle: '0 1px 2px 0 rgba(0, 0, 0, 0.5)',
        limeGlow: '0 0 25px rgba(198, 255, 0, 0.25)',
        limeGlowLg: '0 0 45px rgba(198, 255, 0, 0.35)',
        card: '0 2px 8px rgba(0, 0, 0, 0.6)',
        popover: '0 16px 36px rgba(0, 0, 0, 0.75)',
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
