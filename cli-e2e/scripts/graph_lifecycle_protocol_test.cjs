const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { fork } = require('node:child_process');
const { once } = require('node:events');
const lifecycle = require('../../deps/graph-lifecycle');

function storage(root) { return lifecycle.resolveStorage(root, path.join(root, 'graphs')); }

function fixture(t) {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'logseq-lifecycle-protocol-')));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  return root;
}

async function child(t, root, mode) {
  const process = fork(path.join(__dirname, 'db-worker-node-lifecycle-fixture.cjs'),
    ['--root-dir', root, '--repo', 'logseq_db_demo', '--mode', mode],
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
  assert.equal(lifecycle.processIdentity(worker.pid), null);
  assert.equal(result.existed, true);
  assert.equal(fs.existsSync(path.join(result.destination, 'db-worker.lock')), false);
  assert.equal(fs.readFileSync(path.join(result.destination, 'db.sqlite-wal'), 'utf8'), 'preserved');
});

test('a shutdown error fails deletion with the graph stopped and supports retry', async t => {
  const root = fixture(t);
  await lifecycle.createGraph(storage(root), 'demo');
  const worker = await child(t, root, 'close-error');
  await assert.rejects(lifecycle.deleteGraph(storage(root), 'demo'), /close failed/);
  assert.equal(lifecycle.processIdentity(worker.pid), null);
  const closing = JSON.parse(fs.readFileSync(path.join(root, 'close-under-lease.json')));
  assert.equal(closing.owner?.identity.pid, process.pid);
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
  assert.equal(lifecycle.processIdentity(worker.pid), null);
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
  assert.equal(lifecycle.processIdentity(worker.pid), null);
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
    assert.equal(current.owner?.identity.pid, process.pid);
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
  assert.equal(created.owner.identity.pid, process.pid);
  assert.equal(lifecycle.snapshot(store, 'demo').owner, undefined);
});

for (const changedBirth of [false, true]) {
  test(`lease refuses an existing ${changedBirth ? 'changed process identity' : 'live owner'}`, async t => {
    const root = fixture(t);
    const store = storage(root);
    const ctx = lifecycle.context(store, 'demo');
    await lifecycle.createGraph(store, 'demo');
    const current = lifecycle.snapshot(store, 'demo');
    const identity = lifecycle.processIdentity(process.pid);
    if (changedBirth) identity.birth = 'different birth';
    current.owner = { id: 'other-operation', operation: 'test', identity };
    fs.writeFileSync(ctx.stateFile, JSON.stringify(current));
    let entered = false;
    await assert.rejects(lifecycle.withLease(ctx, 'test', () => { entered = true; }),
      changedBirth ? /identity changed/ : /owner remains alive/);
    assert.equal(entered, false);
    assert.deepEqual(lifecycle.snapshot(store, 'demo'), current);
  });
}

test('lease release refuses to clear a different owner or overwrite its state', async t => {
  const root = fixture(t);
  const store = storage(root);
  const ctx = lifecycle.context(store, 'demo');
  await lifecycle.createGraph(store, 'demo');
  let replacement;
  await assert.rejects(lifecycle.withLease(ctx, 'test', () => {
    replacement = lifecycle.snapshot(store, 'demo');
    replacement.owner = { id: 'replacement', identity: lifecycle.processIdentity(process.pid), operation: 'replacement' };
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
      assert.equal(pending.owner?.identity.pid, crashed.pid);
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
      assert.equal(record.identity.pid, worker.pid);
      assert.ok(record.identity.birth);
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

test('a changed process identity never receives a signal or loses its lock', async t => {
  const root = fixture(t);
  await lifecycle.createGraph(storage(root), 'demo');
  const worker = await child(t, root, 'normal');
  const lockPath = path.join(root, 'graphs', 'demo', 'db-worker.lock');
  const lock = JSON.parse(fs.readFileSync(lockPath));
  lock['process-start'] = 'different process';
  fs.writeFileSync(lockPath, JSON.stringify(lock));
  await assert.rejects(lifecycle.deleteGraph(storage(root), 'demo'), /identity/);
  assert.notEqual(lifecycle.processIdentity(worker.pid), null);
  assert.equal(fs.existsSync(lockPath), true);
});

test('concurrent deletions have only one directory move', async t => {
  const root = fixture(t);
  await lifecycle.createGraph(storage(root), 'demo');
  const results = await Promise.all([lifecycle.deleteGraph(storage(root), 'demo'), lifecycle.deleteGraph(storage(root), 'demo')]);
  assert.equal(results.filter(result => result.existed).length, 1);
  assert.equal(fs.readdirSync(path.join(root, 'graphs', 'Unlinked graphs')).length, 1);
});

test('an unregistered published orphan loses only its matching moved lock', async t => {
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
  assert.equal((await lifecycle.deleteGraph(storage(root), 'demo')).existed, false);
  assert.equal(lifecycle.processIdentity(worker.pid), null);
  assert.equal(fs.existsSync(path.join(moved, 'db-worker.lock')), false);
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
    assert.notEqual(lifecycle.processIdentity(worker.pid), null);
    assert.equal(lifecycle.snapshot(storage(root), 'demo').workers[0].identity.pid, worker.pid);
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
  t.after(() => { if (lifecycle.processIdentity(pid)) process.kill(pid, 'SIGKILL'); });
  await lifecycle.deleteGraph(storage(root), 'demo');
  await rejected;
  assert.equal(lifecycle.processIdentity(pid), null);
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

test('cleanup never removes a successor lock installed after the worker exits', async t => {
  const root = fixture(t);
  await lifecycle.createGraph(storage(root), 'demo');
  const worker = await child(t, root, 'stubborn');
  const lockPath = path.join(root, 'graphs', 'demo', 'db-worker.lock');
  const replacement = { repo: 'logseq_db_demo', pid: process.pid, 'lock-id': 'successor' };
  const kill = process.kill;
  process.kill = (pid, signal) => {
    const result = kill(pid, signal);
    if (pid === worker.pid && signal === 'SIGKILL') fs.writeFileSync(lockPath, JSON.stringify(replacement));
    return result;
  };
  try {
    await assert.rejects(lifecycle.deleteGraph(storage(root), 'demo'), /lock identity changed/);
    assert.equal(lifecycle.processIdentity(worker.pid), null);
    assert.deepEqual(JSON.parse(fs.readFileSync(lockPath)), replacement);
    assert.equal(fs.existsSync(path.join(root, 'graphs', 'demo')), true);
  } finally { process.kill = kill; }
});

test('macOS exiting process retains its identity until OS exit is confirmed',
  { skip: process.platform !== 'darwin' }, async t => {
    const cp = require('node:child_process');
    const root = fixture(t);
    await lifecycle.createGraph(storage(root), 'demo');
    const worker = await child(t, root, 'stubborn');
    const identity = lifecycle.processIdentity(worker.pid);
    const kill = process.kill;
    const spawnSync = cp.spawnSync;
    let transitionReads = 0;
    let remaining = 0;
    process.kill = (pid, signal) => {
      if (pid === worker.pid && signal === 0 && remaining > 0) return true;
      const result = kill(pid, signal);
      if (pid === worker.pid && signal === 'SIGKILL') remaining = 2;
      return result;
    };
    cp.spawnSync = (command, args, options) => {
      if (command === 'ps' && args[1] === String(worker.pid) && remaining > 0) {
        remaining--;
        transitionReads++;
        return { status: 0, stdout: `${identity.birth} ?Es (node)\n` };
      }
      return spawnSync(command, args, options);
    };
    try {
      const result = await lifecycle.deleteGraph(storage(root), 'demo');
      assert.equal(transitionReads, 2);
      assert.equal(lifecycle.processIdentity(worker.pid), null);
      assert.equal(fs.existsSync(path.join(result.destination, 'db-worker.lock')), false);
      assert.equal(fs.readFileSync(path.join(root, 'server-list'), 'utf8'), '');
    } finally { process.kill = kill; cp.spawnSync = spawnSync; }
  });

test('macOS changed birth is rejected even when the PID reports exiting',
  { skip: process.platform !== 'darwin' }, async t => {
    const cp = require('node:child_process');
    const root = fixture(t);
    await lifecycle.createGraph(storage(root), 'demo');
    const worker = await child(t, root, 'normal');
    const spawnSync = cp.spawnSync;
    cp.spawnSync = (command, args, options) => {
      if (command === 'ps' && args[1] === String(worker.pid))
        return { status: 0, stdout: 'Mon Jan  1 00:00:00 2001 ?Es (node)\n' };
      return spawnSync(command, args, options);
    };
    try {
      await assert.rejects(lifecycle.deleteGraph(storage(root), 'demo'), /identity changed/);
      assert.equal(fs.existsSync(path.join(root, 'graphs', 'demo', 'db-worker.lock')), true);
    } finally { cp.spawnSync = spawnSync; }
  });

test('macOS exiting state times out without signaling or removing live resources',
  { skip: process.platform !== 'darwin' }, async t => {
    const cp = require('node:child_process');
    const root = fixture(t);
    await lifecycle.createGraph(storage(root), 'demo');
    const worker = await child(t, root, 'normal');
    const identity = lifecycle.processIdentity(worker.pid);
    const spawnSync = cp.spawnSync;
    const kill = process.kill;
    let signals = 0;
    cp.spawnSync = (command, args, options) => {
      if (command === 'ps' && args[1] === String(worker.pid))
        return { status: 0, stdout: `${identity.birth} ?Es (node)\n` };
      return spawnSync(command, args, options);
    };
    process.kill = (pid, signal) => {
      if (pid === worker.pid && signal) signals++;
      return kill(pid, signal);
    };
    // Withhold shutdown by removing the endpoint from discovery, retaining identity.
    const ctx = lifecycle.context(storage(root), 'demo');
    const state = lifecycle.snapshot(storage(root), 'demo');
    const runtime = path.join(ctx.dir, `runtime-${state.workers[0].ticket}.json`);
    const record = JSON.parse(fs.readFileSync(runtime));
    delete record.port;
    fs.writeFileSync(runtime, JSON.stringify(record));
    fs.writeFileSync(path.join(root, 'server-list'), '');
    try {
      await assert.rejects(lifecycle.deleteGraph(storage(root), 'demo'), { code: 'server-stop-timeout' });
      assert.equal(signals, 0);
      assert.equal(fs.existsSync(path.join(ctx.graphDir, 'db-worker.lock')), true);
      assert.equal(lifecycle.snapshot(storage(root), 'demo').workers.length, 1);
    } finally { cp.spawnSync = spawnSync; process.kill = kill; }
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
      if (lifecycle.processIdentity(pid)) process.kill(pid, 'SIGKILL');
      await rejected;
    });
    if (owner === 'electron') {
      await assert.rejects(lifecycle.stopGraph(storage(root), 'demo', 'cli'), { code: 'server-owned-by-other' });
      assert.notEqual(lifecycle.processIdentity(pid), null);
    }
    await lifecycle.stopGraph(storage(root), 'demo', owner);
    await rejected;
    assert.equal(lifecycle.processIdentity(pid), null);
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

test('a conflicting lock owner cannot override registered ownership', async t => {
  const root = fixture(t);
  await lifecycle.createGraph(storage(root), 'demo');
  const worker = await child(t, root, 'normal');
  const lockPath = path.join(root, 'graphs', 'demo', 'db-worker.lock');
  const lock = JSON.parse(fs.readFileSync(lockPath));
  lock['owner-source'] = 'electron';
  fs.writeFileSync(lockPath, JSON.stringify(lock));
  await assert.rejects(lifecycle.stopGraph(storage(root), 'demo', 'electron'), /owner|identity/);
  assert.notEqual(lifecycle.processIdentity(worker.pid), null);
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
    for (const pid of [a.pid, b.pid]) if (lifecycle.processIdentity(pid)) process.kill(pid, 'SIGKILL');
  });
  const reopened = await lifecycle.startGraph({ ...options, storage: alias });
  assert.equal(reopened.pid, b.pid);
  const deleted = await lifecycle.deleteGraph(alias, 'demo');
  assert.ok(deleted.destination.startsWith(custom.graphsDir));
  assert.equal(lifecycle.processIdentity(b.pid), null);
  assert.notEqual(lifecycle.processIdentity(a.pid), null);
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
  await assert.rejects(lifecycle.deleteGraph(store, 'demo'), /unresolved process identity/);
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
    t.after(() => { if (lifecycle.processIdentity(worker.pid)) process.kill(worker.pid, 'SIGKILL'); });
    const directory = path.join(root, 'graphs', 'demo');
    const log = fs.readdirSync(directory).filter(name => /^db-worker-node-.*\.log$/.test(name))
      .map(name => fs.readFileSync(path.join(directory, name), 'utf8')).join('\n');
    await lifecycle.deleteGraph(storage(root), 'demo');
    assert.match(log, new RegExp(`:vector-embedding-enabled\\? ${expected ? 'true' : 'false'}`));
    if (expected) assert.ok(log.includes(`:embedding-endpoint "${expected}"`), log);
    else assert.ok(!log.includes('http://127.0.0.1:9/inherited'), log);
  });
}
