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

function createShadowEntryPlugin(options: ShadowBridgeConfigOptions): Plugin {
  const virtualId = `virtual:logseq-shadow-bridge:${options.name}`
  const resolvedVirtualId = `\0${virtualId}`

  return {
    name: `logseq-shadow-entry:${options.name}`,
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

      const imports = [
        `import ${JSON.stringify(normalizePath(path.resolve(options.externalsEntry)))};`,
        `import ${JSON.stringify(normalizePath(path.resolve(options.shadowEntry)))};`,
      ]

      return imports.join('\n')
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

export function createShadowBridgeConfig(options: ShadowBridgeConfigOptions): UserConfig {
  const globals = options.globals ?? {
    react: 'React',
    'react-dom': 'ReactDOM',
  }
  const virtualId = `virtual:logseq-shadow-bridge:${options.name}`

  return defineConfig({
    publicDir: false,
    build: {
      emptyOutDir: false,
      outDir: options.outDir,
      sourcemap: true,
      minify: process.env.NODE_ENV === 'production',
      rollupOptions: {
        input: virtualId,
        external: Object.keys(globals),
        output: {
          format: 'iife',
          inlineDynamicImports: true,
          entryFileNames: options.outputFile,
          name: `logseq${options.name[0].toUpperCase()}${options.name.slice(1)}Bridge`,
          globals,
        },
      },
    },
    plugins: [
      createShadowEntryPlugin(options),
      createShadowSyncPlugin(options),
    ],
  })
}
