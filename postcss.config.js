module.exports = {
  plugins: {
    'postcss-import-ext-glob': {},
    'postcss-import': {},
    'postcss-nested': {},
    '@tailwindcss/postcss': {
      optimize: false
    },
    ...(process.env.NODE_ENV === 'production' ? { cssnano: {} } : {})
  }
}
