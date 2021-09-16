const colors = require('tailwindcss/colors')

module.exports = {
  mode: 'jit',
  purge: [
    './src/**/*.js',
    './src/**/*.cljs',
    './resources/**/*.html',
  ],
  plugins: [require('@tailwindcss/ui')],
  darkMode: 'class',
  theme: {
    extend: {
      animation: {
        'spin-reverse': 'spin 2s linear infinite reverse',
      },
      spacing: {
        '128': '32rem',
        '144': '36rem'
      },
      scale: {
        '200': '2',
        '250': '2.5',
        '300': '3',
        '400': '4',
      }
    },
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      black: colors.black,
      white: colors.white,
      gray: colors.trueGray,
      green: colors.green,
      blue: colors.blue,
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
      red: colors.red,
      yellow: colors.amber,
      orange: colors.orange,
      rose: colors.rose
    }
  }
}
