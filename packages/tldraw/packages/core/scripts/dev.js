/* eslint-disable */
const esbuild = require('esbuild')
const pkg = require('../package.json')

const { log } = console

async function main() {
  esbuild.build({
    entryPoints: ['./src/index.ts'],
    outdir: 'dist/esm',
    minify: false,
    bundle: true,
    format: 'esm',
    target: 'es6',
    tsconfig: './tsconfig.build.json',
    jsxFactory: 'React.createElement',
    jsxFragment: 'React.Fragment',
    external: Object.keys(pkg.dependencies),
    incremental: true,
    sourcemap: true,
    watch: {
      onRebuild(error) {
        if (error) {
          log(`× ${pkg.name}: An error in prevented the rebuild.`)
          return
        }
        log(`✔ ${pkg.name}: Rebuilt.`)
      },
    },
  })
}

main()
