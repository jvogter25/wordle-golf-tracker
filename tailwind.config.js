/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
        },
        golf: {
          eagle: '#22c55e',
          birdie: '#84cc16',
          par: '#eab308',
          bogey: '#f97316',
          double: '#ef4444',
          triple: '#991b1b',
        }
      }
    },
  },
  plugins: [],
} 