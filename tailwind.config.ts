import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#ff2d78",
          dark: "#c4145c",
          light: "#ff6fa5",
        },
        base: {
          bg: "#0b0b10",
          card: "#15151c",
        },
      },
    },
  },
  plugins: [],
};

export default config;
