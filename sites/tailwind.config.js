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
        },
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
  ],
}
