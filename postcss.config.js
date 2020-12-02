module.exports = (ctx) => ({
  plugins: [
    require('postcss-nested'),
    require('tailwindcss')('tailwind.config.js'),
    ctx.env === 'production' ? require('cssnano')({ preset: 'default' }) : null,
  ],
})
