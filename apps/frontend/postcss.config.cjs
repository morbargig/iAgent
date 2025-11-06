// postcss.config.cjs
const path = require('path');
const tailwindcss = require('tailwindcss');
const autoprefixer = require('autoprefixer');

module.exports = {
  plugins: [
    tailwindcss({
      config: path.join(__dirname, 'tailwind.config.cjs'),
    }),
    autoprefixer,
  ],
};
