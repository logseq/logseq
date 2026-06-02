module.exports = {
  plugins: {
    'autoprefixer': {},
    'postcss-import-ext-glob': {},
    'postcss-import': {},
    '@tailwindcss/postcss': {},
    ...(process.env.NODE_ENV === 'production' ? { cssnano: {} } : {})
  }
}
