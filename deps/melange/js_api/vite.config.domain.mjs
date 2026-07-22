import { resolve } from 'node:path'
import { defineConfig } from 'vite'

export function domainConfig(entryFile, outputFile) {
  const entry = resolve(process.cwd(), `js/js_api/${entryFile}`)

  return defineConfig({
    build: {
      lib: {
        entry,
        formats: ['cjs'],
        fileName: () => outputFile,
      },
      emptyOutDir: false,
      minify: true,
      sourcemap: false,
      target: 'es2022',
      rollupOptions: {
        output: {
          exports: 'auto',
          codeSplitting: false,
        },
      },
    },
  })
}
