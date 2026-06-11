const { stripIOSWebFontSourcesPlugin } = require('./scripts/lib/postcss-strip-ios-web-font-sources.cjs')

const mobileCssBuild = process.argv.some((arg) => arg.endsWith('tailwind.mobile.css'))

module.exports = {
  plugins: [
    require('autoprefixer')(),
    require('postcss-import-ext-glob')(),
    require('postcss-import')(),
    require('tailwindcss/nesting')('postcss-nested'),
    require('tailwindcss')(),
    ...(mobileCssBuild ? [stripIOSWebFontSourcesPlugin()] : []),
    ...(process.env.NODE_ENV === 'production' ? [require('cssnano')()] : [])
  ]
}
