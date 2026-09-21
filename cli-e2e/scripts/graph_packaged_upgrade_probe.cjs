// Manual macOS package acceptance probe. Pass historical, first SQLite, and subsequent SQLite .app paths.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { promisify } = require('node:util');
const execFile = promisify(require('node:child_process').execFile);
const lifecycle = require('../../deps/graph-lifecycle');
const apps = process.argv.slice(2);
assert.equal(apps.length, 3, 'Pass historical, first SQLite, and subsequent SQLite app paths');
const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'logseq-packaged-chain-')));
const storage = lifecycle.resolveStorage(root, path.join(root, 'graphs'));
const graphs = ['alpha', 'beta'];
const env = { ...process.env, ELECTRON_RUN_AS_NODE: '1' };
delete env.LOGSEQ_DB_WORKER_NODE_SCRIPT;
async function run(app, graph, ...args) {
  const binary = path.join(app, 'Contents/MacOS/Logseq');
  const cli = path.join(app, 'Contents/Resources/app.asar/js/logseq-cli.js');
  const result = await execFile(binary, [cli, ...args, '--root-dir', root, '--graph', graph, '--output', 'json'],
    { env, timeout: 60000, maxBuffer: 1024 * 1024 });
  return JSON.parse(result.stdout);
}
function record(graph) { return lifecycle.snapshot(storage, graph).workers[0]; }
async function health(graph) {
  const r = record(graph);
  const ctx = lifecycle.context(storage, graph);
  const runtime = JSON.parse(fs.readFileSync(path.join(ctx.dir, `runtime-${r.ticket}.json`), 'utf8'));
  return (await fetch(`http://127.0.0.1:${runtime.port}/healthz`)).json();
}
async function absent(pid) {
  for (let i = 0; i < 200 && lifecycle.pidExists(pid); i++) await new Promise(resolve => setTimeout(resolve, 10));
  assert.equal(lifecycle.pidExists(pid), false);
}
(async () => {
  console.log(JSON.stringify({ root, apps }));
  const pages = new Map();
  for (const graph of graphs) {
    await run(apps[0], graph, 'graph', 'create');
    await run(apps[0], graph, 'upsert', 'page', '--page', 'Before upgrade');
    pages.set(graph, await run(apps[0], graph, 'show', '--page', 'Before upgrade'));
    assert.equal(record(graph)['ownership-protocol'], undefined);
    console.log(JSON.stringify({ stage: 'legacy', graph, health: await health(graph) }));
  }
  for (let stage = 1; stage < apps.length; stage++) {
    const siblingPid = record('beta').pid;
    for (const graph of graphs) {
      const previous = record(graph);
      const previousHealth = await health(graph);
      assert.deepEqual(await run(apps[stage], graph, 'show', '--page', 'Before upgrade'), pages.get(graph));
      await absent(previous.pid);
      const current = record(graph);
      const currentHealth = await health(graph);
      assert.notEqual(currentHealth.revision, previousHealth.revision);
      assert.equal(current['ownership-protocol'], 'sqlite-v1');
      assert.equal(currentHealth['ownership-protocol'], 'sqlite-v1');
      assert.equal(current.generation, previous.generation);
      assert.equal(fs.existsSync(path.join(lifecycle.context(storage, graph).graphDir, 'db-worker.lock')), false);
      if (graph === 'alpha') assert.ok(lifecycle.pidExists(siblingPid), 'Targeted migration must preserve the sibling');
      const title = `Edit after packaged stage ${stage}`;
      await run(apps[stage], graph, 'upsert', 'page', '--page', title);
      const edit = await run(apps[stage], graph, 'show', '--page', title);
      await run(apps[stage], graph, 'server', 'stop');
      assert.deepEqual(await run(apps[stage], graph, 'show', '--page', title), edit);
      const ctx = lifecycle.context(storage, graph);
      const inode = fs.statSync(lifecycle.ownershipPath(ctx)).ino;
      const crashed = record(graph);
      process.kill(crashed.pid, 'SIGKILL');
      await absent(crashed.pid);
      assert.deepEqual(await run(apps[stage], graph, 'show', '--page', title), edit);
      assert.equal(fs.statSync(lifecycle.ownershipPath(ctx)).ino, inode);
      console.log(JSON.stringify({ stage, graph, previousRevision: previousHealth.revision,
        revision: currentHealth.revision, result: 'passed', generation: current.generation }));
    }
  }
  for (const graph of graphs) await run(apps[2], graph, 'server', 'stop');
  const ctx = lifecycle.context(storage, 'alpha');
  const state = lifecycle.snapshot(storage, 'alpha');
  assert.deepEqual(state.workers, []);
  const lock = path.join(ctx.graphDir, 'db-worker.lock');
  const raw = '{interrupted legacy artifact';
  const inode = fs.statSync(lifecycle.ownershipPath(ctx)).ino;
  fs.writeFileSync(lock, raw);
  for (let retry = 0; retry < 2; retry++) {
    await assert.rejects(run(apps[2], 'alpha', 'show', '--page', 'Before upgrade'), error =>
      /offline recovery/i.test(error.stdout));
    assert.equal(fs.readFileSync(lock, 'utf8'), raw);
  }
  const diagnostics = path.join(root, 'offline-recovery-evidence');
  fs.mkdirSync(diagnostics);
  fs.copyFileSync(lock, path.join(diagnostics, 'db-worker.lock'));
  fs.copyFileSync(ctx.stateFile, path.join(diagnostics, 'state.json'));
  await lifecycle.withLease(ctx, 'explicit-offline-recovery-probe', () => {
    assert.deepEqual(lifecycle.snapshot(storage, 'alpha').workers, []);
    assert.equal(fs.readFileSync(lock, 'utf8'), fs.readFileSync(path.join(diagnostics, 'db-worker.lock'), 'utf8'));
    fs.unlinkSync(lock);
  });
  assert.deepEqual(await run(apps[2], 'alpha', 'show', '--page', 'Before upgrade'), pages.get('alpha'));
  await run(apps[2], 'alpha', 'upsert', 'page', '--page', 'After explicit offline recovery');
  assert.equal(lifecycle.snapshot(storage, 'alpha').generation, state.generation);
  assert.equal(fs.statSync(lifecycle.ownershipPath(ctx)).ino, inode);
  await run(apps[2], 'alpha', 'server', 'stop');
  console.log('Explicit offline recovery preserved data, generation, and the SQLite ownership file');
  fs.rmSync(root, { recursive: true, force: true });
  console.log('Packaged upgrade chain passed for both graphs, cold starts, and crash recovery');
})().catch(async error => {
  console.error(error);
  for (const graph of graphs) {
    try { await run(apps[2], graph, 'server', 'stop'); } catch (e) { console.error('Cleanup:', e.message); }
  }
  console.error('Diagnostic root preserved:', root);
  process.exitCode = 1;
});
