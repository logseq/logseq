// Run after `pnpm watch` has compiled db-worker-node, and `dune build @bundle`.
// LOGSEQ_QUERY_WORKER_ENTRY and LOGSEQ_QUERY_CLI_ENTRY can select other builds.
// Only library definitions are loaded; no worker daemon or user graph is opened.
const assert = require('node:assert/strict');
const {execFile} = require('node:child_process');
const {once} = require('node:events');
const fs = require('node:fs');
const http = require('node:http');
const Module = require('node:module');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const {promisify} = require('node:util');

const repoRoot = path.resolve(__dirname, '../..');
const workerEntry = process.env.LOGSEQ_QUERY_WORKER_ENTRY || path.join(repoRoot, 'static/db-worker-node.js');
const cliEntry = process.env.LOGSEQ_QUERY_CLI_ENTRY || path.join(repoRoot, 'cli/_build/default/dist/logseq-cli.js');

function loadWorkerLibraries() {
  const source = fs.readFileSync(workerEntry, 'utf8');
  const marker = 'SHADOW_IMPORT("frontend.worker.handler.render_resource.query.js");';
  const end = source.indexOf(marker);
  assert.notEqual(end, -1, 'Use a development db-worker-node build, with its compiled cljs-runtime directory');
  const runtime = new Module(workerEntry);
  runtime.filename = workerEntry;
  runtime.paths = Module._nodeModulePaths(path.dirname(workerEntry));
  runtime._compile(source.slice(0, end + marker.length) + '\n})();', workerEntry);
}

test('CLI and Desktop advanced queries execute against the same worker database', async t => {
  loadWorkerLibraries();
  const c = global.cljs.core;
  const read = text => global.logseq.common.util.safe_read_string(text);
  const print = value => c.pr_str(value);
  const ldb = global.logseq.db;
  const repo = 'logseq_db_query-parity';
  const conn = global.datascript.core.create_conn.cljs$core$IFn$_invoke$arity$1(global.logseq.db.frontend.schema.schema);
  const now = Date.now();
  global.datascript.core.transact_BANG_.cljs$core$IFn$_invoke$arity$2(conn, read(`[
    {:db/id 1 :block/title "Home" :block/name "home"
     :block/uuid #uuid "11111111-1111-1111-1111-111111111111"}
    {:db/id 2 :block/title "Child" :block/parent 1 :block/page 1 :block/updated-at ${now}
     :block/uuid #uuid "22222222-2222-2222-2222-222222222222"}
    {:db/id 3 :db/ident :logseq.property/status.done :block/title "Done"}
    {:db/id 4 :block/title "Daily task" :block/page 1 :logseq.property/status 3 :block/updated-at ${now}
     :block/uuid #uuid "44444444-4444-4444-4444-444444444444"}]`));
  const setConnection = present => c.reset_BANG_(global.frontend.worker.state._STAR_datascript_conns,
    present ? c.hash_map(repo, conn) : read('{}'));
  setConnection(true);

  const server = http.createServer(async (req, res) => {
    try {
      let body = '';
      for await (const chunk of req) body += chunk;
      const {method, argsTransit} = JSON.parse(body);
      const apis = c.deref(global.frontend.common.thread_api._STAR_thread_apis);
      const handler = c.get.cljs$core$IFn$_invoke$arity$2(apis, c.keyword(method));
      assert.ok(handler, method);
      const value = await c.apply(handler, ldb.read_transit_str(argsTransit));
      res.writeHead(200, {'Content-Type': 'application/json'});
      res.end(JSON.stringify({resultTransit: ldb.write_transit_str(value)}));
    } catch (err) {
      res.writeHead(400, {'Content-Type': 'application/json'});
      res.end(JSON.stringify({error: {message: err.message}}));
    }
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'logseq-query-parity-'));
  t.after(async () => {
    await new Promise(resolve => server.close(resolve));
    fs.rmSync(rootDir, {recursive: true, force: true});
  });
  const configPath = path.join(rootDir, 'cli.edn');
  fs.writeFileSync(configPath, `{:custom-queries {
    "echo" {:query [:find ?v . :in $ ?v :where [(identity ?v) ?x]] :inputs ["value"]}
    "twice" {:query [:find ?y . :in $ % ?x :where (twice ?x ?y)] :inputs ["rules" "value"]}}}`);
  const env = {...process.env, LOGSEQ_CLI_BASE_URL: `http://127.0.0.1:${server.address().port}`};
  async function cli(...args) {
    try {
      const {stdout} = await promisify(execFile)(process.execPath,
        [cliEntry, '--root-dir', rootDir, '--config', configPath, '--graph', 'query-parity', '--output', 'edn', 'query', ...args],
        {env, timeout: 10000});
      const payload = read(stdout);
      assert.equal(print(c.get.cljs$core$IFn$_invoke$arity$2(payload, read(':status'))), ':ok', stdout);
      return {value: c.get_in.cljs$core$IFn$_invoke$arity$2(payload, read('[:data :result]'))};
    } catch (error) {
      return {error};
    }
  }
  function desktop(query, inputs = '[]', rules) {
    const parsedInputs = read(inputs);
    let spec = read(`{:kind :datalog :query ${query} :inputs ${inputs} ${rules ? ':rules ' + rules : ''}}`);
    if (c.some(c.hash_set(read(':today')), parsedInputs)) {
      const day = global.logseq.db.frontend.inputs.resolve_input(c.deref(conn), read(':today'), read('{}'));
      spec = c.assoc.cljs$core$IFn$_invoke$arity$3(spec, read(':today-day'), day);
    }
    return global.frontend.worker.handler.render_resource.query.execute_query_spec(c.deref(conn), spec, read(`{:repo "${repo}"}`));
  }
  async function parity(query, inputs = '[]', expected) {
    const result = await cli('--query', query, '--inputs', inputs);
    assert.ifError(result.error);
    assert.equal(print(result.value), print(desktop(query, inputs)));
    if (expected !== undefined) assert.equal(print(result.value), expected);
  }
  const echo = '[:find ?v . :in $ ?v :where [(identity ?v) ?x]]';
  const cases = [
    ['relative journal day', '[:today]'],
    ['relative offset day', '[:-7d]'],
    ['day boundary milliseconds', '[:today-start]'],
    ['page reference string', '["[[Page]]"]', '"page"'],
    ['ordinary string', '["two words"]', '"two words"'],
    ['numeric string uses Desktop parsing', '["42"]', '42'],
    ['boolean string uses Desktop parsing', '["true"]', 'true'],
    ['nil string uses Desktop parsing', '["nil"]', 'nil'],
    ['string starting with a number uses Desktop parsing', '["42 things"]', '42'],
    ['escaped literal string', '["\\"42\\""]', '"42"'],
    ['unknown keyword', '[:logseq.property/status.done]', ':logseq.property/status.done'],
    ['number', '[42]', '42']
  ];
  for (const [label, inputs, expected] of cases) {
    await t.test(label, () => parity(echo, inputs, expected));
  }
  await t.test('mixed inputs retain their order', () => parity(
    '[:find ?day ?label :in $ ?day ?label :where [(identity ?day) ?x]]',
    '[:today "[[Page]]"]'));
  await t.test('current time is evaluated by the worker', async () => {
    const start = Date.now();
    const result = await cli('--query', echo, '--inputs', '[:right-now-ms]');
    assert.ifError(result.error);
    const value = Number(print(result.value));
    assert.ok(value >= start && value <= Date.now(), value);
  });
  await t.test('page-reference equality uses Desktop rewrite', () => parity(
    '[:find ?matched . :in $ ?refs :where [(= ?refs "[[Page]]")] [(identity true) ?matched]]',
    '[#{"page"}]', 'true'));
  for (const inClause of ['', ' :in $ %']) {
    await t.test(`built-in rules${inClause || ' without an explicit percent input'}`, () => parity(
      `[:find ?title .${inClause} :where (parent ?parent ?child) [?parent :block/title "Home"] [?child :block/title ?title] [(= ?title "Child")]]`,
      '[]', '"Child"'));
  }
  const callerRules = '[[(twice ?x ?y) [(* ?x 2) ?y]]]';
  for (const [bindings, inputs] of [
    ['% $ ?x', `[${callerRules} 21]`],
    ['$ % ?x', `[${callerRules} 21]`],
    ['$ ?x %', `[21 ${callerRules}]`]
  ]) {
    const query = `[:find ?y . :in ${bindings} :where (twice ?x ?y)]`;
    await t.test(`Desktop caller rules at :in ${bindings}`, () => {
      assert.equal(print(desktop(query, '[21]', callerRules)), '42');
    });
    await t.test(`CLI caller rules at :in ${bindings}`, async () => {
      const result = await cli('--query', query, '--inputs', inputs);
      assert.ifError(result.error);
      assert.equal(print(result.value), print(desktop(query, '[21]', callerRules)));
      assert.equal(print(result.value), '42');
    });
  }
  await t.test('caller rules preserve collection input bindings', async () => {
    const query = '[:find [?y ...] :in $ % [?x ...] :where (twice ?x ?y)]';
    const result = await cli('--query', query, '--inputs', `[${callerRules} [21 22]]`);
    assert.ifError(result.error);
    assert.deepEqual(Array.from(c.to_array(result.value)).sort(), [42, 44]);
    assert.equal(print(result.value), print(desktop(query, '[[21 22]]', callerRules)));
  });
  const middleBuiltIn = '[:find ?title . :in $ % ?parent :where (parent ?parent ?child) [?child :block/title ?title] [(= ?title "Child")]]';
  await t.test('Desktop inserts discovered rules before ordinary inputs', () => {
    assert.equal(print(desktop(middleBuiltIn, '[1]')), '"Child"');
  });
  await t.test('CLI inserts discovered rules before ordinary inputs', () => parity(middleBuiltIn, '[1]', '"Child"'));
  await t.test('caller rules without ordinary inputs', async () => {
    const rules = '[[(answer ?n) [(identity 42) ?n]]]';
    const query = '[:find ?n . :in $ % :where (answer ?n)]';
    const result = await cli('--query', query, '--inputs', `[${rules}]`);
    assert.ifError(result.error);
    assert.equal(print(result.value), print(desktop(query, '[]', rules)));
    assert.equal(print(result.value), '42');
  });
  await t.test('caller rule lists normalize to the Desktop rules vector', async () => {
    const result = await cli('--query', '[:find ?y . :in $ % ?x :where (twice ?x ?y)]',
      '--inputs', '[([(twice ?x ?y) [(* ?x 2) ?y]]) 21]');
    assert.ifError(result.error);
    assert.equal(print(result.value), '42');
  });
  await t.test('caller rules and discovered built-in rules are combined', async () => {
    const query = '[:find ?y . :in $ % ?x :where (twice ?x ?y) (parent ?p ?c)]';
    const result = await cli('--query', query, '--inputs', `[${callerRules} 21]`);
    assert.ifError(result.error);
    assert.equal(print(result.value), print(desktop(query, '[21]', callerRules)));
    assert.equal(print(result.value), '42');
  });
  await t.test('ordinary vector inputs are not treated as rules', () => parity(echo, '[[21 22]]', '[21 22]'));
  await t.test('named query keeps positional caller rules', async () => {
    const result = await cli('--name', 'twice', '--inputs', `[${callerRules} 21]`);
    assert.ifError(result.error);
    assert.equal(print(result.value), '42');
  });
  await t.test('queries without inputs', () => parity('[:find ?title . :where [?e :block/title ?title] [(= ?title "Home")]]', '[]', '"Home"'));
  for (const input of [':current-page', ':query-page', ':current-block', ':parent-block']) {
    await t.test(`${input} requires explicit context`, async () => {
      assert.throws(() => desktop(echo, `[${input}]`), /requires/);
      const result = await cli('--query', echo, '--inputs', `[${input}]`);
      assert.ok(result.error, 'Missing context must fail, not bind a literal keyword');
      assert.match(result.error.stdout + result.error.stderr, /requires/);
    });
  }
  await t.test('custom named query inputs', async () => {
    const result = await cli('--name', 'echo', '--inputs', '["[[Page]]"]');
    assert.ifError(result.error);
    assert.equal(print(result.value), '"page"');
  });
  await t.test('built-in named queries retain defaults and status inputs', async () => {
    for (const [name, inputs] of [['recent-updated', '[30]'], ['task-search', '[:logseq.property/status.done "daily"]']]) {
      const result = await cli('--name', name, '--inputs', inputs);
      assert.ifError(result.error);
      assert.match(print(result.value), /Daily task/);
    }
  });
  await t.test('missing database is an error', async () => {
    setConnection(false);
    try {
      const result = await cli('--query', echo, '--inputs', '[:today]');
      assert.ok(result.error, 'A missing database must not become a successful nil result');
      assert.match(result.error.stdout + result.error.stderr, /Missing custom query database/);
    } finally {
      setConnection(true);
    }
  });
});
