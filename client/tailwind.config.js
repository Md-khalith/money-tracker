/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Roboto', 'Open Sans', 'sans-serif'],
      },
      colors: {
        spent: {
          light: '#fef2f2',
          DEFAULT: '#dc2626',
          dark: '#991b1b',
        },
        received: {
          light: '#f0fdf4',
          DEFAULT: '#16a34a',
          dark: '#166534',
        }
      }
    },
  },
  plugins: [],
}
