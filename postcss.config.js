const or = (...args) => {
  const variableNames = args.filter(x => x.startsWith('--')) 
  const initialValue = args.filter(x => !x.startsWith('--'))[0]

  return variableNames.reduceRight((memo, current) => {
    if (memo && current) { 
      return `var(${current.trim()}, ${memo})` 
    } else if (current) {
      return `var(${current.trim()})`
    } else if (memo) {
      return memo
    }
  }, initialValue)
}


module.exports = {
  plugins: {
    'autoprefixer': {},
    'postcss-import-ext-glob': {},
    'postcss-import': {},
    'postcss-functions': { functions: { or } },
    'tailwindcss/nesting': 'postcss-nested',
    tailwindcss: {},
    ...(process.env.NODE_ENV === 'production' ? { cssnano: {} } : {})
  }
}
