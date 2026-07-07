/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.jsx", "./src/**/*.{js,jsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        vistaNavy: "#1B3A6B",
        vistaOrange: "#F5A623",
        vistaYellow: "#F7B733",
      },
    },
  },
  plugins: [],
};
