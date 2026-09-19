const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { fork } = require('node:child_process');
const { once } = require('node:events');
const { DatabaseSync } = require('node:sqlite');
const lifecycle = require('../../deps/graph-lifecycle');

async function fixture(t) {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'logseq-ownership-')));
  t.after(async () => {
    for (const record of lifecycle.snapshot(storage, 'demo')?.workers || []) {
      if (record.pid === process.pid) continue;
      if (lifecycle.pidExists(record.pid)) process.kill(record.pid, 'SIGKILL');
      while (lifecycle.pidExists(record.pid)) await new Promise(resolve => setTimeout(resolve, 10));
    }
    fs.rmSync(root, { recursive: true, force: true });
  });
  const storage = lifecycle.resolveStorage(root, path.join(root, 'graphs'));
  await lifecycle.createGraph(storage, 'demo');
  return { root, storage, ctx: lifecycle.context(storage, 'demo') };
}
const script = path.join(__dirname, 'db-worker-node-lifecycle-fixture.cjs');
async function start(t, storage, extraArgs = []) {
  const worker = await lifecycle.startGraph({ storage, repo: 'demo', script, extraArgs: ['--mode', 'normal', ...extraArgs] });
  t.after(async () => {
    if (lifecycle.pidExists(worker.pid)) process.kill(worker.pid, 'SIGKILL');
    while (lifecycle.pidExists(worker.pid)) await new Promise(resolve => setTimeout(resolve, 10));
  });
  return worker;
}

test('ownership excludes competing connections and survives release without a persistent flag', async t => {
  const { ctx } = await fixture(t);
  assert.equal(typeof lifecycle.acquireOwnership, 'function', 'SQLite ownership must replace JSON locks');
  const handle = lifecycle.acquireOwnership(ctx);
  const filename = lifecycle.ownershipPath(ctx);
  const before = fs.statSync(filename);
  t.after(() => handle.release());
  handle.assert();
  assert.throws(() => lifecycle.acquireOwnership(ctx), { code: 'repo-locked' });
  handle.release();
  assert.throws(() => handle.assert(), /ownership/i);
  const next = lifecycle.acquireOwnership(ctx);
  next.release();
  assert.equal(fs.statSync(filename).ino, before.ino);
  const db = new DatabaseSync(filename);
  assert.deepEqual(db.prepare('SELECT name FROM sqlite_schema').all(), []);
  db.close();
});

test('ownership file errors propagate without replacing evidence', async t => {
  const { ctx } = await fixture(t);
  assert.equal(typeof lifecycle.ownershipPath, 'function');
  const filename = lifecycle.ownershipPath(ctx);
  fs.mkdirSync(path.dirname(filename), { recursive: true });
  fs.writeFileSync(filename, 'corrupt lock database');
  assert.throws(() => lifecycle.acquireOwnership(ctx), error => error.errcode === 26);
  assert.equal(fs.readFileSync(filename, 'utf8'), 'corrupt lock database');
});

test('ownership aliases converge outside graph storage', async t => {
  const { root, storage, ctx } = await fixture(t);
  const other = path.join(root, 'another-root');
  fs.mkdirSync(other);
  fs.symlinkSync(storage.graphsDir, path.join(other, 'graphs'), 'dir');
  const alias = lifecycle.context(lifecycle.resolveStorage(other, path.join(other, 'graphs')), 'demo');
  assert.equal(typeof lifecycle.ownershipPath, 'function');
  assert.equal(lifecycle.ownershipPath(ctx), lifecycle.ownershipPath(alias));
  assert.ok(!lifecycle.ownershipPath(ctx).startsWith(root));
});

test('stale management owner PID cannot veto a successfully acquired lease', async t => {
  const { storage, ctx } = await fixture(t);
  const state = lifecycle.snapshot(storage, 'demo');
  state.owner = { id: 'abandoned', pid: process.pid, operation: 'crashed' };
  fs.writeFileSync(ctx.stateFile, JSON.stringify(state));
  await lifecycle.withLease(ctx, 'recover', () => {});
  assert.equal(lifecycle.snapshot(storage, 'demo').owner, undefined);
});

test('admission owns SQLite before resources and a second direct admission is rejected', async t => {
  const { storage, ctx } = await fixture(t);
  const runtime = await lifecycle.admit({ storage, repo: 'demo', owner: 'cli' });
  assert.equal(runtime['ownership-protocol'], 'sqlite-v1');
  t.after(() => lifecycle.releaseOwnership(runtime));
  assert.throws(() => lifecycle.acquireOwnership(ctx), { code: 'repo-locked' });
  await assert.rejects(lifecycle.admit({ storage, repo: 'demo', owner: 'cli' }), /ownership|locked/);
  lifecycle.assertOwnership(runtime);
  lifecycle.releaseOwnership(runtime);
  assert.throws(() => lifecycle.assertOwnership(runtime), /ownership/i);
});

test('worker protocol publishes no JSON lock and excludes a suspended owner', async t => {
  const { storage, ctx } = await fixture(t);
  const worker = await start(t, storage);
  assert.equal(worker['ownership-protocol'], 'sqlite-v1');
  assert.equal(worker['lock-id'], undefined);
  assert.equal(fs.existsSync(path.join(ctx.graphDir, 'db-worker.lock')), false);
  assert.equal(lifecycle.snapshot(storage, 'demo').workers[0]['ownership-protocol'], 'sqlite-v1');
  if (process.platform !== 'win32') {
    process.kill(worker.pid, 'SIGSTOP');
    t.after(() => { if (lifecycle.pidExists(worker.pid)) process.kill(worker.pid, 'SIGCONT'); });
  }
  assert.throws(() => lifecycle.acquireOwnership(ctx), { code: 'repo-locked' });
});

test('death releases ownership and same-path recreation preserves the lock inode', async t => {
  const { storage, ctx } = await fixture(t);
  const worker = await start(t, storage);
  assert.equal(typeof lifecycle.ownershipPath, 'function');
  const filename = lifecycle.ownershipPath(ctx);
  const inode = fs.statSync(filename).ino;
  const generation = lifecycle.snapshot(storage, 'demo').generation;
  process.kill(worker.pid, 'SIGKILL');
  while (lifecycle.pidExists(worker.pid)) await new Promise(resolve => setTimeout(resolve, 10));
  lifecycle.acquireOwnership(ctx).release();
  await lifecycle.deleteGraph(storage, 'demo');
  assert.notEqual(await lifecycle.createGraph(storage, 'demo'), generation);
  assert.equal(fs.statSync(filename).ino, inode);
});

test('abandoned sqlite registration with reused PID is revoked without signals', async t => {
  const { storage, ctx } = await fixture(t);
  const runtime = await lifecycle.admit({ storage, repo: 'demo', owner: 'cli' });
  assert.equal(typeof lifecycle.releaseOwnership, 'function');
  lifecycle.releaseOwnership(runtime);
  const replacement = await start(t, storage);
  assert.notEqual(replacement.pid, process.pid);
  assert.throws(() => lifecycle.checkAdmission(runtime), /registration/);
  assert.equal(lifecycle.snapshot(storage, 'demo').workers.length, 1);
  assert.ok(fs.existsSync(ctx.graphDir));
});

test('management mutation cannot move a graph while ownership remains busy', async t => {
  const { storage, ctx } = await fixture(t);
  assert.equal(typeof lifecycle.acquireOwnership, 'function');
  const handle = lifecycle.acquireOwnership(ctx);
  t.after(() => handle.release());
  await assert.rejects(lifecycle.deleteGraph(storage, 'demo'), /locked|ownership/i);
  assert.ok(fs.existsSync(ctx.graphDir));
});

for (const text of ['', '{broken', JSON.stringify({ repo: 'logseq_db_demo', pid: process.pid, 'lock-id': 'unknown', 'owner-source': 'cli' })]) {
  test(`unverifiable legacy evidence is preserved: ${JSON.stringify(text)}`, async t => {
    const { storage, ctx } = await fixture(t);
    const file = path.join(ctx.graphDir, 'db-worker.lock');
    fs.writeFileSync(file, text);
    await assert.rejects(lifecycle.admit({ storage, repo: 'demo', owner: 'cli' }), /legacy|offline/i);
    assert.equal(fs.readFileSync(file, 'utf8'), text);
    assert.deepEqual(lifecycle.snapshot(storage, 'demo').workers, []);
  });
}

test('dead legacy lock is removed before direct admission, preserving graph generation', async t => {
  const { storage, ctx } = await fixture(t);
  const child = fork(path.join(__dirname, 'db-worker-upgrade-fixture.cjs'),
    [JSON.stringify({ ...storage, repo: 'demo', revision: 'old' })], { stdio: ['ignore', 'ignore', 'ignore', 'ipc'] });
  await once(child, 'message');
  child.kill('SIGKILL');
  await once(child, 'exit');
  const generation = lifecycle.snapshot(storage, 'demo').generation;
  const runtime = await lifecycle.admit({ storage, repo: 'demo', owner: 'cli' });
  assert.equal(fs.existsSync(path.join(ctx.graphDir, 'db-worker.lock')), false);
  t.after(() => lifecycle.releaseOwnership(runtime));
  assert.equal(runtime.generation, generation);
});

test('permission denial preserves the existing ownership database', async t => {
  if (process.platform === 'win32' || process.getuid?.() === 0) return t.skip('POSIX file modes required');
  const { ctx } = await fixture(t);
  lifecycle.acquireOwnership(ctx).release();
  const filename = lifecycle.ownershipPath(ctx);
  const inode = fs.statSync(filename).ino;
  fs.chmodSync(filename, 0);
  try {
    assert.throws(() => lifecycle.acquireOwnership(ctx), error => error.code !== 'repo-locked');
    assert.equal(fs.statSync(filename).ino, inode);
  } finally { fs.chmodSync(filename, 0o600); }
});

test('an unexpectedly ended transaction revokes write authority', async t => {
  const { ctx } = await fixture(t);
  const exec = DatabaseSync.prototype.exec;
  let connection;
  DatabaseSync.prototype.exec = function (sql) {
    const result = exec.call(this, sql);
    if (sql === 'BEGIN IMMEDIATE') connection = this;
    return result;
  };
  let handle;
  try { handle = lifecycle.acquireOwnership(ctx); }
  finally { DatabaseSync.prototype.exec = exec; }
  t.after(() => handle.release());
  connection.exec('ROLLBACK');
  assert.throws(() => handle.assert(), /ownership transaction was lost/);
});

test('partial real worker initialization closes its data database before releasing ownership', async t => {
  const { storage, ctx } = await fixture(t);
  fs.mkdirSync(path.join(ctx.graphDir, 'search', 'db.sqlite'), { recursive: true });
  await assert.rejects(lifecycle.startGraph({ storage, repo: 'demo',
    script: path.resolve(__dirname, '../../static/db-worker-node.js') }), /Worker|startup/i);
  lifecycle.acquireOwnership(ctx).release();
  const db = new DatabaseSync(path.join(ctx.graphDir, 'db.sqlite'));
  db.exec('BEGIN EXCLUSIVE; ROLLBACK');
  db.close();
});

test('a killed real worker reopens committed graph data without replacing its ownership file', async t => {
  const { storage, ctx } = await fixture(t);
  const execFile = require('node:util').promisify(require('node:child_process').execFile);
  const cli = path.resolve(__dirname, '../../static/logseq-cli.js');
  const run = async (...args) => {
    const result = await execFile(process.execPath, [cli, ...args, '--root-dir', storage.root,
      '--graph', 'demo', '--output', 'json'], { timeout: 45000 });
    return JSON.parse(result.stdout);
  };
  await run('upsert', 'page', '--page', 'Ownership crash probe');
  const before = await run('show', '--page', 'Ownership crash probe');
  const original = lifecycle.snapshot(storage, 'demo').workers[0];
  const inode = fs.statSync(lifecycle.ownershipPath(ctx)).ino;
  process.kill(original.pid, 'SIGKILL');
  while (lifecycle.pidExists(original.pid)) await new Promise(resolve => setTimeout(resolve, 10));
  const after = await run('show', '--page', 'Ownership crash probe');
  assert.deepEqual(after, before);
  assert.notEqual(lifecycle.snapshot(storage, 'demo').workers[0].ticket, original.ticket);
  assert.equal(fs.statSync(lifecycle.ownershipPath(ctx)).ino, inode);
  await run('server', 'stop');
});

test('process HOME overrides cannot split the per-user ownership namespace', async t => {
  const { root, ctx } = await fixture(t);
  const original = process.env.HOME;
  const filename = lifecycle.ownershipPath(ctx);
  try {
    process.env.HOME = root;
    assert.equal(lifecycle.ownershipPath(ctx), filename);
  } finally {
    if (original === undefined) delete process.env.HOME;
    else process.env.HOME = original;
  }
});

for (const invalid of ['null', 'false', '{}', '{"workers":null}']) {
  test(`invalid lifecycle metadata remains explicit: ${invalid}`, async t => {
    const { ctx } = await fixture(t);
    fs.writeFileSync(ctx.stateFile, invalid);
    await assert.rejects(lifecycle.withLease(ctx, 'test', () => {}), /Invalid lifecycle state/);
    assert.equal(fs.readFileSync(ctx.stateFile, 'utf8'), invalid);
  });
}
