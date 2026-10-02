'use strict';
// Repro of the RTC download failure: prepare_import(reset) runs
// close-db -> unlink-db -> invalidate-search-db -> create-or-open-db.
// invalidate-search-db's no-cached-conn branch must open a scratch db
// (cljs platform/sqlite-open) — if it registers that handle in
// *sqlite-conns and closes it, every later :search lookup hands back a
// dead DatabaseSync and node:sqlite reports "DB has been closed."
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const tree = path.resolve(process.env.DBW_BUILD_DIR || path.join(__dirname, '../_build/default/js_api/js_api'));
const get = name => require(path.join(tree, name));
const transit = require(path.join(__dirname, '../node_modules/transit-js'));
const writer = transit.writer('json');
const kw = transit.keyword;
const opts = (...pairs) => transit.map([kw('close-other-db?'), false, ...pairs]);
const root = fs.mkdtempSync(path.join(require('node:os').tmpdir(), 'invalidate-search-'));
process.env.LOGSEQ_WORKER_DB_DIR = root;
process.env.LOGSEQ_WORKER_KV_DIR = root;
process.env.CLI_E2E_TEST = '1';
const E = get('runtime/melange/db_worker_effect.js');
const Core = get('lib/worker_core.js');
const State = get('lib/worker_state.js');
const WorkerLog = get('runtime/melange/worker_log.js');
Core.init();
const promise = task => new Promise((resolve, reject) => E.on_any(task, resolve, reject));
const invoke = (name, args) => promise(Core.invoke('thread-api/' + name, writer.write(args)));
const open = repo => invoke('create-or-open-db', [repo, opts()]);
const close = repo => invoke('close-db', [repo]);
const invalidate = repo => invoke('db-sync-invalidate-search-db', [repo]);
const truncateSearch = repo => invoke('search-truncate-tables', [repo]);
const outcome = async f => { try { return await f(); } catch (e) { return String(e.message || JSON.stringify(e)); } };
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const field = (record, name, index) => record[name] !== undefined ? record[name] : record[index];
// worker_state db_kind variant index: Db=0, Search=1, Client_ops=2
const searchConn = repo => State.sqlite_conn_of(repo, 1);

// Capture worker log entries (search/search-listener-failed etc).
const logEntries = [];
WorkerLog.set_entry_sink(entry => logEntries.push(entry));

const repo = 'logseq_db_invalidate-search';
(async () => {
  // 1. open registers Db + Search conns (initialize_db -> get-search-db).
  await open(repo);
  assert.equal(searchConn(repo) !== undefined, true, 'open must register :search conn');

  // 2. close-db drops both conns — matches prepare_import's reset=true.
  await close(repo);
  assert.equal(searchConn(repo) === undefined, true, 'close-db must drop :search conn');

  // 3. invalidate-search-db with no cached conn: cljs opens a scratch
  //    platform/sqlite-open db, truncates, closes — without registering.
  //    Regression: open_search_db registered the scratch handle, so a
  //    closed DatabaseSync stayed cached under (repo, Search).
  await invalidate(repo);
  const stale = searchConn(repo);
  assert.equal(stale === undefined, true,
    'invalidate-search-db must not leave a :search conn registered'
    + (stale ? ' (closed handle cached at ' + field(stale, 'filename', 1) + ')' : ''));

  // A registered-but-closed conn makes every :search statement fail —
  // the same Sqlite_error complete_datoms_import hits at finalize-import.
  assert.doesNotMatch(await outcome(() => truncateSearch(repo)), /DB has been closed/);

  // 4. create-or-open-db again (prepare_import's last step).
  await open(repo);
  const reopened = searchConn(repo);
  assert.equal(reopened !== undefined, true, 'reopen must register :search conn');

  // 5. The deferred search db-listener resolves the conn at call time;
  //    with the stale handle it logged search/search-listener-failed.
  const before = logEntries.length;
  await invoke('transact', [repo, [transit.map([kw('db/ident'), kw('logseq.kv/inv-probe'), kw('kv/value'), 1])], opts(), opts()]);
  await sleep(150);
  const listenerFailures = logEntries.slice(before)
    .filter(e => field(e, 'message', 1) === 'search/search-listener-failed');
  assert.equal(listenerFailures.length, 0,
    'search listener must not hit a closed db: ' + JSON.stringify(listenerFailures.map(e => field(e, 'fields', 2))));

  // 6. Search statements against the reopened conn work.
  const trunc = await outcome(() => truncateSearch(repo));
  assert.doesNotMatch(trunc, /~#(?:js\/Error|error)|DB has been closed/);

  await close(repo);
  console.log(JSON.stringify({name: 'invalidate-search-db leaves no stale conn', status: 'PASS'}));
  process.exit(0);
})().catch(async error => {
  console.log(JSON.stringify({name: 'invalidate-search-db leaves no stale conn', status: 'FAIL', error: String(error.stack || error)}));
  for (const r of [repo]) { try { await close(r); } catch {} }
  process.exit(1);
});
