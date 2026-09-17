const lifecycle = require('../../deps/graph-lifecycle');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const args = process.argv.slice(2);
const root = args[args.indexOf('--root-dir') + 1];
const repo = args[args.indexOf('--repo') + 1];
const option = flag => args.includes(flag) ? args[args.indexOf(flag) + 1] : undefined;
const storage = lifecycle.resolveStorage(root, option('--graphs-dir') || path.join(root, 'graphs'));
const owner = option('--owner-source') || 'cli';
const mode = args[args.indexOf('--mode') + 1];

(async () => {
  if (mode.startsWith('crash-lease-')) {
    const ctx = lifecycle.context(storage, repo);
    const crash = () => process.kill(process.pid, 'SIGKILL');
    if (mode === 'crash-lease-acquired') {
      const { DatabaseSync } = require('node:sqlite');
      const exec = DatabaseSync.prototype.exec;
      DatabaseSync.prototype.exec = function (sql) {
        const result = exec.call(this, sql);
        if (sql === 'BEGIN IMMEDIATE') crash();
        return result;
      };
    }
    const rename = fs.renameSync;
    fs.renameSync = (source, destination) => {
      if (destination === ctx.stateFile) {
        const next = JSON.parse(fs.readFileSync(source, 'utf8'));
        if (mode === 'crash-lease-state-write' && next.deletion?.destination) crash();
        if (mode === 'crash-lease-release' && next.phase === 'deleted' && !next.owner) crash();
        rename(source, destination);
        if (mode === 'crash-lease-owner' && next.owner) crash();
        if (mode === 'crash-lease-released' && next.phase === 'deleted' && !next.owner) crash();
      } else rename(source, destination);
    };
    await lifecycle.deleteGraph(storage, repo);
    throw Error('Expected the process to die at the selected lease boundary');
  }
  if (mode === 'delete-graph') {
    await lifecycle.deleteGraph(storage, repo);
    return;
  }
  if (mode === 'crash-after-move') {
    const sourceDirectory = lifecycle.context(storage, repo).graphDir;
    const rename = fs.renameSync;
    fs.renameSync = (source, destination) => {
      rename(source, destination);
      if (source === sourceDirectory) process.kill(process.pid, 'SIGKILL');
    };
    await lifecycle.deleteGraph(storage, repo);
    throw Error('Expected the process to die after moving the graph');
  }
  if (mode === 'hold-lease') {
    await lifecycle.withLease(lifecycle.context(storage, repo), 'test', async () => {
      if (process.send) process.send({ ready: true });
      await new Promise(() => { setInterval(() => {}, 1000); });
    });
    return;
  }
  if (mode === 'before-admission') {
    fs.writeFileSync(path.join(root, 'before-admission'), String(process.pid));
    await new Promise(() => { setInterval(() => {}, 1000); });
  }
  const runtime = await lifecycle.admit({ storage, repo, owner, ticket: option('--admission-ticket'),
    generation: option('--graph-generation') });
  async function barrier(stage) {
    if (mode !== stage) return;
    fs.writeFileSync(path.join(root, stage), String(process.pid));
    while (!fs.existsSync(path.join(root, `release-${stage}`)))
      await new Promise(resolve => setTimeout(resolve, 20));
    fs.writeFileSync(path.join(root, `continued-${stage}`), String(process.pid));
  }
  await barrier('after-admission');
  const lock = { repo, pid: process.pid, 'lock-id': runtime.ticket,
    'root-dir': runtime.root, ticket: runtime.ticket, generation: runtime.generation, 'owner-source': owner, storage };
  const graphDir = runtime.graphDir;
  await lifecycle.withLease(runtime, 'lock', () => {
    lifecycle.checkAdmission(runtime);
    fs.writeFileSync(path.join(graphDir, 'db-worker.lock'), JSON.stringify(lock));
    fs.writeFileSync(path.join(graphDir, 'db.sqlite-wal'), 'preserved');
  });
  await barrier('before-publication');
  const server = http.createServer((request, response) => {
    if (request.url === '/healthz') {
      // Simulate a published worker that is still alive after sleep/resume but
      // never answers health checks, matching a frozen or reset localhost socket.
      if (mode === 'ready-then-hang' && fs.existsSync(path.join(root, 'hang-health'))) return;
      response.end(JSON.stringify({ ...lock, 'root-dir': runtime.root, host: '127.0.0.1',
        port: server.address().port, status: 'ready',
        ...(option('--health-field') ? { [option('--health-field')]: JSON.parse(option('--health-value')) } : {}) }));
    } else if (request.url === '/v1/shutdown') {
      response.end('{}');
      if (mode === 'stubborn') {
        fs.unlinkSync(path.join(graphDir, 'db-worker.lock'));
        fs.writeFileSync(path.join(runtime.root, 'server-list'), '');
      } else {
        fs.writeFileSync(path.join(root, 'close-under-lease.json'), JSON.stringify(lifecycle.snapshot(storage, repo)));
        lifecycle.recordStop(runtime, mode === 'close-error' ? Error('close failed') : null);
        server.close(() => process.exit(mode === 'close-error' ? 1 : 0));
      }
    } else {
      response.statusCode = 404;
      response.end();
    }
  });
  process.on('SIGTERM', () => {});
  server.listen(0, '127.0.0.1', async () => {
    try {
      await lifecycle.publish(runtime, lock, server.address().port, () => {
        fs.appendFileSync(path.join(runtime.root, 'server-list'), `${process.pid} ${server.address().port}\n`);
      });
      if (process.send) process.send({ ready: true });
    } catch (error) { console.error(error); process.exit(1); }
  });
})().catch(error => { console.error(error); process.exit(1); });
