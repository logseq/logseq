import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, type ESBuildOptions } from 'vite'

const rootDir = path.dirname(fileURLToPath(import.meta.url))
const nodeEnv = process.env.NODE_ENV === 'production' ? 'production' : 'development'
const esbuildOptions = {
  jsx: 'transform',
  jsxFactory: '__LogseqReact.createElement',
  jsxFragment: '__LogseqReact.Fragment',
  jsxInject: "import * as __LogseqReact from 'react'",
} as ESBuildOptions
const browserRequireBanner =
  'var require = function (id) {' +
  ' if (id === "react") return React;' +
  ' if (id === "react-dom") return ReactDOM;' +
  ' throw new Error("Unsupported UI bundle require: " + id);' +
  '};'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(rootDir, '@'),
      'react/jsx-dev-runtime': path.resolve(rootDir, 'src/react-jsx-runtime.ts'),
      'react/jsx-runtime': path.resolve(rootDir, 'src/react-jsx-runtime.ts'),
    },
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(nodeEnv),
  },
  esbuild: esbuildOptions,
  build: {
    sourcemap: true,
    lib: {
      entry: path.resolve(rootDir, 'src/ui.ts'),
      name: 'LSUIBundle',
      formats: ['iife'],
      fileName: () => 'ui.js',
    },
    rollupOptions: {
      external: ['react', 'react-dom'],
      output: {
        intro: browserRequireBanner,
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
        },
      },
    },
  },
})
