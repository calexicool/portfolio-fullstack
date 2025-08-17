// НЕ относительные, а абсолютные пути — чтоб работало из любого cwd
const path = require('path');

module.exports = {
  darkMode: 'class',
  content: [
    path.resolve(__dirname, 'index.html'),
    path.resolve(__dirname, 'src/**/*.{js,jsx,ts,tsx}'),
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
