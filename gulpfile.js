const gulp = require('gulp')
const postcss = require('gulp-postcss')
const concat = require('gulp-concat')
const merge = require('merge-stream')
const cleanCSS = require('gulp-clean-css')

const tailwind = {
  entryPath: './tailwind.css',
  cssPath: './src/**/*.css',
  outputDir: './resources/static/css/',
  outputName: 'tailwind.min.css',
}

function buildCSS() {
  return merge(gulp.src(tailwind.entryPath), gulp.src(tailwind.cssPath))
    .pipe(postcss())
    .pipe(concat(tailwind.outputName))
    .pipe(gulp.dest(tailwind.outputDir))
}

function watchCSS() {
  return gulp.watch([tailwind.entryPath, tailwind.cssPath], { ignoreInitial: false }, buildCSS)
}

function optimizeCSSForRelease() {
  return gulp.src('./resources/static/css/style.css')
    .pipe(cleanCSS())
    .pipe(gulp.dest('./resources/static/'))
}

const releaseCSS = gulp.series(buildCSS, optimizeCSSForRelease)

exports.watchCSS = watchCSS
exports.buildCSS = buildCSS
exports.releaseCSS = releaseCSS
