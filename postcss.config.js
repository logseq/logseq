module.exports = (ctx) => ({
  plugins: [
    require('postcss-nested')({}),
    require('postcss-import-ext-glob')({}),
    require('postcss-import')({}),
    require('tailwindcss')('tailwind.config.js'),
  ],
})
