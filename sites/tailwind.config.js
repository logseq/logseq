const colors = require('tailwindcss/colors')

module.exports = {
  content: [
    './src/**/*.{html,js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'logseq': {
          50: '#b7d5d5',
          100: '#8EC2C2',
          200: '#2c7d8f',
          300: '#266C7D',
          400: '#195D6C',
          500: '#094b5a',
          600: '#023643',
          700: '#002B36',
          800: '#01222a',
          900: '#01171d'
        },
      },
      fontSize: {
        '4xl': '2rem',
        '6xl': '4rem'
      },
      backdropBlur: {
        '4xl': '80px',
        '5xl': '100px'
      },
      linearBorderGradients: ({ theme }) => ({
        colors: {
          'yellow-purple-red': [
            colors.amber[400],
            colors.purple[500],
            colors.red[600]
          ],
          'purple-white-red': [
            colors.red[300],
            colors.white,
            colors.purple[400]
          ],
          'blue-white-green': [
            colors.blue[400],
            colors.white,
            colors.green[200]
          ],
          'yellow-white-orange': [
            colors.yellow[200],
            colors.white,
            colors.orange[400]
          ],
          'green-white-black': [
            colors.green[500],
            colors.white,
            colors.yellow[100]
          ],
        },
        background: theme('colors'),
      })
    },
  },
  plugins: [
    require('tailwindcss-animate'),
    require('tailwindcss-border-gradient-radius')
  ],
}
