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
        // 1. Emerald green & Mint (Election overview)
        emerald: {
          DEFAULT: '#087F6A',
          light: '#E6F4F1',
          border: '#A7DDD2',
          hover: '#066B59',
          dark: '#044C3F',
        },
        mint: {
          DEFAULT: '#DCEBE5',
          subtle: '#F0F6F4',
          border: '#BFD9CF',
          dark: '#2C5C4E',
        },
        // 2. Royal indigo (Voter management)
        indigo: {
          DEFAULT: '#4959C8',
          light: '#EEF0FA',
          border: '#C0C7F0',
          hover: '#3D4BAF',
          dark: '#2E3987',
        },
        // 3. Elegant violet (Encryption & security)
        violet: {
          DEFAULT: '#9367C7',
          light: '#F4EEFB',
          border: '#D7C4EF',
          hover: '#7E52B4',
          dark: '#583286',
        },
        // 4. Ocean blue (Blockchain & network)
        ocean: {
          DEFAULT: '#3998B5',
          light: '#EAF5F8',
          border: '#B0DBE6',
          hover: '#2E819B',
          dark: '#1F586A',
        },
        // 5. Warm amber & Warm sand (Election lifecycle)
        amber: {
          DEFAULT: '#D99A35',
          light: '#FDF6EB',
          border: '#F2D39E',
          hover: '#BE8327',
          dark: '#936317',
        },
        sand: {
          DEFAULT: '#F3E6CC',
          subtle: '#FAF3E6',
          border: '#E8D4AE',
          dark: '#735728',
        },
        // 6. Soft coral, Dusty rose & Sage green (Results & candidate accents)
        coral: {
          DEFAULT: '#E77D68',
          light: '#FDEDEA',
          border: '#F5BEB5',
          hover: '#D46853',
          dark: '#9E3825',
        },
        rose: {
          DEFAULT: '#E8B9C8',
          light: '#FAF1F4',
          border: '#F3D2DD',
          hover: '#D49DAE',
          dark: '#8C4B61',
        },
        sage: {
          DEFAULT: '#8BAA63',
          light: '#F1F6EC',
          border: '#C8DCB0',
          hover: '#759350',
          dark: '#4B622F',
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
