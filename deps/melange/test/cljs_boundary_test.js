const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { spawnSync } = require('node:child_process')
const test = require('node:test')

function findRepoRoot(start) {
  let directory = start
  while (directory !== path.dirname(directory)) {
    if (fs.existsSync(path.join(directory, 'pnpm-workspace.yaml'))) {
      return directory
    }
    directory = path.dirname(directory)
  }
  throw new Error(`Could not find repository root from ${start}`)
}

const repoRoot = findRepoRoot(__dirname)
const melangeRoot = path.join(repoRoot, 'deps/melange')
const sourceExtensions = new Set([
  '.cljs',
  '.cljc',
  '.clj',
  '.edn',
  '.js',
  '.mjs',
  '.cjs',
])
const pathReferenceFiles = new Set([
  'bb.edn',
  'deps.edn',
  'dune',
  'dune-project',
  'package.json',
])
const generatedPathParts = new Set([
  '.cache',
  '.cpcache',
  '.git',
  '.nbb',
  '.shadow-cljs',
  '_build',
  'dist',
  'node_modules',
  'target',
])

function isGenerated(relativePath) {
  return relativePath.split('/').some((part) => generatedPathParts.has(part))
}

function listSourceFiles() {
  const result = spawnSync(
    'git',
    ['ls-files', '--cached', '--others', '--exclude-standard', '-z'],
    { cwd: repoRoot, encoding: 'utf8' }
  )
  assert.equal(result.status, 0, result.stderr)

  return result.stdout
    .split('\0')
    .filter(Boolean)
    .filter((relativePath) => fs.existsSync(path.join(repoRoot, relativePath)))
    .filter((relativePath) => !isGenerated(relativePath))
    .filter((relativePath) => {
      const basename = path.posix.basename(relativePath)
      return (
        sourceExtensions.has(path.posix.extname(relativePath)) ||
        pathReferenceFiles.has(basename) ||
        basename.endsWith('.sh')
      )
    })
    .sort()
}

function matches(pattern, contents) {
  return [...contents.matchAll(pattern)].map((match) => match[0])
}

function inspectSource(relativePath, contents) {
  const offenses = []
  const extension = path.posix.extname(relativePath)
  const isClojureScript = extension === '.cljs' || extension === '.cljc'
  const isClojure = isClojureScript || extension === '.clj'
  const bridgePrefix = 'deps/melange/bridge/'

  if (isClojureScript && !relativePath.startsWith(bridgePrefix)) {
    for (const match of matches(/@logseq\/melange-js-api(?:\/[\w-]+)?/g, contents)) {
      offenses.push(`${relativePath}: direct Melange package import: ${match}`)
    }
  }

  if (isClojure) {
    const oldNamespace =
      /\[\s*logseq\.(?:(?:common|db)(?:\.[\w.-]+)?|melange\.(?:common|db)(?:\.[\w.-]+)?)(?=[\s\]])/g
    for (const match of matches(oldNamespace, contents)) {
      offenses.push(`${relativePath}: legacy namespace load: ${match.trim()}`)
    }
  }

  const legacyCommonPath = ['deps', 'common'].join('/')
  const legacyDbPath = ['deps', 'db'].join('/')
  const legacyPath = new RegExp(
    `(?:${legacyCommonPath}|${legacyDbPath})(?=\\/|[\\s"')]|$)`,
    'g'
  )
  for (const match of matches(legacyPath, contents)) {
    offenses.push(`${relativePath}: legacy source path: ${match}`)
  }

  const isDomainBridge =
    relativePath.startsWith(`${bridgePrefix}src/logseq/melange/bridge/common/`) ||
    relativePath.startsWith(`${bridgePrefix}src/logseq/melange/bridge/db/`)
  if (isDomainBridge) {
    const ownedAtom = /\(def(?:once)?\s+(?:\^\S+\s+)*[\w*?!+.-]+\s+\(atom\b/g
    for (const match of matches(ownedAtom, contents)) {
      offenses.push(`${relativePath}: bridge-owned domain atom: ${match}`)
    }

    const compatibilityFallback =
      /\b(?:compat(?:ibility)?[- ]fallback|fallback[- ](?:implementation|module|namespace|require))\b/gi
    for (const match of matches(compatibilityFallback, contents)) {
      offenses.push(`${relativePath}: compatibility fallback marker: ${match}`)
    }
  }

  return offenses
}

test('source boundaries contain no legacy Common or DB dependencies', () => {
  const offenses = []
  for (const legacyDirectory of [
    ['deps', 'common'].join('/'),
    ['deps', 'db'].join('/'),
  ]) {
    if (fs.existsSync(path.join(repoRoot, legacyDirectory))) {
      offenses.push(`${legacyDirectory}: legacy source directory exists`)
    }
  }

  for (const relativePath of listSourceFiles()) {
    const contents = fs.readFileSync(path.join(repoRoot, relativePath), 'utf8')
    offenses.push(...inspectSource(relativePath, contents))
  }

  offenses.sort()
  assert.deepEqual(offenses, [], offenses.join('\n'))
})

test('source inspection distinguishes forbidden dependencies from valid names', () => {
  const legacyNamespace = ['logseq', 'db', 'entity'].join('.')
  const validNamespace = ['logseq', 'db-sync', 'core'].join('.')
  const legacyPath = ['deps', 'db', 'src'].join('/')
  const validPath = ['deps', 'db-sync', 'src'].join('/')
  const contents = `(:require [${legacyNamespace}] [${validNamespace}]) ${legacyPath} ${validPath}`
  const offenses = inspectSource('src/example.cljs', contents)

  assert.equal(offenses.length, 2)
  assert.match(offenses[0], /legacy namespace load/)
  assert.match(offenses[1], /legacy source path/)
})

test('direct Melange package imports are allowed only inside the bridge', () => {
  const packageName = ['@logseq', 'melange-js-api', 'db'].join('/')

  assert.equal(inspectSource('src/example.cljs', packageName).length, 1)
  assert.deepEqual(
    inspectSource('deps/melange/bridge/src/example.cljs', packageName),
    []
  )
})
