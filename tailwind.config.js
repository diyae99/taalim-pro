/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#fff8ed",
          100: "#f7ead3",
          200: "#edd3a8",
          300: "#dfb776",
          400: "#cd9448",
          500: "#b9782d",
          600: "#965920",
          700: "#79431d",
          800: "#65381f",
          900: "#56311e"
        },
        ink: "#2e241b",
        paper: "#fffdf8"
      },
      boxShadow: {
        soft: "0 18px 45px rgba(86, 49, 30, 0.12)"
      }
    }
  },
  plugins: []
};
