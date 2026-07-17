const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const os = require('node:os')
const { spawnSync } = require('node:child_process')
const { createRequire } = require('node:module')
const test = require('node:test')
const { pathToFileURL } = require('node:url')

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
const consumerRequire = createRequire(path.join(repoRoot, 'package.json'))
const bridgeContractRoot = path.join(
  repoRoot,
  'deps/melange/bridge/test/package_contract'
)
const packageRoot = path.dirname(
  fs.realpathSync(consumerRequire.resolve('@logseq/melange-js-api/common'))
)
const commonPublicModules = [
  'Authorization',
  'BlockRef',
  'CognitoConfig',
  'Config',
  'DateTime',
  'Graph',
  'GraphDir',
  'GraphRegistry',
  'Macro',
  'Namespace',
  'PageRef',
  'Path',
  'StringUtil',
  'Util',
  'Uuid',
  'Version',
]

test('existing root, browser, and node package entry points still resolve', () => {
  for (const packageId of [
    '@logseq/melange-js-api',
    '@logseq/melange-js-api/browser',
    '@logseq/melange-js-api/node',
  ]) {
    assert.doesNotThrow(() => consumerRequire.resolve(packageId))
    assert.notEqual(consumerRequire(packageId), null)
  }
})

for (const subpath of ['common', 'db']) {
  const packageId = `@logseq/melange-js-api/${subpath}`

  test(`${packageId} resolves from plain JavaScript`, () => {
    assert.doesNotThrow(() => consumerRequire.resolve(packageId))
    assert.notEqual(consumerRequire(packageId), null)
  })

  test(`${packageId} resolves from ClojureScript`, () => {
    const nbb = path.join(repoRoot, 'node_modules/.bin/nbb-logseq')
    const fixtureNamespace = `package-resolution-${subpath}`
    const result = spawnSync(
      nbb,
      ['-cp', bridgeContractRoot, '-m', fixtureNamespace],
      {
        cwd: path.join(repoRoot, 'deps/melange/bridge'),
        encoding: 'utf8',
      }
    )

    assert.equal(
      result.status,
      0,
      [result.stdout, result.stderr].filter(Boolean).join('\n')
    )
  })
}

test('common and db expose distinct CommonJS and ESM entry points', () => {
  const manifest = JSON.parse(
    fs.readFileSync(path.join(packageRoot, 'package.json'), 'utf8')
  )

  for (const subpath of ['common', 'db']) {
    assert.deepEqual(manifest.exports[`./${subpath}`], {
      require: `./${subpath}.cjs`,
      import: `./${subpath}.mjs`,
    })
  }
})

test('common and db CommonJS and ESM entries load without _build', async () => {
  const cleanPackageRoot = fs.mkdtempSync(
    path.join(os.tmpdir(), 'melange-js-api-clean-')
  )

  try {
    fs.cpSync(packageRoot, cleanPackageRoot, { recursive: true })
    const cleanRequire = createRequire(
      path.join(cleanPackageRoot, 'package.json')
    )

    for (const subpath of ['common', 'db']) {
      const commonJsApi = cleanRequire(`./${subpath}.cjs`)
      const esmNamespace = await import(
        `${
          pathToFileURL(path.join(cleanPackageRoot, `${subpath}.mjs`)).href
        }?clean=1`
      )
      const esmApi = esmNamespace.default

      assert.ok(commonJsApi)
      assert.ok(esmApi)
      assert.deepEqual(
        Object.keys(esmApi).sort(),
        Object.keys(commonJsApi).sort()
      )
      if (subpath === 'common') {
        assert.deepEqual(Object.keys(esmApi).sort(), commonPublicModules)
      }
    }
  } finally {
    fs.rmSync(cleanPackageRoot, { recursive: true, force: true })
  }
})

test('common and db ESM named exports match public CommonJS modules', async () => {
  for (const subpath of ['common', 'db']) {
    const commonJsApi = consumerRequire(`@logseq/melange-js-api/${subpath}`)
    const esmNamespace = await import(
      `${pathToFileURL(path.join(packageRoot, `${subpath}.mjs`)).href}?named=1`
    )
    const expected = Object.keys(commonJsApi).sort()
    const actual = Object.keys(esmNamespace)
      .filter((name) => name !== 'default')
      .sort()

    assert.deepEqual(actual, expected)
  }
})

test('@logseq/melange-js-api/db loads its bundle from inside the package', () => {
  const entry = consumerRequire.resolve('@logseq/melange-js-api/db')
  consumerRequire('@logseq/melange-js-api/db')
  const packageRoot = fs.realpathSync(path.dirname(entry))
  const loadedFiles = require.cache[entry].children.map(({ filename }) =>
    fs.realpathSync(filename)
  )

  assert.ok(loadedFiles.length > 0)
  assert.ok(
    loadedFiles.every((filename) =>
      filename.startsWith(`${packageRoot}${path.sep}`)
    ),
    `DB package loaded files outside ${packageRoot}: ${loadedFiles.join(', ')}`
  )
})

test('@logseq/melange-js-api/node graph filesystem API resolves from ClojureScript', () => {
  const nbb = path.join(repoRoot, 'node_modules/.bin/nbb-logseq')
  const result = spawnSync(
    nbb,
    ['-cp', bridgeContractRoot, '-m', 'node-graph-package'],
    {
      cwd: path.join(repoRoot, 'deps/melange/bridge'),
      encoding: 'utf8',
    }
  )

  assert.equal(
    result.status,
    0,
    [result.stdout, result.stderr].filter(Boolean).join('\n')
  )
})
