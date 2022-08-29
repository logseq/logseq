module.exports = {
  plugins: {
    'postcss-import': {},
    'postcss-nested': {},
    'postcss-import-ext-glob': {},
    'tailwindcss/nesting': {},
    tailwindcss: {
      content: ['./**/*.jsx', '../apps/**/*.{js,jsx,ts,tsx}'],
    },
    autoprefixer: {},
  },
}
