/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Suede Brand Colors
        'suede-primary': '#4B8E8E',    // Primary teal/green
        'suede-secondary': '#A6978E',  // Warm grey/beige
        'suede-accent': '#284D4D',     // Dark teal for accents
        'suede-background': '#F2F0ED', // Light warm background
        'suede-text': '#333333',       // Soft black text
        
        // Legacy primary colors mapped to Suede
        primary: {
          50: '#f0f9f9',
          100: '#d1f2f2',
          200: '#a3e5e5',
          300: '#75d8d8',
          400: '#4B8E8E',  // suede-primary
          500: '#4B8E8E',  // suede-primary
          600: '#3d7272',
          700: '#2f5656',
          800: '#213a3a',
          900: '#284D4D',  // suede-accent
        },
      },
    },
  },
  plugins: [],
}