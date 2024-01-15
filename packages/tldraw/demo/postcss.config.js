const rootTailwindConfig = require('../../tailwind.config')

module.exports = {
  plugins: {
    'postcss-import': {},
    'postcss-nested': {},
    'postcss-import-ext-glob': {},
    'tailwindcss/nesting': {},
    tailwindcss: {
      ...rootTailwindConfig,
      content: ['./**/*.jsx', '../apps/**/*.{js,jsx,ts,tsx}'],
    },
    autoprefixer: {},
  },
}
