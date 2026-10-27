const { test } = require('node:test');
const assert = require('node:assert/strict');
const cp = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const lifecycle = require('../index.cjs');

const STALE_PID = 2147000;
const REVISION = 'new-build';

async function withGraph(action) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'graph-stale-records-'));
  try {
    const storage = lifecycle.resolveStorage(root, path.join(root, 'graphs'));
    await lifecycle.createGraph(storage, 'stale graph');
    return await action(storage, 'stale graph');
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

// Registers a worker that was left behind by an earlier run of the app.
function registerLeftoverWorker(storage, repo, pid) {
  const { stateFile } = lifecycle.context(storage, repo);
  const current = lifecycle.snapshot(storage, repo);
  current.workers = [{ ticket: 'leftover-ticket', generation: current.generation, pid, owner: 'electron',
    root: storage.root, graphsDir: storage.graphsDir, lifecycleDir: storage.lifecycleDir, repo,
    'ownership-protocol': 'sqlite-v1' }];
  fs.writeFileSync(stateFile, JSON.stringify(current));
}

// Makes signal 0 to `pid` fail the way the OS does for a process owned by another user.
function denySignalZero(pid) {
  const realKill = process.kill;
  process.kill = (target, signal) => {
    if (target === pid && signal === 0) throw Object.assign(new Error('kill EPERM'), { code: 'EPERM', syscall: 'kill' });
    return realKill.call(process, target, signal);
  };
  return () => { process.kill = realKill; };
}

test('a PID this user may not signal is reported as gone only when the caller asks for it', () => {
  const restore = denySignalZero(STALE_PID);
  try {
    assert.equal(lifecycle.pidExists(STALE_PID, { unsignalableIsGone: true }), false);
    assert.throws(() => lifecycle.pidExists(STALE_PID), { code: 'EPERM' });
  } finally {
    restore();
  }
});

for (const [description, repo] of [['of one graph', 'stale graph'], ['of every graph', undefined]]) {
  test(`startup cleanup ${description} retires a leftover worker whose PID now belongs to another user`, async () => {
    await withGraph(async (storage, graph) => {
      registerLeftoverWorker(storage, graph, STALE_PID);
      fs.writeFileSync(path.join(storage.root, 'server-list'), `${STALE_PID} 4000\n`);
      const restore = denySignalZero(STALE_PID);
      try {
        await lifecycle.stopOutdatedWorkers(storage, REVISION, repo);
        // Later stop and start calls still treat an unsignalable PID as an error, so none may be left to meet.
        await assert.rejects(lifecycle.stopGraph(storage, graph, 'cli'), { code: 'server-not-found' });
      } finally {
        restore();
      }
      assert.deepEqual(lifecycle.snapshot(storage, graph).workers, []);
      assert.equal(fs.readFileSync(path.join(storage.root, 'server-list'), 'utf8'), '');
    });
  });
}

test('startup cleanup removes the publications of a retired worker from every root it inspected', async () => {
  await withGraph(async (storage, repo) => {
    const otherRoot = path.join(storage.root, 'other root');
    const opened = lifecycle.resolveStorage(otherRoot, storage.graphsDir);
    registerLeftoverWorker(storage, repo, STALE_PID); // registered under the first root
    const lists = [storage.root, opened.root].map(root => path.join(root, 'server-list'));
    for (const list of lists) fs.writeFileSync(list, `${STALE_PID} 4000\n`);
    const restore = denySignalZero(STALE_PID);
    try {
      await lifecycle.stopOutdatedWorkers(opened, REVISION, repo); // the graph is opened through the second root
      await assert.rejects(lifecycle.stopGraph(opened, repo, 'cli'), { code: 'server-not-found' });
    } finally {
      restore();
    }
    for (const list of lists) assert.equal(fs.readFileSync(list, 'utf8'), '');
  });
});

const LONG_AGO = new Date(Date.now() - 60000);

function exitedPid() {
  return cp.spawnSync(process.execPath, ['--version']).pid;
}

// Runs the startup cleanup of a leftover worker, which rewrites server-list under server-list.lock.
async function cleanUpLeftoverWorkerWithLock(storage, repo, lockText, lockTime) {
  registerLeftoverWorker(storage, repo, exitedPid());
  const lock = path.join(storage.root, 'server-list.lock');
  fs.writeFileSync(lock, lockText);
  if (lockTime) fs.utimesSync(lock, lockTime, lockTime);
  await lifecycle.stopOutdatedWorkers(storage, REVISION, repo);
  assert.equal(fs.existsSync(lock), false, 'the lock is released');
  assert.deepEqual(lifecycle.snapshot(storage, repo).workers, []);
}

for (const [description, lockText] of [['empty', ''], ['truncated', '{"pid":'], ['not JSON', 'garbage'],
  ['JSON null', 'null'], ['missing its holder PID', '{"lock-id":"abc"}']]) {
  test(`startup cleanup reclaims a server-list lock that is ${description}`, async () => {
    await withGraph((storage, repo) => cleanUpLeftoverWorkerWithLock(storage, repo, lockText, LONG_AGO));
  });
}

test('startup cleanup reclaims a freshly written unusable server-list lock once it stays unusable', async () => {
  await withGraph((storage, repo) => cleanUpLeftoverWorkerWithLock(storage, repo, '', null));
});

test('startup cleanup reclaims a server-list lock held by an exited process', async () => {
  await withGraph((storage, repo) =>
    cleanUpLeftoverWorkerWithLock(storage, repo, JSON.stringify({ pid: exitedPid(), 'lock-id': 'abc' }), null));
});

test('startup cleanup reclaims a server-list lock whose holder PID now belongs to another user', async () => {
  await withGraph(async (storage, repo) => {
    const restore = denySignalZero(STALE_PID);
    try {
      await cleanUpLeftoverWorkerWithLock(storage, repo, JSON.stringify({ pid: STALE_PID, 'lock-id': 'abc' }), null);
    } finally {
      restore();
    }
  });
});

// Observes every exclusive creation of `lock` and every unlink of it by a holder; returns the function that undoes it.
function watchLock(lock, onCreate, onUnlink) {
  const { writeFileSync, unlinkSync } = fs;
  fs.writeFileSync = function (file, data, options) {
    const result = writeFileSync.apply(this, arguments);
    if (file === lock && options?.flag === 'wx') onCreate();
    return result;
  };
  fs.unlinkSync = function (file) {
    const result = unlinkSync.apply(this, arguments);
    if (file === lock) onUnlink();
    return result;
  };
  return () => { fs.writeFileSync = writeFileSync; fs.unlinkSync = unlinkSync; };
}

test('a reclaimer does not take the lock of a writer that replaced the stale lock after it was judged', async () => {
  await withGraph(async (storage, repo) => {
    registerLeftoverWorker(storage, repo, exitedPid());
    const lock = path.join(storage.root, 'server-list.lock');
    fs.writeFileSync(lock, '');
    fs.utimesSync(lock, LONG_AGO, LONG_AGO);
    let writerHolds = false;
    let takenFromWriter = false;
    let replaced = false;
    const { statSync } = fs;
    // Right after the reclaimer has judged the old empty lock stale, a writer replaces it the way the server-list
    // writers do: create the lock empty, write the holder later, release when done.
    fs.statSync = function (file) {
      const result = statSync.apply(this, arguments);
      if (file === lock && !replaced) {
        replaced = true;
        fs.unlinkSync(lock);
        const fd = fs.openSync(lock, 'wx');
        writerHolds = true;
        setTimeout(() => fs.writeSync(fd, JSON.stringify({ pid: process.pid, 'lock-id': 'writer' })), 100);
        setTimeout(() => { writerHolds = false; fs.closeSync(fd); fs.rmSync(lock, { force: true }); }, 300);
      }
      return result;
    };
    const unwatch = watchLock(lock, () => { if (writerHolds) takenFromWriter = true; }, () => {});
    try {
      await lifecycle.stopOutdatedWorkers(storage, REVISION, repo);
    } finally {
      unwatch();
      fs.statSync = statSync;
    }
    assert.equal(replaced, true);
    assert.equal(takenFromWriter, false, 'the reclaimer took the lock while the writer held it');
    assert.deepEqual(lifecycle.snapshot(storage, repo).workers, []);
  });
});

test('concurrent reclaimers of one stale server-list lock take it one at a time', async () => {
  await withGraph(async (storage, repo) => {
    const others = ['second graph', 'third graph', 'fourth graph'];
    for (const other of others) await lifecycle.createGraph(storage, other);
    for (const graph of [repo, ...others]) registerLeftoverWorker(storage, graph, exitedPid());
    const lock = path.join(storage.root, 'server-list.lock');
    fs.writeFileSync(lock, '');
    fs.utimesSync(lock, LONG_AGO, LONG_AGO);
    let holders = 0;
    let mostHolders = 0;
    const unwatch = watchLock(lock, () => { mostHolders = Math.max(mostHolders, ++holders); }, () => { holders--; });
    try {
      await Promise.all([repo, ...others].map(graph => lifecycle.stopOutdatedWorkers(storage, REVISION, graph)));
    } finally {
      unwatch();
    }
    assert.equal(mostHolders, 1);
    assert.equal(fs.existsSync(lock), false);
    for (const graph of [repo, ...others]) assert.deepEqual(lifecycle.snapshot(storage, graph).workers, []);
  });
});

test('startup cleanup does not take a server-list lock held by a live process', async () => {
  await withGraph(async (storage, repo) => {
    registerLeftoverWorker(storage, repo, exitedPid());
    const lock = path.join(storage.root, 'server-list.lock');
    fs.writeFileSync(lock, JSON.stringify({ pid: process.pid, 'lock-id': 'live' }));
    await assert.rejects(lifecycle.stopOutdatedWorkers(storage, REVISION, repo), /Timed out acquiring server-list lock/);
    assert.equal(JSON.parse(fs.readFileSync(lock, 'utf8'))['lock-id'], 'live');
  });
});

const leftoverRuntimeFile = (storage, repo) => path.join(lifecycle.context(storage, repo).dir, 'runtime-leftover-ticket.json');

for (const [description, content] of [['empty', ''], ['truncated', '{"ticket":"left'], ['not JSON', Buffer.from([0xff, 0xfe, 0x41])],
  ['an array', '[]']]) {
  test(`startup cleanup retires an exited worker whose runtime file is ${description}`, async () => {
    await withGraph(async (storage, repo) => {
      registerLeftoverWorker(storage, repo, exitedPid());
      fs.writeFileSync(leftoverRuntimeFile(storage, repo), content);
      await lifecycle.stopOutdatedWorkers(storage, REVISION, repo);
      assert.deepEqual(lifecycle.snapshot(storage, repo).workers, []);
      assert.equal(fs.existsSync(leftoverRuntimeFile(storage, repo)), false);
    });
  });
}

test('startup cleanup retires a registration whose PID was reused by an unrelated process, runtime file unreadable', async () => {
  await withGraph(async (storage, repo) => {
    const unrelated = cp.spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], { stdio: 'ignore' });
    try {
      registerLeftoverWorker(storage, repo, unrelated.pid);
      fs.writeFileSync(leftoverRuntimeFile(storage, repo), '{broken');
      await lifecycle.stopOutdatedWorkers(storage, REVISION, repo);
      assert.deepEqual(lifecycle.snapshot(storage, repo).workers, []);
      assert.equal(unrelated.exitCode, null, 'the unrelated process was left alone');
    } finally {
      unrelated.kill();
    }
  });
});

test('startup cleanup refuses, with a coded error, a live worker whose runtime file is unreadable', async () => {
  await withGraph(async (storage, repo) => {
    const worker = cp.spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], { stdio: 'ignore' });
    const holder = lifecycle.acquireOwnership(lifecycle.context(storage, repo));
    try {
      registerLeftoverWorker(storage, repo, worker.pid);
      fs.writeFileSync(leftoverRuntimeFile(storage, repo), '{broken');
      await assert.rejects(lifecycle.stopOutdatedWorkers(storage, REVISION, repo),
        error => error.errors.every(cause => cause.code === 'server-stop-failed'));
      assert.equal(lifecycle.snapshot(storage, repo).workers.length, 1);
      assert.equal(fs.readFileSync(leftoverRuntimeFile(storage, repo), 'utf8'), '{broken');
    } finally {
      holder.release();
      worker.kill();
    }
  });
});

for (const [description, damage] of [['without permissions', lock => { fs.writeFileSync(lock, '{}'); fs.chmodSync(lock, 0); }],
  ['a directory', lock => fs.mkdirSync(lock)]]) {
  test(`startup cleanup reclaims a server-list lock that is ${description}`, async () => {
    await withGraph(async (storage, repo) => {
      registerLeftoverWorker(storage, repo, exitedPid());
      const lock = path.join(storage.root, 'server-list.lock');
      damage(lock);
      fs.utimesSync(lock, LONG_AGO, LONG_AGO);
      await lifecycle.stopOutdatedWorkers(storage, REVISION, repo);
      assert.equal(fs.existsSync(lock), false);
      assert.deepEqual(lifecycle.snapshot(storage, repo).workers, []);
    });
  });
}

test('startup cleanup refuses, with a coded error, a server-list that cannot be read', async () => {
  await withGraph(async (storage, repo) => {
    registerLeftoverWorker(storage, repo, exitedPid());
    const list = path.join(storage.root, 'server-list');
    fs.writeFileSync(list, '');
    fs.chmodSync(list, 0);
    await assert.rejects(lifecycle.stopOutdatedWorkers(storage, REVISION, repo),
      error => error.errors.every(cause => cause.code === 'server-stop-failed' && /Unreadable server publication list/.test(cause.message)));
    fs.chmodSync(list, 0o600);
  });
});

// Registers the leftover worker a second time, under another ticket or under the same one.
function registerTwice(storage, repo, pid, sameTicket) {
  registerLeftoverWorker(storage, repo, pid);
  const { stateFile } = lifecycle.context(storage, repo);
  const current = lifecycle.snapshot(storage, repo);
  current.workers.push({ ...current.workers[0], ticket: sameTicket ? current.workers[0].ticket : 'second-ticket' });
  fs.writeFileSync(stateFile, JSON.stringify(current));
}

for (const [description, sameTicket] of [['under two tickets', false], ['twice under one ticket', true]]) {
  test(`startup cleanup and stop retire an exited worker registered ${description}`, async () => {
    await withGraph(async (storage, repo) => {
      registerTwice(storage, repo, exitedPid(), sameTicket);
      await lifecycle.stopOutdatedWorkers(storage, REVISION, repo);
      assert.deepEqual(lifecycle.snapshot(storage, repo).workers, []);
      registerTwice(storage, repo, exitedPid(), sameTicket);
      await lifecycle.stopGraph(storage, repo, 'cli');
      assert.deepEqual(lifecycle.snapshot(storage, repo).workers, []);
    });
  });
}

test('a running worker that holds the graph and is registered twice is still refused', async () => {
  await withGraph(async (storage, repo) => {
    const worker = cp.spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], { stdio: 'ignore' });
    const holder = lifecycle.acquireOwnership(lifecycle.context(storage, repo));
    try {
      registerTwice(storage, repo, worker.pid, false);
      await assert.rejects(lifecycle.stopGraph(storage, repo, 'cli'), /Duplicate worker registration/);
      assert.equal(lifecycle.snapshot(storage, repo).workers.length, 2);
    } finally {
      holder.release();
      worker.kill();
    }
  });
});

test('startup cleanup retires two registrations of a PID that was reused by an unrelated process', async () => {
  await withGraph(async (storage, repo) => {
    const unrelated = cp.spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], { stdio: 'ignore' });
    try {
      registerTwice(storage, repo, unrelated.pid, false);
      await lifecycle.stopOutdatedWorkers(storage, REVISION, repo);
      assert.deepEqual(lifecycle.snapshot(storage, repo).workers, []);
      assert.equal(unrelated.exitCode, null, 'the unrelated process was left alone');
    } finally {
      unrelated.kill();
    }
  });
});

const isCoded = error => (error instanceof AggregateError ? error.errors : [error]).every(cause => typeof cause.code === 'string' && cause.code.startsWith('server-'));

for (const [description, damage] of [['empty', file => fs.writeFileSync(file, '')], ['truncated', file => fs.writeFileSync(file, '{"generation":"abc","pha')],
  ['not JSON', file => fs.writeFileSync(file, Buffer.from([0xff, 0xfe, 0x41]))], ['without permissions', file => fs.chmodSync(file, 0)],
  ['a directory', file => { fs.rmSync(file); fs.mkdirSync(file); }]]) {
  test(`a state.json that is ${description} is refused with a coded error and left as it is`, async () => {
    await withGraph(async (storage, repo) => {
      const { stateFile } = lifecycle.context(storage, repo);
      damage(stateFile);
      const before = ['a directory', 'without permissions'].includes(description) ? null : fs.readFileSync(stateFile);
      for (const operation of [() => lifecycle.createGraph(storage, repo), () => lifecycle.stopGraph(storage, repo, 'cli'),
        () => lifecycle.stopOutdatedWorkers(storage, REVISION, repo), () => lifecycle.deleteGraph(storage, repo)])
        await assert.rejects(operation(), error => isCoded(error) && /Invalid lifecycle state/.test(error.message));
      assert.throws(() => lifecycle.snapshot(storage, repo), error => isCoded(error));
      if (description === 'a directory') assert.equal(fs.statSync(stateFile).isDirectory(), true);
      else if (description === 'without permissions') assert.equal(fs.statSync(stateFile).mode & 0o777, 0);
      else assert.equal(fs.readFileSync(stateFile).equals(before), true, 'state.json was rewritten');
      fs.chmodSync(stateFile, 0o600);
    });
  });
}

for (const [description, workers, message] of [['null', [null], /Invalid lifecycle state/], ['a number', [1], /Invalid lifecycle state/],
  ['an empty object', [{}], /Invalid worker registration/], ['an object without a root', [{ pid: 12, ticket: 't' }], /Invalid worker registration/]]) {
  test(`a worker list holding ${description} is refused as invalid`, async () => {
    await withGraph(async (storage, repo) => {
      const { stateFile } = lifecycle.context(storage, repo);
      fs.writeFileSync(stateFile, JSON.stringify({ ...lifecycle.snapshot(storage, repo), workers }));
      await assert.rejects(lifecycle.stopGraph(storage, repo, 'cli'), error => isCoded(error) && message.test(error.message));
      await assert.rejects(lifecycle.stopOutdatedWorkers(storage, REVISION, repo), error => isCoded(error) && message.test(error.message));
    });
  });
}

test('worker-side checks report a vanished state.json with a coded error instead of a TypeError', async () => {
  await withGraph(async (storage, repo) => {
    const runtime = await lifecycle.admit({ storage, repo, owner: 'cli' });
    try {
      fs.rmSync(runtime.stateFile);
      assert.throws(() => lifecycle.checkAdmission(runtime), { code: 'server-start-failed' });
      assert.throws(() => lifecycle.assertOwnership(runtime), { code: 'repo-locked' });
      assert.doesNotThrow(() => lifecycle.abortAdmission(runtime, new Error('stopped')));
    } finally {
      lifecycle.releaseOwnership(runtime);
    }
  });
});

// The sqlite error is reported as it is, with the phase that met it and the lease database's path.
for (const [description, damage, phase] of [['not a database', file => fs.writeFileSync(file, 'this is not a database'.repeat(20)), 'lease-begin'],
  ['without permissions', file => fs.chmodSync(file, 0), 'lease-open']]) {
  test(`a lease database that is ${description} is refused with its sqlite error and left as it is`, async () => {
    await withGraph(async (storage, repo) => {
      const file = path.join(lifecycle.context(storage, repo).dir, 'lease.sqlite');
      damage(file);
      const before = description === 'not a database' ? fs.readFileSync(file) : null;
      for (const operation of [() => lifecycle.createGraph(storage, repo), () => lifecycle.stopGraph(storage, repo, 'cli'),
        () => lifecycle.stopOutdatedWorkers(storage, REVISION, repo)])
        await assert.rejects(operation(), error => (error instanceof AggregateError ? error.errors : [error])
          .every(cause => cause.code === 'ERR_SQLITE_ERROR' && cause.phase === phase && cause.dbPath === file));
      if (before) assert.equal(fs.readFileSync(file).equals(before), true, 'the lease database was rewritten');
      fs.chmodSync(file, 0o600);
    });
  });
}

test('a worker admitted after a leftover worker whose PID now belongs to another user replaces its registration', async () => {
  await withGraph(async (storage, repo) => {
    registerLeftoverWorker(storage, repo, STALE_PID);
    fs.writeFileSync(path.join(storage.root, 'server-list'), `${STALE_PID} 4000\n`);
    const restore = denySignalZero(STALE_PID);
    try {
      const runtime = await lifecycle.admit({ storage, repo, owner: 'cli' });
      lifecycle.releaseOwnership(runtime);
    } finally {
      restore();
    }
    assert.deepEqual(lifecycle.snapshot(storage, repo).workers.map(worker => worker.pid), [process.pid]);
  });
});

test('starting a graph past a leftover worker whose PID now belongs to another user gets as far as launching a worker', async () => {
  await withGraph(async (storage, repo) => {
    registerLeftoverWorker(storage, repo, STALE_PID);
    const restore = denySignalZero(STALE_PID);
    try {
      // The launched script does not exist, so the worker exits at once; what matters is that nothing raised EPERM.
      await assert.rejects(lifecycle.startGraph({ storage, repo, script: path.join(storage.root, 'missing-worker.cjs') }),
        error => error.code === 'server-start-failed');
    } finally {
      restore();
    }
  });
});

test('admission while something holds the graph reports it as locked, not as EPERM', async () => {
  await withGraph(async (storage, repo) => {
    registerLeftoverWorker(storage, repo, STALE_PID);
    const holder = lifecycle.acquireOwnership(lifecycle.context(storage, repo));
    const restore = denySignalZero(STALE_PID);
    try {
      await assert.rejects(lifecycle.admit({ storage, repo, owner: 'cli' }), { code: 'repo-locked' });
    } finally {
      restore();
      holder.release();
    }
    assert.equal(lifecycle.snapshot(storage, repo).workers.length, 1);
  });
});

async function closedPort() {
  const server = require('node:net').createServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  await new Promise(resolve => server.close(resolve));
  return port;
}

test('stop and delete probe an unregistered server-list entry with an unsignalable PID instead of failing with EPERM', async () => {
  await withGraph(async (storage, repo) => {
    const list = path.join(storage.root, 'server-list');
    fs.writeFileSync(list, `${STALE_PID} ${await closedPort()}\n`);
    const restore = denySignalZero(STALE_PID);
    try {
      await assert.rejects(lifecycle.stopGraph(storage, repo, 'cli'), { code: 'server-not-found' });
      const deleted = await lifecycle.deleteGraph(storage, repo);
      assert.equal(deleted.existed, true);
    } finally {
      restore();
    }
  });
});

test('stop and delete still refuse to go on past a PID this user may not signal', async () => {
  await withGraph(async (storage, repo) => {
    registerLeftoverWorker(storage, repo, STALE_PID);
    const restore = denySignalZero(STALE_PID);
    try {
      await assert.rejects(lifecycle.stopGraph(storage, repo, 'cli'), { code: 'EPERM' });
      await assert.rejects(lifecycle.deleteGraph(storage, repo), { code: 'EPERM' });
    } finally {
      restore();
    }
    assert.equal(lifecycle.snapshot(storage, repo).workers.length, 1);
  });
});

test('observing a graph whose state.json is damaged reports it instead of throwing', async () => {
  await withGraph(async (storage, repo) => {
    const { generation } = lifecycle.snapshot(storage, repo);
    fs.writeFileSync(lifecycle.context(storage, repo).stateFile, '');
    const changes = [];
    const close = lifecycle.observe(storage, repo, generation, change => changes.push(change));
    try {
      assert.deepEqual(changes.map(change => change.phase), ['observation-failed']);
    } finally {
      close();
    }
  });
});
