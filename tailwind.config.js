const colors = require('tailwindcss/colors')

function exposeColorsToCssVars({ addBase, theme }) {
  function extractColorVars(colorObj, colorGroup = '') {
    return Object.keys(colorObj).reduce((vars, colorKey) => {
      const value = colorObj[colorKey];

      const newVars =
        typeof value === 'string'
          ? { [`--color${colorGroup}-${colorKey}`]: value }
          : extractColorVars(value, `-${colorKey}`);

      return { ...vars, ...newVars };
    }, {});
  }

  addBase({
    ':root': extractColorVars(theme('colors')),
  });
}

module.exports = {
  mode: 'jit',
  purge: {
    content: [
      './src/**/*.js',
      './src/**/*.cljs',
      './resources/**/*.html'
    ],
    safelist: [
      "bg-black",
      "bg-white",
      "bg-gray-50",  "bg-red-50",  "bg-yellow-50",  "bg-green-50",  "bg-blue-50",  "bg-indigo-50",  "bg-orange-50",  "bg-rose-50",  "bg-purple-50",
      "bg-gray-100", "bg-red-100", "bg-yellow-100", "bg-green-100", "bg-blue-100", "bg-indigo-100", "bg-orange-100", "bg-rose-100", "bg-purple-100", "bg-pink-100",
      "bg-gray-200", "bg-red-200", "bg-yellow-200", "bg-green-200", "bg-blue-200", "bg-indigo-200", "bg-orange-200", "bg-rose-200", "bg-purple-200", "bg-pink-200",
      "bg-gray-300", "bg-red-300", "bg-yellow-300", "bg-green-300", "bg-blue-300", "bg-indigo-300", "bg-orange-300", "bg-rose-300", "bg-purple-300", "bg-pink-300",
      "bg-gray-400", "bg-red-400", "bg-yellow-400", "bg-green-400", "bg-blue-400", "bg-indigo-400", "bg-orange-400", "bg-rose-400", "bg-purple-400", "bg-pink-400",
      "bg-gray-500", "bg-red-500", "bg-yellow-500", "bg-green-500", "bg-blue-500", "bg-indigo-500", "bg-orange-500", "bg-rose-500", "bg-purple-500", "bg-pink-500",
      "bg-gray-600", "bg-red-600", "bg-yellow-600", "bg-green-600", "bg-blue-600", "bg-indigo-600", "bg-orange-600", "bg-rose-600", "bg-purple-600", "bg-pink-600",
      "bg-gray-700", "bg-red-700", "bg-yellow-700", "bg-green-700", "bg-blue-700", "bg-indigo-700", "bg-orange-700", "bg-rose-700", "bg-purple-700", "bg-pink-700",
      "bg-gray-800", "bg-red-800", "bg-yellow-800", "bg-green-800", "bg-blue-800", "bg-indigo-800", "bg-orange-800", "bg-rose-800", "bg-purple-800", "bg-pink-800",
      "bg-gray-900", "bg-red-900", "bg-yellow-900", "bg-green-900", "bg-blue-900", "bg-indigo-900", "bg-orange-900", "bg-rose-900", "bg-purple-900", "bg-pink-900",
    ]
  },
  plugins: [
    require('@tailwindcss/ui'),
    exposeColorsToCssVars],
  darkMode: 'class',
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
      rose: colors.rose,
      purple: colors.purple,
      pink: colors.pink
    }
  }
}
