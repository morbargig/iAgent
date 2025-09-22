// tailwind.config.cjs
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./apps/frontend/index.html",
    "./apps/frontend/src/**/*.{ts,tsx,js,jsx}",
    // If you import components from Nx libs, include them:
    "./libs/**/*.{ts,tsx,js,jsx,html}",
  ],
  theme: { extend: {} },
  plugins: [],
  // Force regeneration for development
  safelist: [],
};
