const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { fork } = require('node:child_process');
const { once } = require('node:events');
const lifecycle = require('../../deps/graph-lifecycle');

function fixture(t) {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'logseq-worker-upgrade-')));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  return lifecycle.resolveStorage(root, path.join(root, 'graphs'));
}
async function worker(t, storage, options = {}) {
  const child = fork(path.join(__dirname, 'db-worker-upgrade-fixture.cjs'),
    [JSON.stringify({ ...storage, repo: 'demo', revision: 'old', ...options })],
    { stdio: ['ignore', 'ignore', 'inherit', 'ipc'] });
  t.after(async () => {
    if (child.exitCode === null && child.signalCode === null) {
      child.kill('SIGKILL');
      await once(child, 'exit');
    }
  });
  const [message] = await once(child, 'message');
  return { ...message, pid: child.pid };
}

test('startup stops every outdated worker across graphs and owners, then graphs reopen', async t => {
  const storage = fixture(t);
  const old = await Promise.all(['cli', 'electron'].map(owner => worker(t, storage, { repo: owner, owner })));
  await assert.rejects(lifecycle.startGraph({ storage, repo: 'cli' }), /unregistered live owner/);
  await lifecycle.stopOutdatedWorkers(storage, 'current');
  for (const target of old) {
    assert.equal(lifecycle.pidExists(target.pid), false);
    assert.equal(fs.existsSync(path.join(target.directory, 'shutdown-requested')), true);
    assert.equal(fs.existsSync(path.join(target.directory, 'db-worker.lock')), false);
    const db = new (require('node:sqlite').DatabaseSync)(path.join(target.directory, 'db.sqlite'));
    assert.equal(db.prepare('SELECT value FROM upgrade_probe').get().value, 'keep database');
    db.close();
  }
  assert.equal(fs.readFileSync(path.join(storage.root, 'server-list'), 'utf8'), '');
  const runtime = await lifecycle.startGraph({ storage, repo: 'cli', owner: 'electron',
    script: path.join(__dirname, 'db-worker-node-lifecycle-fixture.cjs'), extraArgs: ['--mode', 'normal'] });
  assert.ok(lifecycle.pidExists(runtime.pid));
  await lifecycle.stopGraph(storage, 'cli', 'electron');
  await lifecycle.stopOutdatedWorkers(storage, 'current');
});

test('startup retains a current worker and an unrelated storage root', async t => {
  const storage = fixture(t);
  const current = await worker(t, storage, { revision: 'current' });
  const other = fixture(t);
  const foreign = await worker(t, other);
  fs.appendFileSync(path.join(storage.root, 'server-list'), `${foreign.pid} ${foreign.port}\n`);
  await lifecycle.stopOutdatedWorkers(storage, 'current');
  for (const target of [current, foreign]) {
    assert.ok(lifecycle.pidExists(target.pid));
    assert.equal(fs.existsSync(path.join(target.directory, 'shutdown-requested')), false);
  }
});

test('startup escalates to SIGKILL when an identified outdated worker ignores shutdown and SIGTERM', async t => {
  const storage = fixture(t);
  const target = await worker(t, storage, { stubborn: true });
  await lifecycle.stopOutdatedWorkers(storage, 'current');
  assert.equal(lifecycle.pidExists(target.pid), false);
  assert.equal(fs.existsSync(path.join(target.directory, 'shutdown-requested')), true);
});

for (const [field, value] of [['pid', 1], ['port', 1], ['lock-id', 'wrong'], ['repo', 'logseq_db_other'],
  ['owner-source', 'unknown'], ['host', '0.0.0.0'], ['revision', null]]) {
  test(`startup refuses an unverified worker: ${field}`, async t => {
    const storage = fixture(t);
    const target = await worker(t, storage, { health: { [field]: value } });
    await assert.rejects(lifecycle.stopOutdatedWorkers(storage, 'current'));
    assert.ok(lifecycle.pidExists(target.pid));
    assert.equal(fs.existsSync(path.join(target.directory, 'shutdown-requested')), false);
  });
}

test('startup still stops other old workers when one candidate cannot be verified', async t => {
  const storage = fixture(t);
  const bad = await worker(t, storage, { repo: 'bad', health: { pid: 1 } });
  const good = await worker(t, storage, { repo: 'good' });
  await assert.rejects(lifecycle.stopOutdatedWorkers(storage, 'current'));
  assert.ok(lifecycle.pidExists(bad.pid));
  assert.equal(lifecycle.pidExists(good.pid), false);
});

test('startup tolerates dead publications and removes them', async t => {
  const storage = fixture(t);
  const target = await worker(t, storage);
  await fetch(`http://127.0.0.1:${target.port}/v1/shutdown`, { method: 'POST' });
  while (lifecycle.pidExists(target.pid)) await new Promise(resolve => setTimeout(resolve, 20));
  await lifecycle.stopOutdatedWorkers(storage, 'current');
  assert.equal(fs.readFileSync(path.join(storage.root, 'server-list'), 'utf8'), '');
});

test('startup stops registered outdated workers and preserves graph generation', async t => {
  const storage = fixture(t);
  const generation = await lifecycle.createGraph(storage, 'demo');
  const target = await lifecycle.startGraph({ storage, repo: 'demo', owner: 'cli',
    script: path.join(__dirname, 'db-worker-node-lifecycle-fixture.cjs'),
    extraArgs: ['--mode', 'normal', '--health-field', 'revision', '--health-value', '"old"'] });
  t.after(() => { if (lifecycle.pidExists(target.pid)) process.kill(target.pid, 'SIGKILL'); });
  await lifecycle.stopOutdatedWorkers(storage, 'current');
  assert.equal(lifecycle.pidExists(target.pid), false);
  assert.equal(lifecycle.snapshot(storage, 'demo').generation, generation);
  assert.equal(lifecycle.snapshot(storage, 'demo').workers.length, 0);
});

test('startup does not signal an unresponsive live publication with unknown revision', async t => {
  const storage = fixture(t);
  const target = await worker(t, storage);
  // Publish a closed port instead of the worker endpoint.
  fs.writeFileSync(path.join(storage.root, 'server-list'), `${target.pid} 1\n`);
  await assert.rejects(lifecycle.stopOutdatedWorkers(storage, 'current'));
  assert.ok(lifecycle.pidExists(target.pid));
  assert.equal(fs.existsSync(path.join(target.directory, 'shutdown-requested')), false);
});

test('startup preserves a replacement lock if ownership changes during shutdown', async t => {
  const storage = fixture(t);
  const target = await worker(t, storage, { replaceLock: true });
  await assert.rejects(lifecycle.stopOutdatedWorkers(storage, 'current'), /lock identity changed/);
  assert.equal(lifecycle.pidExists(target.pid), false);
  assert.equal(JSON.parse(fs.readFileSync(path.join(target.directory, 'db-worker.lock')))['lock-id'], 'replacement');
});


test('startup retires historical workers whose health endpoint predates lock IDs', async t => {
  const storage = fixture(t);
  const target = await worker(t, storage, { omitLockId: true });
  await lifecycle.stopOutdatedWorkers(storage, 'current');
  assert.equal(lifecycle.pidExists(target.pid), false);
  assert.equal(fs.existsSync(path.join(target.directory, 'shutdown-requested')), true);
  assert.equal(fs.existsSync(path.join(target.directory, 'db-worker.lock')), false);
});
