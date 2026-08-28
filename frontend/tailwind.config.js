export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eafaf5",
          100: "#d0f3e7",
          400: "#43c7ae",
          500: "#27c2a3",
          600: "#17a689",
          700: "#118b79",
          900: "#0b2238",
        },
        navy: {
          500: "#1b3a5c",
          700: "#102a43",
          900: "#0b2238",
        },
        ink: "#152536",
        muted: "#708096",
        line: "#e6edf3",
        canvas: "#f5f8fb",
        status: {
          success: "#23a77e",
          successBg: "#eaf8f3",
          warning: "#dc962f",
          warningBg: "#fff4e4",
          danger: "#d6535e",
          dangerBg: "#fff0f1",
          info: "#4777ef",
          infoBg: "#edf3ff",
        },
      },
      boxShadow: {
        card: "0 10px 30px rgba(22,47,74,.06)",
      },
      borderRadius: {
        xl2: "1rem",
      },
    },
  },
  plugins: [],
};
