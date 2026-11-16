/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Quiet Authority Color System
        mineral: '#E9E8E2',
        surface: {
          primary: '#F4F3EE',
          elevated: '#F8F7F2',
          recessed: '#DEDED5',
        },
        border: {
          subtle: '#D2D2C9',
          focus: '#536A55',
        },
        ink: {
          primary: '#30362F',
          secondary: '#6F746B',
          muted: '#93958C',
        },
        olive: {
          DEFAULT: '#536A55',
          hover: '#465B48',
          active: '#3A4D3C',
          light: '#E4EAE1',
          border: '#C3D1C0',
        },
        bronze: {
          DEFAULT: '#A48B70',
          hover: '#8E775F',
          light: '#F2EDE7',
          border: '#D8CABE',
        },
        clay: {
          DEFAULT: '#A87565',
          hover: '#946455',
          light: '#F7EFEB',
          border: '#DEC2B9',
        },
        status: {
          success: '#457354',
          successBg: '#E8F0EA',
          error: '#A34A42',
          errorBg: '#F7ECEB',
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
