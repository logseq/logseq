const fs = require('fs')
const cp = require('child_process')
const path = require('path')
const gulp = require('gulp')
const postcss = require('gulp-postcss')
const concat = require('gulp-concat')
const cached = require('gulp-cached')
const remember = require('gulp-remember')
const cleanCSS = require('gulp-clean-css')
const del = require('del')

const outputPath = path.join(__dirname, 'static')
const resourcesPath = path.join(__dirname, 'resources')
const sourcePath = path.join(__dirname, 'src/main/frontend')
const resourceFilePath = path.join(resourcesPath, '**')

const tailwindCoreEntry = path.join(__dirname, 'tailwind.css')
const tailwindBuildEntry = path.join(sourcePath, '**/*.css')
const tailwind = {
  paths: [tailwindCoreEntry, tailwindBuildEntry],
  outputDir: path.join(outputPath, 'css'),
  outputName: 'tailwind.build.css',
}

const css = {
  async watchCSS () {
    // remove tailwind core css
    await new Promise((resolve) => {
      css._buildTailwind(
        tailwind.paths.shift(),
        'tailwind.core.css'
      )
        .on('end', resolve)
    })

    return gulp.watch(
      tailwind.paths, { ignoreInitial: false },
      css._buildTailwind.bind(null, void 0, void 0))
  },

  buildCSS (...params) {
    return gulp.series(
      css._buildTailwind.bind(null, tailwindCoreEntry, 'tailwind.core.css'),
      css._buildTailwind.bind(null, tailwindBuildEntry, 'tailwind.build.css'),
      css._optimizeCSSForRelease)(...params)
  },

  _buildTailwind (entry, output) {
    return gulp.src(entry || tailwind.paths)
      .pipe(cached('postcss-' + entry))
      .pipe(postcss())
      .pipe(remember('postcss-' + entry))
      .pipe(concat(output || tailwind.outputName))
      .pipe(gulp.dest(tailwind.outputDir))
  },

  _optimizeCSSForRelease () {
    return gulp.src(path.join(outputPath, 'css', 'style.css'))
      .pipe(cleanCSS())
      .pipe(gulp.dest(path.join(outputPath, 'css')))
  },
}

const common = {
  clean () {
    return del(['./static/**/*', '!./static/yarn.lock', '!./static/node_modules'])
  },

  syncResourceFile () {
    return gulp.src(resourceFilePath).pipe(gulp.dest(outputPath))
  },

  keepSyncResourceFile () {
    return gulp.watch(resourceFilePath, { ignoreInitial: false }, common.syncResourceFile)
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

exports.electronMaker = () => {
  cp.execSync('yarn release', {
    stdio: 'inherit'
  })

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

exports.clean = common.clean
exports.watch = gulp.parallel(common.keepSyncResourceFile, css.watchCSS)
exports.build = gulp.series(common.clean, common.syncResourceFile, css.buildCSS)
