import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

const bases = {
  core: path.resolve(__dirname, '../packages/core/src'),
  react: path.resolve(__dirname, '../packages/react/src'),
  tldrawLogseq: path.resolve(__dirname, '../apps/tldraw-logseq/src'),
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        parserOpts: {
          plugins: ['decorators-legacy'],
        },
        plugins: [[require.resolve('@babel/plugin-proposal-decorators'), { legacy: true }]],
      },
    }),
  ],
  server: {
    port: '3031',
    // force: true,
    fs: {
      strict: false,
    },
  },
  resolve: {
    alias: [
      {
        find: 'tldraw-logseq',
        replacement: bases.tldrawLogseq,
      },
      {
        find: '@tldraw/core',
        replacement: bases.core,
      },
      {
        find: '@tldraw/react',
        replacement: bases.react,
      },
    ],
  },
})
