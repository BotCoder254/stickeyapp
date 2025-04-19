/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3A59D1',
        secondary: '#3D90D7',
        accent: '#7AC6D2',
        light: '#B5FCCD',
      }
    },
  },
  plugins: [],
} 

