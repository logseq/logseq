import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import test from 'node:test'

const require = createRequire(import.meta.url)

test('gulpfile registers app watch tasks', () => {
  const gulpfile = require('../../../gulpfile.js')

  assert.equal(typeof gulpfile.watch, 'function')
  assert.equal(typeof gulpfile.watchMobile, 'function')
  assert.equal(typeof gulpfile.build, 'function')
})
