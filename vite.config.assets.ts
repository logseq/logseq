import { normalizePath, type Plugin, defineConfig } from 'vite'
import { viteStaticCopy, type Target } from 'vite-plugin-static-copy'

const useReactDevelopmentAssets = process.env.LOGSEQ_REACT_DEV_ASSETS === 'true'

const virtualEntryId = 'virtual:logseq-assets-entry'
const resolvedVirtualEntryId = `\0${virtualEntryId}`

function virtualAssetsEntryPlugin(): Plugin {
  return {
    name: 'logseq-assets-entry',
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
    generateBundle(_, bundle) {
      for (const fileName of Object.keys(bundle)) {
        delete bundle[fileName]
      }
    },
  }
}

function flatCopy(src: string | string[], dest: string): Target {
  return {
    src,
    dest,
    rename: { stripBase: true },
  }
}

function reactRuntimeTargets(dest: string): Target[] {
  if (useReactDevelopmentAssets && dest === 'js') {
    return [
      {
        src: 'node_modules/react/umd/react.development.js',
        dest,
        rename: { stripBase: true, name: 'react.production.min.js' },
      },
      {
        src: 'node_modules/react-dom/umd/react-dom.development.js',
        dest,
        rename: { stripBase: true, name: 'react-dom.production.min.js' },
      },
    ]
  }

  return [
    flatCopy([
      'node_modules/react/umd/react.production.min.js',
      'node_modules/react/umd/react.development.js',
      'node_modules/react-dom/umd/react-dom.production.min.js',
      'node_modules/react-dom/umd/react-dom.development.js',
    ], dest),
  ]
}

const desktopJsTargets: Target[] = [
  flatCopy([
    'node_modules/katex/dist/katex.min.js',
    'node_modules/katex/dist/contrib/mhchem.min.js',
    'node_modules/html2canvas/dist/html2canvas.min.js',
    'node_modules/interactjs/dist/interact.min.js',
    'node_modules/photoswipe/dist/umd/*.js',
    'node_modules/marked/lib/marked.umd.js',
    'node_modules/@highlightjs/cdn-assets/highlight.min.js',
    'node_modules/@isomorphic-git/lightning-fs/dist/lightning-fs.min.js',
    'packages/ui/dist/ui.js',
    'node_modules/@sqlite.org/sqlite-wasm/dist/sqlite3.wasm',
    'node_modules/prop-types/prop-types.min.js',
    'node_modules/dompurify/dist/purify.js',
  ], 'js'),
  ...reactRuntimeTargets('js'),
  {
    src: 'node_modules/@tabler/icons-react/dist/umd/tabler-icons-react.min.js',
    dest: 'js',
    rename: { stripBase: true },
    transform: {
      encoding: 'utf8',
      handler(content) {
        return content.replace(
          '"@tabler/icons-react"]={},a.react,',
          '"tablerIcons"]={},a.React,',
        )
      },
    },
  },
  flatCopy([
    'node_modules/@glidejs/glide/dist/glide.min.js',
    'node_modules/@glidejs/glide/dist/css/glide.core.min.css',
    'node_modules/@glidejs/glide/dist/css/glide.theme.min.css',
  ], 'js/glide'),
  flatCopy([
    'node_modules/pdfjs-dist/legacy/build/pdf.mjs',
    'node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs',
    'node_modules/pdfjs-dist/legacy/web/pdf_viewer.mjs',
  ], 'js/pdfjs'),
  flatCopy('node_modules/pdfjs-dist/cmaps/*.*', 'js/pdfjs/cmaps'),
]

const mobileJsTargets: Target[] = [
  flatCopy([
    'node_modules/katex/dist/katex.min.js',
    'node_modules/katex/dist/contrib/mhchem.min.js',
    'node_modules/marked/lib/marked.umd.js',
    'node_modules/@highlightjs/cdn-assets/highlight.min.js',
    'node_modules/@isomorphic-git/lightning-fs/dist/lightning-fs.min.js',
    'node_modules/interactjs/dist/interact.min.js',
    'node_modules/photoswipe/dist/umd/*.js',
    'packages/ui/dist/ui.js',
    'node_modules/@sqlite.org/sqlite-wasm/dist/sqlite3.wasm',
    'node_modules/prop-types/prop-types.min.js',
  ], 'mobile/js'),
  ...reactRuntimeTargets('mobile/js'),
]

const cssAssetTargets: Target[] = [
  flatCopy('node_modules/inter-ui/inter.css', 'css'),
  flatCopy('node_modules/inter-ui/web/*.*', 'css/web'),
  flatCopy('node_modules/katex/dist/fonts/*.woff2', 'css/fonts'),
  flatCopy('node_modules/inter-ui/inter.css', 'mobile/css'),
  flatCopy('node_modules/inter-ui/web/*.*', 'mobile/css/web'),
  flatCopy('node_modules/katex/dist/fonts/*.woff2', 'mobile/css/fonts'),
]

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
    virtualAssetsEntryPlugin(),
    viteStaticCopy({
      targets: [
        {
          src: normalizePath('resources/**/*'),
          dest: '.',
          // Drop only the resources/ prefix while preserving its nested paths.
          rename: { stripBase: 1 },
        },
        ...desktopJsTargets,
        ...mobileJsTargets,
        ...cssAssetTargets,
      ],
      watch: {
        reloadPageOnChange: false,
      },
    }),
  ],
})
