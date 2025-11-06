// tailwind.config.cjs
/** @type {import('tailwindcss').Config} */
const path = require('path');

module.exports = {
  content: [
    path.resolve(__dirname, 'index.html'),
    path.resolve(__dirname, 'src/**/*.{ts,tsx,js,jsx}'),
    // If you import components from Nx libs, include them:
    path.resolve(__dirname, '../../libs/**/*.{ts,tsx,js,jsx,html}'),
  ],
  theme: { extend: {} },
  plugins: [],
};
