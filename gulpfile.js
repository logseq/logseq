const fs = require('fs')
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

const tailwind = {
  paths: [path.join(__dirname, 'tailwind.css'), path.join(sourcePath, '**/*.css')],
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
    return gulp.series(css._buildTailwind.bind(null, void 0, void 0), css._optimizeCSSForRelease)(...params)
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
    // tailwind.core.css placeholder
    fs.writeFileSync(path.join(outputPath, 'css', 'tailwind.core.css'), '')
    return gulp.src(path.join(outputPath, 'css', 'style.css'))
      .pipe(cleanCSS())
      .pipe(gulp.dest(path.join(outputPath, 'css')))
  },
}

const common = {
  clean () {
    return del(outputPath)
  },

  syncResourceFile () {
    return gulp.src(resourceFilePath).pipe(gulp.dest(outputPath))
  },

  keepSyncResourceFile () {
    return gulp.watch(resourceFilePath, { ignoreInitial: false }, common.syncResourceFile)
  }
}

exports.clean = common.clean
exports.watch = gulp.parallel(common.keepSyncResourceFile, css.watchCSS)
exports.build = gulp.series(common.clean, common.syncResourceFile, css.buildCSS)
