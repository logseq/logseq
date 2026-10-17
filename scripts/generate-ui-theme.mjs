import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import postcss from 'postcss'
import postcssNested from 'postcss-nested'

const [directory, target] = process.argv.slice(2)
if (!directory || !target) throw new Error('Expected theme CSS directory and OCaml target paths')
const sources = ['theme/vars-classic.css', 'theme/colors.css', 'theme/index.css', 'shui.css']
const rules = []
const accents = new Set(['', 'none', 'logseq'])
const owned = new Set()

// Compile the authored HTML/body palette scopes. Component scopes remain CSS-owned.
// Reject a new global selector shape instead of silently inventing native colors.
function globalScope(selector, rule) {
  if (['.white-theme', '.light-theme', '.dark-theme'].includes(selector)) {
    return { mode: selector === '.dark-theme' ? 'dark' : 'light', accent: null,
      body: selector, specificity: 100 }
  }
  selector = selector.replace(/=["']([a-z-]+)["']\]/g, '=$1]')
  const match = selector.match(/^(:root|html(?:\.dark)?(?:\[data-(?:theme|color)=[a-z-]+\])*)(?: (body|\.dark-theme|\.light-theme))?$/)
  if (!match) {
    if ((selector.startsWith('html') || selector.startsWith(':root')) && !selector.includes(' ')) {
      throw rule.error(`Unsupported global theme selector: ${selector}`)
    }
    return null
  }
  const attributes = Array.from(match[1].matchAll(/\[data-(theme|color)=([a-z-]+)\]/g))
  const mode = attributes.find(attribute => attribute[1] === 'theme')?.[2]
    ?? (match[1].includes('.dark') ? 'dark' : null)
  const accent = attributes.find(attribute => attribute[1] === 'color')?.[2] ?? null
  if (accent !== null) accents.add(accent)
  const body = match[2] ?? null
  const specificity = (attributes.length + Number(match[1].includes('.dark'))
    + Number(match[1] === ':root') + Number(body?.startsWith('.') ?? false)) * 100
    + Number(match[1].startsWith('html')) + Number(body === 'body')
  return { mode, accent, body, specificity }
}

for (const source of sources) {
  const file = join(directory, source)
  const root = (await postcss([postcssNested()]).process(await readFile(file, 'utf8'), { from: file })).root
  root.walkRules(rule => {
    const declarations = rule.nodes.filter(node => node.type === 'decl' && node.prop.startsWith('--'))
    if (!declarations.length) return
    for (const selector of rule.selectors) {
      const scope = globalScope(selector.trim(), rule)
      if (!scope) continue
      let layer = 1
      for (let parent = rule.parent; parent.type !== 'root'; parent = parent.parent) {
        if (parent.type !== 'atrule' || parent.name !== 'layer' || parent.params !== 'base') {
          throw rule.error('Global theme variables must be unlayered or in the base layer')
        }
        layer = 0
      }
      if (declarations.some(declaration => declaration.important)) {
        throw rule.error('Global theme variables must not use !important')
      }
      for (const declaration of declarations) owned.add(declaration.prop)
      rules.push({ ...scope, layer, declarations })
    }
  })
}

rules.sort((a, b) => a.layer - b.layer || a.specificity - b.specificity)
function variables(mode, accent, body) {
  const result = new Map()
  for (const rule of rules) {
    if (Boolean(rule.body) !== body || rule.mode !== null && rule.mode !== mode
      || rule.accent !== null && rule.accent !== accent
      || rule.body === '.dark-theme' && mode !== 'dark'
      || ['.light-theme', '.white-theme'].includes(rule.body) && mode !== 'light') continue
    for (const declaration of rule.declarations) result.set(declaration.prop, declaration.value)
  }
  return result
}
function bindings(variables) {
  return ['[', ...Array.from(variables, ([name, value]) =>
    `  ${JSON.stringify(name)}, ${JSON.stringify(value)};`), ']'].join('\n')
}

const output = ['(* Generated from the shared theme CSS. Do not edit. *)',
  `let owned_names = [${Array.from(owned, name => JSON.stringify(name)).join('; ')}]`,
  `let accents = [${Array.from(accents, name => JSON.stringify(name)).join('; ')}]`,
  'let vars ~dark ~accent = match dark, accent with']
for (const mode of ['light', 'dark']) {
  for (const accent of accents) {
    output.push(`| ${mode === 'dark'}, ${JSON.stringify(accent)} ->`,
      `(${bindings(variables(mode, accent, false))},`,
      `${bindings(variables(mode, accent, true))})`)
  }
}
output.push('| _, accent -> invalid_arg ("Unknown theme accent: " ^ accent)')
await writeFile(target, `${output.join('\n')}\n`)
