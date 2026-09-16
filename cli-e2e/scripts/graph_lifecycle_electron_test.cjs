// Run with Electron after compiling :electron and staging db-worker-node.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const Module = require('node:module');
const lifecycle = require('../../deps/graph-lifecycle');
const project = path.resolve(__dirname, '../..');
const entry = path.join(project, 'static/electron.js');
const append = 'SHADOW_IMPORT("shadow.module.main.append.js");';
const source = fs.readFileSync(entry, 'utf8');
assert.ok(source.includes(append), 'Expected the development Electron build');
const compiled = new Module(entry, module);
compiled.filename = entry;
compiled.paths = Module._nodeModulePaths(path.dirname(entry));
// Load the actual compiled namespaces without opening the normal Desktop UI.
compiled._compile(source.replace(append, ''), entry);
const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'logseq-electron-storage-')));
const graphs = path.join(root, 'custom-graphs');
const standard = lifecycle.resolveStorage(root, path.join(root, 'graphs'));
const pids = new Set();
const kw = name => cljs.core.keyword.call(null, name);
const value = (map, key) => cljs.core.get.call(null, map, kw(key));
const config = object => cljs.core.js__GT_clj.call(null, object, kw('keywordize-keys'), true);
async function health(runtime) {
  const response = await fetch(`${value(runtime, 'base-url')}/healthz`);
  assert.equal(response.status, 200);
  return response.json();
}
async function runtimeRegressions() {
  process.env.LOGSEQ_GRAPHS_DIR = path.join(root, 'runtime-graphs');
  const storage = lifecycle.resolveStorage(root, process.env.LOGSEQ_GRAPHS_DIR);
  const errors = [];
  const check = async (name, run) => {
    try { await run(); console.log(`${name}: passed`); }
    catch (error) { errors.push(error); console.error(`${name}:`, error); }
  };
  const open = (repo, window, generation, extra = {}) => electron.db_worker.ensure_runtime_BANG_.call(
    null, repo, window, config({ 'root-dir': root, 'graphs-dir': storage.graphsDir, generation, ...extra }));
  const release = window => electron.db_worker.release_window_BANG_.call(null, window);
  const waitFor = async predicate => {
    const deadline = Date.now() + 5000;
    while (!predicate()) {
      assert.ok(Date.now() < deadline, 'Timed out waiting for lifecycle observation');
      await new Promise(resolve => setTimeout(resolve, 25));
    }
  };
  await check('parallel graph generations', async () => {
    const generations = await Promise.all(['parallel-a', 'parallel-b'].map(repo => lifecycle.createGraph(storage, repo)));
    const results = await Promise.allSettled(generations.map((generation, index) =>
      open(`parallel-${index ? 'b' : 'a'}`, 100 + index, generation)));
    for (let index = 0; index < results.length; index++) {
      assert.equal(results[index].status, 'fulfilled', String(results[index].reason));
      assert.equal(value(results[index].value, 'generation'), generations[index]);
    }
    await Promise.all([release(100), release(101)]);
  });
  // Track actual resources, including observe's internal self-close path.
  const watchers = new Set();
  const intervals = new Set();
  const watch = fs.watch;
  const interval = global.setInterval;
  const clear = global.clearInterval;
  fs.watch = function (...args) {
    const watcher = watch.apply(this, args);
    watchers.add(watcher);
    watcher.once('close', () => watchers.delete(watcher));
    return watcher;
  };
  global.setInterval = function (callback, delay, ...args) {
    const timer = interval(callback, delay, ...args);
    if (delay === 250) intervals.add(timer);
    return timer;
  };
  global.clearInterval = function (timer) { intervals.delete(timer); return clear(timer); };
  try {
    await check('recovery and release resources', async () => {
      const generation = await lifecycle.createGraph(storage, 'recover');
      let runtime = await open('recover', 102, generation);
      for (let iteration = 0; iteration < 2; iteration++) {
        const { pid } = await health(runtime);
        process.kill(pid, 'SIGKILL');
        await waitFor(() => !lifecycle.pidExists(pid));
        runtime = await open('recover', 102, generation);
        pids.add((await health(runtime)).pid);
        await new Promise(resolve => setImmediate(resolve));
        assert.equal(watchers.size, 1);
        assert.equal(intervals.size, 1);
      }
      await release(102);
      await waitFor(() => watchers.size === 0);
      assert.equal(intervals.size, 0);
    });
    // Clean failed probe resources so the notification check is independent.
    for (const watcher of watchers) watcher.close();
    for (const timer of intervals) global.clearInterval(timer);
    await new Promise(resolve => setImmediate(resolve));
    await check('deletion completion and stale generation', async () => {
      const generation = await lifecycle.createGraph(storage, 'delete');
      const phases = [];
      await open('delete', 103, generation, {
        'on-graph-lifecycle!': (_repo, event) => phases.push(value(event, 'phase')),
      });
      await lifecycle.deleteGraph(storage, 'delete');
      await waitFor(() => phases.includes('deleted'));
      assert.ok(phases.includes('deleting'));
      await waitFor(() => watchers.size === 0);
      assert.equal(intervals.size, 0);
      const replacement = await lifecycle.createGraph(storage, 'delete');
      assert.notEqual(replacement, generation);
      await assert.rejects(open('delete', 104, generation), /generation/i);
      await open('delete', 104, replacement);
      await electron.db_worker.stop_all_managed_BANG_.call(null);
      await waitFor(() => watchers.size === 0);
      assert.equal(intervals.size, 0);
    });
  } finally {
    for (const watcher of watchers) watcher.close();
    for (const timer of intervals) clear(timer);
    fs.watch = watch;
    global.setInterval = interval;
    global.clearInterval = clear;
    for (const repo of ['parallel-a', 'parallel-b', 'recover', 'delete']) {
      await lifecycle.deleteGraph(storage, repo);
    }
  }
  if (errors.length) throw new AggregateError(errors, 'Electron runtime regressions');
}
(async () => {
  await lifecycle.createGraph(standard, 'demo');
  const sibling = await lifecycle.startGraph({ storage: standard, repo: 'demo', owner: 'cli',
    script: path.join(project, 'static/db-worker-node.js') });
  pids.add(sibling.pid);
  fs.writeFileSync(path.join(standard.graphsDir, 'demo', 'marker'), 'standard');
  process.env.LOGSEQ_GRAPHS_DIR = graphs;
  const generation = await electron.handler_interface.handle.call(null, null, cljs.core.vector.call(null, kw('createGraph'), 'logseq_db_demo'));
  fs.writeFileSync(path.join(graphs, 'demo', 'marker'), 'custom');
  const options = config({ generation, 'owner-source': 'electron' });
  const open = () => logseq.cli.server.ensure_server_BANG_.call(null, options, 'logseq_db_demo');
  const runtime = await open();
  const first = await health(runtime);
  pids.add(first.pid);
  assert.equal(first.storage.graphsDir, graphs);
  assert.ok(fs.existsSync(path.join(graphs, 'demo', 'db.sqlite')));
  assert.ok(fs.readdirSync(path.join(graphs, 'demo')).some(name => name.startsWith('db-worker-node-')));
  const alias = path.join(root, 'alias');
  fs.symlinkSync(graphs, alias, 'dir');
  process.env.LOGSEQ_GRAPHS_DIR = alias;
  assert.equal((await health(await open())).pid, first.pid);
  const storage = logseq.cli.server.resolve_storage.call(null, options);
  await lifecycle.stopGraph(storage, 'demo', 'electron');
  assert.equal(lifecycle.pidExists(first.pid), false);
  const reopened = await health(await open());
  pids.add(reopened.pid);
  assert.notEqual(reopened.pid, first.pid);
  const destination = await logseq.cli.common._LT_unlink_graph_BANG_.call(null, alias, 'logseq_db_demo');
  assert.equal(fs.readFileSync(path.join(destination, 'marker'), 'utf8'), 'custom');
  assert.equal(lifecycle.pidExists(reopened.pid), false);
  assert.equal(fs.existsSync(path.join(graphs, 'demo')), false);
  assert.equal(fs.readFileSync(path.join(standard.graphsDir, 'demo', 'marker'), 'utf8'), 'standard');
  assert.equal(lifecycle.pidExists(sibling.pid), true);
  const response = await fetch(`http://127.0.0.1:${sibling.port}/healthz`);
  assert.equal(response.status, 200);
  console.log(JSON.stringify({ electron: process.versions.electron, customStorage: true, aliasReuse: true,
    stoppedAndReopened: true, customDeleted: true, standardWorkerPreserved: true }));
  await lifecycle.deleteGraph(standard, 'demo');
  await runtimeRegressions();
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => {
  for (const pid of pids) if (lifecycle.pidExists(pid)) process.kill(pid, 'SIGKILL');
  fs.rmSync(root, { recursive: true, force: true });
  require('electron').app.exit(process.exitCode || 0);
});
