const colors = require('tailwindcss/colors')

module.exports = {
  purge: [
    './src/**/*.js',
    './src/**/*.cljs',
    './resources/**/*.html',
  ],
  plugins: [require('@tailwindcss/ui')],
  darkMode: 'class',
  theme: {
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      black: colors.black,
      white: colors.white,
      gray: colors.trueGray,
      indigo: {
        50: '#f0f9ff',
        100: '#e0f2fe',
        200: '#bae6fd',
        300: '#7dd3fc',
        400: '#38bdf8',
        500: '#0ea5e9',
        600: '#0284c7',
        700: '#005b8a',
        800: '#075985',
        900: '#0c4a6e',
      },
      red: colors.rose,
      yellow: colors.amber,
      orange: colors.orange,
      rose: colors.rose
    }
  }
}
