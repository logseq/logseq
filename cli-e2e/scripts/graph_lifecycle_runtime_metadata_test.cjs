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
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'logseq-lifecycle-runtime-')));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  return root;
}

async function child(t, root) {
  const worker = fork(path.join(__dirname, 'db-worker-node-lifecycle-fixture.cjs'),
    ['--root-dir', root, '--repo', 'logseq_db_demo', '--mode', 'normal'],
    { stdio: ['ignore', 'ignore', 'inherit', 'ipc'] });
  t.after(async () => {
    if (worker.exitCode === null && worker.signalCode === null) {
      worker.kill('SIGKILL');
      await once(worker, 'exit');
    }
  });
  const [message] = await once(worker, 'message');
  assert.equal(message.ready, true);
  return worker;
}

function runtimePath(store) {
  const record = lifecycle.snapshot(store, 'demo').workers[0];
  return path.join(lifecycle.context(store, 'demo').dir, `runtime-${record.ticket}.json`);
}

test('null runtime metadata stays an explicit error', async t => {
  const root = fixture(t);
  const store = storage(root);
  await lifecycle.createGraph(store, 'demo');
  const worker = await child(t, root);
  fs.writeFileSync(runtimePath(store), 'null');
  await assert.rejects(lifecycle.deleteGraph(store, 'demo'), /Invalid worker runtime metadata/);
  assert.equal(lifecycle.pidExists(worker.pid), true);
});

test('a runtime file published between the read and an existence check is not malformed', async t => {
  const root = fixture(t);
  const store = storage(root);
  await lifecycle.createGraph(store, 'demo');
  const worker = await child(t, root);
  const readFileSync = fs.readFileSync;
  let missed = false;
  fs.readFileSync = (file, options) => {
    if (!missed && typeof file === 'string' && file.includes(`${path.sep}runtime-`) && file.endsWith('.json')) {
      missed = true;
      throw Object.assign(new Error(`ENOENT: no such file, open '${file}'`), { code: 'ENOENT' });
    }
    return readFileSync(file, options);
  };
  try {
    const result = await lifecycle.deleteGraph(store, 'demo');
    assert.equal(missed, true);
    assert.equal(result.existed, true);
    assert.equal(lifecycle.pidExists(worker.pid), false);
  } finally {
    fs.readFileSync = readFileSync;
  }
});
