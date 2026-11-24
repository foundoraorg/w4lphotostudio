/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        wall: "#F3F0E9",
        page: "#F8F6F0",
        ink: "#29211D",
        accent: "#C8F23D",
        bronze: "#B97953",
        night: "#101318",
        drawer: "#EAE3D6",
        muted: "#6F665F",
        line: "#D9D2C5",
      },
      fontFamily: {
        display: ["Oswald", "Arial Narrow", "sans-serif"],
        serif: ["Newsreader", "Georgia", "serif"],
        mono: ["DM Mono", "ui-monospace", "monospace"],
      },
      transitionTimingFunction: {
        drawer: "cubic-bezier(.1,.85,.2,1)",
        flyer: "cubic-bezier(.25,.75,.25,1)",
        reveal: "cubic-bezier(.2,.7,.2,1)",
      },
      maxWidth: {
        frame: "1440px",
      },
      screens: {
        xs: "480px",
      },
    },
  },
  plugins: [],
};
