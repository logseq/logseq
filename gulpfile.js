const path = require('path')
const gulp = require('gulp')
const postcss = require('gulp-postcss')
const concat = require('gulp-concat')
const cleanCSS = require('gulp-clean-css')
const del = require('del')

const outputPath = path.join(__dirname, 'static')
const resourcesPath = path.join(__dirname, 'resources')
const sourcePath = path.join(__dirname, 'src')
const resourceFilePath = path.join(resourcesPath, '**')

const tailwind = {
  paths: [path.join(__dirname, 'tailwind.css'), path.join(sourcePath, '**/*.css')],
  outputDir: path.join(outputPath, 'css'),
  outputName: 'tailwind.build.css',
}

const css = {
  watchCSS() {
    return gulp.watch(tailwind.paths, { ignoreInitial: false }, css._buildTailwind)
  },

  buildCSS(...params) {
    return gulp.series(css._buildTailwind, css._optimizeCSSForRelease)(...params)
  },

  _buildTailwind() {
    return gulp.src(tailwind.paths)
      .pipe(postcss())
      .pipe(concat(tailwind.outputName))
      .pipe(gulp.dest(tailwind.outputDir))
  },

  _optimizeCSSForRelease() {
    return gulp.src(path.join(outputPath, 'css', 'style.css'))
      .pipe(cleanCSS())
      .pipe(gulp.dest(outputPath))
  },
}

const common = {
  clean() {
    return del(outputPath)
  },

  syncResourceFile() {
    return gulp.src(resourceFilePath).pipe(gulp.dest(outputPath))
  },

  keepSyncResourceFile() {
    return gulp.watch(resourceFilePath, { ignoreInitial: false }, common.syncResourceFile)
  }
}

exports.clean = common.clean
exports.watch = gulp.parallel(common.keepSyncResourceFile, css.watchCSS)
exports.build = gulp.series(common.syncResourceFile, css.buildCSS)
