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
const melangeBuildRoot = path.join(repoRoot, 'deps/melange/_build/default/lib')

function assertAggregateOnly(directory, library) {
  const buildRoot = path.join(melangeBuildRoot, directory)
  const publicInterfaces = fs
    .readdirSync(path.join(buildRoot, `.${library}.objs/melange`))
    .filter((file) => file.endsWith('.cmi'))
    .sort()

  assert.deepEqual(publicInterfaces, [
    `${library}.cmi`,
    `${library}__Workflows.cmi`,
  ])
}

function assertAggregateDoesNotImportInternals(directory, library, modulePrefix) {
  const buildRoot = path.join(melangeBuildRoot, directory)
  const cmi = path.join(
    buildRoot,
    `.${library}.objs/melange/${library}__Workflows.cmi`
  )
  const result = spawnSync('ocamlobjinfo', [cmi], { encoding: 'utf8' })

  assert.equal(result.status, 0, result.stderr)
  const privateImports = result.stdout.match(
    new RegExp(`${modulePrefix}(?:_internal)?__(?!Workflows\\b)\\w+`, 'g')
  )
  assert.deepEqual(privateImports, null)
}

test('DB API library exposes only its aggregate module', () => {
  assertAggregateOnly('db_api', 'melange_db_api')
})

test('DB aggregate interface does not import internal API modules', () => {
  assertAggregateDoesNotImportInternals(
    'db_api',
    'melange_db_api',
    'Melange_db_api'
  )
})

test('Common API library exposes only its aggregate module', () => {
  assertAggregateOnly('common_api', 'melange_common_api')
})

test('Common aggregate interface does not import internal API modules', () => {
  assertAggregateDoesNotImportInternals(
    'common_api',
    'melange_common_api',
    'Melange_common_api'
  )
})
