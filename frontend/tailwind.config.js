/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          800: '#1e293b',
          900: '#0f172a',
          950: '#090d16',
        },
        brand: {
          blue: '#2563eb',
          teal: '#0d9488',
          accent: '#06b6d4',
        }
      }
    },
  },
  plugins: [],
}
