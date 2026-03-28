/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      backgroundImage: {
        "app-gradient": "linear-gradient(140deg, rgba(236,253,245,0.95) 0%, rgba(209,250,229,0.85) 25%, rgba(186,230,253,0.85) 60%, rgba(224,242,254,0.95) 100%)",
      },
    },
  },
  plugins: [],
}

