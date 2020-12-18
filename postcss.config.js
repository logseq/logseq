module.exports = (ctx) => ({
  plugins: [
    require('postcss-nested'),
    require('tailwindcss')('tailwind.config.js'),
  ],
})
