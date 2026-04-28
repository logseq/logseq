import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

const require = createRequire(import.meta.url)
const pkg = require('./package.json')
const rootDir = path.dirname(fileURLToPath(import.meta.url))
const targetName = process.env.LOGSEQ_LIBS_TARGET ?? 'user'

const targets = {
  user: {
    entry: 'src/LSPlugin.user.ts',
    fileName: 'lsplugin.user.js',
    globalName: 'LSPluginEntry',
    outDir: 'dist',
  },
  core: {
    entry: 'src/LSPlugin.core.ts',
    fileName: 'lsplugin.core.js',
    globalName: 'LSPlugin',
    outDir: '../resources/js',
  },
} as const

const target = targets[targetName as keyof typeof targets]
const browserProcess =
  '({ env: {}, platform: "browser", cwd: () => "/", noDeprecation: false, throwDeprecation: false, traceDeprecation: false, pid: 0 })'
const browserGlobalsBanner = [
  'var global = globalThis;',
  `var process = global.process || (global.process = ${browserProcess});`,
  'process.env || (process.env = {});',
  'process.cwd || (process.cwd = function () { return "/" });',
  'process.platform || (process.platform = "browser");',
  'process.noDeprecation || (process.noDeprecation = false);',
  'process.throwDeprecation || (process.throwDeprecation = false);',
  'process.traceDeprecation || (process.traceDeprecation = false);',
  'process.pid || (process.pid = 0);',
].join('\n')

if (!target) {
  throw new Error(`Unknown LOGSEQ_LIBS_TARGET: ${targetName}`)
}

export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production'

  return {
    define: {
      'global.process': browserProcess,
      LIB_VERSION: JSON.stringify(pkg.version),
      'process.env.NODE_ENV': JSON.stringify(isProduction ? 'production' : 'development'),
      'process.env.NODE_DEBUG': 'undefined',
      'process.noDeprecation': 'false',
      'process.pid': '0',
      'process.platform': JSON.stringify('browser'),
      'process.throwDeprecation': 'false',
      'process.traceDeprecation': 'false',
      'process.cwd': '(() => "/")',
    },
    build: {
      emptyOutDir: false,
      minify: isProduction,
      outDir: target.outDir,
      rollupOptions: {
        output: {
          banner: browserGlobalsBanner,
        },
      },
      lib: {
        entry: path.resolve(rootDir, target.entry),
        name: target.globalName,
        formats: ['umd'],
        fileName: () => target.fileName,
      },
    },
  }
})
