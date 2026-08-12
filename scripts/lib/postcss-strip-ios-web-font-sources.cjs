const unsupportedIOSWebFontSourcePattern =
  /\.woff2?(?:[?#][^"')\s]*)?(?:["')\s]|$)|format\(["']woff2?["']\)/i

const stripUnsupportedIOSWebFontValue = (value) => {
  const sources = value.split(/,(?=\s*(?:url|local)\()/)
  const supportedSources = sources.filter((source) =>
    !unsupportedIOSWebFontSourcePattern.test(source))

  return supportedSources.length === 0 ? null : supportedSources.join(',')
}

const stripUnsupportedIOSWebFontSources = (css) =>
  css.replace(/@font-face\s*{[^{}]*}/g, (fontFace) => {
    let hasSupportedSrc = true
    const nextFontFace = fontFace.replace(/src:([^;}]+)([;}])/g, (_match, value, delimiter) => {
      const nextValue = stripUnsupportedIOSWebFontValue(value)
      hasSupportedSrc = nextValue !== null
      return nextValue === null ? '' : `src:${nextValue}${delimiter}`
    })
    return hasSupportedSrc ? nextFontFace : ''
  })

const stripIOSWebFontSourcesPlugin = () => ({
  postcssPlugin: 'strip-ios-web-font-sources',
  Declaration (decl) {
    if (decl.prop.toLowerCase() === 'src') {
      const nextValue = stripUnsupportedIOSWebFontValue(decl.value)
      if (nextValue === null) {
        if (decl.parent?.type === 'atrule' && decl.parent.name === 'font-face') {
          decl.parent.remove()
        } else {
          decl.remove()
        }
      } else {
        decl.value = nextValue
      }
    }
  },
})

module.exports = {
  stripIOSWebFontSourcesPlugin,
  stripUnsupportedIOSWebFontSources,
}
