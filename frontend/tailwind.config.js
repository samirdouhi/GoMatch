/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gomatch: {
          red: {
            50: "#fff1f2",
            100: "#ffe4e6",
            200: "#fecdd3",
            300: "#fda4af",
            400: "#fb7185",
            500: "#f43f5e",
            600: "#e11d48",
            700: "#be123c",
            800: "#9f1239",
            900: "#881337",
          },
          ink: {
            950: "#05070D",
            900: "#070A12",
            850: "#0A0F1B",
            800: "#0B1220",
          },
        },
      },
   backgroundImage: {
  "gomatch-radial":
    "radial-gradient(1000px circle at 18% 12%, rgba(225,29,72,0.28), transparent 58%), radial-gradient(900px circle at 78% 18%, rgba(16,185,129,0.18), transparent 58%), radial-gradient(900px circle at 55% 95%, rgba(245,158,11,0.14), transparent 62%)",
  "glass-sheen":
    "linear-gradient(135deg, rgba(255,255,255,0.10), rgba(255,255,255,0.02) 35%, rgba(255,255,255,0.06))",
},
      boxShadow: {
        "soft-xl": "0 20px 70px rgba(0,0,0,0.55)",
        "red-glow": "0 18px 60px rgba(225,29,72,0.35)",
        "emerald-glow": "0 18px 60px rgba(16,185,129,0.22)",
      },
    },
  },
  plugins: [],
};