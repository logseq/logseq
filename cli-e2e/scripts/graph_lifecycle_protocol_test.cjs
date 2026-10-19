const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { fork } = require('node:child_process');
const { once } = require('node:events');
const lifecycle = require('../../deps/graph-lifecycle');

function storage(root) { return lifecycle.resolveStorage(root, path.join(root, 'graphs')); }

async function rejectsWithoutSignals(pid, action, expected) {
  const kill = process.kill;
  const signals = [];
  process.kill = (target, signal) => {
    if (target === pid && signal !== 0) signals.push(signal);
    return kill(target, signal);
  };
  try {
    await assert.rejects(action, expected);
    assert.deepEqual(signals, []);
  } finally { process.kill = kill; }
}

function fixture(t) {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'logseq-lifecycle-protocol-')));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  return root;
}

async function child(t, root, mode, extraArgs = []) {
  const process = fork(path.join(__dirname, 'db-worker-node-lifecycle-fixture.cjs'),
    ['--root-dir', root, '--repo', 'logseq_db_demo', '--mode', mode, ...extraArgs],
    { stdio: ['ignore', 'ignore', 'inherit', 'ipc'] });
  t.after(async () => {
    if (process.exitCode === null && process.signalCode === null) {
      process.kill('SIGKILL');
      await once(process, 'exit');
    }
  });
  const [message] = await once(process, 'message');
  assert.equal(message.ready, true);
  return process;
}

test('shutdown acknowledgement and removed metadata do not prove exit', async t => {
  const root = fixture(t);
  await lifecycle.createGraph(storage(root), 'demo');
  const worker = await child(t, root, 'stubborn');
  const result = await lifecycle.deleteGraph(storage(root), 'demo');
  assert.equal(lifecycle.pidExists(worker.pid), false);
  assert.equal(result.existed, true);
  assert.ok(fs.existsSync(lifecycle.ownershipPath(lifecycle.context(storage(root), 'demo'))));
  assert.equal(fs.readFileSync(path.join(result.destination, 'db.sqlite-wal'), 'utf8'), 'preserved');
});

test('a shutdown error fails deletion with the graph stopped and supports retry', async t => {
  const root = fixture(t);
  await lifecycle.createGraph(storage(root), 'demo');
  const worker = await child(t, root, 'close-error');
  await assert.rejects(lifecycle.deleteGraph(storage(root), 'demo'), /close failed/);
  assert.equal(lifecycle.pidExists(worker.pid), false);
  const closing = JSON.parse(fs.readFileSync(path.join(root, 'close-under-lease.json')));
  assert.equal(closing.owner?.pid, process.pid);
  assert.equal(closing.owner.operation, 'delete');
  assert.equal(closing.phase, 'deleting');
  assert.equal(fs.existsSync(path.join(root, 'graphs', 'demo')), true);
  const result = await lifecycle.deleteGraph(storage(root), 'demo');
  assert.equal(result.existed, true);
});

test('rename failure leaves the stopped graph and allows a deliberate retry', async t => {
  const root = fixture(t);
  await lifecycle.createGraph(storage(root), 'demo');
  const worker = await child(t, root, 'normal');
  const destination = path.join(root, 'graphs', 'Unlinked graphs');
  fs.writeFileSync(destination, 'not a directory');
  await assert.rejects(lifecycle.deleteGraph(storage(root), 'demo'));
  assert.equal(lifecycle.pidExists(worker.pid), false);
  assert.equal(fs.existsSync(path.join(root, 'graphs', 'demo')), true);
  fs.unlinkSync(destination);
  assert.equal((await lifecycle.deleteGraph(storage(root), 'demo')).existed, true);
});

test('restart retains close-error publication until cleanup succeeds', async t => {
  const root = fixture(t);
  const store = storage(root);
  await lifecycle.createGraph(store, 'demo');
  const worker = await child(t, root, 'close-error');
  const ctx = lifecycle.context(store, 'demo');
  const previous = lifecycle.snapshot(store, 'demo').workers[0];
  const previousFile = path.join(ctx.dir, `runtime-${previous.ticket}.json`);
  await assert.rejects(lifecycle.stopGraph(store, 'demo', 'cli'), /close failed/);
  assert.equal(lifecycle.pidExists(worker.pid), false);
  assert.equal(JSON.parse(fs.readFileSync(previousFile)).error, 'close failed');
  await lifecycle.startGraph({ storage: store, repo: 'demo',
    script: path.join(__dirname, 'db-worker-node-lifecycle-fixture.cjs'), extraArgs: ['--mode', 'normal'] });
  try {
    const current = lifecycle.snapshot(store, 'demo').workers[0];
    assert.notEqual(current.ticket, previous.ticket);
    assert.equal(fs.existsSync(previousFile), false);
    assert.ok(fs.existsSync(path.join(ctx.dir, `runtime-${current.ticket}.json`)));
  } finally {
    await lifecycle.stopGraph(store, 'demo', 'cli');
  }
});

test('an old admission ticket cannot attach after delete and explicit recreate', async t => {
  const root = fixture(t);
  await lifecycle.createGraph(storage(root), 'demo');
  const old = lifecycle.snapshot(storage(root), 'demo').generation;
  await lifecycle.deleteGraph(storage(root), 'demo');
  await lifecycle.createGraph(storage(root), 'demo');
  await assert.rejects(lifecycle.admit({ owner: 'cli', storage: storage(root), repo: 'demo', generation: old }), /generation/);
});

test('an old renderer generation cannot attach to a recreated graph', async t => {
  const root = fixture(t);
  await lifecycle.createGraph(storage(root), 'demo');
  const generation = lifecycle.snapshot(storage(root), 'demo').generation;
  await lifecycle.deleteGraph(storage(root), 'demo');
  await lifecycle.createGraph(storage(root), 'demo');
  await assert.rejects(lifecycle.startGraph({ storage: storage(root), repo: 'demo', generation }), /generation/);
});

test('a direct worker cannot admit after graph deletion', async t => {
  const root = fixture(t);
  await lifecycle.createGraph(storage(root), 'demo');
  await lifecycle.deleteGraph(storage(root), 'demo');
  await assert.rejects(lifecycle.admit({ owner: 'cli', storage: storage(root), repo: 'demo' }), /graph/i);
  assert.equal(fs.existsSync(path.join(root, 'graphs', 'demo')), false);
});

test('lease exclusion is serialized and releases after failure', async t => {
  const root = fixture(t);
  const ctx = lifecycle.context(storage(root), 'demo');
  let release;
  const barrier = new Promise(resolve => { release = resolve; });
  let entered;
  const enteredPromise = new Promise(resolve => { entered = resolve; });
  const first = lifecycle.withLease(ctx, 'test', async () => { entered(); await barrier; throw Error('deliberate'); });
  const rejected = assert.rejects(first, /deliberate/);
  await enteredPromise;
  let secondEntered = false;
  const second = lifecycle.withLease(ctx, 'test', () => { secondEntered = true; });
  assert.equal(secondEntered, false);
  release();
  await rejected;
  await second;
  assert.equal(secondEntered, true);
  assert.equal(fs.existsSync(path.join(ctx.dir, 'owner.json')), false);
  assert.equal(lifecycle.snapshot(storage(root), 'demo').owner, undefined);
});

test('lease owner is visible in state and release preserves the latest operation data', async t => {
  const root = fixture(t);
  const store = storage(root);
  const ctx = lifecycle.context(store, 'demo');
  await lifecycle.createGraph(store, 'demo');
  const generation = lifecycle.snapshot(store, 'demo').generation;
  await assert.rejects(lifecycle.withLease(ctx, 'test-failure', () => {
    const current = lifecycle.snapshot(store, 'demo');
    assert.equal(current.owner?.pid, process.pid);
    assert.equal(current.owner.operation, 'test-failure');
    assert.equal(fs.existsSync(path.join(ctx.dir, 'owner.json')), false);
    current.phase = 'deletion-failed';
    current.deletion = { id: 'test-operation', generation, moved: false };
    fs.writeFileSync(ctx.stateFile, JSON.stringify(current));
    throw Error('deliberate');
  }), /deliberate/);
  const current = lifecycle.snapshot(store, 'demo');
  assert.equal(current.owner, undefined);
  assert.equal(current.generation, generation);
  assert.equal(current.phase, 'deletion-failed');
  assert.equal(current.deletion.id, 'test-operation');
  await lifecycle.withLease(ctx, 'retry', () => {
    assert.equal(lifecycle.snapshot(store, 'demo').owner.operation, 'retry');
  });
});

test('creation preserves its lease owner when replacing a deleted generation', async t => {
  const root = fixture(t);
  const store = storage(root);
  const ctx = lifecycle.context(store, 'demo');
  const previous = await lifecycle.createGraph(store, 'demo');
  await lifecycle.deleteGraph(store, 'demo');
  const rename = fs.renameSync;
  const states = [];
  fs.renameSync = (source, destination) => {
    if (destination === ctx.stateFile) states.push(JSON.parse(fs.readFileSync(source)));
    return rename(source, destination);
  };
  let generation;
  try { generation = await lifecycle.createGraph(store, 'demo'); }
  finally { fs.renameSync = rename; }
  assert.notEqual(generation, previous);
  const created = states.find(state => state.generation === generation);
  assert.equal(created.owner?.operation, 'create');
  assert.equal(created.owner.pid, process.pid);
  assert.equal(lifecycle.snapshot(store, 'demo').owner, undefined);
});

test('lease acquisition supersedes an abandoned owner despite PID reuse', async t => {
  const root = fixture(t);
  const store = storage(root);
  const ctx = lifecycle.context(store, 'demo');
  await lifecycle.createGraph(store, 'demo');
  const current = lifecycle.snapshot(store, 'demo');
  current.owner = { id: 'other-operation', operation: 'test', pid: process.pid };
  fs.writeFileSync(ctx.stateFile, JSON.stringify(current));
  let entered = false;
  await lifecycle.withLease(ctx, 'test', () => { entered = true; });
  assert.equal(entered, true);
  assert.equal(lifecycle.snapshot(store, 'demo').owner, undefined);
});

test('lease release refuses to clear a different owner or overwrite its state', async t => {
  const root = fixture(t);
  const store = storage(root);
  const ctx = lifecycle.context(store, 'demo');
  await lifecycle.createGraph(store, 'demo');
  let replacement;
  await assert.rejects(lifecycle.withLease(ctx, 'test', () => {
    replacement = lifecycle.snapshot(store, 'demo');
    replacement.owner = { id: 'replacement', pid: process.pid, operation: 'replacement' };
    replacement.phase = 'deletion-failed';
    fs.writeFileSync(ctx.stateFile, JSON.stringify(replacement));
  }), /ownership changed/);
  assert.deepEqual(lifecycle.snapshot(store, 'demo'), replacement);
  // Release failure must still release the OS lock; remove only the test's injected owner.
  delete replacement.owner;
  fs.writeFileSync(ctx.stateFile, JSON.stringify(replacement));
  await lifecycle.withLease(ctx, 'retry', () => {});
});

test('owner publication and release do not invalidate an available graph observer', async t => {
  const root = fixture(t);
  const store = storage(root);
  const generation = await lifecycle.createGraph(store, 'demo');
  const changes = [];
  const close = lifecycle.observe(store, 'demo', generation, value => changes.push(value));
  try {
    await lifecycle.withLease(lifecycle.context(store, 'demo'), 'test', async () => {
      await new Promise(resolve => setTimeout(resolve, 300));
    });
    await new Promise(resolve => setTimeout(resolve, 300));
    assert.deepEqual(changes, []);
  } finally { close(); }
});

for (const boundary of ['acquired', 'owner', 'state-write', 'release', 'released']) {
  test(`lease crash recovery at ${boundary} preserves one graph generation and deletion move`, async t => {
    const root = fixture(t);
    const store = storage(root);
    const ctx = lifecycle.context(store, 'demo');
    const generation = await lifecycle.createGraph(store, 'demo');
    const crashed = fork(path.join(__dirname, 'db-worker-node-lifecycle-fixture.cjs'),
      ['--root-dir', root, '--repo', 'demo', '--mode', `crash-lease-${boundary}`], { stdio: 'ignore' });
    t.after(() => { if (crashed.exitCode === null && crashed.signalCode === null) crashed.kill('SIGKILL'); });
    const [, signal] = await once(crashed, 'exit');
    assert.equal(signal, 'SIGKILL');
    const pending = lifecycle.snapshot(store, 'demo');
    assert.equal(pending.generation, generation);
    if (['owner', 'state-write', 'release'].includes(boundary)) {
      assert.equal(pending.owner?.pid, crashed.pid);
    }
    assert.equal(fs.existsSync(path.join(ctx.dir, 'owner.json')), false);
    await lifecycle.deleteGraph(store, 'demo');
    const completed = lifecycle.snapshot(store, 'demo');
    assert.equal(completed.owner, undefined);
    assert.equal(completed.generation, generation);
    assert.equal(completed.phase, 'deleted');
    assert.equal(completed.deletion.moved, true);
    assert.equal(fs.readdirSync(path.join(store.graphsDir, 'Unlinked graphs')).length, 1);
  });
}

test('termination logs retain every escalation stage without accumulating diagnostic files', async t => {
  const root = fixture(t);
  const store = storage(root);
  const ctx = lifecycle.context(store, 'demo');
  for (const mode of ['stubborn', 'normal']) {
    await lifecycle.createGraph(store, 'demo');
    const worker = await child(t, root, mode);
    const ticket = lifecycle.snapshot(store, 'demo').workers[0].ticket;
    const supervisor = fork(path.join(__dirname, 'db-worker-node-lifecycle-fixture.cjs'),
      ['--root-dir', root, '--repo', 'demo', '--mode', 'delete-graph'],
      { stdio: ['ignore', 'pipe', 'pipe', 'ipc'] });
    t.after(() => { if (supervisor.exitCode === null && supervisor.signalCode === null) supervisor.kill('SIGKILL'); });
    let stderr = '';
    let stdout = '';
    supervisor.stderr.on('data', chunk => { stderr += chunk; });
    supervisor.stdout.on('data', chunk => { stdout += chunk; });
    const [code] = await once(supervisor, 'close');
    assert.equal(code, 0, stderr);
    assert.equal(stdout, '');
    const records = stderr.split('\n').filter(line => line.startsWith('[graph-lifecycle] '))
      .map(line => JSON.parse(line.slice('[graph-lifecycle] '.length)));
    assert.deepEqual(records.map(record => record.stage), mode === 'stubborn' ? ['graceful', 'SIGTERM', 'SIGKILL'] : ['graceful']);
    for (const record of records) {
      assert.equal(record.repo, 'demo');
      assert.equal(record.ticket, ticket);
      assert.equal(record.pid, worker.pid);
      assert.ok(record.generation);
    }
    assert.deepEqual(fs.readdirSync(ctx.dir).filter(name => name.endsWith('.json')), ['state.json']);
    assert.equal(lifecycle.snapshot(store, 'demo').owner, undefined);
  }
});

test('a crashed lease owner is reclaimed using process exit, without an age delay', async t => {
  const root = fixture(t);
  const holder = await child(t, root, 'hold-lease');
  const exit = once(holder, 'exit');
  holder.kill('SIGKILL');
  await exit;
  await lifecycle.createGraph(storage(root), 'demo');
  assert.equal(fs.existsSync(path.join(root, 'graphs', 'demo')), true);
});

test('a changed runtime ticket never receives a signal or loses ownership', async t => {
  const root = fixture(t);
  await lifecycle.createGraph(storage(root), 'demo');
  const worker = await child(t, root, 'normal');
  const ctx = lifecycle.context(storage(root), 'demo');
  const registration = lifecycle.snapshot(storage(root), 'demo').workers[0];
  const lockPath = path.join(ctx.dir, `runtime-${registration.ticket}.json`);
  const lock = JSON.parse(fs.readFileSync(lockPath));
  lock.ticket = 'different-ticket';
  fs.writeFileSync(lockPath, JSON.stringify(lock));
  await rejectsWithoutSignals(worker.pid, () => lifecycle.deleteGraph(storage(root), 'demo'), /identity/);
  assert.equal(lifecycle.pidExists(worker.pid), true);
  assert.equal(fs.existsSync(lockPath), true);
});

test('concurrent deletions have only one directory move', async t => {
  const root = fixture(t);
  await lifecycle.createGraph(storage(root), 'demo');
  const results = await Promise.all([lifecycle.deleteGraph(storage(root), 'demo'), lifecycle.deleteGraph(storage(root), 'demo')]);
  assert.equal(results.filter(result => result.existed).length, 1);
  assert.equal(fs.readdirSync(path.join(root, 'graphs', 'Unlinked graphs')).length, 1);
});

test('an unregistered published orphan is not adopted or signaled', async t => {
  const root = fixture(t);
  await lifecycle.createGraph(storage(root), 'demo');
  const worker = await child(t, root, 'normal');
  const ctx = lifecycle.context(storage(root), 'demo');
  const state = lifecycle.snapshot(storage(root), 'demo');
  state.workers = [];
  fs.writeFileSync(ctx.stateFile, JSON.stringify(state));
  const moved = path.join(root, 'graphs', 'Unlinked graphs', 'demo');
  fs.mkdirSync(path.dirname(moved));
  fs.renameSync(ctx.graphDir, moved);
  await assert.rejects(lifecycle.deleteGraph(storage(root), 'demo'), /unregistered/);
  assert.equal(lifecycle.pidExists(worker.pid), true);
  assert.ok(fs.existsSync(lifecycle.ownershipPath(ctx)));
  assert.equal(fs.readFileSync(path.join(moved, 'db.sqlite-wal'), 'utf8'), 'preserved');
});

test('permission denial retains the live worker record and canonical data', async t => {
  const root = fixture(t);
  await lifecycle.createGraph(storage(root), 'demo');
  const worker = await child(t, root, 'stubborn');
  const kill = process.kill;
  process.kill = (pid, signal) => {
    if (pid === worker.pid && signal === 'SIGKILL') throw Object.assign(Error('denied'), { code: 'EPERM' });
    return kill(pid, signal);
  };
  try {
    await assert.rejects(lifecycle.deleteGraph(storage(root), 'demo'), { code: 'EPERM' });
    assert.equal(lifecycle.pidExists(worker.pid), true);
    assert.equal(lifecycle.snapshot(storage(root), 'demo').workers[0].pid, worker.pid);
    assert.equal(fs.existsSync(path.join(root, 'graphs', 'demo')), true);
  } finally { process.kill = kill; }
});

test('deletion includes a spawned child that has not entered admission', async t => {
  const root = fixture(t);
  await lifecycle.createGraph(storage(root), 'demo');
  const starting = lifecycle.startGraph({ storage: storage(root), repo: 'demo',
    script: path.join(__dirname, 'db-worker-node-lifecycle-fixture.cjs'),
    extraArgs: ['--mode', 'before-admission'] });
  const rejected = assert.rejects(starting, /Graph|Worker/);
  while (!fs.existsSync(path.join(root, 'before-admission'))) {
    await new Promise(resolve => setTimeout(resolve, 10));
  }
  const pid = Number(fs.readFileSync(path.join(root, 'before-admission')));
  t.after(() => { if (lifecycle.pidExists(pid)) process.kill(pid, 'SIGKILL'); });
  await lifecycle.deleteGraph(storage(root), 'demo');
  await rejected;
  assert.equal(lifecycle.pidExists(pid), false);
  assert.equal(fs.existsSync(path.join(root, 'graphs', 'demo')), false);
});

test('client commit completes before a new create can acquire exclusion', async t => {
  const root = fixture(t);
  await lifecycle.createGraph(storage(root), 'demo');
  let entered;
  const reached = new Promise(resolve => { entered = resolve; });
  let release;
  const barrier = new Promise(resolve => { release = resolve; });
  const deleting = lifecycle.deleteGraph(storage(root), 'demo', async () => {
    entered();
    await barrier;
    return { ok: true };
  });
  await reached;
  let created = false;
  const creating = lifecycle.createGraph(storage(root), 'demo').then(() => { created = true; });
  assert.equal(created, false);
  assert.equal(lifecycle.snapshot(storage(root), 'demo').phase, 'deleting');
  release();
  await deleting;
  await creating;
  assert.equal(created, true);
});

test('management retains the ownership database throughout worker shutdown and graph move', async t => {
  const root = fixture(t);
  const store = storage(root);
  await lifecycle.createGraph(store, 'demo');
  await child(t, root, 'normal');
  const ctx = lifecycle.context(store, 'demo');
  const file = lifecycle.ownershipPath(ctx);
  const inode = fs.statSync(file).ino;
  await lifecycle.deleteGraph(store, 'demo', () => {
    assert.throws(() => lifecycle.acquireOwnership(ctx), { code: 'repo-locked' });
    return { ok: true };
  });
  assert.equal(fs.statSync(file).ino, inode);
});

test('client commit failure retains the moved directory and retries exactly once', async t => {
  const root = fixture(t);
  const generation = await lifecycle.createGraph(storage(root), 'demo');
  let commits = 0;
  await assert.rejects(lifecycle.deleteGraph(storage(root), 'demo', () => {
    commits++;
    return { ok: false, error: 'configuration is read-only' };
  }), /read-only/);
  const pending = lifecycle.snapshot(storage(root), 'demo');
  assert.ok(pending.deletion.destination, 'completed move must be recorded before client commit');
  assert.equal(pending.generation, generation);
  assert.ok(pending.deletion.id);
  const result = await lifecycle.deleteGraph(storage(root), 'demo', () => { commits++; return { ok: true }; });
  assert.equal(result.existed, true);
  assert.equal(result.destination, pending.deletion.destination);
  assert.equal(commits, 2);
  assert.equal(fs.readdirSync(path.dirname(result.destination)).length, 1);
  assert.equal(lifecycle.snapshot(storage(root), 'demo').deletion.id, pending.deletion.id);
});

test('an absent graph does not run client configuration cleanup', async t => {
  const root = fixture(t);
  let committed = false;
  const result = await lifecycle.deleteGraph(storage(root), 'demo', () => { committed = true; return { ok: true }; });
  assert.equal(result.existed, false);
  assert.equal(committed, false);
});

test('a queued retry cannot commit against a recreated generation', async t => {
  const root = fixture(t);
  await lifecycle.createGraph(storage(root), 'demo');
  await assert.rejects(lifecycle.deleteGraph(storage(root), 'demo', () => ({ ok: false, error: 'commit failed' })));
  let release;
  let entered;
  const reached = new Promise(resolve => { entered = resolve; });
  const barrier = new Promise(resolve => { release = resolve; });
  const held = lifecycle.withLease(lifecycle.context(storage(root), 'demo'), 'test', async () => { entered(); await barrier; });
  await reached;
  const creating = lifecycle.createGraph(storage(root), 'demo');
  let committed = false;
  const retry = lifecycle.deleteGraph(storage(root), 'demo', () => { committed = true; return { ok: true }; });
  const rejected = assert.rejects(retry, /generation|operation/);
  release();
  await held;
  await creating;
  await rejected;
  assert.equal(committed, false);
  assert.equal(fs.existsSync(path.join(root, 'graphs', 'demo')), true);
});

for (const owner of ['cli', 'electron']) {
  test(`ordinary stop checks registered ${owner} ownership before admission`, async t => {
    const root = fixture(t);
    await lifecycle.createGraph(storage(root), 'demo');
    const starting = lifecycle.startGraph({ storage: storage(root), repo: 'demo', owner,
      script: path.join(__dirname, 'db-worker-node-lifecycle-fixture.cjs'),
      extraArgs: ['--mode', 'before-admission'] });
    const rejected = assert.rejects(starting, /Graph|Worker/);
    while (!fs.existsSync(path.join(root, 'before-admission'))) await new Promise(resolve => setTimeout(resolve, 10));
    const pid = Number(fs.readFileSync(path.join(root, 'before-admission')));
    t.after(async () => {
      if (lifecycle.pidExists(pid)) process.kill(pid, 'SIGKILL');
      await rejected;
    });
    if (owner === 'electron') {
      await assert.rejects(lifecycle.stopGraph(storage(root), 'demo', 'cli'), { code: 'server-owned-by-other' });
      assert.equal(lifecycle.pidExists(pid), true);
    }
    await lifecycle.stopGraph(storage(root), 'demo', owner);
    await rejected;
    assert.equal(lifecycle.pidExists(pid), false);
    assert.equal(fs.existsSync(path.join(root, 'graphs', 'demo')), true);
    assert.deepEqual(lifecycle.snapshot(storage(root), 'demo').workers, []);
  });
}

test('independent unresolved publications are probed concurrently', async t => {
  const http = require('node:http');
  const root = fixture(t);
  await lifecycle.createGraph(storage(root), 'demo');
  const worker = await child(t, root, 'normal');
  const original = fs.readFileSync(path.join(root, 'server-list'), 'utf8');
  const publications = [];
  for (let i = 0; i < 3; i++) {
    const server = http.createServer(() => {});
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    t.after(() => { server.closeAllConnections(); server.close(); });
    publications.push(`${process.pid} ${server.address().port}\n`);
  }
  fs.writeFileSync(path.join(root, 'server-list'), original + publications.join(''));
  const before = performance.now();
  const result = await lifecycle.startGraph({ storage: storage(root), repo: 'demo' });
  assert.equal(result.pid, worker.pid);
  assert.ok(performance.now() - before < 2000, 'independent timeouts must not accumulate');
});

test('a crash after rename resumes the recorded move intent', async t => {
  const root = fixture(t);
  await lifecycle.createGraph(storage(root), 'demo');
  const crashed = fork(path.join(__dirname, 'db-worker-node-lifecycle-fixture.cjs'),
    ['--root-dir', root, '--repo', 'demo', '--mode', 'crash-after-move'], { stdio: 'ignore' });
  t.after(() => { if (crashed.exitCode === null && crashed.signalCode === null) crashed.kill('SIGKILL'); });
  const [, signal] = await once(crashed, 'exit');
  assert.equal(signal, 'SIGKILL');
  const pending = lifecycle.snapshot(storage(root), 'demo');
  assert.equal(pending.phase, 'deleting');
  assert.equal(pending.deletion.moved, false);
  assert.equal(fs.existsSync(path.join(root, 'graphs', 'demo')), false);
  const result = await lifecycle.deleteGraph(storage(root), 'demo', () => ({ ok: true }));
  assert.equal(result.existed, true);
  assert.ok(fs.existsSync(result.destination));
  assert.equal(fs.readdirSync(path.dirname(result.destination)).length, 1);
});

test('a conflicting runtime owner cannot override registered ownership', async t => {
  const root = fixture(t);
  await lifecycle.createGraph(storage(root), 'demo');
  const worker = await child(t, root, 'normal');
  const ctx = lifecycle.context(storage(root), 'demo');
  const registration = lifecycle.snapshot(storage(root), 'demo').workers[0];
  const lockPath = path.join(ctx.dir, `runtime-${registration.ticket}.json`);
  const lock = JSON.parse(fs.readFileSync(lockPath));
  lock.owner = 'electron';
  fs.writeFileSync(lockPath, JSON.stringify(lock));
  await assert.rejects(lifecycle.stopGraph(storage(root), 'demo', 'electron'), /owner|identity/);
  assert.equal(lifecycle.pidExists(worker.pid), true);
});

test('custom storage and physical aliases share exclusion and preserve sibling workers', async t => {
  const root = fixture(t);
  const standard = lifecycle.resolveStorage(root, path.join(root, 'graphs'));
  const custom = lifecycle.resolveStorage(root, path.join(root, 'custom-graphs'));
  const aliasRoot = path.join(root, 'alias-root');
  fs.mkdirSync(aliasRoot);
  fs.symlinkSync(custom.graphsDir, path.join(aliasRoot, 'graphs'), 'dir');
  const alias = lifecycle.resolveStorage(aliasRoot, path.join(aliasRoot, 'graphs'));
  await lifecycle.createGraph(standard, 'demo');
  await lifecycle.createGraph(custom, 'demo');
  const options = { repo: 'demo', script: path.join(__dirname, 'db-worker-node-lifecycle-fixture.cjs'), extraArgs: ['--mode', 'normal'] };
  const a = await lifecycle.startGraph({ ...options, storage: standard });
  const b = await lifecycle.startGraph({ ...options, storage: custom });
  t.after(async () => {
    for (const pid of [a.pid, b.pid]) if (lifecycle.pidExists(pid)) process.kill(pid, 'SIGKILL');
  });
  const reopened = await lifecycle.startGraph({ ...options, storage: alias });
  assert.equal(reopened.pid, b.pid);
  const deleted = await lifecycle.deleteGraph(alias, 'demo');
  assert.ok(deleted.destination.startsWith(custom.graphsDir));
  assert.equal(lifecycle.pidExists(b.pid), false);
  assert.equal(lifecycle.pidExists(a.pid), true);
  assert.equal(fs.existsSync(path.join(standard.graphsDir, 'demo', 'db.sqlite-wal')), true);
  assert.equal(lifecycle.snapshot(custom, 'demo').phase, 'deleted');
});

test('a pending move cannot clean configuration for a replacement directory', async t => {
  const root = fixture(t);
  await lifecycle.createGraph(storage(root), 'demo');
  await assert.rejects(lifecycle.deleteGraph(storage(root), 'demo', () => ({ ok: false, error: 'commit failed' })));
  const graphDir = path.join(root, 'graphs', 'demo');
  fs.mkdirSync(graphDir);
  fs.writeFileSync(path.join(graphDir, 'marker'), 'replacement');
  let committed = false;
  await assert.rejects(lifecycle.deleteGraph(storage(root), 'demo', () => { committed = true; return { ok: true }; }), /identity/);
  assert.equal(committed, false);
  assert.equal(fs.readFileSync(path.join(graphDir, 'marker'), 'utf8'), 'replacement');
});

test('an endpoint claiming the graph without matching process identity fails explicitly', async t => {
  const http = require('node:http');
  const root = fixture(t);
  const store = storage(root);
  await lifecycle.createGraph(store, 'demo');
  const server = http.createServer((_, response) => response.end(JSON.stringify({ repo: 'demo', storage: store })));
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => { server.closeAllConnections(); server.close(); });
  fs.writeFileSync(path.join(root, 'server-list'), `${process.pid} ${server.address().port}\n`);
  await assert.rejects(lifecycle.deleteGraph(store, 'demo'), /unregistered/);
  assert.equal(fs.existsSync(path.join(root, 'graphs', 'demo')), true);
});

for (const [owner, explicit, expected] of [
  ['electron', false, null],
  ['electron', true, 'http://127.0.0.1:9/explicit'],
  ['cli', false, 'http://127.0.0.1:9/inherited'],
  ['cli', true, 'http://127.0.0.1:9/explicit'],
]) {
  test(`${owner} embedding configuration with explicit endpoint=${explicit}`, async t => {
    const root = fixture(t);
    const previous = process.env.LOGSEQ_EMBEDDINGS_URL;
    process.env.LOGSEQ_EMBEDDINGS_URL = 'http://127.0.0.1:9/inherited';
    t.after(() => {
      if (previous === undefined) delete process.env.LOGSEQ_EMBEDDINGS_URL;
      else process.env.LOGSEQ_EMBEDDINGS_URL = previous;
    });
    await lifecycle.createGraph(storage(root), 'demo');
    const worker = await lifecycle.startGraph({ storage: storage(root), repo: 'demo', owner,
      script: path.resolve(__dirname, '../../static/db-worker-node.js'),
      extraArgs: explicit ? ['--embedding-endpoint', 'http://127.0.0.1:9/explicit'] : [] });
    t.after(() => { if (lifecycle.pidExists(worker.pid)) process.kill(worker.pid, 'SIGKILL'); });
    const directory = path.join(root, 'graphs', 'demo');
    const log = fs.readdirSync(directory).filter(name => /^db-worker-node-.*\.log$/.test(name))
      .map(name => fs.readFileSync(path.join(directory, name), 'utf8')).join('\n');
    await lifecycle.deleteGraph(storage(root), 'demo');
    const vectorEnabled = !!expected && process.platform === 'darwin' && process.arch === 'arm64';
    assert.match(log, new RegExp(`:vector-embedding-enabled\\? ${vectorEnabled}`));
    if (expected) assert.ok(log.includes(`:embedding-endpoint "${expected}"`), log);
    else assert.ok(!log.includes('http://127.0.0.1:9/inherited'), log);
  });
}

// Fault injection is limited to disposable fixture PIDs and restored before cleanup.
test('PID probes distinguish missing processes from permission and input errors', t => {
  const kill = process.kill;
  t.after(() => { process.kill = kill; });
  assert.equal(lifecycle.pidExists(process.pid), true);
  for (const pid of [0, -1, 1.5, NaN, undefined, '123']) {
    assert.throws(() => lifecycle.pidExists(pid), /Invalid PID/);
  }
  process.kill = () => { throw Object.assign(Error('gone'), { code: 'ESRCH' }); };
  assert.equal(lifecycle.pidExists(process.pid), false);
  for (const code of ['EPERM', 'EIO']) {
    process.kill = () => { throw Object.assign(Error(code), { code }); };
    assert.throws(() => lifecycle.pidExists(process.pid), { code });
  }
});

for (const [field, value] of [
  ['ticket', 'another-worker'], ['generation', 'another-generation'], ['pid', 1],
  ['repo', 'another-graph'], ['owner-source', 'electron'], ['ownership-protocol', 'unknown-protocol'],
  ['storage', { root: '/', graphsDir: '/', lifecycleDir: '/' }],
]) {
  test(`endpoint ${field} mismatch fails before shutdown or signals`, async t => {
    const root = fixture(t);
    await lifecycle.createGraph(storage(root), 'demo');
    const worker = await child(t, root, 'normal', ['--health-field', field, '--health-value', JSON.stringify(value)]);
    await rejectsWithoutSignals(worker.pid, () => lifecycle.deleteGraph(storage(root), 'demo'), /identity mismatch/);
    assert.equal(lifecycle.pidExists(worker.pid), true);
    assert.equal(fs.existsSync(lifecycle.ownershipPath(lifecycle.context(storage(root), 'demo'))), true);
    assert.equal(fs.existsSync(path.join(root, 'close-under-lease.json')), false);
  });
}

for (const field of ['pid', 'ticket', 'generation', 'owner', 'repo', 'graphsDir', 'lifecycleDir']) {
  test(`conflicting runtime ${field} cannot replace the registered worker`, async t => {
    const root = fixture(t);
    const store = storage(root);
    await lifecycle.createGraph(store, 'demo');
    const worker = await child(t, root, 'normal');
    const ctx = lifecycle.context(store, 'demo');
    const registration = lifecycle.snapshot(store, 'demo').workers[0];
    const file = path.join(ctx.dir, `runtime-${registration.ticket}.json`);
    const runtime = JSON.parse(fs.readFileSync(file));
    runtime[field] = field === 'pid' ? process.pid : 'conflicting-value';
    fs.writeFileSync(file, JSON.stringify(runtime));
    await rejectsWithoutSignals(worker.pid, () => lifecycle.deleteGraph(store, 'demo'), /registration|identity/);
    assert.equal(lifecycle.pidExists(worker.pid), true);
    assert.equal(fs.existsSync(lifecycle.ownershipPath(ctx)), true);
  });
}

test('an unregistered canonical lock owner is not adopted', async t => {
  const root = fixture(t);
  const store = storage(root);
  await lifecycle.createGraph(store, 'demo');
  const worker = await child(t, root, 'normal');
  const state = lifecycle.snapshot(store, 'demo');
  state.workers = [];
  fs.writeFileSync(lifecycle.context(store, 'demo').stateFile, JSON.stringify(state));
  await assert.rejects(lifecycle.deleteGraph(store, 'demo'), /unregistered/);
  assert.equal(lifecycle.pidExists(worker.pid), true);
});

function hideEndpoint(root, store) {
  const record = lifecycle.snapshot(store, 'demo').workers[0];
  const file = path.join(lifecycle.context(store, 'demo').dir, `runtime-${record.ticket}.json`);
  const runtime = JSON.parse(fs.readFileSync(file));
  delete runtime.port;
  fs.writeFileSync(file, JSON.stringify(runtime));
  fs.writeFileSync(path.join(root, 'server-list'), '');
}

test('persistent PID existence times out and retains locks and data', async t => {
  const root = fixture(t);
  const store = storage(root);
  await lifecycle.createGraph(store, 'demo');
  const worker = await child(t, root, 'normal');
  hideEndpoint(root, store);
  const kill = process.kill;
  const signals = [];
  process.kill = (pid, signal) => {
    if (pid === worker.pid && signal !== 0) { signals.push(signal); return true; }
    return kill(pid, signal);
  };
  try {
    await assert.rejects(lifecycle.deleteGraph(store, 'demo'), { code: 'server-stop-timeout' });
    assert.deepEqual(signals, ['SIGTERM', 'SIGKILL']);
    assert.equal(fs.existsSync(lifecycle.ownershipPath(lifecycle.context(storage(root), 'demo'))), true);
    assert.equal(lifecycle.snapshot(store, 'demo').workers.length, 1);
  } finally { process.kill = kill; }
});

test('worker disappearance at signal delivery completes cleanup', async t => {
  const root = fixture(t);
  const store = storage(root);
  await lifecycle.createGraph(store, 'demo');
  const worker = await child(t, root, 'normal');
  hideEndpoint(root, store);
  const kill = process.kill;
  let disappeared = false;
  process.kill = (pid, signal) => {
    if (pid === worker.pid && signal === 'SIGTERM') {
      kill(pid, 'SIGKILL');
      disappeared = true;
      throw Object.assign(Error('gone at signal delivery'), { code: 'ESRCH' });
    }
    return kill(pid, signal);
  };
  try {
    const result = await lifecycle.deleteGraph(store, 'demo');
    assert.equal(disappeared, true);
    assert.equal(lifecycle.pidExists(worker.pid), false);
    assert.ok(fs.existsSync(lifecycle.ownershipPath(lifecycle.context(storage(root), 'demo'))));
  } finally { process.kill = kill; }
});

test('probe permission failure preserves the registered worker and graph', async t => {
  const root = fixture(t);
  const store = storage(root);
  await lifecycle.createGraph(store, 'demo');
  const worker = await child(t, root, 'normal');
  const kill = process.kill;
  process.kill = (pid, signal) => {
    if (pid === worker.pid) throw Object.assign(Error('denied'), { code: 'EPERM' });
    return kill(pid, signal);
  };
  try {
    await assert.rejects(lifecycle.deleteGraph(store, 'demo'), { code: 'EPERM' });
    assert.equal(fs.existsSync(lifecycle.ownershipPath(lifecycle.context(storage(root), 'demo'))), true);
    assert.equal(lifecycle.snapshot(store, 'demo').workers.length, 1);
  } finally { process.kill = kill; }
});

test('a registered self target is never signaled', async t => {
  const root = fixture(t);
  const store = storage(root);
  await lifecycle.createGraph(store, 'demo');
  await lifecycle.admit({ storage: store, repo: 'demo', owner: 'cli' });
  const kill = process.kill;
  let signals = 0;
  process.kill = (pid, signal) => {
    if (signal !== 0) { signals++; throw Error('unexpected signal'); }
    return kill(pid, signal);
  };
  try {
    await assert.rejects(lifecycle.deleteGraph(store, 'demo'), /calling process/);
    assert.equal(signals, 0);
    assert.equal(fs.existsSync(path.join(root, 'graphs/demo')), true);
  } finally { process.kill = kill; }
});

test('a responsive released worker must still exit before graph deletion', async t => {
  const root = fixture(t);
  const store = storage(root);
  await lifecycle.createGraph(store, 'demo');
  const worker = await child(t, root, 'released-but-alive');
  lifecycle.acquireOwnership(lifecycle.context(store, 'demo')).release();
  await lifecycle.deleteGraph(store, 'demo');
  assert.equal(lifecycle.pidExists(worker.pid), false);
});
