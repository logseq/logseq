import assert from 'node:assert/strict'
import { copyFileSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')

function startWorker(t, prepare) {
  const directory = mkdtempSync(join(repoRoot, '.worker-startup-test-'))
  t.after(() => rmSync(directory, { recursive: true, force: true }))
  copyFileSync(join(repoRoot, 'static/db-worker-node.js'), join(directory, 'db-worker-node.js'))
  prepare?.(join(directory, 'db-worker-ocaml.cjs'))
  const result = spawnSync(process.execPath, [join(directory, 'db-worker-node.js'), '--help'], {
    cwd: repoRoot,
    encoding: 'utf8',
    timeout: 30000,
  })
  assert.ifError(result.error)
  return result
}

test('worker startup fails when the OCaml bundle is missing', (t) => {
  const result = startWorker(t)
  assert.notEqual(result.status, 0, 'Missing OCaml bundle must not start the CLJS worker')
  assert.match(result.stderr, /Cannot find module .*db-worker-ocaml\.cjs/)
})

test('worker startup fails when the OCaml bundle is broken', (t) => {
  const result = startWorker(t, (bundle) => writeFileSync(bundle, 'throw new Error("broken OCaml bundle")'))
  assert.notEqual(result.status, 0)
  assert.match(result.stderr, /broken OCaml bundle/)
})

test('worker startup succeeds with the built OCaml bundle', (t) => {
  const result = startWorker(t, (bundle) => copyFileSync(join(repoRoot, 'static/db-worker-ocaml.cjs'), bundle))
  assert.equal(result.status, 0, result.stderr)
  assert.match(result.stdout, /db-worker-node options:/)
})
