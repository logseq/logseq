const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { fork } = require('node:child_process');
const { once } = require('node:events');
const lifecycle = require('../../deps/graph-lifecycle');
const execFileAsync = require('node:util').promisify(require('node:child_process').execFile);
const cli = path.resolve(__dirname, '../../static/logseq-cli.js');

function fixture(t) {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'logseq-worker-upgrade-')));
  t.after(async () => {
    const listing = path.join(root, 'server-list');
    const pids = fs.existsSync(listing) ? fs.readFileSync(listing, 'utf8').trim().split('\n')
      .filter(Boolean).map(line => Number(line.split(' ')[0])) : [];
    for (const pid of pids) {
      if (lifecycle.pidExists(pid)) process.kill(pid, 'SIGKILL');
      const deadline = Date.now() + 5000;
      while (lifecycle.pidExists(pid)) {
        assert.ok(Date.now() < deadline, 'Fixture worker must exit before removing storage');
        await new Promise(resolve => setTimeout(resolve, 20));
      }
    }
    fs.rmSync(root, { recursive: true, force: true });
  });
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

test('startup migrates legacy ownership even at the same revision and preserves unrelated storage', async t => {
  const storage = fixture(t);
  const current = await worker(t, storage, { revision: 'current' });
  const other = fixture(t);
  const foreign = await worker(t, other);
  fs.appendFileSync(path.join(storage.root, 'server-list'), `${foreign.pid} ${foreign.port}\n`);
  await lifecycle.stopOutdatedWorkers(storage, 'current');
  assert.equal(lifecycle.pidExists(current.pid), false);
  assert.ok(lifecycle.pidExists(foreign.pid));
  assert.equal(fs.existsSync(path.join(foreign.directory, 'shutdown-requested')), false);
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

test('targeted retirement ignores an unrelated unverifiable worker and reports the retired target', async t => {
  const storage = fixture(t);
  const target = await worker(t, storage, { owner: 'electron', omitLockId: true });
  const unrelated = await worker(t, storage, { repo: 'unrelated', health: { pid: 1 } });
  const stopped = await lifecycle.stopOutdatedWorkers(storage, 'current', 'logseq_db_demo');
  assert.deepEqual(stopped.map(item => item.pid), [target.pid]);
  assert.equal(lifecycle.pidExists(target.pid), false);
  assert.ok(lifecycle.pidExists(unrelated.pid));
});

test('targeted retirement migrates matching legacy revisions and skips absent graphs', async t => {
  const storage = fixture(t);
  const current = await worker(t, storage, { revision: 'current' });
  assert.deepEqual((await lifecycle.stopOutdatedWorkers(storage, 'current', 'demo')).map(x => x.pid), [current.pid]);
  assert.deepEqual(await lifecycle.stopOutdatedWorkers(storage, 'current', 'missing'), []);
  assert.equal(lifecycle.pidExists(current.pid), false);
});

for (const owner of ['cli', 'electron']) {
  for (const command of [['server', 'start'], ['server', 'stop'], ['graph', 'remove']]) {
    test(`CLI ${command.join(' ')} retires only its target historical ${owner} worker`, async t => {
      const storage = fixture(t);
      const target = await worker(t, storage, { owner, omitLockId: true });
      const unrelated = await worker(t, storage, { repo: 'unrelated', health: { pid: 1 } });
      const { stdout } = await execFileAsync(process.execPath,
        [cli, ...command, '--root-dir', storage.root, '--graph', 'demo', '--output', 'json'], { timeout: 45000 });
      assert.equal(JSON.parse(stdout).error, undefined, stdout);
      assert.equal(lifecycle.pidExists(target.pid), false);
      assert.ok(lifecycle.pidExists(unrelated.pid));
      if (command[1] === 'start') {
        const [record] = lifecycle.snapshot(storage, 'demo').workers;
        assert.notEqual(record.pid, target.pid);
        assert.ok(lifecycle.pidExists(record.pid));
        await lifecycle.stopGraph(storage, 'demo', 'cli');
      } else if (command[1] === 'remove') {
        assert.equal(lifecycle.snapshot(storage, 'demo').phase, 'deleted');
      } else assert.equal(fs.existsSync(target.directory), true);
    });
  }
}

for (const options of [{ malformedLock: '' }, { malformedLock: '{broken' }, { noLock: true }]) {
  test(`registered legacy evidence permits retirement with damaged disk artifact ${JSON.stringify(options)}`, async t => {
    const storage = fixture(t);
    const generation = await lifecycle.createGraph(storage, 'demo');
    const target = await worker(t, storage, { registered: true, ...options });
    await lifecycle.stopOutdatedWorkers(storage, 'current', 'demo');
    assert.equal(lifecycle.pidExists(target.pid), false);
    assert.equal(lifecycle.snapshot(storage, 'demo').generation, generation);
    assert.equal(fs.existsSync(path.join(target.directory, 'db-worker.lock')), false);
  });
}

test('legacy cleanup preserves a registration replaced during shutdown', async t => {
  const storage = fixture(t);
  await lifecycle.createGraph(storage, 'demo');
  const target = await worker(t, storage, { registered: true, replaceRegistration: true });
  await assert.rejects(lifecycle.stopOutdatedWorkers(storage, 'current', 'demo'), /registration changed/);
  assert.equal(lifecycle.pidExists(target.pid), false);
  assert.equal(lifecycle.snapshot(storage, 'demo').workers[0].ticket, 'replacement-ticket');
  assert.ok(fs.existsSync(path.join(target.directory, 'db-worker.lock')));
});

test('a legacy artifact restored after successful migration is classified again', async t => {
  const storage = fixture(t);
  const target = await worker(t, storage);
  await lifecycle.stopOutdatedWorkers(storage, 'current', 'demo');
  const file = path.join(target.directory, 'db-worker.lock');
  fs.writeFileSync(file, '');
  await assert.rejects(lifecycle.startGraph({ storage, repo: 'demo' }), /offline recovery/);
  assert.equal(fs.readFileSync(file, 'utf8'), '');
});
