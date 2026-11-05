import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    // `xs` breakpoint pehle define nahi tha, isliye `xs:` wali classes (e.g. `hidden xs:inline`)
    // kabhi apply nahi hoti thi. Poori list order me di hai (extend nahi) taaki xs
    // CSS me sm/md/lg se PEHLE aaye aur bade breakpoints ko override na kare.
    screens: {
      xs: "475px",
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
    },
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      animation: {
        shimmer: 'shimmer 2s infinite',
         blockRise: 'blockRise 1s ease-in-out infinite',
      },
      keyframes: {
         blockRise: {
        '0%, 100%': { height: '12px', opacity: '0.4' },
        '50%':       { height: '40px', opacity: '1'   },
      },
        shimmer: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
      },
    },
  },
  plugins: [],
};
export default config;
