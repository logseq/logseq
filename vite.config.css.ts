import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import autoprefixer from 'autoprefixer'
import cssnano from 'cssnano'
import postcss, { type AcceptedPlugin } from 'postcss'
import postcssImport from 'postcss-import'
import postcssImportExtGlob from 'postcss-import-ext-glob'
import tailwindcss from 'tailwindcss'
import tailwindNesting from 'tailwindcss/nesting'
import { defineConfig, type Plugin } from 'vite'

type CssTarget = {
  name: string
  input: string
  output: string
}

const virtualEntryId = 'virtual:logseq-css-entry'
const resolvedVirtualEntryId = `\0${virtualEntryId}`

const allCssTargets: CssTarget[] = [
  {
    name: 'desktop',
    input: 'tailwind.all.css',
    output: 'static/css/style.css',
  },
  {
    name: 'mobile',
    input: 'tailwind.mobile.css',
    output: 'static/mobile/css/style.css',
  },
]

function requestedCssTargets(): CssTarget[] {
  const targetName = process.env.LOGSEQ_CSS_TARGET
  if (!targetName) {
    return allCssTargets
  }

  const target = allCssTargets.find(({ name }) => name === targetName)
  if (!target) {
    throw new Error(`Unknown LOGSEQ_CSS_TARGET: ${targetName}`)
  }

  return [target]
}

function filesToWatch(): string[] {
  return [
    'tailwind.config.js',
    ...allCssTargets.map(({ input }) => input),
    'src',
    'resources',
    path.join('deps', 'shui', 'src'),
    path.join('packages', 'ui', 'src'),
    path.join('packages', 'ui', '@'),
  ].filter(existsSync)
}

async function buildCss(targets: CssTarget[]) {
  const postcssPlugin = (plugin: unknown): AcceptedPlugin => plugin as AcceptedPlugin
  const postcssPlugins: AcceptedPlugin[] = [
    postcssPlugin(postcssImportExtGlob()),
    postcssPlugin(postcssImport()),
    postcssPlugin(tailwindNesting()),
    postcssPlugin(tailwindcss()),
    postcssPlugin(autoprefixer()),
  ]

  if (process.env.NODE_ENV === 'production') {
    postcssPlugins.push(postcssPlugin(cssnano({ preset: 'default' })))
  }

  const processor = postcss(postcssPlugins)

  for (const target of targets) {
    const input = path.resolve(target.input)
    const output = path.resolve(target.output)
    const result = await processor.process(readFileSync(input, 'utf8'), {
      from: input,
      to: output,
      map: false,
    })

    mkdirSync(path.dirname(output), { recursive: true })
    writeFileSync(output, result.css)
  }
}

function cssPipelinePlugin(targets: CssTarget[]): Plugin {
  return {
    name: 'logseq-css-pipeline',
    resolveId(id) {
      if (id === virtualEntryId) {
        return resolvedVirtualEntryId
      }

      return null
    },
    load(id) {
      if (id === resolvedVirtualEntryId) {
        return 'export {}\n'
      }

      return null
    },
    buildStart() {
      for (const file of filesToWatch()) {
        this.addWatchFile(path.resolve(file))
      }
    },
    async closeBundle() {
      await buildCss(targets)
    },
    generateBundle(_, bundle) {
      for (const fileName of Object.keys(bundle)) {
        delete bundle[fileName]
      }
    },
  }
}

const cssTargets = requestedCssTargets()

export default defineConfig({
  publicDir: false,
  build: {
    emptyOutDir: false,
    outDir: 'static',
    rollupOptions: {
      input: virtualEntryId,
    },
  },
  plugins: [
    cssPipelinePlugin(cssTargets),
  ],
})
