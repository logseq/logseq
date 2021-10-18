const fs = require('fs')
const utils = require('util')
const cp = require('child_process')
const exec = utils.promisify(cp.exec)
const path = require('path')
const gulp = require('gulp')
const cleanCSS = require('gulp-clean-css')
const del = require('del')

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

  keepSyncResourceFile () {
    return gulp.watch(resourceFilePath, { ignoreInitial: true }, common.syncResourceFile)
  },

  syncStatic () {
    return gulp.src([
      outputFilePath,
      '!' + path.join(outputPath, 'node_modules/**')
    ]).pipe(gulp.dest(publicStaticPath))
  },

  keepSyncStatic () {
    return gulp.watch([
      path.join(outputPath, 'js/**'),
      path.join(outputPath, 'css/**')
    ], { ignoreInitial: true }, common.syncStatic)
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
  cp.execSync('yarn cljs:release', {
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

  cp.execSync('yarn rebuild:better-sqlite3', {
    cwd: outputPath,
    stdio: 'inherit'
  })

  cp.execSync('yarn electron:make', {
    cwd: outputPath,
    stdio: 'inherit'
  })
}

exports.clean = common.clean
exports.watch = gulp.series(common.syncResourceFile, common.syncStatic, gulp.parallel(common.keepSyncResourceFile, css.watchCSS, common.keepSyncStatic))
exports.build = gulp.series(common.clean, common.syncResourceFile, css.buildCSS)
