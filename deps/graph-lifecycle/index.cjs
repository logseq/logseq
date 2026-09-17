'use strict';

// Node-only lifecycle protocol shared by Electron, the CLI, and graph workers.
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const cp = require('node:child_process');
const http = require('node:http');

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const id = () => crypto.randomUUID();
function fail(message, code = 'server-stop-failed') {
  throw Object.assign(new Error(message), { code });
}
function readJSON(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch (error) { if (error.code === 'ENOENT') return null; throw error; }
}
function writeJSON(file, value) {
  const temporary = `${file}.${id()}.tmp`;
  try {
    fs.writeFileSync(temporary, JSON.stringify(value), { flag: 'wx' });
    fs.renameSync(temporary, file);
  } finally { fs.rmSync(temporary, { force: true }); }
}
function graphName(repo) {
  if (typeof repo !== 'string' || !repo) fail('repo is required', 'missing-repo');
  return repo.replace(/^logseq_db_/, '');
}
function encodeGraph(repo) {
  return encodeURIComponent(graphName(repo)).replace(/%20/g, ' ').replace(/~/g, '%7E').replace(/%/g, '~');
}
function canonicalRoot(root) {
  if (typeof root !== 'string' || !root) fail('root-dir is required', 'missing-root-dir');
  return fs.realpathSync(root.startsWith('~/') ? path.join(os.homedir(), root.slice(2)) : root);
}
function resolveStorage(root, graphsDir) {
  fs.mkdirSync(root, { recursive: true });
  root = canonicalRoot(root);
  if (typeof graphsDir !== 'string' || !graphsDir) fail('graphs-dir is required', 'missing-graphs-dir');
  fs.mkdirSync(graphsDir, { recursive: true });
  graphsDir = canonicalRoot(graphsDir);
  const storeId = crypto.createHash('sha256').update(graphsDir).digest('hex');
  const lifecycleDir = path.join(path.dirname(graphsDir), '.graph-lifecycle', storeId);
  fs.mkdirSync(lifecycleDir, { recursive: true });
  return { root, graphsDir, lifecycleDir };
}
function context(storage, repo) {
  const { root, graphsDir, lifecycleDir } = storage;
  if (!root || !graphsDir || !lifecycleDir) fail('Canonical storage context is required');
  repo = graphName(repo);
  const dir = path.join(lifecycleDir, encodeGraph(repo));
  fs.mkdirSync(dir, { recursive: true });
  return { root, graphsDir, lifecycleDir, repo, dir, graphDir: path.join(graphsDir, encodeGraph(repo)),
    stateFile: path.join(dir, 'state.json') };
}
function snapshot(storage, repo) {
  return readJSON(path.join(storage.lifecycleDir, encodeGraph(repo), 'state.json'));
}
function sameStorage(ctx, value) {
  return value && value.graphsDir && value.lifecycleDir
    && canonicalRoot(value.graphsDir) === ctx.graphsDir
    && canonicalRoot(value.lifecycleDir) === ctx.lifecycleDir;
}

// PID existence deliberately does not establish OS process-instance identity.
function pidExists(pid) {
  if (!Number.isSafeInteger(pid) || pid <= 0) fail('Invalid PID');
  try { process.kill(pid, 0); return true; }
  catch (error) { if (error.code === 'ESRCH') return false; throw error; }
}
function signalProcess(pid, signal) {
  if (pid === process.pid) fail('Cannot stop the calling process');
  if (!pidExists(pid)) return;
  try { process.kill(pid, signal); }
  catch (error) { if (error.code !== 'ESRCH') throw error; }
}

async function acquireLease(ctx, operation) {
  const { DatabaseSync } = require('node:sqlite');
  const db = new DatabaseSync(path.join(ctx.dir, 'lease.sqlite'));
  const deadline = Date.now() + 30000;
  let acquired = false;
  try {
    for (;;) {
      try { db.exec('BEGIN IMMEDIATE'); acquired = true; break; }
      catch (error) {
        if (error.errcode !== 5 || Date.now() >= deadline) throw error;
        await sleep(25);
      }
    }
    const current = state(ctx);
    const previous = current.owner;
    if (previous && pidExists(previous.pid)) fail('Lifecycle owner remains alive');
    const owner = { id: id(), pid: process.pid, operation };
    current.owner = owner;
    writeJSON(ctx.stateFile, current);
    let released = false;
    return () => {
      if (released) return;
      released = true;
      try {
        // The action may have replaced the generation or advanced deletion state.
        const latest = readJSON(ctx.stateFile);
        if (latest?.owner?.id !== owner.id) fail('Lifecycle lease ownership changed');
        delete latest.owner;
        writeJSON(ctx.stateFile, latest);
      } finally {
        try { db.exec('COMMIT'); } finally { db.close(); }
      }
    };
  } catch (error) {
    if (acquired) db.exec('ROLLBACK');
    db.close();
    throw error;
  }
}
async function withLease(ctx, operation, action) {
  const release = await acquireLease(ctx, operation);
  try { return await action(); } finally { release(); }
}
function state(ctx) {
  let value = readJSON(ctx.stateFile);
  if (!value) {
    value = { generation: id(), phase: fs.existsSync(ctx.graphDir) ? 'available' : 'absent', workers: [] };
    writeJSON(ctx.stateFile, value);
  }
  return value;
}
function requireAvailable(ctx, current, generation) {
  if (generation && generation !== current.generation) fail('Graph generation changed', 'graph-not-exists');
  if (current.phase !== 'available' || !fs.existsSync(ctx.graphDir)) fail('Graph is absent or stopped by deletion', 'graph-not-exists');
}
async function createGraph(storage, repo) {
  const ctx = context(storage, repo);
  return withLease(ctx, 'create', () => {
    const current = state(ctx);
    if (current.phase === 'available' && fs.existsSync(ctx.graphDir)) return current.generation;
    if (current.deletion && !current.deletion.moved && fs.existsSync(ctx.graphDir))
      fail('Graph deletion must finish before recreation');
    if (current.workers.some(worker => pidExists(worker.pid))) fail('Graph still has a live worker');
    fs.mkdirSync(ctx.graphDir, { recursive: true });
    const next = { generation: id(), phase: 'available', workers: [], owner: current.owner };
    writeJSON(ctx.stateFile, next);
    return next.generation;
  });
}
function runtimeFile(ctx, ticket) {
  if (!/^[\w-]+$/.test(ticket)) fail('Invalid admission ticket');
  return path.join(ctx.dir, `runtime-${ticket}.json`);
}
async function admit({ storage, repo, ticket, generation, owner }) {
  const ctx = context(storage, repo);
  if (!owner) fail('Worker owner is required');
  return withLease(ctx, 'admit', () => {
    const current = state(ctx);
    requireAvailable(ctx, current, generation);
    let record;
    if (ticket) {
      record = current.workers.find(worker => worker.ticket === ticket);
      if (!record || record.owner !== owner || record.pid !== process.pid)
        fail('Worker admission generation or process identity changed');
      validateRegistration(ctx, current, record);
    } else {
      record = runtimeRecord({ ...ctx, ticket: id(), generation: current.generation, pid: process.pid, owner });
      current.workers.push(record);
      writeJSON(ctx.stateFile, current);
    }
    return { ...ctx, ...record };
  });
}
async function publish(runtime, lock, port, exposeReady) {
  return withLease(runtime, 'publish', () => {
    checkAdmission(runtime);
    validateLock(runtime, lock, runtime);
    writeJSON(runtimeFile(runtime, runtime.ticket), { ...runtimeRecord(runtime), lock, port, phase: 'ready' });
    // Publish the endpoint and readiness within the same admission check.
    exposeReady();
  });
}
function runtimeRecord(runtime) {
  const { ticket, generation, pid, owner, root, graphsDir, lifecycleDir, repo } = runtime;
  return { ticket, generation, pid, owner, root, graphsDir, lifecycleDir, repo };
}
function checkAdmission(runtime) {
  const current = readJSON(runtime.stateFile);
  requireAvailable(runtime, current, runtime.generation);
  if (!registered(current, runtime)) fail('Worker admission registration changed', 'server-start-failed');
}
function registered(current, runtime) {
  return current.workers.some(record => Object.entries(runtimeRecord(runtime))
    .every(([key, value]) => record[key] === value));
}
function recordStop(runtime, error) {
  const file = runtimeFile(runtime, runtime.ticket);
  const previous = readJSON(file);
  writeJSON(file, { ...(previous || runtimeRecord(runtime)), phase: error ? 'close-error' : 'closed',
    error: error ? String(error.message || error) : null });
}
function abortAdmission(runtime, error) {
  if (registered(readJSON(runtime.stateFile), runtime)) recordStop(runtime, error);
}
function entries(root) {
  let raw;
  try { raw = fs.readFileSync(path.join(root, 'server-list'), 'utf8'); }
  catch (error) { if (error.code === 'ENOENT') return []; throw error; }
  return raw.split('\n').filter(line => line.trim()).map(line => {
    const match = line.trim().match(/^(\d+)\s+(\d+)$/);
    if (!match) fail('Invalid server publication');
    return { pid: Number(match[1]), port: Number(match[2]) };
  });
}
function request(port, endpoint, method = 'GET', headers = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request({ hostname: '127.0.0.1', port, path: endpoint, method, headers }, res => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', chunk => { body += chunk; });
      res.on('end', () => { clearTimeout(timer); resolve({ status: res.statusCode, body }); });
      res.on('error', reject);
    });
    const timer = setTimeout(() => req.destroy(Error('Worker request timeout')), 1000);
    req.on('error', error => { clearTimeout(timer); reject(error); });
    req.end();
  });
}
function transientRequestError(error) {
  return !!error && (['ECONNREFUSED', 'ECONNRESET'].includes(error.code)
    || error.message === 'Worker request timeout');
}
function validateRegistration(ctx, current, record) {
  if (!Number.isSafeInteger(record.pid) || record.pid <= 0 || !record.ticket || !record.owner
      || !record.root || record.generation !== current.generation || record.repo !== ctx.repo
      || record.graphsDir !== ctx.graphsDir || record.lifecycleDir !== ctx.lifecycleDir)
    fail('Invalid worker registration');
}
function readRuntime(ctx, record) {
  const runtime = readJSON(runtimeFile(ctx, record.ticket));
  if (runtime && Object.entries(runtimeRecord(record)).some(([key, value]) => runtime[key] !== value))
    fail('Worker runtime identity differs from registration');
  return runtime;
}
async function health(ctx, target, port) {
  const response = await request(port, '/healthz');
  const value = JSON.parse(response.body);
  if (![200, 503].includes(response.status) || value.pid !== target.pid || value.port !== port
      || !sameStorage(ctx, value.storage) || graphName(value.repo) !== ctx.repo
      || value.host !== '127.0.0.1' || value.ticket !== target.ticket
      || value.generation !== target.generation || value['owner-source'] !== target.owner
      || !target.lock || value['lock-id'] !== target.lock['lock-id']) fail('Worker endpoint identity mismatch');
  return value;
}
function validateLock(ctx, lock, target) {
  if (graphName(lock.repo) !== ctx.repo || lock.pid !== target.pid
      || !lock['lock-id'] || !sameStorage(ctx, lock.storage)
      || lock['owner-source'] !== target.owner || lock.ticket !== target.ticket
      || lock.generation !== target.generation
      || (target.lock && lock['lock-id'] !== target.lock['lock-id'])) fail('Graph lock identity mismatch');
}
async function discover(ctx, current) {
  const targets = new Map();
  for (const record of current.workers) {
    validateRegistration(ctx, current, record);
    if (targets.has(record.pid)) fail('Duplicate worker registration');
    const target = { ...record, ...readRuntime(ctx, record) };
    if (target.lock) validateLock(ctx, target.lock, target);
    targets.set(record.pid, target);
  }
  const lock = readJSON(path.join(ctx.graphDir, 'db-worker.lock'));
  const attachLock = candidate => {
    const target = targets.get(candidate.pid);
    if (target) { validateLock(ctx, candidate, target); target.lock = candidate; }
    else if (pidExists(candidate.pid)) fail('Graph lock has an unregistered live owner');
  };
  if (lock) attachLock(lock);
  const unlinked = path.join(ctx.graphsDir, 'Unlinked graphs');
  if (fs.existsSync(unlinked) && fs.statSync(unlinked).isDirectory()) {
    for (const directory of fs.readdirSync(unlinked, { withFileTypes: true })) {
      if (!directory.isDirectory()) continue;
      const moved = readJSON(path.join(unlinked, directory.name, 'db-worker.lock'));
      if (moved && graphName(moved.repo) === ctx.repo) attachLock(moved);
    }
  }
  const probes = [];
  for (const root of new Set([ctx.root, ...current.workers.map(record => record.root)])) {
    for (const candidate of entries(root)) {
      if (!pidExists(candidate.pid)) continue;
      const target = targets.get(candidate.pid);
      if (target) {
        if (target.port && target.port !== candidate.port) fail('Worker publication identity mismatch');
        target.port = candidate.port;
      } else probes.push(async () => {
        let value;
        try { value = JSON.parse((await request(candidate.port, '/healthz')).body); }
        catch (error) {
          if (!(error instanceof SyntaxError) && !transientRequestError(error)) throw error;
        }
        if (value?.repo && graphName(value.repo) === ctx.repo
            && (!value.storage || sameStorage(ctx, value.storage)))
          fail('Published graph worker is unregistered');
      });
    }
  }
  const results = await Promise.allSettled(probes.map(probe => probe()));
  for (const result of results) if (result.status === 'rejected') throw result.reason;
  return { targets: [...targets.values()], lock };
}
async function removeEntries(root, removed) {
  const lockFile = path.join(root, 'server-list.lock');
  const owner = { pid: process.pid, 'lock-id': id() };
  const deadline = Date.now() + 2000;
  for (;;) {
    try { fs.writeFileSync(lockFile, JSON.stringify(owner), { flag: 'wx' }); break; }
    catch (error) {
      if (error.code !== 'EEXIST') throw error;
      const previous = readJSON(lockFile);
      if (previous && !pidExists(previous.pid)) {
        if (readJSON(lockFile)?.['lock-id'] === previous['lock-id']) fs.unlinkSync(lockFile);
      }
      if (Date.now() >= deadline) fail('Timed out acquiring server-list lock');
      await sleep(25);
    }
  }
  try {
    const retained = entries(root).filter(entry => !removed.some(target => target.pid === entry.pid && target.port === entry.port));
    const file = path.join(root, 'server-list');
    const temporary = `${file}.${id()}.tmp`;
    try {
      fs.writeFileSync(temporary, retained.map(entry => `${entry.pid} ${entry.port}\n`).join(''));
      fs.renameSync(temporary, file);
    } finally { fs.rmSync(temporary, { force: true }); }
  } finally {
    if (readJSON(lockFile)?.['lock-id'] !== owner['lock-id']) fail('Server-list lock ownership changed');
    fs.unlinkSync(lockFile);
  }
}
async function waitExit(pid, milliseconds) {
  const deadline = Date.now() + milliseconds;
  do {
    if (!pidExists(pid)) return true;
    await sleep(50);
  } while (Date.now() < deadline);
  return !pidExists(pid);
}
async function terminate(ctx, target, deleting) {
  if (!pidExists(target.pid)) return;
  if (target.pid === process.pid) fail('Cannot stop the calling process');
  let responsive = false;
  if (target.port) {
    try {
      await health(ctx, target, target.port);
      responsive = true;
    } catch (error) {
      if (!transientRequestError(error)) throw error;
    }
  }
  await shutdownAndWait(ctx, target, deleting, responsive);
}
async function shutdownAndWait(ctx, target, deleting, responsive) {
  if (target.pid === process.pid) fail('Cannot stop the calling process');
  if (!pidExists(target.pid)) return;
  if (responsive) {
    try {
      const response = await request(target.port, '/v1/shutdown', 'POST',
        deleting ? { 'x-logseq-graph-deleting': 'true' } : {});
      if (response.status !== 200) fail('Worker rejected shutdown');
    } catch (error) {
      if (!transientRequestError(error)) throw error;
    }
  }
  for (const [stage, milliseconds] of [['graceful', 5000], ['SIGTERM', 1000], ['SIGKILL', 2000]]) {
    if (stage !== 'graceful') signalProcess(target.pid, stage);
    process.stderr.write(`[graph-lifecycle] ${JSON.stringify({ event: 'worker-termination',
      repo: ctx.repo, graphsDir: ctx.graphsDir, generation: target.generation,
      ticket: target.ticket, pid: target.pid, stage })}\n`);
    if (await waitExit(target.pid, milliseconds)) return;
  }
  fail(`Timed out stopping worker ${target.pid}`, 'server-stop-timeout');
}

// Upgrade cleanup validates the running HTTP endpoint against its graph lock.
// It never admits an older worker into the current lifecycle protocol.
async function stopOutdatedWorkers(storage, revision, repo) {
  if (typeof revision !== 'string' || !revision) fail('Build revision is required');
  const scoped = repo === undefined ? null : context(storage, repo);
  const targetLock = scoped && readJSON(path.join(scoped.graphDir, 'db-worker.lock'));
  const candidates = entries(storage.root).filter(target => !scoped || target.pid === targetLock?.pid);
  const results = await Promise.allSettled(candidates.map(async target => {
    if (!pidExists(target.pid)) {
      await removeEntries(storage.root, [target]);
      return;
    }
    const probe = async () => {
      const response = await request(target.port, '/healthz');
      const value = JSON.parse(response.body);
      if (![200, 503].includes(response.status) || value.pid !== target.pid
          || value.port !== target.port || value.host !== '127.0.0.1'
          || typeof value.revision !== 'string' || !value.revision
          || !['cli', 'electron'].includes(value['owner-source'])
          || typeof value.repo !== 'string' || !value.repo)
        fail('Outdated worker endpoint identity mismatch');
      return value;
    };
    const value = await probe();
    if (scoped && graphName(value.repo) !== scoped.repo) fail('Outdated worker target graph mismatch');
    if (canonicalRoot(value['root-dir']) !== storage.root
        || (value.storage && !sameStorage(storage, value.storage))) return;
    if (value.revision === revision) return;
    const ctx = context(storage, value.repo);
    return withLease(ctx, 'upgrade', async () => {
      if (!pidExists(target.pid)) return;
      const confirmed = await probe();
      for (const key of ['pid', 'port', 'host', 'repo', 'root-dir', 'lock-id', 'owner-source', 'revision']) {
        if (confirmed[key] !== value[key]) fail('Outdated worker identity changed before shutdown');
      }
      const lockFile = path.join(ctx.graphDir, 'db-worker.lock');
      const lock = readJSON(lockFile);
      if (!lock || lock.pid !== target.pid || lock.repo !== value.repo
          || !lock['lock-id'] || lock['owner-source'] !== value['owner-source']
          || (value['lock-id'] !== undefined && lock['lock-id'] !== value['lock-id']))
        fail('Outdated worker graph lock identity mismatch');
      await shutdownAndWait(ctx, { ...target, ticket: value.ticket, generation: value.generation }, false, true);
      removeMatchingLock(lockFile, lock);
      await removeEntries(storage.root, [target]);
      const current = state(ctx);
      for (const record of current.workers.filter(record => record.pid === target.pid)) {
        const runtime = readRuntime(ctx, record);
        if (runtime?.error) fail(`Worker close failed: ${runtime.error}`);
        fs.rmSync(runtimeFile(ctx, record.ticket), { force: true });
      }
      current.workers = current.workers.filter(record => record.pid !== target.pid);
      writeJSON(ctx.stateFile, current);
      return target;
    });
  }));
  const errors = results.filter(result => result.status === 'rejected').map(result => result.reason);
  if (errors.length) throw new AggregateError(errors, `Outdated worker cleanup failed: ${errors.map(error => error.message).join('; ')}`);
  return results.map(result => result.value).filter(Boolean);
}
function removeMatchingLock(file, lock) {
  const actual = readJSON(file);
  if (!actual) return;
  if (actual.pid !== lock.pid || actual['lock-id'] !== lock['lock-id'] || actual.repo !== lock.repo)
    fail('Graph lock identity changed during cleanup');
  if (pidExists(actual.pid)) fail('Cannot remove a live graph lock');
  fs.unlinkSync(file);
}
async function cleanup(ctx, current, targets, lock) {
  for (const target of targets) if (pidExists(target.pid)) fail('Worker remains alive during cleanup');
  if (lock) removeMatchingLock(path.join(ctx.graphDir, 'db-worker.lock'), lock);
  else if (readJSON(path.join(ctx.graphDir, 'db-worker.lock'))) fail('Unexpected graph lock appeared during cleanup');
  const unlinked = path.join(ctx.graphsDir, 'Unlinked graphs');
  if (fs.existsSync(unlinked) && fs.statSync(unlinked).isDirectory()) {
    for (const directory of fs.readdirSync(unlinked, { withFileTypes: true })) {
      if (!directory.isDirectory()) continue;
      const file = path.join(unlinked, directory.name, 'db-worker.lock');
      const moved = readJSON(file);
      if (moved && graphName(moved.repo) === ctx.repo && targets.some(target => target.pid === moved.pid
          && target.lock?.['lock-id'] === moved['lock-id'])) removeMatchingLock(file, moved);
    }
  }
  for (const root of new Set([ctx.root, ...targets.map(target => target.root)]))
    await removeEntries(root, targets);
  for (const target of targets) {
    const record = readJSON(runtimeFile(ctx, target.ticket));
    if (record?.error && !current.acknowledgedErrors?.includes(target.ticket)) {
      current.acknowledgedErrors = [...(current.acknowledgedErrors || []), target.ticket];
      writeJSON(ctx.stateFile, current);
      fail(`Worker close failed: ${record.error}`);
    }
  }
  for (const target of targets) fs.rmSync(runtimeFile(ctx, target.ticket), { force: true });
}
async function stopUnderLease(ctx, current, deleting, owner) {
  const { targets, lock } = await discover(ctx, current);
  if (!deleting) {
    for (const target of targets) {
      if (!pidExists(target.pid)) continue;
      const source = target.owner;
      if (source !== owner && !(owner === 'cli' && source === 'unknown'))
        fail('Server is owned by another process', 'server-owned-by-other');
    }
  }
  for (const target of targets) await terminate(ctx, target, deleting);
  await cleanup(ctx, current, targets, lock);
  current.workers = [];
  writeJSON(ctx.stateFile, current);
  return targets.length > 0 || !!lock;
}
async function stopGraph(storage, repo, owner) {
  const ctx = context(storage, repo);
  return withLease(ctx, 'stop', async () => {
    const current = state(ctx);
    const stopped = await stopUnderLease(ctx, current, false, owner);
    if (!stopped) fail('Server is not running', 'server-not-found');
    return { repo };
  });
}
function directoryIdentity(directory) {
  try {
    const info = fs.statSync(directory);
    return { dev: info.dev, ino: info.ino };
  } catch (error) { if (error.code === 'ENOENT') return null; throw error; }
}
function sameDirectory(a, b) {
  return a && b && a.dev === b.dev && a.ino === b.ino;
}
async function deleteGraph(storage, repo, commit) {
  const ctx = context(storage, repo);
  const observed = snapshot(storage, repo);
  return withLease(ctx, 'delete', async () => {
    const current = state(ctx);
    if (observed && observed.generation !== current.generation)
      fail('Graph generation changed', 'graph-not-exists');
    if (observed?.deletion && observed.deletion.id !== current.deletion?.id)
      fail('Graph deletion operation changed', 'graph-not-exists');
    if (current.phase === 'deleted') return { existed: false, destination: null };
    if (!current.deletion) current.deletion = { id: id(), generation: current.generation, moved: false };
    const operation = current.deletion;
    if (operation.generation !== current.generation) fail('Graph deletion generation changed', 'graph-not-exists');
    current.phase = 'deleting';
    writeJSON(ctx.stateFile, current);
    try {
      // The persisted move intent closes the crash window between rename and state publication.
      if (operation.destination && !operation.moved) {
        const source = directoryIdentity(ctx.graphDir);
        const destination = directoryIdentity(operation.destination);
        if (!source && sameDirectory(operation.source, destination)) operation.moved = true;
        else if (!sameDirectory(operation.source, source) || destination)
          fail('Graph directory identity changed', 'graph-not-exists');
      }
      if (operation.moved) {
        if (fs.existsSync(ctx.graphDir) || !sameDirectory(operation.source, directoryIdentity(operation.destination)))
          fail('Graph directory identity changed', 'graph-not-exists');
      } else {
        await stopUnderLease(ctx, current, true);
        const source = directoryIdentity(ctx.graphDir);
        operation.existed = !!source;
        if (source) {
          if (!operation.destination) {
            const parent = path.join(ctx.graphsDir, 'Unlinked graphs');
            fs.mkdirSync(parent, { recursive: true });
            const name = encodeGraph(repo);
            let destination = path.join(parent, name);
            for (let suffix = 1; fs.existsSync(destination); suffix++) destination = path.join(parent, `${name}-${suffix}`);
            Object.assign(operation, { source, destination });
            writeJSON(ctx.stateFile, current);
          }
          fs.renameSync(ctx.graphDir, operation.destination);
          operation.moved = true;
        }
      }
      writeJSON(ctx.stateFile, current);
      if (operation.existed && commit) {
        const result = await commit();
        if (!result.ok) fail(result.error);
      }
      current.phase = 'deleted';
      delete current.error;
      writeJSON(ctx.stateFile, current);
      return { existed: operation.existed, destination: operation.destination || null };
    } catch (error) {
      current.phase = 'deletion-failed';
      current.error = String(error.message || error);
      writeJSON(ctx.stateFile, current);
      throw error;
    }
  });
}
async function cancelStartup(ctx, record) {
  return withLease(ctx, 'cancel-start', async () => {
    const current = state(ctx);
    if (current.generation !== record.generation || !registered(current, record)) {
      if (pidExists(record.pid)) fail('Startup registration changed while its worker remains alive');
      return;
    }
    const { targets, lock } = await discover(ctx, current);
    const target = targets.find(candidate => candidate.ticket === record.ticket);
    if (lock && lock.pid !== record.pid) fail('Startup lock belongs to another worker');
    await terminate(ctx, target, false);
    await cleanup(ctx, current, [target], lock);
    current.workers = current.workers.filter(candidate => candidate.ticket !== record.ticket);
    writeJSON(ctx.stateFile, current);
  });
}
async function startGraph(options) {
  return startGraphAttempt(options, false);
}
async function startGraphAttempt({ storage, repo, script, owner = 'cli', createEmpty = false, generation, extraArgs = [] }, replaced) {
  const ctx = context(storage, repo);
  // Capture the instance before queuing for exclusion, not after a delete/recreate.
  const observed = snapshot(storage, repo)?.generation;
  let created;
  try {
    const record = await withLease(ctx, 'start', async () => {
      const current = state(ctx);
      requireAvailable(ctx, current, generation || observed);
      const { targets, lock } = await discover(ctx, current);
      const live = targets.filter(target => pidExists(target.pid));
      if (live.length > 1) fail('Multiple live graph workers', 'server-start-failed');
      if (live.length) {
        const target = live[0];
        if (!lock && target.port) fail('Ready worker has no canonical graph lock', 'server-start-failed');
        if (lock) validateLock(ctx, lock, target);
        return target;
      }
      await cleanup(ctx, current, targets, lock);
      const ticket = id();
      const args = [script, '--repo', `logseq_db_${ctx.repo}`, '--root-dir', ctx.root, '--graphs-dir', ctx.graphsDir, '--lifecycle-dir', ctx.lifecycleDir, '--owner-source', owner,
        '--admission-ticket', ticket, '--graph-generation', current.generation];
      if (createEmpty) args.push('--create-empty-db');
      args.push(...extraArgs);
      const env = { ...process.env, ELECTRON_RUN_AS_NODE: '1' };
      if (owner === 'electron' && !extraArgs.includes('--embedding-endpoint')) delete env.LOGSEQ_EMBEDDINGS_URL;
      const child = cp.spawn(process.execPath, args, { detached: owner !== 'electron',
        stdio: 'ignore', env });
      child.on('error', () => {}); // Readiness or the missing PID reports spawn failure.
      const pid = child.pid;
      if (!pid || !pidExists(pid)) fail('Worker failed to spawn', 'server-start-failed');
      child.unref();
      const spawned = runtimeRecord({ ...ctx, ticket, generation: current.generation, pid, owner });
      current.workers = [spawned];
      try { writeJSON(ctx.stateFile, current); }
      catch (error) {
        // An unregistered child must exit before the parent releases admission exclusion.
        signalProcess(pid, 'SIGKILL');
        if (!await waitExit(pid, 2000)) fail('Unregistered worker did not exit');
        throw error;
      }
      created = spawned;
      return spawned;
    });
    const deadline = Date.now() + 30000;
    let transients = 0;
    for (;;) {
      checkAdmission({ ...ctx, ...record });
      if (!pidExists(record.pid)) fail('Worker exited before becoming ready', 'server-start-failed');
      const runtime = readRuntime(ctx, record);
      const port = runtime?.port || record.port;
      if (port) {
        const lock = readJSON(path.join(ctx.graphDir, 'db-worker.lock'));
        if (!lock) fail('Worker has no canonical graph lock', 'server-start-failed');
        validateLock(ctx, lock, { ...record, lock: runtime?.lock || record.lock });
        try {
          const value = await health(ctx, { ...record, lock }, port);
          transients = 0;
          if (value.status === 'ready') return { ...value, generation: record.generation };
        } catch (error) {
          if (!transientRequestError(error)) throw error;
          // A published worker that no longer answers is unresponsive, not still
          // starting. Replace it instead of failing recovery after sleep/resume.
          if (!created && !replaced && ++transients >= 2) {
            try { await stopGraph(storage, repo, owner); }
            catch (stopError) { if (stopError.code !== 'server-not-found') throw stopError; }
            return startGraphAttempt({ storage, repo, script, owner, createEmpty, generation, extraArgs }, true);
          }
        }
      }
      if (Date.now() >= deadline) fail('Worker failed to become ready', 'server-start-failed');
      await sleep(50);
    }
  } catch (error) {
    if (created) {
      try { await cancelStartup(ctx, created); }
      catch (cleanupError) {
        throw Object.assign(new AggregateError([error, cleanupError],
          `${error.message}; startup cleanup failed: ${cleanupError.message}`), { code: 'server-start-failed' });
      }
    }
    throw error;
  }
}

function observe(storage, repo, generation, onChange) {
  const ctx = context(storage, repo);
  let closed = false;
  let previous;
  const inspect = () => {
    if (closed) return;
    const current = readJSON(ctx.stateFile);
    if (!current || current.generation !== generation || current.phase !== 'available') {
      const key = JSON.stringify([current?.generation, current?.phase]);
      if (key !== previous) { previous = key; onChange(current); }
      if (current?.phase !== 'deleting') close();
    }
  };
  const watcher = fs.watch(ctx.dir, (_, file) => { if (file === 'state.json') inspect(); });
  const timer = setInterval(inspect, 250);
  watcher.on('error', error => onChange({ phase: 'observation-failed', error: error.message }));
  const close = () => { closed = true; watcher.close(); clearInterval(timer); };
  inspect();
  return close;
}

module.exports = { resolveStorage, context, snapshot, pidExists, withLease, createGraph, admit, publish,
  checkAdmission, recordStop, abortAdmission, startGraph, stopGraph, deleteGraph, observe, stopOutdatedWorkers };
