const fs = require('fs')
const utils = require('util')
const cp = require('child_process')
const exec = utils.promisify(cp.exec)
const path = require('path')
const gulp = require('gulp')

const outputPath = path.join(__dirname, 'static')
const resourcesPath = path.join(__dirname, 'resources')
const sourcePath = path.join(__dirname, 'src/main/frontend')
const resourceFilePath = path.join(resourcesPath, '**')
const resourceSyncGlobs = [
  resourceFilePath,
  '!' + path.join(resourcesPath, 'node_modules/**'),
]
const rawCopySrc = (globs, options = {}) =>
  gulp.src(globs, { encoding: false, ...options })
const staticCleanKeep = new Set([
  'entitlements.plist',
  'node_modules',
  'package.json',
  'pnpm-lock.yaml',
])
const staticInstallCommand = 'pnpm install --ignore-workspace --frozen-lockfile'

const css = {
  watchCSS () {
    return cp.spawn(`pnpm css:watch`, {
      shell: true,
      stdio: 'inherit',
    })
  },

  buildCSS (...params) {
    return gulp.series(
      () => exec(`pnpm css:build`, {}),
      css._optimizeCSSForRelease,
    )(...params)
  },

  _optimizeCSSForRelease () {
    return gulp.src(path.join(outputPath, 'css', 'style.css')).
      pipe(gulp.dest(path.join(outputPath, 'css')))
  },
}

const common = {
  clean () {
    if (!fs.existsSync(outputPath)) {
      fs.mkdirSync(outputPath, { recursive: true })
    }

    for (const entry of fs.readdirSync(outputPath)) {
      if (staticCleanKeep.has(entry)) continue
      fs.rmSync(path.join(outputPath, entry), {
        recursive: true,
        force: true,
        maxRetries: 10,
        retryDelay: 100,
      })
    }
    return Promise.resolve()
  },

  syncResourceFile () {
    return rawCopySrc(resourceSyncGlobs).pipe(gulp.dest(outputPath))
  },

  // NOTE: All assets from node_modules are copied to the output directory
  syncAssetFiles (...params) {
    return gulp.series(
      () => rawCopySrc([
        'node_modules/katex/dist/katex.min.js',
        'node_modules/katex/dist/contrib/mhchem.min.js',
        'node_modules/html2canvas/dist/html2canvas.min.js',
        'node_modules/interactjs/dist/interact.min.js',
        'node_modules/photoswipe/dist/umd/*.js',
        'node_modules/marked/lib/marked.umd.js',
        'node_modules/@highlightjs/cdn-assets/highlight.min.js',
        'node_modules/@isomorphic-git/lightning-fs/dist/lightning-fs.min.js',
        'node_modules/@sqlite.org/sqlite-wasm/dist/sqlite3.wasm',
        'node_modules/dompurify/dist/purify.js',
      ]).pipe(gulp.dest(path.join(outputPath, 'js'))),
      () => rawCopySrc([
        'node_modules/pdfjs-dist/legacy/build/pdf.mjs',
        'node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs',
        'node_modules/pdfjs-dist/legacy/web/pdf_viewer.mjs',
      ]).pipe(gulp.dest(path.join(outputPath, 'js', 'pdfjs'))),
      () => rawCopySrc([
        'node_modules/pdfjs-dist/cmaps/*.*',
      ]).pipe(gulp.dest(path.join(outputPath, 'js', 'pdfjs', 'cmaps'))),
      () => rawCopySrc([
        'node_modules/inter-ui/inter.css',
      ]).pipe(gulp.dest(path.join(outputPath, 'css'))),
      () => rawCopySrc('node_modules/inter-ui/web/*.*').
        pipe(gulp.dest(path.join(outputPath, 'css', 'web'))),
      () => rawCopySrc([
        'node_modules/katex/dist/fonts/*.woff2',
      ]).pipe(gulp.dest(path.join(outputPath, 'css', 'fonts'))),
    )(...params)
  },

  keepSyncResourceFile () {
    return gulp.watch(resourceSyncGlobs, { ignoreInitial: true },
      common.syncResourceFile)
  },
}

exports.electron = () => {
  cp.execSync(staticInstallCommand, {
    cwd: outputPath,
    stdio: 'inherit',
  })

  cp.execSync('pnpm electron:dev', {
    cwd: outputPath,
    stdio: 'inherit',
  })
}

const prepareElectronMaker = async () => {
  cp.execSync('pnpm ui:build', {
    stdio: 'inherit',
  })
  cp.execSync('pnpm cljs:release-publishing', {
    stdio: 'inherit',
  })
  cp.execSync('pnpm electron:build', {
    stdio: 'inherit',
  })
  cp.execSync('pnpm db-worker:build', {
    stdio: 'inherit',
  })
  cp.execSync('pnpm db-worker-node:bundle', {
    stdio: 'inherit',
  })
  if (process.platform !== 'win32') {
    // macOS/Linux ship the native OCaml daemon binary; Windows keeps the
    // JS daemon bundle staged by db-worker-node:bundle.
    cp.execSync('pnpm db-worker-node:native', {
      stdio: 'inherit',
    })
    const binDir = path.join(outputPath, 'db-worker-bin')
    fs.mkdirSync(binDir, { recursive: true })
    fs.copyFileSync(
      path.join(__dirname, 'deps/db-worker/_build/default/bin/main.exe'),
      path.join(binDir, 'main.exe'))
  } else {
    fs.mkdirSync(path.join(outputPath, 'db-worker-bin'), { recursive: true })
  }
  cp.execSync('pnpm cli:release', {
    stdio: 'inherit',
  })
  cp.execSync('pnpm desktop:prepare-runtime-js', {
    stdio: 'inherit',
  })

  const pkgPath = path.join(outputPath, 'package.json')
  const pkg = require(pkgPath)
  const version = fs.readFileSync(
    path.join(__dirname, 'src/main/frontend/version.cljs')).
    toString().
    match(/[0-9.]{3,}/)[0]

  if (!version) {
    throw new Error('release version error in src/**/*/version.cljs')
  }

  pkg.version = version
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2))

  if (!fs.existsSync(path.join(outputPath, 'node_modules'))) {
    cp.execSync(staticInstallCommand, {
      cwd: outputPath,
      stdio: 'inherit',
    })
  }
}

const runStaticScript = (script) => {
  cp.execSync(`pnpm ${script}`, {
    cwd: outputPath,
    stdio: 'inherit',
  })
}

exports.electronMaker = async () => {
  await prepareElectronMaker()
  runStaticScript('electron:make')
}

exports.electronMakerUnsigned = async () => {
  await prepareElectronMaker()
  runStaticScript('electron:make-unsigned')
}

exports.clean = common.clean
exports.watch = gulp.series(
  common.syncResourceFile,
  common.syncAssetFiles,
  gulp.parallel(common.keepSyncResourceFile, css.watchCSS))
exports.build = gulp.series(common.clean, common.syncResourceFile,
  common.syncAssetFiles, css.buildCSS)
