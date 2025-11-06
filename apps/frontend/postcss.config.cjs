// postcss.config.cjs
const path = require('path');

module.exports = {
  plugins: {
    tailwindcss: {
      config: path.resolve(__dirname, 'tailwind.config.cjs'),
    },
    autoprefixer: {},
  },
};
