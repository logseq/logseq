// Run with Electron after compiling :electron. Exercises the actual ready handler.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { fork } = require('node:child_process');
const { once } = require('node:events');
const Module = require('node:module');
const { app } = require('electron');
process.env.NODE_ENV = 'production';
const lifecycle = require('../../deps/graph-lifecycle');
const entry = path.resolve(__dirname, '../../static/electron.js');
const append = 'SHADOW_IMPORT("shadow.module.main.append.js");';
const source = fs.readFileSync(entry, 'utf8');
assert.ok(source.includes(append), 'Expected development Electron build');
const compiled = new Module(entry, module);
compiled.filename = entry;
compiled.paths = Module._nodeModulePaths(path.dirname(entry));
compiled._compile(source.replace(append, ''), entry);
const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'logseq-startup-electron-')));
process.env.LOGSEQ_GRAPHS_DIR = path.join(root, 'graphs');
const storage = lifecycle.resolveStorage(root, process.env.LOGSEQ_GRAPHS_DIR);
const children = [];
async function spawn(repo, revision, health) {
  const child = fork(path.join(__dirname, 'db-worker-upgrade-fixture.cjs'),
    [JSON.stringify({ ...storage, repo, revision, health })],
    { env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' }, stdio: ['ignore', 'ignore', 'inherit', 'ipc'] });
  children.push(child);
  await once(child, 'message');
  return child;
}
(async () => {
  await app.whenReady();
  const expected = logseq.common.version.revision.call(null);
  const old = await spawn('old', 'previous-build');
  await lifecycle.createGraph(storage, 'current');
  const current = await lifecycle.startGraph({ storage, repo: 'current', owner: 'cli',
    script: path.join(__dirname, 'db-worker-node-lifecycle-fixture.cjs'),
    extraArgs: ['--mode', 'normal', '--health-field', 'revision', '--health-value', JSON.stringify(expected)] });
  let ready;
  let opened = 0;
  const reachedWindow = Error('window reached');
  const failures = [];
  electron.core.setup_interceptor_BANG_ = () => () => {};
  electron.window.create_main_window_BANG_ = () => {
    assert.equal(lifecycle.pidExists(old.pid), false, 'old worker must exit before window creation');
    assert.ok(lifecycle.pidExists(current.pid), 'current worker must survive');
    opened++;
    throw reachedWindow; // Stop before the rest of UI initialization in this isolated probe.
  };
  electron.window.create_main_window_BANG_.cljs$core$IFn$_invoke$arity$0 = electron.window.create_main_window_BANG_;
  electron.logger.error.cljs$core$IFn$_invoke$arity$variadic = args => failures.push(cljs.core.to_array.call(null, args).at(-1));
  const application = { on: (event, fn) => { if (event === 'ready') ready = fn; }, getVersion: () => 'test', quit: () => {} };
  electron.core.on_app_ready_BANG_.call(null, application);
  await ready();
  assert.equal(opened, 1);
  assert.deepEqual(failures, [reachedWindow]);
  console.log('Electron ready: old worker stopped before window creation; current worker retained');
  const runtime = await lifecycle.startGraph({ storage, repo: 'old', owner: 'electron',
    script: path.resolve(__dirname, '../../static/db-worker-node.js') });
  assert.ok(lifecycle.pidExists(runtime.pid));
  await lifecycle.stopGraph(storage, 'old', 'electron');
  await ready();
  assert.equal(opened, 2);
  console.log('Electron ready: graph reopened with current worker; repeat startup succeeds');
  await lifecycle.stopGraph(storage, 'current', 'cli');
  await spawn('invalid', 'previous-build', { pid: 1 });
  await ready();
  assert.equal(opened, 2, 'failed cleanup must not open the graph UI');
  assert.notEqual(failures.at(-1), reachedWindow);
  console.log('Electron ready: failed identity check blocks window creation');
})().then(() => { process.exitCode = 0; }, error => { console.error(error); process.exitCode = 1; }).finally(async () => {
  for (const child of children) {
    if (child.exitCode === null && child.signalCode === null) { child.kill('SIGKILL'); await once(child, 'exit'); }
  }
  fs.rmSync(root, { recursive: true, force: true });
  app.exit(process.exitCode);
});
