const { join } = require('path');

module.exports = {
  plugins: {
    tailwindcss: {
      config: join(__dirname, 'apps/frontend/tailwind.config.js'),
    },
    autoprefixer: {},
  },
}; 