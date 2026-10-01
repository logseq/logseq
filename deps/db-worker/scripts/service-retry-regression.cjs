'use strict'
// Real remote_invoke routing with disposable graphs and synthetic faults.
const assert = require('node:assert/strict'),
  fs = require('node:fs'),
  os = require('node:os'),
  path = require('node:path')
const { spawnSync } = require('node:child_process'),
  { test } = require('node:test')
const scenarios = [
  'invalid-import',
  'service-creation-failure',
  'transient-repair',
  'cancelled-open',
  'superseded-open',
  'healthy-request-failure',
]
if (!process.argv.includes('--scenario')) {
  for (const name of scenarios)
    test(name, () => {
      const result = spawnSync(
        process.execPath,
        [__filename, '--scenario', name],
        { encoding: 'utf8', timeout: 30000 }
      )
      assert.equal(result.status, 0, result.stdout + result.stderr)
      process.stdout.write(result.stdout)
    })
} else {
  const scenario = process.argv[3],
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'logseq-service-retry-'))
  process.env.LOGSEQ_WORKER_DB_DIR = root
  process.env.LOGSEQ_WORKER_KV_DIR = root
  process.env.CLI_E2E_TEST = '1'
  globalThis.self = { postMessage() {} }
  const tree = path.resolve(__dirname, '../_build/default/js_api/js_api'),
    get = (name) => require(path.join(tree, name))
  const E = get('runtime/melange/db_worker_effect.js'),
    Core = get('lib/worker_core.js'),
    Sqlite = get('runtime/melange/sqlite.js'),
    Fix = get('lib/worker_db_fix.js')
  const transit = require(path.join(
      __dirname,
      '../../../node_modules/transit-js'
    )),
    writer = transit.writer('json'),
    reader = transit.reader('json'),
    kw = transit.keyword,
    map = (...pairs) => transit.map(pairs)
  const awaitTask = (task) =>
    new Promise((resolve, reject) => E.on_any(task, resolve, reject))
  const remote = (name, args) => {
    try {
      return awaitTask(
        Core.remote_invoke('thread-api/' + name, writer.write(args))
      )
    } catch (error) {
      return Promise.reject(error)
    }
  }
  const open = (repo, options = map()) =>
    remote('create-or-open-db', [repo, options])
  const close = (repo) =>
    awaitTask(Core.invoke('thread-api/close-db', writer.write([repo])))
  const outcome = (task) =>
    task.then(
      (value) => ({ value }),
      (error) => ({ error: String(error._1 || error.message || error) })
    )
  const failed = (result) =>
    assert(
      result.error || /~#(?:js\/Error|error)/.test(result.value || ''),
      JSON.stringify(result)
    )
  const ready = async (repo) => {
    assert.match(
      await open(repo),
      /schema/,
      'same graph must become ready on retry'
    )
    const query =
      '[:find ?v . :where [?e :db/ident :logseq.kv/db-type] [?e :kv/value ?v]]'
    assert.equal(reader.read(await remote('q', [repo, [query]])), 'db')
  }
  ;(async () => {
    const repo = 'service-retry-' + scenario
    if (scenario === 'invalid-import') {
      failed(await outcome(open(repo, map(kw('datoms'), 42))))
      await ready(repo)
    } else if (scenario === 'service-creation-failure') {
      const Service = get('lib/shared_service.js'),
        original = Service.create_service
      let calls = 0
      Service.create_service = (...args) =>
        ++calls === 1
          ? E.error(new Error('injected-service-creation'))
          : original(...args)
      try {
        failed(await outcome(open(repo)))
        await ready(repo)
        assert.equal(calls, 2)
      } finally {
        Service.create_service = original
      }
    } else if (scenario === 'transient-repair') {
      const original = Fix.check_and_fix_schema
      let calls = 0
      Fix.check_and_fix_schema = (...args) => {
        if (++calls === 1) throw new Error('injected-transient-repair')
        return original(...args)
      }
      try {
        failed(await outcome(open(repo)))
        await ready(repo)
        assert.equal(calls, 2)
      } finally {
        Fix.check_and_fix_schema = original
      }
    } else if (
      scenario === 'cancelled-open' ||
      scenario === 'superseded-open'
    ) {
      const original = Sqlite.prepare_pool,
        [pending, resolver] = E.wait()
      Sqlite.prepare_pool = () => pending
      const first = outcome(open(repo))
      Sqlite.prepare_pool = original
      if (scenario === 'cancelled-open') {
        await close(repo)
        failed(await first)
        await ready(repo)
        E.wakeup(resolver, undefined)
        await ready(repo)
      } else {
        const next = repo + '-next'
        await ready(next)
        failed(await first)
        E.wakeup(resolver, undefined)
        await ready(next)
        await close(next)
      }
    } else {
      await ready(repo)
      failed(await outcome(remote('not-a-registered-endpoint', [repo])))
      await ready(repo)
    }
    await close(repo)
    console.log(JSON.stringify({ scenario, result: 'pass' }))
  })()
    .then(() => {
      fs.rmSync(root, { recursive: true, force: true })
      process.exit(0)
    })
    .catch((error) => {
      console.error(error)
      console.error('retained isolated graph:', root)
      process.exit(1)
    })
}
