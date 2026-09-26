import assert from 'node:assert/strict'
import { dirname, join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')
const daemonScript = join(repoRoot, 'static/db-worker-node.js')

function runWorker(args) {
  const result = spawnSync(process.execPath, [daemonScript, ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
    timeout: 30000,
  })
  assert.ifError(result.error)
  return result
}

test('worker startup prints help', () => {
  const result = runWorker(['--help'])
  assert.equal(result.status, 0, result.stderr)
  assert.match(result.stdout, /db-worker-node options:/)
})

test('worker startup prints build metadata', () => {
  const result = runWorker(['--version'])
  assert.equal(result.status, 0, result.stderr)
  assert.match(result.stdout, /Revision:/)
})

test('worker startup fails without required options', () => {
  const result = runWorker([])
  assert.notEqual(result.status, 0)
  assert.match(result.stderr, /root-dir is required/)
})
