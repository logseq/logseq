import react from '@vitejs/plugin-react'
// import swc from 'unplugin-swc'
// import basicSsl from '@vitejs/plugin-basic-ssl'
import path from 'path'
import { defineConfig } from 'vite'

const bases = {
  core: path.resolve(__dirname, '../packages/core/src'),
  react: path.resolve(__dirname, '../packages/react/src'),
  tldrawLogseq: path.resolve(__dirname, '../apps/tldraw-logseq/src'),
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    // swc.vite({
    //   jsc: {
    //     target: 'es2022',
    //     parser: {
    //       decorators: true,
    //       tsx: true,
    //       jsx: true,
    //     },
    //     transform: {
    //       legacyDecorator: true,
    //       react: {
    //         refresh: true,
    //         runtime: 'automatic',
    //       }
    //     }
    //   }
    // }),
    react({
      babel: {
        parserOpts: {
          plugins: ['decorators-legacy'],
        },
        plugins: [[require.resolve('@babel/plugin-proposal-decorators'), { legacy: true }]],
      },
    }),
    // basicSsl(),
  ],
  server: {
    port: '3031',
    fs: { strict: false },
    // https: true,
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
