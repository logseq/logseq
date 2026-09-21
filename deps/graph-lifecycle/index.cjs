'use strict';

// Node-only lifecycle protocol shared by Electron, the CLI, and graph workers.
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const cp = require('node:child_process');
const http = require('node:http');
const { ownershipPath, acquireOwnership } = require('./ownership.cjs');
const PROTOCOL = 'sqlite-v1';
const ownership = new WeakMap();
const children = new Map();

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
// One readiness poll is a 50ms sleep plus a health request capped at 1s; anything longer is a clock jump.
const READY_POLL_MAX_ELAPSED = 2000;
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
  const name = repo.trim().replace(/^logseq_db_/, '').trim();
  if (!name) fail('repo is required', 'missing-repo');
  return name;
}
function encodeGraph(repo) {
  return encodeURIComponent(graphName(repo)).replace(/%20/g, ' ').replace(/~/g, '%7E').replace(/%/g, '~');
}
function canonicalGraphDirectory(name) {
  let decoded;
  try { decoded = decodeURIComponent(name.replace(/~/g, '%')); }
  catch (error) { if (error instanceof URIError) return null; throw error; }
  if (!decoded.trim() || decoded === 'Unlinked graphs' || decoded === 'backup'
      || decoded.startsWith('logseq_db_') || decoded.startsWith('logseq_local_')) return null;
  return encodeGraph(decoded) === name ? decoded : null;
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

async function acquireLease(ctx, operation, checkWaiting) {
  const { DatabaseSync } = require('node:sqlite');
  const db = new DatabaseSync(path.join(ctx.dir, 'lease.sqlite'));
  const deadline = Date.now() + 30000;
  let acquired = false;
  try {
    for (;;) {
      if (checkWaiting) checkWaiting();
      try { db.exec('BEGIN IMMEDIATE'); acquired = true; break; }
      catch (error) {
        if (error.errcode !== 5 || Date.now() >= deadline) throw error;
        await sleep(25);
      }
    }
    const current = state(ctx);
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
async function withLease(ctx, operation, action, checkWaiting) {
  const release = await acquireLease(ctx, operation, checkWaiting);
  try { return await action(); } finally { release(); }
}
function state(ctx) {
  let value = readJSON(ctx.stateFile);
  if (value === null && !fs.existsSync(ctx.stateFile)) {
    value = { generation: id(), phase: fs.existsSync(ctx.graphDir) ? 'available' : 'absent', workers: [] };
    writeJSON(ctx.stateFile, value);
  }
  if (!value || !Array.isArray(value.workers) || typeof value.generation !== 'string' || typeof value.phase !== 'string')
    fail('Invalid lifecycle state');
  return value;
}
function requireAvailable(ctx, current, generation) {
  if (generation && generation !== current.generation) fail('Graph generation changed', 'graph-not-exists');
  if (current.phase !== 'available' || !fs.existsSync(ctx.graphDir)) fail('Graph is absent or stopped by deletion', 'graph-not-exists');
}
function ownershipAvailable(ctx) {
  let handle;
  try { handle = acquireOwnership(ctx); }
  catch (error) { if (error.code === 'repo-locked') return false; throw error; }
  handle.release();
  return true;
}
async function createGraph(storage, repo) {
  const ctx = context(storage, repo);
  return withLease(ctx, 'create', async () => {
    const current = state(ctx);
    if (current.phase === 'available' && fs.existsSync(ctx.graphDir)) return current.generation;
    if (current.deletion && !current.deletion.moved && fs.existsSync(ctx.graphDir))
      fail('Graph deletion must finish before recreation');
    await stopUnderLease(ctx, current, true);
    const handle = acquireOwnership(ctx);
    try {
      fs.mkdirSync(ctx.graphDir, { recursive: true });
      const next = { generation: id(), phase: 'available', workers: [], owner: current.owner };
      writeJSON(ctx.stateFile, next);
      return next.generation;
    } finally { handle.release(); }
  });
}
function runtimeFile(ctx, ticket) {
  if (!/^[\w-]+$/.test(ticket)) fail('Invalid admission ticket');
  return path.join(ctx.dir, `runtime-${ticket}.json`);
}
async function admit({ storage, repo, ticket, generation, owner }) {
  const ctx = context(storage, repo);
  if (!owner) fail('Worker owner is required');
  return withLease(ctx, 'admit', async () => {
    const current = state(ctx);
    requireAvailable(ctx, current, generation);
    await legacy.retireGraph(ctx, current);
    let record;
    if (ticket) {
      record = current.workers.find(worker => worker.ticket === ticket);
      if (!record || record.owner !== owner || record.pid !== process.pid)
        fail('Worker admission generation or process identity changed');
      validateRegistration(ctx, current, record);
    }
    const previous = ticket ? [] : (await discover(ctx, current)).targets;
    if (previous.some(pending)) fail('Graph ownership admission is pending', 'repo-locked');
    const handle = acquireOwnership(ctx);
    try {
      if (!record) {
        await cleanup(ctx, current, previous);
        record = runtimeRecord({ ...ctx, ticket: id(), generation: current.generation, pid: process.pid, owner,
          'ownership-protocol': PROTOCOL });
        current.workers = [record];
        writeJSON(ctx.stateFile, current);
      }
      const runtime = { ...ctx, ...record };
      writeJSON(runtimeFile(ctx, runtime.ticket), { ...record, phase: 'initializing' });
      ownership.set(runtime, handle);
      return runtime;
    } catch (error) { handle.release(); throw error; }
  }, ticket ? () => {
    const current = readJSON(ctx.stateFile);
    if (current?.generation !== generation || !current.workers.some(record => record.ticket === ticket && record.pid === process.pid))
      fail('Worker admission registration was revoked', 'server-start-failed');
  } : undefined);
}
function assertOwnership(runtime) {
  const handle = ownership.get(runtime);
  if (!handle) fail('Graph ownership handle is missing', 'repo-locked');
  handle.assert();
  const current = readJSON(runtime.stateFile);
  if (current.generation !== runtime.generation || !registered(current, runtime))
    fail('Graph ownership admission changed', 'repo-locked');
}
function releaseOwnership(runtime) {
  const handle = ownership.get(runtime);
  if (!handle) fail('Graph ownership handle is missing', 'repo-locked');
  handle.release();
}
async function publish(runtime, port, exposeReady) {
  return withLease(runtime, 'publish', () => {
    checkAdmission(runtime);
    assertOwnership(runtime);
    writeJSON(runtimeFile(runtime, runtime.ticket), { ...runtimeRecord(runtime), port, phase: 'ready' });
    exposeReady();
  });
}
function runtimeRecord(runtime) {
  const { ticket, generation, pid, owner, root, graphsDir, lifecycleDir, repo } = runtime;
  return { ticket, generation, pid, owner, root, graphsDir, lifecycleDir, repo,
    'ownership-protocol': runtime['ownership-protocol'] };
}
function checkAdmission(runtime) {
  const current = readJSON(runtime.stateFile);
  requireAvailable(runtime, current, runtime.generation);
  if (!registered(current, runtime)) fail('Worker admission registration changed', 'server-start-failed');
}
function pending(target) {
  return !target.phase && target.expires > Date.now() && pidExists(target.parent);
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
function validateRegistration(ctx, current, record) {
  if (!Number.isSafeInteger(record.pid) || record.pid <= 0 || !record.ticket || !record.owner
      || !record.root || record.generation !== current.generation || record.repo !== ctx.repo
      || record['ownership-protocol'] !== PROTOCOL
      || record.graphsDir !== ctx.graphsDir || record.lifecycleDir !== ctx.lifecycleDir)
    fail('Invalid worker registration');
}
function readRuntime(ctx, record) {
  const file = runtimeFile(ctx, record.ticket);
  const runtime = readJSON(file);
  if (fs.existsSync(file) && (!runtime || typeof runtime !== 'object' || Array.isArray(runtime)))
    fail('Invalid worker runtime metadata');
  if (runtime && Object.entries(runtimeRecord(record)).some(([key, value]) => runtime[key] !== value))
    fail('Worker runtime identity differs from registration');
  return runtime;
}
async function health(ctx, target, port) {
  const response = await request(port, '/healthz');
  const value = JSON.parse(response.body);
  if (![200, 503].includes(response.status) || value.pid !== target.pid || value.port !== port
      || !sameStorage(ctx, value.storage) || graphName(value.repo) !== ctx.repo
      || typeof value['root-dir'] !== 'string' || canonicalRoot(value['root-dir']) !== canonicalRoot(target.root)
      || typeof value.revision !== 'string' || !value.revision
      || value.host !== '127.0.0.1' || value.ticket !== target.ticket
      || value.generation !== target.generation || value['owner-source'] !== target.owner
      || target['ownership-protocol'] !== PROTOCOL || value['ownership-protocol'] !== PROTOCOL) fail('Worker endpoint identity mismatch');
  return value;
}
function ignorableDiscoveryError(error) {
  return error instanceof SyntaxError || ['ECONNREFUSED', 'ECONNRESET'].includes(error.code)
    || error.message === 'Worker request timeout';
}
// Routing observations live for one upgrade scan only. Shutdown still validates
// the current registration and endpoint under the graph's lease.
function publicationScan() {
  const roots = new Map();
  const probes = new Map();
  const grouped = new Map();
  const read = root => {
    if (!roots.has(root)) {
      const publications = entries(root);
      const byPid = new Map();
      for (const publication of publications) {
        if (!byPid.has(publication.pid)) byPid.set(publication.pid, []);
        byPid.get(publication.pid).push(publication);
      }
      roots.set(root, { publications, byPid });
    }
    return roots.get(root);
  };
  const probe = publication => {
    const key = `${publication.pid}:${publication.port}`;
    if (!probes.has(key)) probes.set(key, request(publication.port, '/healthz').then(response => JSON.parse(response.body)));
    return probes.get(key);
  };
  return {
    entries: root => read(root).publications,
    matching: (root, pid) => read(root).byPid.get(pid) || [],
    probe,
    async forGraph(root, repo) {
      if (!grouped.has(root)) grouped.set(root, (async () => {
        const groups = new Map();
        const results = await Promise.allSettled(read(root).publications.map(async candidate => {
          if (!pidExists(candidate.pid)) return;
          let value;
          try { value = await probe(candidate); }
          catch (error) { if (!ignorableDiscoveryError(error)) throw error; }
          if (value?.repo) {
            const name = graphName(value.repo);
            if (!groups.has(name)) groups.set(name, []);
            groups.get(name).push({ candidate, value });
          }
        }));
        for (const result of results) if (result.status === 'rejected') throw result.reason;
        return groups;
      })());
      return (await grouped.get(root)).get(repo) || [];
    },
  };
}
async function discover(ctx, current, scan, registeredOnly = false) {
  const targets = new Map();
  for (const record of current.workers) {
    validateRegistration(ctx, current, record);
    if (targets.has(record.pid)) fail('Duplicate worker registration');
    const target = { ...record, ...readRuntime(ctx, record) };
    targets.set(record.pid, target);
  }
  const attach = (target, candidate) => {
    if (target.port && target.port !== candidate.port) fail('Worker publication identity mismatch');
    target.port = candidate.port;
  };
  const checkUnregistered = value => {
    if (value?.repo && graphName(value.repo) === ctx.repo
        && (value.storage ? sameStorage(ctx, value.storage)
          : (!value['root-dir'] || canonicalRoot(value['root-dir']) === ctx.root)))
      fail('Published graph worker is unregistered');
  };
  const probes = [];
  for (const root of new Set([ctx.root, ...current.workers.map(record => record.root)])) {
    if (scan) {
      for (const target of targets.values()) {
        if (pidExists(target.pid)) for (const candidate of scan.matching(root, target.pid)) attach(target, candidate);
      }
      if (!registeredOnly) probes.push(async () => {
        for (const { candidate, value } of await scan.forGraph(root, ctx.repo))
          if (pidExists(candidate.pid) && !targets.has(candidate.pid)) checkUnregistered(value);
      });
    } else {
      for (const candidate of entries(root)) {
        if (!pidExists(candidate.pid)) continue;
        const target = targets.get(candidate.pid);
        if (target) attach(target, candidate);
        else probes.push(async () => {
          let value;
          try { value = JSON.parse((await request(candidate.port, '/healthz')).body); }
          catch (error) { if (!ignorableDiscoveryError(error)) throw error; }
          checkUnregistered(value);
        });
      }
    }
  }
  const results = await Promise.allSettled(probes.map(probe => probe()));
  for (const result of results) if (result.status === 'rejected') throw result.reason;
  return { targets: [...targets.values()] };
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
  if (ownershipAvailable(ctx)) {
    // Free ownership fences abandoned tickets, but a verified endpoint still has
    // to exit before management can complete a stop or filesystem mutation.
    if (target.port) {
      let responsive = false;
      try { await health(ctx, target, target.port); responsive = true; }
      catch (error) {
        if (!['ECONNREFUSED', 'ECONNRESET'].includes(error.code) && error.message !== 'Worker request timeout') throw error;
      }
      if (responsive) {
        await shutdownAndWait(ctx, target, deleting, true);
        return;
      }
    }
    const waiting = pending(target);
    if (waiting) {
      const latest = state(ctx);
      latest.workers = latest.workers.filter(record => record.ticket !== target.ticket);
      writeJSON(ctx.stateFile, latest);
    }
    const child = children.get(target.ticket);
    if (child && child.pid === target.pid) {
      signalProcess(target.pid, 'SIGTERM');
      if (!await waitExit(target.pid, 1000)) signalProcess(target.pid, 'SIGKILL');
      if (!await waitExit(target.pid, 2000)) fail('Startup worker did not exit');
    } else if (waiting && !await waitExit(target.pid, 5000)) {
      fail('Revoked startup worker did not exit', 'server-stop-timeout');
    }
    return;
  }
  if (target.pid === process.pid) fail('Cannot stop the calling process');
  let responsive = false;
  if (target.port) {
    try { await health(ctx, target, target.port); responsive = true; }
    catch (error) {
      if (!['ECONNREFUSED', 'ECONNRESET'].includes(error.code) && error.message !== 'Worker request timeout') throw error;
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
      if (!['ECONNREFUSED', 'ECONNRESET'].includes(error.code) && error.message !== 'Worker request timeout') throw error;
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

const legacy = require('./legacy-retirement.cjs')({ fail, readJSON, writeJSON, graphName, canonicalRoot,
  sameStorage, pidExists, entries, request, shutdownAndWait, removeEntries, runtimeFile, state });

async function stopOutdatedWorkers(storage, revision, repo) {
  if (typeof revision !== 'string' || !revision) fail('Build revision is required');
  const names = repo === undefined
    ? fs.readdirSync(storage.graphsDir, { withFileTypes: true }).filter(entry => entry.isDirectory())
      .map(entry => canonicalGraphDirectory(entry.name)).filter(name => name !== null)
    : [repo];
  const scan = publicationScan();
  const results = await Promise.allSettled(names.map(name => {
    const ctx = context(storage, name);
    return withLease(ctx, 'upgrade', async () => {
      const current = state(ctx);
      const retired = await legacy.retireGraph(ctx, current, scan);
      const { targets } = await discover(ctx, current, scan, repo !== undefined);
      const available = ownershipAvailable(ctx);
      for (const target of targets) {
        if (available && !pending(target)) {
          await terminate(ctx, target, false);
          await cleanup(ctx, current, [target]);
          current.workers = current.workers.filter(record => record.ticket !== target.ticket);
          writeJSON(ctx.stateFile, current);
          continue;
        }
        if (!pidExists(target.pid)) continue;
        if (!target.port) fail('Worker endpoint is not published; retry after initialization', 'server-start-failed');
        const value = await health(ctx, target, target.port);
        if (typeof value.revision !== 'string' || !value.revision) fail('Worker revision is missing');
        if (value.revision === revision) continue;
        await terminate(ctx, target, false);
        await cleanup(ctx, current, [target]);
        current.workers = current.workers.filter(record => record.ticket !== target.ticket);
        writeJSON(ctx.stateFile, current);
        retired.push(target);
      }
      return retired;
    });
  }));
  const errors = results.filter(result => result.status === 'rejected').map(result => result.reason);
  if (errors.length) throw new AggregateError(errors, `Outdated worker cleanup failed: ${errors.map(error => error.message).join('; ')}`);
  return results.flatMap(result => result.value);
}
async function cleanup(ctx, current, targets) {
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
  const retired = await legacy.retireGraph(ctx, current);
  const { targets } = await discover(ctx, current);
  const available = ownershipAvailable(ctx);
  if (!deleting) {
    for (const target of targets) {
      if (!pidExists(target.pid) || (available && !pending(target))) continue;
      const source = target.owner;
      if (source !== owner && !(owner === 'cli' && source === 'unknown'))
        fail('Server is owned by another process', 'server-owned-by-other');
    }
  }
  for (const target of targets) await terminate(ctx, target, deleting);
  const probe = acquireOwnership(ctx);
  probe.release();
  await cleanup(ctx, current, targets);
  current.workers = [];
  writeJSON(ctx.stateFile, current);
  return retired.length > 0 || targets.length > 0;
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
    let mutationOwnership;
    try {
      await stopUnderLease(ctx, current, true);
      mutationOwnership = acquireOwnership(ctx);
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
    } finally { if (mutationOwnership) mutationOwnership.release(); }
  });
}
async function cancelStartup(ctx, record) {
  return withLease(ctx, 'cancel-start', async () => {
    const current = state(ctx);
    if (current.generation !== record.generation || !registered(current, record)) {
      if (pidExists(record.pid)) fail('Startup registration changed while its worker remains alive');
      return;
    }
    const { targets } = await discover(ctx, current);
    const target = targets.find(candidate => candidate.ticket === record.ticket);
    await terminate(ctx, target, false);
    await cleanup(ctx, current, [target]);
    current.workers = current.workers.filter(candidate => candidate.ticket !== record.ticket);
    writeJSON(ctx.stateFile, current);
  });
}
async function startGraph({ storage, repo, script, owner = 'cli', createEmpty = false, generation, extraArgs = [] }) {
  const ctx = context(storage, repo);
  // Capture the instance before queuing for exclusion, not after a delete/recreate.
  const observed = snapshot(storage, repo)?.generation;
  let created;
  try {
    const record = await withLease(ctx, 'start', async () => {
      const current = state(ctx);
      requireAvailable(ctx, current, generation || observed);
      await legacy.retireGraph(ctx, current);
      const { targets } = await discover(ctx, current);
      const available = ownershipAvailable(ctx);
      const live = targets.filter(target => pidExists(target.pid) && (!available || pending(target)));
      if (!available && !live.length) fail('Graph ownership is locked without a registered worker', 'repo-locked');
      if (live.length > 1) fail('Multiple live graph workers', 'server-start-failed');
      if (live.length) return live[0];
      for (const target of targets) await terminate(ctx, target, false);
      await cleanup(ctx, current, targets);
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
      children.set(ticket, child);
      child.once('exit', () => children.delete(ticket));
      const spawned = { ...runtimeRecord({ ...ctx, ticket, generation: current.generation, pid, owner, 'ownership-protocol': PROTOCOL }), parent: process.pid, expires: Date.now() + 30000 };
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
    // The wall clock jumps across system sleep, so budget only the time each poll observed.
    let budget = 30000;
    let last = Date.now();
    for (;;) {
      checkAdmission({ ...ctx, ...record });
      if (!pidExists(record.pid)) fail('Worker exited before becoming ready', 'server-start-failed');
      const runtime = readRuntime(ctx, record);
      const port = runtime?.port || record.port;
      if (port) {
        const value = await health(ctx, record, port);
        if (value.status === 'ready') return { ...value, generation: record.generation };
      }
      if (budget <= 0) fail('Worker failed to become ready', 'server-start-failed');
      await sleep(50);
      const now = Date.now();
      budget -= Math.min(Math.max(now - last, 0), READY_POLL_MAX_ELAPSED);
      last = now;
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

module.exports = { ownershipPath, acquireOwnership, assertOwnership, releaseOwnership, resolveStorage, context, snapshot, pidExists, withLease, createGraph, admit, publish,
  checkAdmission, recordStop, abortAdmission, startGraph, stopGraph, deleteGraph, observe, stopOutdatedWorkers };
