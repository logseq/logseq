const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { fork } = require('node:child_process');
const { once } = require('node:events');
const lifecycle = require('../../deps/graph-lifecycle');
const script = path.join(__dirname, 'db-worker-node-lifecycle-fixture.cjs');
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function until(predicate, message) {
  const deadline = Date.now() + 5000;
  while (!predicate()) {
    assert.ok(Date.now() < deadline, message);
    await sleep(20);
  }
}
async function fixture(t) {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'logseq-startup-')));
  const storage = lifecycle.resolveStorage(root, path.join(root, 'graphs'));
  const ctx = lifecycle.context(storage, 'demo');
  const pids = new Set();
  t.after(async () => {
    for (const record of lifecycle.snapshot(storage, 'demo')?.workers || []) pids.add(record.pid);
    pids.delete(process.pid);
    for (const pid of pids) {
      if (lifecycle.pidExists(pid)) process.kill(pid, 'SIGKILL');
      await until(() => !lifecycle.pidExists(pid), 'Fixture worker must exit');
    }
    fs.rmSync(root, { recursive: true, force: true });
  });
  await lifecycle.createGraph(storage, 'demo');
  fs.writeFileSync(path.join(ctx.graphDir, 'sentinel'), 'existing graph');
  const start = mode => lifecycle.startGraph({ storage, repo: 'demo', script, extraArgs: ['--mode', mode] });
  const barrier = async mode => {
    const file = path.join(root, mode);
    await until(() => fs.existsSync(file), `Worker must reach ${mode}`);
    const pid = Number(fs.readFileSync(file));
    pids.add(pid);
    return pid;
  };
  return { root, storage, ctx, start, barrier, pids };
}

for (const mode of ['after-admission', 'before-publication']) {
  for (const operation of ['stop', 'delete']) {
    test(`${operation} exits a worker paused ${mode} without waiting for initialization`, async t => {
      const { storage, ctx, start, barrier } = await fixture(t);
      const starting = assert.rejects(start(mode), /Worker|Graph|registration|admission/);
      const pid = await barrier(mode);
      const started = performance.now();
      const result = operation === 'stop'
        ? await lifecycle.stopGraph(storage, 'demo', 'cli')
        : await lifecycle.deleteGraph(storage, 'demo');
      assert.ok(performance.now() - started < 10000, 'Initialization must not hold the lease');
      await starting;
      assert.equal(lifecycle.pidExists(pid), false);
      assert.deepEqual(lifecycle.snapshot(storage, 'demo').workers, []);
      const directory = operation === 'stop' ? ctx.graphDir : result.destination;
      assert.equal(fs.readFileSync(path.join(directory, 'sentinel'), 'utf8'), 'existing graph');
      assert.ok(fs.existsSync(lifecycle.ownershipPath(ctx)));
      if (operation === 'delete') {
        assert.equal((await lifecycle.deleteGraph(storage, 'demo')).existed, false);
        await lifecycle.createGraph(storage, 'demo');
      }
      const reopened = await start('normal');
      assert.notEqual(reopened.pid, pid);
      await lifecycle.stopGraph(storage, 'demo', 'cli');
    });
  }
}

test('a timed out creator cancels its worker, fails observers, and a retry preserves data', async t => {
  const { storage, ctx, start, barrier } = await fixture(t);
  const creating = assert.rejects(start('before-admission'), /failed to become ready/);
  const pid = await barrier('before-admission');
  const observing = assert.rejects(start('normal'), /Worker|admission|registration/);
  await Promise.all([creating, observing]);
  assert.equal(lifecycle.pidExists(pid), false);
  assert.deepEqual(lifecycle.snapshot(storage, 'demo').workers, []);
  assert.equal(fs.readdirSync(ctx.dir).some(file => file.startsWith('runtime-')), false);
  const reopened = await start('normal');
  assert.notEqual(reopened.pid, pid);
  assert.equal(fs.readFileSync(path.join(ctx.graphDir, 'sentinel'), 'utf8'), 'existing graph');
  await lifecycle.stopGraph(storage, 'demo', 'cli');
});

for (const mode of ['after-admission', 'before-publication']) {
  for (const operation of ['stop', 'delete']) {
    test(`${operation} prevents late initialization resumed from ${mode}`, async t => {
      const { root, storage, ctx, start, barrier } = await fixture(t);
      const starting = assert.rejects(start(mode), /Worker|Graph|registration|admission/);
      const pid = await barrier(mode);
      const stopping = operation === 'stop' ? lifecycle.stopGraph(storage, 'demo', 'cli')
        : lifecycle.deleteGraph(storage, 'demo');
      await until(() => lifecycle.snapshot(storage, 'demo').owner?.operation === operation,
        'Stop/delete must acquire exclusion before initialization resumes');
      fs.writeFileSync(path.join(root, `release-${mode}`), 'resume');
      await until(() => fs.existsSync(path.join(root, `continued-${mode}`)), 'Worker must resume initialization');
      assert.equal(lifecycle.snapshot(storage, 'demo').owner?.operation, operation);
      const result = await stopping;
      assert.equal(lifecycle.pidExists(pid), false);
      assert.deepEqual(lifecycle.snapshot(storage, 'demo').workers, []);
      assert.equal(fs.readdirSync(ctx.dir).some(file => file.startsWith('runtime-')), false);
      assert.equal(fs.readFileSync(path.join(root, 'server-list'), 'utf8'), '');
      const directory = operation === 'delete' ? result.destination : ctx.graphDir;
      assert.equal(fs.readFileSync(path.join(directory, 'sentinel'), 'utf8'), 'existing graph');
      assert.ok(fs.existsSync(lifecycle.ownershipPath(ctx)));
      if (operation === 'delete') await lifecycle.createGraph(storage, 'demo');
      const replacement = await start('normal');
      await starting;
      assert.ok(lifecycle.pidExists(replacement.pid), 'Older startup cleanup must preserve the replacement');
      assert.notEqual(replacement.pid, pid);
      await lifecycle.stopGraph(storage, 'demo', 'cli');
    });
  }
}

test('readiness wait survives a wall-clock jump across system sleep', async t => {
  const { root, storage, start, barrier } = await fixture(t);
  const starting = start('before-publication');
  const pid = await barrier('before-publication');
  const now = Date.now;
  t.after(() => { Date.now = now; });
  Date.now = () => now() + 3600000;
  await sleep(500);
  fs.writeFileSync(path.join(root, 'release-before-publication'), 'resume');
  assert.equal((await starting).pid, pid);
  await lifecycle.stopGraph(storage, 'demo', 'cli');
});

test('a timed out observer cannot cancel a worker admitted by another caller', async t => {
  const { root, storage, start, barrier } = await fixture(t);
  const child = fork(script, ['--root-dir', root, '--repo', 'logseq_db_demo', '--mode', 'after-admission'],
    { stdio: ['ignore', 'ignore', 'inherit', 'ipc'] });
  const pid = await barrier('after-admission');
  await assert.rejects(start('normal'), /failed to become ready/);
  assert.ok(lifecycle.pidExists(pid));
  const ready = once(child, 'message');
  fs.writeFileSync(path.join(root, 'release-after-admission'), 'go');
  await ready;
  assert.equal((await start('normal')).pid, pid);
  await lifecycle.stopGraph(storage, 'demo', 'cli');
});

test('publication rejects a revoked admission without exposing readiness', async t => {
  const { storage, ctx } = await fixture(t);
  const runtime = await lifecycle.admit({ storage, repo: 'demo', owner: 'cli' });
  // Model cancellation after admission, without signaling this test process.
  const current = lifecycle.snapshot(storage, 'demo');
  current.workers = [];
  fs.writeFileSync(ctx.stateFile, JSON.stringify(current));
  t.after(() => lifecycle.releaseOwnership(runtime));
  let exposed = false;
  await assert.rejects(async () => lifecycle.publish(runtime, 12345, () => { exposed = true; }), /admission|registration/);
  assert.equal(exposed, false);
  assert.equal(JSON.parse(fs.readFileSync(path.join(ctx.dir, `runtime-${runtime.ticket}.json`))).phase, 'initializing');
});

test('startup reports both the endpoint failure and incomplete cleanup', async t => {
  const { storage, pids } = await fixture(t);
  await assert.rejects(lifecycle.startGraph({ storage, repo: 'demo', script,
    extraArgs: ['--mode', 'normal', '--health-field', 'pid', '--health-value', '1'] }), error => {
    assert.equal(error.code, 'server-start-failed');
    assert.match(error.message, /endpoint identity mismatch/);
    assert.match(error.message, /cleanup failed/i);
    return true;
  });
  const [record] = lifecycle.snapshot(storage, 'demo').workers;
  pids.add(record.pid);
  assert.ok(lifecycle.pidExists(record.pid), 'Unverified endpoint must not be signaled');
});
