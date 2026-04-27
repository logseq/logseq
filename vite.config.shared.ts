import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync } from 'node:fs'
import path from 'node:path'
import { defineConfig, normalizePath, type Plugin, type UserConfig } from 'vite'

type ShadowBridgeConfigOptions = {
  name: string
  shadowDir: string
  externalsEntry: string
  shadowEntry: string
  outDir: string
  outputFile: string
  globals?: Record<string, string>
}

function getBuildNodeEnv(): 'production' | 'development' {
  return process.env.NODE_ENV === 'production' ? 'production' : 'development'
}

function isProductionBuild(): boolean {
  return getBuildNodeEnv() === 'production'
}

function listFilesRecursive(rootDir: string): string[] {
  if (!existsSync(rootDir)) {
    return []
  }

  const files: string[] = []

  for (const entry of readdirSync(rootDir, { withFileTypes: true })) {
    const entryPath = path.join(rootDir, entry.name)
    if (entry.isDirectory()) {
      files.push(...listFilesRecursive(entryPath))
    } else {
      files.push(entryPath)
    }
  }

  return files
}

function createShadowExternalEntryPlugin(options: ShadowBridgeConfigOptions): Plugin {
  const virtualId = `virtual:logseq-shadow-externals:${options.name}`
  const resolvedVirtualId = `\0${virtualId}`

  return {
    name: `logseq-shadow-externals-entry:${options.name}`,
    resolveId(id) {
      if (id === virtualId) {
        return resolvedVirtualId
      }

      return null
    },
    load(id) {
      if (id !== resolvedVirtualId) {
        return null
      }

      return `import ${JSON.stringify(normalizePath(path.resolve(options.externalsEntry)))};`
    },
  }
}

function createShadowSyncPlugin(options: ShadowBridgeConfigOptions): Plugin {
  const shadowDir = path.resolve(options.shadowDir)
  const externalsEntry = path.resolve(options.externalsEntry)
  const shadowEntry = path.resolve(options.shadowEntry)
  const outDir = path.resolve(options.outDir)
  const shadowManifest = path.join(shadowDir, 'manifest.edn')
  const shadowModuleLoader = path.join(shadowDir, 'module-loader.json')
  const overwrittenEntries = new Set([options.outputFile, `${options.outputFile}.map`])

  const fileHasContent = (filePath: string) => {
    if (!existsSync(filePath)) {
      return false
    }

    const stats = statSync(filePath)
    return stats.isFile() && stats.size > 0
  }

  const isShadowBridgeReady = () =>
    fileHasContent(shadowEntry) && existsSync(shadowManifest) && existsSync(shadowModuleLoader)

  const clearBridgeOutputs = () => {
    for (const fileName of overwrittenEntries) {
      rmSync(path.join(outDir, fileName), { force: true })
    }
  }

  return {
    name: `logseq-shadow-sync:${options.name}`,
    buildStart() {
      this.addWatchFile(shadowDir)
      this.addWatchFile(externalsEntry)
      this.addWatchFile(shadowEntry)

      for (const file of listFilesRecursive(shadowDir)) {
        this.addWatchFile(file)
      }
    },
    closeBundle() {
      if (!existsSync(shadowDir)) {
        return
      }

      mkdirSync(outDir, { recursive: true })

      if (!isShadowBridgeReady()) {
        clearBridgeOutputs()
        return
      }

      for (const entry of readdirSync(shadowDir, { withFileTypes: true })) {
        if (overwrittenEntries.has(entry.name)) {
          continue
        }

        const src = path.join(shadowDir, entry.name)
        const dest = path.join(outDir, entry.name)

        cpSync(src, dest, { recursive: entry.isDirectory(), force: true })
      }
    },
  }
}

function createIifeRequireShim(globals: Record<string, string>): string {
  const requireCases = Object.keys(globals)
    .map((id) => {
      const parameter = id.replace(/[^a-zA-Z0-9_$]/g, '_')
      return `    case ${JSON.stringify(id)}: return ${parameter};`
    })
    .join('\n')

  return [
    'var require = function(mod) {',
    '  switch (mod) {',
    requireCases,
    '    default: throw new Error("Cannot require external module " + mod + " from Vite IIFE bridge");',
    '  }',
    '};',
  ].join('\n')
}

function createBrowserExternalRuntimeShim(): string {
  const nodeEnv = JSON.stringify(getBuildNodeEnv())

  return [
    'var global = globalThis;',
    'var process = globalThis.process || {};',
    'process.env || (process.env = {});',
    `process.env.NODE_ENV || (process.env.NODE_ENV = ${nodeEnv});`,
    'process.browser = true;',
  ].join('\n')
}

function createWorkerRuntimeShim(): string {
  const nodeEnv = JSON.stringify(getBuildNodeEnv())

  return [
    'var global = globalThis.global || globalThis;',
    'globalThis.global || (globalThis.global = global);',
    "var document = globalThis.document || { baseURI: self.location.href, location: self.location, currentScript: { tagName: 'SCRIPT', src: self.location.href, href: self.location.href } };",
    'var process = globalThis.process || {};',
    'process.env || (process.env = {});',
    `process.env.NODE_ENV || (process.env.NODE_ENV = ${nodeEnv});`,
    'process.argv || (process.argv = []);',
    "process.version || (process.version = '');",
    'process.versions || (process.versions = {});',
    'process.browser = true;',
    "process.platform || (process.platform = (typeof navigator !== 'undefined' && /Win/i.test(navigator.userAgent || navigator.platform || '')) ? 'win32' : 'browser');",
    "process.cwd || (process.cwd = function() { return '/'; });",
    'process.nextTick || (process.nextTick = function(callback) {',
    '  var args = Array.prototype.slice.call(arguments, 1);',
    '  Promise.resolve().then(function() { callback.apply(null, args); });',
    '});',
  ].join('\n')
}

function createBrowserExternalIifeIntro(globals: Record<string, string>): string {
  return `${createBrowserExternalRuntimeShim()}\n${createIifeRequireShim(globals)}`
}

function createWorkerIifeIntro(globals: Record<string, string>): string {
  return `${createWorkerRuntimeShim()}\n${createIifeRequireShim(globals)}`
}

export function createShadowBridgeConfig(options: ShadowBridgeConfigOptions): UserConfig {
  const globals = options.globals ?? {
    react: 'React',
    'react-dom': 'ReactDOM',
  }
  const virtualId = `virtual:logseq-shadow-externals:${options.name}`

  return defineConfig({
    publicDir: false,
    build: {
      emptyOutDir: false,
      outDir: options.outDir,
      sourcemap: true,
      minify: isProductionBuild(),
      rollupOptions: {
        input: virtualId,
        external: Object.keys(globals),
        output: {
          format: 'iife',
          inlineDynamicImports: true,
          entryFileNames: options.outputFile,
          name: `logseq${options.name[0].toUpperCase()}${options.name.slice(1)}Bridge`,
          globals,
          intro: createBrowserExternalIifeIntro(globals),
        },
      },
    },
    define: {
      'process.env.NODE_ENV': JSON.stringify(getBuildNodeEnv()),
    },
    plugins: [
      createShadowExternalEntryPlugin(options),
      createShadowSyncPlugin(options),
    ],
  })
}

type WorkerBundleConfigOptions = {
  entry: string
  outDir: string
  outputFile: string
}

export function createWorkerBundleConfig(options: WorkerBundleConfigOptions): UserConfig {
  const globals = {
    react: 'React',
    'react-dom': 'ReactDOM',
  }

  return defineConfig({
    base: './',
    publicDir: false,
    build: {
      emptyOutDir: false,
      outDir: options.outDir,
      sourcemap: true,
      minify: isProductionBuild(),
      rollupOptions: {
        input: options.entry,
        external: Object.keys(globals),
        output: {
          format: 'iife',
          inlineDynamicImports: true,
          entryFileNames: options.outputFile,
          name: 'logseqDbWorkerBundle',
          globals,
          intro: createWorkerIifeIntro(globals),
        },
      },
    },
    define: {
      'process.env.NODE_ENV': JSON.stringify(getBuildNodeEnv()),
      'import.meta.url': 'self.location.href',
    },
    resolve: {
      alias: {
        process: 'process/browser',
      },
    },
  })
}
