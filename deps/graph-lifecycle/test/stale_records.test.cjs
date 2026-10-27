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
