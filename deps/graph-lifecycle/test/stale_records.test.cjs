const { test } = require('node:test');
const assert = require('node:assert/strict');
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
