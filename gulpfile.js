const fs = require('fs')
const utils = require('util')
const cp = require('child_process')
const exec = utils.promisify(cp.exec)
const path = require('path')
const gulp = require('gulp')
const cleanCSS = require('gulp-clean-css')
const del = require('del')
const ip = require('ip')

const outputPath = path.join(__dirname, 'static')
const resourcesPath = path.join(__dirname, 'resources')
const publicStaticPath = path.join(__dirname, 'public/static')
const sourcePath = path.join(__dirname, 'src/main/frontend')
const resourceFilePath = path.join(resourcesPath, '**')
const outputFilePath = path.join(outputPath, '**')

const css = {
  watchCSS () {
    return cp.spawn(`yarn css:watch`, {
      shell: true,
      stdio: 'inherit'
    })
  },

  buildCSS (...params) {
    return gulp.series(
      () => exec(`yarn css:build`, {}),
      css._optimizeCSSForRelease
    )(...params)
  },

  _optimizeCSSForRelease () {
    return gulp.src(path.join(outputPath, 'css', 'style.css'))
      .pipe(cleanCSS())
      .pipe(gulp.dest(path.join(outputPath, 'css')))
  }
}

const common = {
  clean () {
    return del(['./static/**/*', '!./static/yarn.lock', '!./static/node_modules'])
  },

  syncResourceFile () {
    return gulp.src(resourceFilePath).pipe(gulp.dest(outputPath))
  },

  // NOTE: All assets from node_modules are copied to the output directory
  syncAssetFiles (...params) {
    return gulp.series(
      () => gulp.src([
        './node_modules/@excalidraw/excalidraw/dist/excalidraw-assets/**',
        '!**/*/i18n-*.js'
      ]).pipe(gulp.dest(path.join(outputPath, 'js', 'excalidraw-assets'))),
      () => gulp.src([
        'node_modules/katex/dist/katex.min.js',
        'node_modules/katex/dist/contrib/mhchem.min.js',
        'node_modules/html2canvas/dist/html2canvas.min.js',
        'node_modules/interactjs/dist/interact.min.js',
        'node_modules/photoswipe/dist/umd/*.js',
        'node_modules/reveal.js/dist/reveal.js',
        'node_modules/shepherd.js/dist/js/shepherd.min.js'
      ]).pipe(gulp.dest(path.join(outputPath, 'js'))),
      () => gulp.src([
        'node_modules/@tabler/icons/iconfont/tabler-icons.min.css',
        'node_modules/inter-ui/inter.css',
        'node_modules/reveal.js/dist/theme/fonts/source-sans-pro/**',
      ]).pipe(gulp.dest(path.join(outputPath, 'css'))),
      () => gulp.src('node_modules/inter-ui/Inter (web)/*.*')
        .pipe(gulp.dest(path.join(outputPath, 'css', 'Inter (web)'))),
      () => gulp.src([
        'node_modules/@tabler/icons/iconfont/fonts/**',
        'node_modules/katex/dist/fonts/*.woff2'
      ]).pipe(gulp.dest(path.join(outputPath, 'css', 'fonts'))),
    )(...params)
  },

  keepSyncResourceFile () {
    return gulp.watch(resourceFilePath, { ignoreInitial: true }, common.syncResourceFile)
  },

  syncAllStatic () {
    return gulp.src([
      outputFilePath,
      '!' + path.join(outputPath, 'node_modules/**')
    ]).pipe(gulp.dest(publicStaticPath))
  },

  syncJS_CSSinRt () {
    return gulp.src([
      path.join(outputPath, 'js/**'),
      path.join(outputPath, 'css/**')
    ], { base: outputPath }).pipe(gulp.dest(publicStaticPath))
  },

  keepSyncStaticInRt () {
    return gulp.watch([
      path.join(outputPath, 'js/**'),
      path.join(outputPath, 'css/**')
    ], { ignoreInitial: true }, common.syncJS_CSSinRt)
  },

  async runCapWithLocalDevServerEntry (cb) {
    const mode = process.env.PLATFORM || 'ios'

    const IP = ip.address()
    const LOGSEQ_APP_SERVER_URL = `http://${IP}:3001`

    if (typeof global.fetch === 'function') {
      try {
        await fetch(LOGSEQ_APP_SERVER_URL)
      } catch (e) {
        return cb(new Error(`/* ❌ Please check if the service is ON. (${LOGSEQ_APP_SERVER_URL}) ❌ */`))
      }
    }

    console.log(`------ Cap ${mode.toUpperCase()} -----`)
    console.log(`Dev serve at: ${LOGSEQ_APP_SERVER_URL}`)
    console.log(`--------------------------------------`)

    cp.execSync(`npx cap sync ${mode}`, {
      stdio: 'inherit',
      env: Object.assign(process.env, {
        LOGSEQ_APP_SERVER_URL
      })
    })

    cp.execSync(`rm -rf ios/App/App/public/static/out`, {
      stdio: 'inherit'
    })


    cp.execSync(`npx cap run ${mode} --external`, {
      stdio: 'inherit',
      env: Object.assign(process.env, {
        LOGSEQ_APP_SERVER_URL
      })
    })

    cb()
  }
}

exports.electron = () => {
  if (!fs.existsSync(path.join(outputPath, 'node_modules'))) {
    cp.execSync('yarn', {
      cwd: outputPath,
      stdio: 'inherit'
    })
  }

  cp.execSync('yarn electron:dev', {
    cwd: outputPath,
    stdio: 'inherit'
  })
}

exports.electronMaker = async () => {
  cp.execSync('yarn cljs:release-electron', {
    stdio: 'inherit'
  })

  const pkgPath = path.join(outputPath, 'package.json')
  const pkg = require(pkgPath)
  const version = fs.readFileSync(path.join(__dirname, 'src/main/frontend/version.cljs'))
    .toString().match(/[0-9.]{3,}/)[0]

  if (!version) {
    throw new Error('release version error in src/**/*/version.cljs')
  }

  pkg.version = version
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2))

  if (!fs.existsSync(path.join(outputPath, 'node_modules'))) {
    cp.execSync('yarn', {
      cwd: outputPath,
      stdio: 'inherit'
    })
  }

  cp.execSync('yarn electron:make', {
    cwd: outputPath,
    stdio: 'inherit'
  })
}

exports.cap = common.runCapWithLocalDevServerEntry
exports.clean = common.clean
exports.watch = gulp.series(common.syncResourceFile, common.syncAssetFiles, common.syncAllStatic,
  gulp.parallel(common.keepSyncResourceFile, css.watchCSS))
exports.build = gulp.series(common.clean, common.syncResourceFile, common.syncAssetFiles, css.buildCSS)
