'use strict'
// Run after building the Node worker bundle. Uses disposable graphs only.
const fs = require('node:fs'),
  path = require('node:path'),
  os = require('node:os'),
  assert = require('node:assert/strict')
const base = path.resolve(process.argv[2] || path.join(__dirname, '../../..'))
const mode = process.argv[3] || 'after'
const only = process.argv[4]
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'logseq-storage-recovery-'))
process.env.LOGSEQ_WORKER_DB_DIR = root
process.env.LOGSEQ_WORKER_KV_DIR = root
process.env.CLI_E2E_TEST = '1'
const worker = require(path.join(base, 'static/db-worker-ocaml.cjs'))
const transit = require(path.join(base, 'node_modules/transit-js')),
  writer = transit.writer('json'),
  kw = transit.keyword
const map = (...xs) => transit.map(xs)
const { DatabaseSync } = require('node:sqlite')
const invoke = async (name, args) => {
  try {
    return await worker.invoke('thread-api/' + name, writer.write(args))
  } catch (e) {
    return 'rejected: ' + (e._1 || e.message || String(e))
  }
}
const error = (raw) => /error|rejected:/i.test(raw)
const transaction = (repo, n) =>
  invoke('transact', [
    repo,
    [map(kw('db/ident'), kw('logseq.kv/durability-probe'), kw('kv/value'), n)],
    map(),
    map(),
  ])
const query = (repo) =>
  invoke('q', [
    repo,
    [
      '[:find ?v . :where [?e :db/ident :logseq.kv/durability-probe] [?e :kv/value ?v]]',
    ],
  ])
;(async () => {
  if (!only || only === 'during-commit') {
    const repo = 'publication'
    await invoke('create-or-open-db', [repo, map()])
    await transaction(repo, 7)
    const originalPrepare = DatabaseSync.prototype.prepare
    let observation
    let once = true
    DatabaseSync.prototype.prepare = function (sql) {
      const stmt = originalPrepare.call(this, sql)
      if (once && /insert or replace into kvs/i.test(sql)) {
        once = false
        return {
          run(...args) {
            observation = query(repo)
            return stmt.run(...args)
          },
        }
      }
      return stmt
    }
    let committed
    try {
      committed = await transaction(repo, 8)
    } finally {
      DatabaseSync.prototype.prepare = originalPrepare
    }
    assert(!once)
    assert(!error(committed))
    const during = await observation
    if (mode === 'after')
      assert(
        error(during) && /progress/i.test(during),
        'read during durable commit must be blocked'
      )
    else assert.equal(during, writer.write(8))
    await invoke('close-db', [repo])
    await invoke('create-or-open-db', [repo, map()])
    assert.equal(await query(repo), writer.write(8))
    await invoke('close-db', [repo])
    console.log(
      JSON.stringify({
        fault: 'during-commit',
        during,
        committed: true,
        reopened: 8,
        root,
      })
    )
  }
  for (const fault of [
    'insert',
    'begin',
    'commit-before',
    'commit-after',
  ].filter((f) => !only || only === f)) {
    const repo = 'durability-' + fault
    assert(!error(await invoke('create-or-open-db', [repo, map()])))
    assert(!error(await transaction(repo, 7)))
    const originalPrepare = DatabaseSync.prototype.prepare,
      originalExec = DatabaseSync.prototype.exec
    let injection = true
    DatabaseSync.prototype.prepare = function (sql) {
      if (
        injection &&
        fault === 'insert' &&
        /insert or replace into kvs/i.test(sql)
      ) {
        injection = false
        return {
          run() {
            throw new Error('injected-kvs-write-failure')
          },
        }
      }
      return originalPrepare.call(this, sql)
    }
    DatabaseSync.prototype.exec = function (sql) {
      if (
        injection &&
        ((fault === 'begin' && /^begin$/i.test(sql)) ||
          (fault.startsWith('commit') && /^commit$/i.test(sql)))
      ) {
        injection = false
        if (fault === 'commit-after') originalExec.call(this, sql)
        throw new Error('injected-' + fault + '-failure')
      }
      return originalExec.call(this, sql)
    }
    let failed
    try {
      failed = await transaction(repo, 8)
    } finally {
      DatabaseSync.prototype.prepare = originalPrepare
      DatabaseSync.prototype.exec = originalExec
    }
    assert(!injection, 'fault was reached')
    assert(error(failed), 'write reports original failure')
    const live = await query(repo)
    let retry, openWhileFenced
    if (mode === 'after') {
      assert(error(live) && /reopen/i.test(live), 'live read must be fenced')
      retry = await transaction(repo, 99)
      assert(error(retry) && /reopen/i.test(retry), 'retry must be fenced')
      openWhileFenced = await invoke('create-or-open-db', [repo, map()])
      assert(error(openWhileFenced) && /reopen/i.test(openWhileFenced))
    }
    const close = await invoke('close-db', [repo])
    assert(!error(close), 'failed graph must close before reopening')
    assert(!error(await invoke('close-db', [repo])), 'closing again is safe')
    assert(!error(await invoke('create-or-open-db', [repo, map()])))
    const reopened = await query(repo)
    assert.equal(reopened, writer.write(fault === 'commit-after' ? 8 : 7))
    if (mode === 'before') assert.equal(live, writer.write(8))
    assert(!error(await transaction(repo, 9)))
    await invoke('close-db', [repo])
    await invoke('create-or-open-db', [repo, map()])
    assert.equal(await query(repo), writer.write(9))
    await invoke('close-db', [repo])
    console.log(
      JSON.stringify({
        fault,
        failed,
        live,
        retry,
        openWhileFenced,
        close,
        reopened,
        retryAfterReopen: '9',
        root,
      })
    )
  }
})()
  .then(() => {
    fs.rmSync(root, { recursive: true, force: true })
    process.exit(0)
  })
  .catch((e) => {
    console.error(e)
    console.error('retained isolated graph:', root)
    process.exit(1)
  })
