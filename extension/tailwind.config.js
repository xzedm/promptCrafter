/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html", // Tailwind scans this file for class names
    "./src/**/*.{js,ts,jsx,tsx}", // Also scan all JS/TS/React files in src
  ],
  theme: {
    extend: {}, // You can add custom colors, fonts, etc. here
  },
  plugins: [], // Optional Tailwind plugins
}
