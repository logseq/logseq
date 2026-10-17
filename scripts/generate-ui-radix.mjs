import { readFile, writeFile } from 'node:fs/promises'
import postcss from 'postcss'
import { radixChannelsPlugin } from './lib/postcss-radix-channels.cjs'

const [source, target] = process.argv.slice(2)
if (!source || !target) throw new Error('Expected palette CSS source and OCaml target paths')
const palette = await postcss([radixChannelsPlugin()]).process(await readFile(source, 'utf8'), { from: source })
const modes = { light: new Map(), dark: new Map() }
palette.root.walkRules(rule => {
  const targets = rule.selector === ':root' ? Object.values(modes)
    : rule.selector === 'html.dark, html[data-theme=dark]' ? [modes.dark]
      : null
  if (!targets) throw rule.error(`Unsupported palette scope: ${rule.selector}`)
  rule.walkDecls(declaration => {
    if (!declaration.prop.startsWith('--rx-')) throw declaration.error('Expected a Radix palette variable')
    for (const target of targets) target.set(declaration.prop, declaration.value)
  })
})
const output = ['(* Generated from resources/css/theme/radix.css. Do not edit. *)']
for (const [mode, variables] of Object.entries(modes)) {
  output.push(`let ${mode} = [`,
    ...Array.from(variables, ([name, value]) => `  ${JSON.stringify(name)}, ${JSON.stringify(value)};`), ']')
}
await writeFile(target, `${output.join('\n')}\n`)
