'use strict';
// Real Node worker endpoints and SQLite files; injection only interrupts named
// initialization boundaries. Every graph lives under a fresh synthetic root.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const tree = path.resolve(process.env.DBW_BUILD_DIR || path.join(__dirname, '../_build/default/js_api/js_api'));
const get = name => require(path.join(tree, name));
const transit = require(path.join(__dirname, '../../../node_modules/transit-js'));
const writer = transit.writer('json');
const reader = transit.reader('json');
const kw = transit.keyword;
const opts = (...pairs) => transit.map([kw('close-other-db?'), false, ...pairs]);
const root = fs.mkdtempSync(path.join(require('node:os').tmpdir(), 'endpoint-lifecycle-'));
process.env.LOGSEQ_WORKER_DB_DIR = root;
process.env.LOGSEQ_WORKER_KV_DIR = root;
process.env.CLI_E2E_TEST = '1';
const E = get('runtime/melange/db_worker_effect.js');
const Core = get('lib/worker_core.js');
const State = get('lib/worker_state.js');
const Sqlite = get('runtime/melange/sqlite.js');
const Sync = get('lib/sync_state.js');
const Listener = get('lib/db_listener.js');
Core.init();
const promise = task => new Promise((resolve, reject) => E.on_any(task, resolve, reject));
const invoke = (name, args) => promise(Core.invoke('thread-api/' + name, writer.write(args)));
const open = (repo, options = opts()) => invoke('create-or-open-db', [repo, options]);
const close = repo => invoke('close-db', [repo]);
const outcome = async f => { try { return await f(); } catch (e) { return String(e.message || JSON.stringify(e)); } };
const failed = value => assert.match(value, /~#(?:js\/Error|error)|injected-|unexpected shape|Graph open cancelled/i);
const q = (repo, query) => invoke('q', [repo, [query]]).then(raw => reader.read(raw));
const initialized = async repo => assert.equal(await q(repo, '[:find ?v . :where [?e :db/ident :logseq.kv/db-type] [?e :kv/value ?v]]'), 'db');
const acquired = new Set();
const Timers = get('runtime/melange/timers.js');
const intervals = new Set();
const replace = (object, key, callback) => { const original = object[key]; object[key] = new Proxy(original, {apply: (target, receiver, args) => callback(target, args)}); return original; };
const patch = replace;
const list = xs => { const values = []; while (xs) { values.push(xs.hd); xs = xs.tl; } return values; };
for (const key of ['open_db', 'open_db_pool']) patch(Sqlite, key, (original, args) => { const db = original(...args); acquired.add(db); return db; });
patch(Sqlite, 'close', (original, [db]) => { const result = original(db); acquired.delete(db); return result; });
const hasListener = conn => list(conn.listeners).some(([key]) => key === "listen-db-changes!");
const clean = repo => {
  assert.equal(State.datascript_conn(repo) === undefined, true, 'failed conn must be unpublished');
  assert.equal(State.sqlite_conn(repo) === undefined, true, 'failed sqlite must be unpublished');
  assert.equal(Sync.client_ops_conn_opt(repo) === undefined, true, 'client ops must be closed');
  assert.equal(acquired.size, 0, 'all acquired SQLite handles must close');
  assert.equal(intervals.size, 0, 'cleanup interval must be cleared');
};
patch(Timers, 'set_interval', (original, args) => { const timer = original(...args); intervals.add(timer); return timer; });
patch(Timers, 'clear', (original, [timer]) => { const result = original(timer); intervals.delete(timer); return result; });
const baseline = [Sqlite, Listener, get("lib/worker_db_fix.js"), get("lib/db_migrate.js"), get("lib/sync_client.js"), get("runtime/melange/embedding.js"), get("runtime/melange/vector_index.js")].map(module => [module, {...module}]);
const scenarios = [];
const test = (name, run) => scenarios.push({name, run});

test('invalid import fails repeatedly, cleans up, then retry fully initializes and persists', async () => {
  const repo = 'logseq_db_invalid-import';
  let reports = 0;
  Listener.register('lifecycle-probe', (repo, report) => reports++);
  for (let i = 0; i < 2; i++) {
    failed(await outcome(() => open(repo, opts(kw('datoms'), 42))));
    clean(repo);
  }
  assert.match(await open(repo), /schema/);
  await initialized(repo);
  // A listener is required for normal post-open worker transaction processing.
  const transaction = await invoke('transact', [repo, [transit.map([kw('db/ident'), kw('logseq.kv/lifecycle-probe'), kw('kv/value'), 7])], opts(), opts()]);
  assert.doesNotMatch(transaction, /~#(?:js\/Error|error)/);
  assert.equal(reports, 1);
  await close(repo);
  await open(repo);
  await initialized(repo);
  assert.equal(await q(repo, '[:find ?v . :where [?e :db/ident :logseq.kv/lifecycle-probe] [?e :kv/value ?v]]'), 7);
  await close(repo);
});

for (const [label, file, key] of [
  ['repair', 'lib/worker_db_fix.js', 'check_and_fix_schema'],
  ['migration', 'lib/db_migrate.js', 'migrate'],
  ['checksum', 'lib/sync_client.js', 'reconcile_local_checksum'],
  ['listener', 'lib/db_listener.js', 'listen_db_changes'],
]) test(label + ' failure is torn down and retry reruns initialization', async () => {
  const repo = 'logseq_db_fail-' + label;
  const module = get(file), original = module[key];
  let calls = 0, oldConn, overlapping;
  replace(module, key, (original, args) => {
    calls++;
    if (label === 'listener') { overlapping = outcome(() => open(repo)); original(...args); oldConn = args.at(-1); }
    throw new Error('injected-' + label);
  });
  try { failed(await outcome(() => open(repo))); } finally { module[key] = original; }
  assert.equal(calls, 1);
  if (overlapping) failed(await overlapping);
  clean(repo);
  if (oldConn) assert.equal(hasListener(oldConn), false, 'installed listener must be detached');
  replace(module, key, (original, args) => { calls++; return original(...args); });
  try { assert.match(await open(repo), /schema/); } finally { module[key] = original; }
  assert.equal(calls, 2, 'retry must revisit failed phase');
  await initialized(repo);
  await close(repo);
});

for (const label of ['graph', 'client-ops', 'search']) test(label + ' pragma failure closes even the not-yet-registered handle', async () => {
  const repo = 'logseq_db_pragma-' + label;
  const original = Sqlite.exec;
  let injected = false;
  Sqlite.exec = (db, sql, bind) => {
    const matches = label === 'graph' ? db.filename.endsWith('/db.sqlite') && !db.filename.includes('client-ops-')
      : label === 'client-ops' ? db.filename.includes('client-ops-') : db.filename.endsWith('-search.sqlite');
    if (!injected && matches && /locking_mode/.test(sql)) { injected = true; throw new Error('injected-' + label + '-pragma'); }
    return original(db, sql, bind);
  };
  try { failed(await outcome(() => open(repo))); } finally { Sqlite.exec = original; }
  assert.equal(injected, true);
  clean(repo);
  await open(repo); await initialized(repo); await close(repo);
});

for (const label of ['client-ops', 'search']) test(label + ' setup reports local close failure and teardown retries that handle', async () => {
  const repo = 'logseq_db_local-close-' + label;
  const matches = db => label === 'client-ops' ? db.filename.includes('client-ops-') : db.filename.endsWith('-search.sqlite');
  let setupFailed = false, closeFailed = false;
  replace(Sqlite, 'exec', (original, [db, sql, bind]) => {
    if (!setupFailed && matches(db) && /locking_mode/.test(sql)) { setupFailed = true; throw new Error('injected-setup'); }
    return original(db, sql, bind);
  });
  replace(Sqlite, 'close', (original, [db]) => {
    if (!closeFailed && matches(db)) { closeFailed = true; throw new Error('injected-local-close'); }
    return original(db);
  });
  const result = await outcome(() => open(repo));
  assert.match(result, /injected-setup/);
  assert.match(result, /injected-local-close/);
  clean(repo);
  for (const [module, exports] of baseline) Object.assign(module, exports);
  await open(repo); await initialized(repo); await close(repo);
});

test('overlapping opens share pending initialization and failure, then retry starts again', async () => {
  const repo = 'logseq_db_overlap';
  const original = Sqlite.prepare_pool;
  const [pending, resolver] = E.wait();
  let calls = 0;
  replace(Sqlite, "prepare_pool", () => { calls++; return pending; });
  const first = outcome(() => open(repo)), second = outcome(() => open(repo));
  assert.equal(calls, 1, 'only one initialization may be in flight');
  E.reject(resolver, new Error('injected-prepare'));
  failed(await first); failed(await second);
  Sqlite.prepare_pool = original;
  clean(repo);
  await open(repo); await initialized(repo); await close(repo);
});

test('close while open awaits pool prevents the continuation from publishing or opening handles', async () => {
  const repo = 'logseq_db_close-pending';
  const original = Sqlite.prepare_pool;
  const [pending, resolver] = E.wait();
  replace(Sqlite, "prepare_pool", () => pending);
  const opening = outcome(() => open(repo));
  await close(repo);
  E.wakeup(resolver, undefined);
  failed(await opening);
  Sqlite.prepare_pool = original;
  clean(repo);
  await open(repo); await initialized(repo); await close(repo);
});

test('late completion of cancelled open does not tear down a newer ready connection', async () => {
  const repo = 'logseq_db_cancel-retry';
  const original = Sqlite.prepare_pool;
  const [pending, resolver] = E.wait();
  replace(Sqlite, 'prepare_pool', () => pending);
  const opening = outcome(() => open(repo));
  await close(repo);
  Sqlite.prepare_pool = original;
  await open(repo); await initialized(repo);
  E.wakeup(resolver, undefined);
  failed(await opening);
  await initialized(repo);
  await close(repo);
});

test('switching graphs cancels an open still waiting for pool preparation', async () => {
  const firstRepo = 'logseq_db_switch-pending', nextRepo = 'logseq_db_switch-next';
  const original = Sqlite.prepare_pool;
  const [pending, resolver] = E.wait();
  replace(Sqlite, 'prepare_pool', () => pending);
  const opening = outcome(() => open(firstRepo));
  Sqlite.prepare_pool = original;
  await open(nextRepo, transit.map([kw('close-other-db?'), true]));
  E.wakeup(resolver, undefined);
  failed(await opening);
  assert.equal(State.datascript_conn(firstRepo) === undefined, true);
  await initialized(nextRepo);
  await close(nextRepo); clean(firstRepo);
});

test('a ready connection uses fast path and close detaches its listener', async () => {
  const repo = 'logseq_db_ready';
  await open(repo); await initialized(repo);
  const conn = State.datascript_conn(repo);
  assert.match(await open(repo, opts(kw('datoms'), 42)), /schema/);
  assert.equal(State.datascript_conn(repo) === conn, true);
  await close(repo);
  assert.equal(hasListener(conn), false);
  clean(repo);
});

// A pending vector effect is a platform boundary; no vector backend, account,
// or network is accessed by this probe.
test('async vector rejection after SQLite allocation cleans resources and permits retry', async () => {
  const repo = 'logseq_db_vector-rejection';
  const Embedding = get('runtime/melange/embedding.js');
  const Vector = get('runtime/melange/vector_index.js');
  const enabled = Embedding.enabled, vectorOpen = Vector.open_index;
  const [pending, resolver] = E.wait();
  let vectorReached;
  const allocated = new Promise(resolve => vectorReached = resolve);
  replace(Embedding, "enabled", () => true); replace(Embedding, "dimension", () => 384); replace(Vector, "open_index", () => { vectorReached(); return pending; });
  const opening = outcome(() => open(repo));
  await Promise.race([allocated, opening.then(result => { throw new Error("vector boundary not reached: " + result); })]);
  assert.ok(acquired.size > 0);
  E.reject(resolver, new Error('injected-vector'));
  try { failed(await opening); } finally { Embedding.enabled = enabled; Vector.open_index = vectorOpen; }
  clean(repo);
  await open(repo); await initialized(repo); await close(repo);
});

test('teardown continues after checkpoint error, preserves initialization error, and supports retry', async () => {
  const repo = 'logseq_db_cleanup-error';
  const original = Sqlite.exec;
  Sqlite.exec = (db, sql, bind) => { if (/wal_checkpoint/.test(sql)) throw new Error('injected-checkpoint'); return original(db, sql, bind); };
  let result;
  try { result = await outcome(() => open(repo, opts(kw('datoms'), 42))); } finally { Sqlite.exec = original; }
  assert.match(result, /unexpected shape/);
  assert.match(result, /injected-checkpoint/);
  clean(repo);
  await open(repo); await initialized(repo); await close(repo);
});

(async () => {
  let failures = 0;
  for (const {name, run} of scenarios) {
    let timeout;
    try { await Promise.race([run(), new Promise((_, reject) => { timeout = setTimeout(() => reject(new Error('scenario timed out')), 10000); })]); console.log(JSON.stringify({name, status: 'PASS'})); }
    catch (error) { failures++; console.log(JSON.stringify({name, status: 'FAIL', error: String(error.stack || error)})); }
    finally {
      for (const [module, exports] of baseline) Object.assign(module, exports);
      // Restore baseline phase injectors even when an assertion fails.
      for (const repo of list(State.repos())) { try { await close(repo); } catch {} }
      for (const db of [...acquired]) { try { Sqlite.close(db); } catch {} }
    }
  }
  console.log(JSON.stringify({root, scenarios: scenarios.length, failures}));
  process.exit(failures ? 1 : 0);
})().catch(error => { console.error(error); process.exit(1); });
