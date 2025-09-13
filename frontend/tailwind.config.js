/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'background': '#c3c3c3',
        'card': '#f1f2f5',
        'btn': '#dddedf',
        'typography': '#101827',
      },
    },
  },
  plugins: [],
}
