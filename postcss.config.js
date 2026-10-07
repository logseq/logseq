const postcssNested = require('postcss-nested')

module.exports = {
  plugins: [
    require('postcss-import-ext-glob')(),
    require('postcss-import')(),
    // postcss-nested v7 exports the plugin directly; v8 wraps it in .default
    (postcssNested.default || postcssNested)(),
    require('@tailwindcss/postcss')({ optimize: false }),
    ...(process.env.NODE_ENV === 'production' ? [require('cssnano')()] : [])
  ]
}
