const colors = require('tailwindcss/colors')

function exposeColorsToCssVars ({ addBase, theme }) {
  function extractColorVars (colorObj, colorGroup = '') {
    return Object.keys(colorObj).reduce((vars, colorKey) => {
      const value = colorObj[colorKey]

      const newVars =
        typeof value === 'string'
          ? { [`--color${colorGroup}-${colorKey}`]: value }
          : extractColorVars(value, `-${colorKey}`)

      return { ...vars, ...newVars }
    }, {})
  }

  addBase({
    ':root': extractColorVars(theme('colors')),
  })
}

module.exports = {
  darkMode: 'class',
  content: [
    './src/**/*.js',
    './src/**/*.cljs',
    './resources/**/*.html'
  ],
  safelist: [
    'bg-black', 'bg-white',
    { pattern: /bg-(gray|red|yellow|green|blue|orange|indigo|rose|purple|pink)-(100|200|300|400|500|600|700|800|900)/ },
    { pattern: /text-(gray|red|yellow|green|blue|orange|indigo|rose|purple|pink)-(100|200|300|400|500|600|700|800|900)/ },
    { pattern: /columns-([1-9]|1[0-2])|(auto|3xs|2xs|xs|sm|md|lg|xl)|([2-7]xl)/ }
  ],
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/aspect-ratio'),
    require('@tailwindcss/line-clamp'),
    exposeColorsToCssVars
  ],
  theme: {
    extend: {
      fontSize: {
        '2xs': ['0.625rem', '0.875rem']
      },
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
      gray: colors.neutral,
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
      rose: colors.rose,
      purple: colors.purple,
      pink: colors.pink
    }
  }
}
