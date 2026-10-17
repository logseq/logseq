// Preserve one palette source for full colors and raw HSL channels.
function radixChannelsPlugin() {
  return {
    postcssPlugin: 'logseq-radix-channels',
    Declaration(declaration) {
      if (!/^--rx-[a-z]+-\d+$/.test(declaration.prop)) return
      const match = declaration.value.match(/^hsl\(\s*([^,]+),\s*([^,]+),\s*([^,)]+)\s*\)$/)
      if (!match) throw declaration.error('Radix colors must use literal HSL channels')
      declaration.cloneAfter({
        prop: `${declaration.prop}-hsl`,
        value: match.slice(1).map(channel => channel.trim()).join(' '),
      })
    },
  }
}

module.exports = { radixChannelsPlugin }
