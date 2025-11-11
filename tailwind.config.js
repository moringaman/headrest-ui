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
        // Headrest Brand Colors (from new logo)
        'headrest': {
          // Teal/Turquoise tones
          'teal-dark': '#4A8A8D',      // Darker teal from logo
          'teal': '#5A9B9E',            // Primary teal
          'teal-medium': '#7EBDC0',     // Medium teal
          'teal-light': '#A8D5D7',      // Light teal

          // Blue-Gray tones
          'slate-dark': '#4F6B7D',      // Darker blue-gray
          'slate': '#6B8A9C',           // Primary blue-gray
          'slate-medium': '#8FA8B8',    // Medium blue-gray
          'slate-light': '#B8CDD9',     // Light blue-gray

          // Supporting colors
          'navy': '#2C4A5C',            // Dark navy for text
          'cream': '#F5F7F9',           // Very light background
          'white': '#FFFFFF',           // Pure white
        },

        // Legacy names for backward compatibility
        'suede-primary': '#5A9B9E',     // headrest-teal
        'suede-secondary': '#8FA8B8',   // headrest-slate-medium
        'suede-accent': '#2C4A5C',      // headrest-navy
        'suede-background': '#F5F7F9',  // headrest-cream
        'suede-text': '#2C4A5C',        // headrest-navy

        // Primary color scale
        primary: {
          50: '#F0F7F8',
          100: '#D9ECEE',
          200: '#B8DDE0',
          300: '#A8D5D7',  // teal-light
          400: '#7EBDC0',  // teal-medium
          500: '#5A9B9E',  // teal (main)
          600: '#4A8A8D',  // teal-dark
          700: '#3A7275',
          800: '#2C5558',
          900: '#2C4A5C',  // navy
        },
      },
    },
  },
  plugins: [],
}