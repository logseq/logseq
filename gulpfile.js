const fs = require('fs')
const utils = require('util')
const cp = require('child_process')
const exec = utils.promisify(cp.exec)
const path = require('path')
const gulp = require('gulp')
const webpack = require('webpack')

const outputPath = path.join(__dirname, 'static')
const outputJsPath = path.join(outputPath, 'js')
const resourcesPath = path.join(__dirname, 'resources')
const publicRootPath = path.join(__dirname, 'public')
const mobilePath = path.join(outputPath, 'mobile')
const mobileJsPath = path.join(mobilePath, 'js')
const sourcePath = path.join(__dirname, 'src/main/frontend')
const resourceFilePath = path.join(resourcesPath, '**')
const resourceSyncGlobs = [
  resourceFilePath,
  '!' + path.join(resourcesPath, 'node_modules/**'),
]
const outputFilePath = path.join(outputPath, '**')
const rawCopySrc = (globs, options = {}) =>
  gulp.src(globs, { encoding: false, ...options })
const browserGlobalEntryPath = (file) =>
  path.join(__dirname, 'scripts', 'browser-globals', file)
const runWebpack = (config) =>
  new Promise((resolve, reject) => {
    webpack(config, (err, stats) => {
      if (err) {
        reject(err)
      } else if (stats.hasErrors()) {
        reject(new Error(stats.toString({
          all: false,
          errors: true,
          warnings: true,
        })))
      } else {
        resolve()
      }
    })
  })
const browserGlobalConfig = (mode, outputDir, entry, externals = {}) => ({
  mode,
  target: 'web',
  devtool: false,
  entry,
  externals,
  output: {
    path: outputDir,
    filename: '[name].js',
    clean: false,
  },
})
const bundleBrowserGlobals = (outputDir) =>
  Promise.all([
    runWebpack(browserGlobalConfig('production', outputDir, {
      'react.production.min': browserGlobalEntryPath('react.js'),
    })),
    runWebpack(browserGlobalConfig('development', outputDir, {
      'react.development': browserGlobalEntryPath('react.js'),
    })),
    runWebpack(browserGlobalConfig('production', outputDir, {
      'react-dom.production.min': browserGlobalEntryPath('react-dom.js'),
      'react-dom-client.production.min': browserGlobalEntryPath('react-dom-client.js'),
      'react-jsx-runtime.production.min': browserGlobalEntryPath('react-jsx-runtime.js'),
      'react-jsx-dev-runtime.production.min': browserGlobalEntryPath('react-jsx-dev-runtime.js'),
      'tabler-icons-react.min': browserGlobalEntryPath('tabler-icons-react.js'),
    }, { react: 'React' })),
    runWebpack(browserGlobalConfig('development', outputDir, {
      'react-dom.development': browserGlobalEntryPath('react-dom.js'),
      'react-dom-client.development': browserGlobalEntryPath('react-dom-client.js'),
      'react-jsx-runtime.development': browserGlobalEntryPath('react-jsx-runtime.js'),
      'react-jsx-dev-runtime.development': browserGlobalEntryPath('react-jsx-dev-runtime.js'),
    }, { react: 'React' })),
  ])
const removeUnsupportedIOSFontSources = (cssText) =>
  cssText.
    replace(/@font-face\s*{[^{}]*url\(["']?web\/Inter-[^{}]*?\.woff2[^{}]*}\s*/g, '').
    replace(/url\((["']?)[^)"']+?\.(?:woff2|woff)(?:\?[^)"']*)?\1\)\s*format\((["'])(?:woff2|woff)\2\),?\s*/g, '')
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

  watchMobileCSS () {
    return cp.spawn(`pnpm css:mobile-watch`, {
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

  buildMobileCSS (...params) {
    return gulp.series(
      () => exec(`pnpm css:mobile-build`, {}),
      css._removeUnsupportedIOSFonts,
    )(...params)
  },

  _optimizeCSSForRelease () {
    return gulp.src(path.join(outputPath, 'css', 'style.css')).
      pipe(gulp.dest(path.join(outputPath, 'css')))
  },

  _removeUnsupportedIOSFonts () {
    const mobileCssPath = path.join(mobilePath, 'css')
    for (const file of ['inter.css', 'style.css']) {
      const filePath = path.join(mobileCssPath, file)
      if (fs.existsSync(filePath)) {
        fs.writeFileSync(
          filePath,
          removeUnsupportedIOSFontSources(fs.readFileSync(filePath, 'utf8')))
      }
    }
    return Promise.resolve()
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

  syncUIAssetFile (...params) {
    return gulp.series(
      () => rawCopySrc(['packages/ui/dist/ui.js']).pipe(gulp.dest(path.join(outputPath, 'js'))),
      () => rawCopySrc(['packages/ui/dist/ui.js']).pipe(gulp.dest(path.join(outputPath, 'mobile', 'js'))),
    )(...params)
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
        'packages/ui/dist/ui.js',
        'node_modules/@sqlite.org/sqlite-wasm/dist/sqlite3.wasm',
        'node_modules/prop-types/prop-types.min.js',
        'node_modules/dompurify/dist/purify.js',
      ]).pipe(gulp.dest(path.join(outputPath, 'js'))),
      () => bundleBrowserGlobals(path.join(outputPath, 'js')),
      () => rawCopySrc([
        'node_modules/@glidejs/glide/dist/glide.min.js',
        'node_modules/@glidejs/glide/dist/css/glide.core.min.css',
        'node_modules/@glidejs/glide/dist/css/glide.theme.min.css',
      ]).pipe(gulp.dest(path.join(outputPath, 'js', 'glide'))),
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
      () => rawCopySrc([
        'node_modules/katex/dist/katex.min.js',
        'node_modules/katex/dist/contrib/mhchem.min.js',
        'node_modules/marked/lib/marked.umd.js',
        'node_modules/@highlightjs/cdn-assets/highlight.min.js',
        'node_modules/@isomorphic-git/lightning-fs/dist/lightning-fs.min.js',
        'node_modules/prop-types/prop-types.min.js',
        'node_modules/interactjs/dist/interact.min.js',
        'node_modules/photoswipe/dist/umd/*.js',
        'packages/ui/dist/ui.js',
        'node_modules/@sqlite.org/sqlite-wasm/dist/sqlite3.wasm',
      ]).pipe(gulp.dest(path.join(outputPath, 'mobile', 'js'))),
      () => bundleBrowserGlobals(path.join(outputPath, 'mobile', 'js')),
      () => rawCopySrc([
        'node_modules/inter-ui/inter.css',
      ]).pipe(gulp.dest(path.join(outputPath, 'mobile', 'css'))),
      () => rawCopySrc([
        'node_modules/katex/dist/fonts/*.ttf',
      ]).pipe(gulp.dest(path.join(outputPath, 'mobile', 'css', 'fonts'))),
    )(...params)
  },

  keepSyncResourceFile () {
    return gulp.watch(resourceSyncGlobs, { ignoreInitial: true },
      common.syncResourceFile)
  },

  keepSyncUIAssetFile () {
    return gulp.watch(['packages/ui/dist/ui.js'], { ignoreInitial: true },
      common.syncUIAssetFile)
  },

  syncAllStatic () {
    return rawCopySrc([
      outputFilePath,
      '!' + path.join(outputPath, 'node_modules/**'),
      '!' + path.join(outputPath, 'mobile/**'),
      '!' + path.join(outputPath, 'android/**'),
      '!' + path.join(outputPath, 'ios/**'),
    ]).pipe(gulp.dest(publicRootPath))
  },

  syncJS_CSSinRt () {
    return gulp.src([
      path.join(outputPath, 'js/**'),
      path.join(outputPath, 'css/**'),
    ], { base: outputPath }).pipe(gulp.dest(publicRootPath))
  },

  keepSyncStaticInRt () {
    return gulp.watch([
      path.join(outputPath, 'js/**'),
      path.join(outputPath, 'css/**'),
    ], { ignoreInitial: true }, common.syncJS_CSSinRt)
  },

  syncWorkersToMobile () {
    return gulp.src([
      path.join(outputPath, 'js/db-worker.js'),
    ], { base: outputJsPath }).pipe(gulp.dest(mobileJsPath))
  },

  keepSyncWorkersToMobile () {
    return gulp.watch([
      path.join(outputPath, 'js/db-worker.js'),
    ], { ignoreInitial: false }, common.syncWorkersToMobile)
  },

  async runCapWithLocalDevServerEntry (cb) {
    const mode = process.env.PLATFORM || 'ios'

    const LOGSEQ_APP_SERVER_URL = `http://localhost:3002`

    if (typeof global.fetch === 'function') {
      try {
        await fetch(LOGSEQ_APP_SERVER_URL)
      } catch (e) {
        return cb(new Error(
          `/* ❌ Please check if the service is ON. (${LOGSEQ_APP_SERVER_URL}) ❌ */`))
      }
    }

    console.log(`------ Cap ${mode.toUpperCase()} -----`)
    console.log(`Dev serve at: ${LOGSEQ_APP_SERVER_URL}`)
    console.log(`--------------------------------------`)

    cp.execSync(`pnpm exec cap sync ${mode}`, {
      stdio: 'inherit',
      env: Object.assign(process.env, {
        LOGSEQ_APP_SERVER_URL,
      }),
    })

    cp.execSync(`rm -rf ios/App/App/public/out`, {
      stdio: 'inherit',
    })

    cp.execSync(`pnpm exec cap run ${mode}`, {
      stdio: 'inherit',
      env: Object.assign(process.env, {
        LOGSEQ_APP_SERVER_URL,
      }),
    })

    cb()
  },

  switchReactDevelopmentMode (cb) {
    try {
      [
        ['react.development.js', 'react.production.min.js'],
        ['react-dom.development.js', 'react-dom.production.min.js'],
        ['react-dom-client.development.js', 'react-dom-client.production.min.js'],
        ['react-jsx-runtime.development.js', 'react-jsx-runtime.production.min.js'],
        ['react-jsx-dev-runtime.development.js', 'react-jsx-dev-runtime.production.min.js'],
      ].forEach(([from, to]) => {
        fs.renameSync(
          path.join(outputPath, 'js', from),
          path.join(outputPath, 'js', to),
        )
      })

      cb()
    } catch (err) {
      console.error('Error during switchReactDevelopmentMode:', err)
      cb(err)
    }
  },

  pruneDesktopPackageFiles () {
    for (const entry of ['mobile', 'android', 'ios']) {
      fs.rmSync(path.join(outputPath, entry), {
        recursive: true,
        force: true,
        maxRetries: 10,
        retryDelay: 100,
      })
    }

    return Promise.resolve()
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
  cp.execSync('pnpm cljs:release-electron', {
    stdio: 'inherit',
  })
  cp.execSync('pnpm db-worker-node:bundle', {
    stdio: 'inherit',
  })
  cp.execSync('pnpm webpack-app-build', {
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

  await common.pruneDesktopPackageFiles()

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

exports.cap = common.runCapWithLocalDevServerEntry
exports.clean = common.clean
exports.watch = gulp.series(
  common.syncResourceFile,
  common.syncAssetFiles, common.switchReactDevelopmentMode,
  gulp.parallel(common.keepSyncResourceFile, common.keepSyncUIAssetFile, css.watchCSS))
exports.watchMobile = gulp.series(
  common.syncResourceFile, common.syncAssetFiles,
  gulp.parallel(common.keepSyncResourceFile, common.keepSyncUIAssetFile, common.keepSyncWorkersToMobile, css.watchMobileCSS))
exports.build = gulp.series(common.clean, common.syncResourceFile,
  common.syncAssetFiles, css.buildCSS)
exports.buildMobile = gulp.series(common.clean, common.syncResourceFile,
  common.syncAssetFiles, css.buildMobileCSS)
