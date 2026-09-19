const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawnSync, execFile } = require('node:child_process');
const execFileAsync = require('node:util').promisify(execFile);
const lifecycle = require('../../deps/graph-lifecycle');
const cli = path.resolve(__dirname, '../../static/logseq-cli.js');
function fixture(t) {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'logseq-followup-cli-')));
  const storage = lifecycle.resolveStorage(root, path.join(root, 'graphs'));
  t.after(() => {
    const listing = path.join(root, 'server-list');
    if (fs.existsSync(listing)) for (const line of fs.readFileSync(listing, 'utf8').trim().split('\n').filter(Boolean)) {
      const pid = Number(line.split(' ')[0]);
      if (lifecycle.pidExists(pid)) process.kill(pid, 'SIGKILL');
    }
    fs.rmSync(root, { recursive: true, force: true });
  });
  function run(graph, ...args) {
    const start = performance.now();
    const result = spawnSync(process.execPath, [cli, ...args, '--root-dir', root, '--graph', graph, '--output', 'json'],
      { encoding: 'utf8', timeout: 45000 });
    if (result.error) throw result.error;
    return { ...result, seconds: (performance.now() - start) / 1000, json: JSON.parse(result.stdout) };
  }
  function ok(graph, ...args) {
    const result = run(graph, ...args);
    assert.equal(result.status, 0, result.stdout + result.stderr);
    return result;
  }
  return { root, storage, run, ok };
}

test('CLI remove resumes configuration cleanup while retaining missing-graph errors', t => {
  const { root, storage, run, ok } = fixture(t);
  ok('demo', 'graph', 'create');
  const config = path.join(root, 'cli.edn');
  fs.writeFileSync(config, '{:graph "demo"}');
  fs.chmodSync(config, 0o444);
  const failed = run('demo', 'graph', 'remove');
  fs.chmodSync(config, 0o644);
  assert.equal(failed.status, 1);
  assert.equal(failed.json.error.code, 'server-cleanup-failed');
  const pending = lifecycle.snapshot(storage, 'demo');
  assert.equal(pending.deletion.moved, true);
  assert.ok(fs.existsSync(pending.deletion.destination));
  ok('demo', 'graph', 'remove');
  assert.equal(fs.readFileSync(config, 'utf8').trim(), '{}');
  assert.equal(lifecycle.snapshot(storage, 'demo').deletion.destination, pending.deletion.destination);
  assert.equal(fs.readdirSync(path.dirname(pending.deletion.destination)).length, 1);
  assert.equal(run('demo', 'graph', 'remove').json.error.code, 'graph-not-exists');
});

test('consecutive CLI commands reuse the worker built from the same source', async t => {
  const { storage, ok } = fixture(t);
  ok('demo', 'graph', 'create');
  ok('demo', 'server', 'start');
  const [original] = lifecycle.snapshot(storage, 'demo').workers;
  try {
    for (let attempt = 0; attempt < 3; attempt++) {
      ok('demo', 'list', 'page', '--limit', '1');
      assert.equal(lifecycle.snapshot(storage, 'demo').workers[0].pid, original.pid,
        'Matching CLI/worker builds must not trigger revision retirement');
    }
  } finally {
    // Keep this parent responsive while the actual CLI confirms child exit.
    await execFileAsync(process.execPath, [cli, 'server', 'stop', '--root-dir', storage.root,
      '--graph', 'demo', '--output', 'json'], { timeout: 45000 });
  }
});

for (const command of [['server', 'stop'], ['graph', 'remove']]) {
  test(`CLI crash recovery retires runtime publications before ${command.join(' ')}`, async t => {
    const { storage, ok } = fixture(t);
    ok('demo', 'graph', 'create');
    ok('demo', 'server', 'start');
    const ctx = lifecycle.context(storage, 'demo');
    const publications = () => fs.readdirSync(ctx.dir).filter(name => /^runtime-.*\.json$/.test(name));
    for (let iteration = 0; iteration < 3; iteration++) {
      const previous = lifecycle.snapshot(storage, 'demo').workers[0];
      process.kill(previous.pid, 'SIGKILL');
      const deadline = Date.now() + 5000;
      while (lifecycle.pidExists(previous.pid)) {
        assert.ok(Date.now() < deadline, 'Crashed worker must exit before recovery');
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      ok('demo', 'server', 'start');
      const current = lifecycle.snapshot(storage, 'demo').workers[0];
      assert.notEqual(current.ticket, previous.ticket);
      assert.deepEqual(publications(), [`runtime-${current.ticket}.json`]);
      ok('demo', 'list', 'page', '--limit', '1');
    }
    ok('demo', ...command);
    assert.deepEqual(publications(), []);
    assert.deepEqual(lifecycle.snapshot(storage, 'demo').workers, []);
    assert.equal(fs.existsSync(ctx.graphDir), command[0] === 'server');
  });
}

test('CLI fails pending retirement explicitly and succeeds after publication', async t => {
  const { root, storage, ok } = fixture(t);
  ok('demo', 'graph', 'create');
  const starting = lifecycle.startGraph({ storage, repo: 'demo',
    script: path.join(__dirname, 'db-worker-node-lifecycle-fixture.cjs'), extraArgs: ['--mode', 'before-publication'] });
  let pid;
  try {
    const deadline = Date.now() + 5000;
    while (!fs.existsSync(path.join(root, 'before-publication'))) {
      assert.ok(Date.now() < deadline, 'Worker must reach the fixture barrier');
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    pid = Number(fs.readFileSync(path.join(root, 'before-publication')));
    const ticket = lifecycle.snapshot(storage, 'demo').workers[0].ticket;
    await assert.rejects(execFileAsync(process.execPath, [cli, 'server', 'stop', '--root-dir', root,
      '--graph', 'demo', '--output', 'json'], { timeout: 45000 }), error => {
      assert.match(JSON.parse(error.stdout).error.message, /endpoint.*retry/i);
      return true;
    });
    assert.ok(lifecycle.pidExists(pid));
    assert.equal(lifecycle.snapshot(storage, 'demo').workers[0].ticket, ticket);
    fs.writeFileSync(path.join(root, 'release-before-publication'), 'release');
    await starting;
    // Let this parent's event loop reap the child while the separate CLI waits for exit.
    await execFileAsync(process.execPath, [cli, 'server', 'stop', '--root-dir', root,
      '--graph', 'demo', '--output', 'json'], { timeout: 45000 });
    assert.equal(lifecycle.pidExists(pid), false);
    ok('demo', 'server', 'restart');
    ok('demo', 'list', 'page', '--limit', '1');
    ok('demo', 'graph', 'remove');
  } finally {
    fs.writeFileSync(path.join(root, 'release-before-publication'), 'release');
    await starting;
    if (pid && lifecycle.pidExists(pid)) process.kill(pid, 'SIGKILL');
  }
});

test('CLI target command remains responsive with three unrelated workers paused', { skip: process.platform === 'win32' }, t => {
  const { storage, ok } = fixture(t);
  const others = [];
  for (const graph of ['demo', 'other1', 'other2', 'other3']) {
    ok(graph, 'graph', 'create');
    ok(graph, 'list', 'page', '--limit', '1');
    if (graph !== 'demo') others.push(lifecycle.snapshot(storage, graph).workers[0].pid);
  }
  const baseline = ok('demo', 'list', 'page', '--limit', '1', '--profile');
  let paused;
  try {
    others.forEach(pid => process.kill(pid, 'SIGSTOP'));
    paused = ok('demo', 'list', 'page', '--limit', '1', '--profile');
  } finally { others.forEach(pid => process.kill(pid, 'SIGCONT')); }
  const resumed = ok('demo', 'list', 'page', '--limit', '1', '--profile');
  assert.deepEqual(paused.json, baseline.json);
  assert.deepEqual(resumed.json, baseline.json);
  assert.ok(paused.seconds < 2, `Unrelated timeouts accumulated: ${paused.seconds}s\n${paused.stderr}`);
  console.log(JSON.stringify({ baseline: baseline.seconds, paused: paused.seconds, resumed: resumed.seconds, equal: true }));
  for (const graph of ['demo', 'other1', 'other2', 'other3']) ok(graph, 'graph', 'remove');
});
