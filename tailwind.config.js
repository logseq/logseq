module.exports = {
  purge: [
    './src/**/*.js',
    './src/**/*.cljs',
    './resources/**/*.html',
  ],
  plugins: [require('@tailwindcss/ui')],
  darkMode: 'class',
}
