/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f3fdf7',
          100: '#e7f9ee',
          200: '#c3f0d4',
          300: '#98e0b6',
          400: '#6FCF97',
          500: '#4abe9e',
          600: '#2FA084',
          700: '#278872',
          800: '#1F6F5F',
          900: '#0f3830',
        }
      }
    },
  },
  plugins: [],
}