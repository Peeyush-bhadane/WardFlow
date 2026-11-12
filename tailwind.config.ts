import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        clinical: {
          bg: "#F7F6F2",
          card: "#FFFFFF",
          border: "#E3E1DA",
          text: "#1C2A33",
          muted: "#5B6B75",
          teal: "#0F6B6B",
          tealHover: "#0C5555",
          tealLight: "#E6F0F0",
        },
        status: {
          grey: "#8A949B",
          greyLight: "#F0F2F3",
          greyBorder: "#D2D7DA",
          blue: "#2F6FA8",
          blueLight: "#EBF3FA",
          blueBorder: "#C0D9EF",
          green: "#2E7D4F",
          greenLight: "#EBF6EF",
          greenBorder: "#BDE2CA",
          amber: "#C98A1B",
          amberLight: "#FEF6E9",
          amberBorder: "#F6DEB0",
          red: "#B3372E",
          redLight: "#FCEEED",
          redBorder: "#F3C7C4",
        },
      },
      borderRadius: {
        DEFAULT: "6px",
        md: "6px",
        lg: "6px",
        xl: "6px",
        "2xl": "6px",
      },
      fontFamily: {
        sans: ["var(--font-ibm-plex-sans)", "system-ui", "-apple-system", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
