/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./TiffinTrack.jsx"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          orange: '#E65100',
          green: '#2E7D32',
          cream: '#FFF8E8',
          dark: '#2D2D2D',
          light: '#F5F5F5'
        },
        orange: {
          50: '#FFF8E8',
          100: '#FFE0B2',
          200: '#FFCC80',
          300: '#FFB74D',
          400: '#FFA726',
          500: '#F57C00',
          600: '#E65100',
          700: '#E65100',
          800: '#E65100',
          900: '#E65100',
        },
        amber: {
          50: '#FFF8E8',
          100: '#FFE0B2',
          200: '#FFCC80',
          300: '#FFB74D',
          400: '#FFA726',
          500: '#F57C00',
          600: '#E65100',
          700: '#E65100',
        },
        green: {
          50: '#E8F5E9',
          100: '#C8E6C9',
          200: '#A5D6A7',
          300: '#81C784',
          400: '#66BB6A',
          500: '#4CAF50',
          600: '#2E7D32',
          700: '#1B5E20',
        },
        stone: {
          50: '#FFF8E8',
          100: '#F5F5F5',
          200: '#EEEEEE',
          300: '#E0E0E0',
          400: '#BDBDBD',
          500: '#9E9E9E',
          600: '#757575',
          700: '#616161',
          800: '#2D2D2D',
          900: '#212121',
        },
        blue: {
          // Replace blue accents with green or orange as per instructions: "Prefer orange + green palette. Never use purple."
          // But auth screens have blue for delivery person. I'll make it a teal/greenish blue so it's distinct but fits.
          50: '#E0F2F1',
          100: '#B2DFDB',
          200: '#80CBC4',
          300: '#4DB6AC',
          400: '#26A69A',
          500: '#009688',
          600: '#00897B',
          700: '#00796B',
        },
        purple: {
          // Removing purple by mapping it to grey/stone or green to ensure it's not used as a bright accent.
          50: '#F5F5F5',
          100: '#EEEEEE',
          200: '#E0E0E0',
          300: '#BDBDBD',
          400: '#9E9E9E',
          500: '#757575',
          600: '#616161',
          700: '#424242',
        }
      }
    },
  },
  plugins: [],
}
