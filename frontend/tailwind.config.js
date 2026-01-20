/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {},
    screens: {
    'md': '768px',
    'tablet-lg': '900px',  // новый для 900–1023px
    'lg': '1024px',
  },
  },
  plugins: [],
}