/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0fdf7',
          100: '#dcfce8',
          200: '#bbf7d2',
          300: '#86efad',
          400: '#6FCF97',
          500: '#2FA084',
          600: '#1F6F5F',
          700: '#155348',
          800: '#11423a',
          900: '#0f3630',
        }
      }
    },
  },
  plugins: [],
}