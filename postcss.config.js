const { stripIOSWebFontSourcesPlugin } = require('./scripts/lib/postcss-strip-ios-web-font-sources.cjs')

const mobileCssBuild = process.argv.some((arg) => arg.endsWith('tailwind.mobile.css'))

module.exports = {
  plugins: {
    'postcss-import-ext-glob': {},
    'postcss-import': {},
    'postcss-nested': {},
    '@tailwindcss/postcss': {
      optimize: false
    },
    ...(mobileCssBuild ? [stripIOSWebFontSourcesPlugin()] : []),
    ...(process.env.NODE_ENV === 'production' ? { cssnano: {} } : {})
  }
}
