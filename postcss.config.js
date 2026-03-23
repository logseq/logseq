module.exports = {
  plugins: {
    'autoprefixer': {},
    'postcss-import-ext-glob': {},
    'postcss-import': {},
    'tailwindcss/nesting': 'postcss-nested',
    tailwindcss: {},
    ...(process.env.NODE_ENV === 'production' ? { cssnano: {} } : {})
  }
}
