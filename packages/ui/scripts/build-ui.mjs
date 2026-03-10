import path from 'path'
import { build } from 'esbuild'

const root = path.resolve(process.cwd())

await build({
  entryPoints: [path.join(root, 'src/index.ts')],
  bundle: true,
  format: 'cjs',
  platform: 'browser',
  target: 'es2018',
  outfile: path.join(root, 'dist/index.js'),
  jsx: 'transform',
  jsxFactory: 'React.createElement',
  jsxFragment: 'React.Fragment',
  minify: true,
  legalComments: 'none',
  alias: {
    '@': path.join(root, '@')
  },
  external: [
    'react',
    'react-dom',
    'react/jsx-runtime',
    'react/jsx-dev-runtime',
    'aws-amplify',
    'aws-amplify/*',
    '@aws-amplify/*',
  ],
  define: {
    'process.env.NODE_ENV': '"production"',
  },
})
