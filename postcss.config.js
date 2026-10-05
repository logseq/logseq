module.exports = {
  plugins: [
    require('postcss-import-ext-glob')(),
    require('postcss-import')(),
    require('postcss-nested').default(),
    require('@tailwindcss/postcss')({ optimize: false }),
    ...(process.env.NODE_ENV === 'production' ? [require('cssnano')()] : [])
  ]
}
