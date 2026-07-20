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

function commandFailure(result) {
  return [result.stdout, result.stderr].filter(Boolean).join('\n')
}

function generateAndFormat(script, target) {
  const generated = spawnSync(
    'clojure',
    ['-Sdeps', '{:deps {}}', '-M', script],
    { cwd: melangeRoot, encoding: 'utf8' }
  )
  assert.equal(generated.status, 0, commandFailure(generated))

  const formatted = spawnSync(
    'opam',
    ['exec', '--', 'ocamlformat', '--name', target, '-'],
    { cwd: melangeRoot, encoding: 'utf8', input: generated.stdout }
  )
  assert.equal(formatted.status, 0, commandFailure(formatted))
  return formatted.stdout
}

test('the Melange project contains no generated-project executable scaffold', () => {
  for (const relativePath of ['bin/dune', 'bin/main.ml', 'lib/dune']) {
    assert.equal(
      fs.existsSync(path.join(melangeRoot, relativePath)),
      false,
      `${relativePath} is unused generated-project scaffold`
    )
  }

  const projectFiles = ['dune-project', 'melange-deps.opam'].map((file) =>
    fs.readFileSync(path.join(melangeRoot, file), 'utf8')
  )
  for (const contents of projectFiles) {
    assert.doesNotMatch(
      contents,
      /username\/reponame|Author Name|Maintainer Name|A short synopsis|A longer description|url\/to\/documentation|add topics/
    )
  }
})

test('the generated OPAM dependency package has valid repository metadata', () => {
  const result = spawnSync('opam', ['lint', 'melange-deps.opam'], {
    cwd: melangeRoot,
    encoding: 'utf8',
  })
  assert.equal(result.status, 0, commandFailure(result))

  const readme = fs.readFileSync(path.join(melangeRoot, 'README.md'), 'utf8')
  assert.match(readme, /\.\.\/\.\.\/LICENSE\.md/)
  assert.equal(fs.existsSync(path.join(repoRoot, 'LICENSE.md')), true)
})

test('Melange owns a working Datalog rule lint task', () => {
  const result = spawnSync('bb', ['lint:rules'], {
    cwd: melangeRoot,
    encoding: 'utf8',
  })
  assert.equal(result.status, 0, commandFailure(result))
})

test('the ClojureScript source boundary guard is registered and passes', () => {
  const dune = fs.readFileSync(path.join(melangeRoot, 'test/dune'), 'utf8')
  assert.match(dune, /cljs_boundary_test\.js/)

  const env = { ...process.env }
  delete env.NODE_TEST_CONTEXT
  const result = spawnSync(
    process.execPath,
    [path.join(melangeRoot, 'test/cljs_boundary_test.js')],
    { cwd: repoRoot, encoding: 'utf8', env }
  )
  assert.equal(result.status, 0, commandFailure(result))
})

test('checked-in generated OCaml sources match their formatted generators', () => {
  const generatedSources = [
    ['scripts/generate-db-properties.clj', 'lib/db/property_catalog.ml'],
    ['scripts/generate-db-rules.clj', 'lib/db/rules_data.ml'],
  ]

  for (const [script, target] of generatedSources) {
    const expected = fs.readFileSync(path.join(melangeRoot, target), 'utf8')
    assert.equal(
      generateAndFormat(script, target),
      expected,
      `${target} does not match ${script}`
    )
  }
})

test('every ClojureScript compilation script prepares the Melange JS API', () => {
  const { scripts } = JSON.parse(
    fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8')
  )
  const compilationScripts = Object.entries(scripts).filter(
    ([name, command]) =>
      name.startsWith('cljs:') &&
      /\bclojure\b.*\b(?:watch|release|compile|shadow\.cljs\.build-report)\b/.test(
        command
      )
  )
  const missingPreparation = compilationScripts
    .filter(([, command]) =>
      !command.startsWith('pnpm melange:build-js-api && ')
    )
    .map(([name]) => name)

  assert.deepEqual(missingPreparation, [])
})

test('the JavaScript package has no unexported compatibility wrappers', () => {
  for (const file of ['browser.js', 'common.js', 'db.js', 'node.js']) {
    assert.equal(
      fs.existsSync(path.join(melangeRoot, 'js_api', file)),
      false,
      `${file} is not exposed by package.json`
    )
  }
})

test('the ClojureScript runtime boundary names opaque values explicitly', () => {
  const valueCodecSpec = fs.readFileSync(
    path.join(melangeRoot, 'spec/cljs_runtime/value_codec.mli'),
    'utf8'
  )
  assert.match(valueCodecSpec, /^type cljs_value$/m)
  assert.doesNotMatch(valueCodecSpec, /^type value$/m)

  const oldQualifiedType = spawnSync(
    'git',
    [
      'grep',
      '-n',
      '-E',
      'Value_codec\\.value($|[^A-Za-z0-9_])|Runtime_codec\\.value($|[^A-Za-z0-9_])|Runtime\\.value($|[^A-Za-z0-9_])',
      '--',
      'deps/melange',
    ],
    { cwd: repoRoot, encoding: 'utf8' }
  )
  assert.equal(oldQualifiedType.status, 1, commandFailure(oldQualifiedType))

  const renamedValueOperation = spawnSync(
    'git',
    [
      'grep',
      '-n',
      'Runtime_codec\\.cljs_value_',
      '--',
      'deps/melange/lib',
    ],
    { cwd: repoRoot, encoding: 'utf8' }
  )
  assert.equal(
    renamedValueOperation.status,
    1,
    commandFailure(renamedValueOperation)
  )
})

test('Melange documentation describes only files that exist', () => {
  assert.equal(fs.existsSync(path.join(melangeRoot, 'README.md')), true)

  const design = fs.readFileSync(
    path.join(repoRoot, 'docs/agent-guide/079-melange-common-db.md'),
    'utf8'
  )
  const inventory = fs.readFileSync(
    path.join(repoRoot, 'docs/agent-guide/079-melange-common-db_inventory.md'),
    'utf8'
  )

  assert.doesNotMatch(design, /docs\/agent-guide\/039-melange\.md/)
  for (const missingSpecification of [
    'spec/authorization/platform.mli',
    'spec/crypto/digest.mli',
    'spec/db_runtime/ident.mli',
  ]) {
    assert.doesNotMatch(inventory, new RegExp(missingSpecification.replace('.', '\\.')))
  }
})
