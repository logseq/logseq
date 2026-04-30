const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('fs')
const path = require('path')

const config = require('./forge.config')

const repoRoot = path.resolve(__dirname, '..')

function normalizeResourcePath(resourcePath) {
  return path.resolve(resourcePath)
}

function collectExtraResources() {
  return (config.packagerConfig?.extraResource || []).map(normalizeResourcePath)
}

function isCoveredByExtraResources(targetPath, extraResources) {
  const normalizedTarget = path.resolve(targetPath)
  return extraResources.some((resource) =>
    normalizedTarget === resource || normalizedTarget.startsWith(resource + path.sep)
  )
}

test('packager includes all JavaScript files under dist/', () => {
  const distDir = path.resolve(repoRoot, 'dist')
  const distJsFiles = fs
    .readdirSync(distDir)
    .filter((name) => name.endsWith('.js'))
    .map((name) => path.join(distDir, name))

  assert.ok(
    distJsFiles.length > 0,
    'Expected dist/ to contain at least one JavaScript file for packaging checks'
  )

  const extraResources = collectExtraResources()

  for (const jsFile of distJsFiles) {
    assert.ok(
      isCoveredByExtraResources(jsFile, extraResources),
      `Expected extraResource to include or cover ${jsFile}`
    )
  }
})

test('packager includes dist/build directory', () => {
  const distBuildDir = path.resolve(repoRoot, 'dist/build')

  assert.ok(
    fs.existsSync(distBuildDir),
    'Expected dist/build directory to exist for packaging checks'
  )

  const extraResources = collectExtraResources()

  assert.ok(
    isCoveredByExtraResources(distBuildDir, extraResources),
    `Expected extraResource to include or cover ${distBuildDir}`
  )
})
