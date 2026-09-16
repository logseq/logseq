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

// A positive PID probe is insufficient: retain the OS birth marker and command.
// Unknown status and permission errors propagate instead of counting as exit.
function processIdentity(pid) {
  if (!Number.isSafeInteger(pid) || pid <= 0) fail('Invalid process identity');
  try { process.kill(pid, 0); }
  catch (error) { if (error.code === 'ESRCH') return null; throw error; }
  if (process.platform === 'linux') {
    try {
      const stat = fs.readFileSync(`/proc/${pid}/stat`, 'utf8');
      const fields = stat.slice(stat.lastIndexOf(')') + 2).split(' ');
      if (fields[0] === 'Z') return null;
      const argv = fs.readFileSync(`/proc/${pid}/cmdline`, 'utf8').split('\0').filter(Boolean);
      return { pid, birth: fields[19], command: argv.join(' '), argv };
    } catch (error) { if (error.code === 'ENOENT') return null; throw error; }
  }
  if (process.platform === 'win32') {
    const result = cp.spawnSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command',
      `Get-CimInstance Win32_Process -Filter "ProcessId = ${pid}" | Select-Object CreationDate,CommandLine | ConvertTo-Json -Compress`],
    { encoding: 'utf8', windowsHide: true });
    if (result.error) throw result.error;
    if (result.status !== 0) fail('Cannot inspect process identity');
    if (!result.stdout.trim()) return null;
    const info = JSON.parse(result.stdout);
    if (!info.CreationDate || !info.CommandLine) fail('Incomplete process identity');
    return { pid, birth: String(info.CreationDate), command: info.CommandLine };
  }
  const result = cp.spawnSync('ps', ['-p', String(pid), '-o', 'lstart=', '-o', 'stat=', '-o', 'command='],
    { encoding: 'utf8', env: { ...process.env, LC_ALL: 'C' } });
  if (result.error) throw result.error;
  if (result.status === 1 && !result.stdout.trim()) return null;
  if (result.status !== 0) fail('Cannot inspect process identity');
  const match = result.stdout.trim().match(/^(\w+\s+\w+\s+\d+\s+[\d:]+\s+\d+)\s+(\S+)\s+(.+)$/);
  if (!match) fail('Incomplete process identity');
  if (match[2].startsWith('Z')) return null;
  return { pid, birth: match[1], command: match[3], exiting: match[2].includes('E') };
}
function sameProcess(a, b) {
  return a && b && a.pid === b.pid && a.birth === b.birth && (a.command === b.command || b.exiting === true);
}
function verifiedProcess(identity) {
  const actual = processIdentity(identity.pid);
  if (actual && !sameProcess(identity, actual)) fail(`Process identity changed for PID ${identity.pid}`);
  return actual;
}
function verifiedAlive(identity) {
  return verifiedProcess(identity) !== null;
}
function signalVerified(identity, signal) {
  const actual = verifiedProcess(identity);
  // macOS P_WEXIT may replace argv with "(node)" while the same process exits.
  // Keep waiting for disappearance; never treat this transition as completed exit.
  if (actual && !actual.exiting) process.kill(identity.pid, signal);
}
function argument(identity, flag) {
  if (identity.argv) {
    const index = identity.argv.indexOf(flag);
    return index < 0 ? null : identity.argv[index + 1];
  }
  const match = identity.command.match(new RegExp(`(?:^|\\s)${flag}\\s+(.+?)(?=\\s+--[a-z-]+(?:\\s|$)|$)`));
  return match ? match[1].replace(/^"(.*)"$/, '$1') : null;
}
// Return null when argv cannot establish graph identity. Only false is safe to skip.
function belongsTo(ctx, identity) {
  if (!/db-worker-node/.test(identity.command)) return null;
  const repo = argument(identity, '--repo');
  if (!repo) return null;
  if (graphName(repo) !== ctx.repo) return false;
  const root = argument(identity, '--root-dir');
  if (!root) return null;
  // Direct worker invocations use the documented root/graphs default at their boundary.
  const graphsDir = argument(identity, '--graphs-dir') || path.join(root, 'graphs');
  return canonicalRoot(graphsDir) === ctx.graphsDir;
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
    if (previous && verifiedAlive(previous.identity)) fail('Lifecycle owner remains alive');
    const owner = { id: id(), identity: processIdentity(process.pid), operation };
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
    if (current.workers.some(worker => verifiedAlive(worker.identity))) fail('Graph still has a live worker');
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
  const release = await acquireLease(ctx, 'admit');
  try {
    const current = state(ctx);
    requireAvailable(ctx, current, generation);
    let record;
    if (ticket) {
      record = current.workers.find(worker => worker.ticket === ticket);
      if (!record || record.owner !== owner || record.generation !== current.generation || !sameProcess(record.identity, processIdentity(process.pid)))
        fail('Worker admission generation or process identity changed');
    } else {
      record = { ticket: id(), generation: current.generation, identity: processIdentity(process.pid), owner, root: ctx.root };
      current.workers.push(record);
      writeJSON(ctx.stateFile, current);
    }
    return { ...ctx, ...record, release };
  } catch (error) { release(); throw error; }
}
function publish(runtime, lock, port) {
  checkAdmission(runtime);
  validateLock(runtime, lock, runtime);
  writeJSON(runtimeFile(runtime, runtime.ticket), { ...runtimeRecord(runtime), lock, port, phase: 'ready' });
  runtime.release();
}
function runtimeRecord(runtime) {
  return { ticket: runtime.ticket, generation: runtime.generation, identity: runtime.identity, owner: runtime.owner, root: runtime.root };
}
function checkAdmission(runtime) {
  requireAvailable(runtime, readJSON(runtime.stateFile), runtime.generation);
}
function recordStop(runtime, error) {
  const file = runtimeFile(runtime, runtime.ticket);
  const previous = readJSON(file);
  writeJSON(file, { ...(previous || runtimeRecord(runtime)), phase: error ? 'close-error' : 'closed',
    error: error ? String(error.message || error) : null });
}
function abortAdmission(runtime, error) {
  try { recordStop(runtime, error); } finally { runtime.release(); }
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
async function health(ctx, identity, port) {
  const response = await request(port, '/healthz');
  const value = JSON.parse(response.body);
  if (![200, 503].includes(response.status) || value.pid !== identity.pid || value.port !== port
      || !sameStorage(ctx, value.storage)
      || graphName(value.repo) !== ctx.repo || value.host !== '127.0.0.1') fail('Worker endpoint identity mismatch');
  if (value['process-start'] && value['process-start'] !== identity.birth) fail('Worker process identity mismatch');
  return value;
}
function validateLock(ctx, lock, target) {
  if (graphName(lock.repo) !== ctx.repo || lock.pid !== target.identity.pid
      || !lock['lock-id'] || !sameStorage(ctx, lock.storage)
      || (target.owner && lock['owner-source'] !== target.owner)
      || (lock['process-start'] && lock['process-start'] !== target.identity.birth)
      || (target.lock && lock['lock-id'] !== target.lock['lock-id'])) fail('Graph lock identity mismatch');
}
async function discover(ctx, current) {
  const targets = new Map();
  for (const record of current.workers) {
    const runtime = readJSON(runtimeFile(ctx, record.ticket));
    targets.set(record.identity.pid, { ...record, ...runtime });
  }
  const lock = readJSON(path.join(ctx.graphDir, 'db-worker.lock'));
  const published = entries(ctx.root);
  const probes = [];
  const candidates = [...published];
  if (lock) candidates.push({ pid: lock.pid });
  for (const candidate of candidates) {
    let target = targets.get(candidate.pid);
    const identity = target ? target.identity : processIdentity(candidate.pid);
    if (!identity) continue;
    const membership = target ? true : belongsTo(ctx, identity);
    if (membership !== true) {
      if (lock?.pid === candidate.pid) fail('Live lock owner has unresolved graph identity');
      if (membership === false) continue;
      if (candidate.port) probes.push(async () => {
        let value;
        try { value = JSON.parse((await request(candidate.port, '/healthz')).body); }
        catch (error) {
          if (!(error instanceof SyntaxError) && !['ECONNREFUSED', 'ECONNRESET'].includes(error.code)
              && error.message !== 'Worker request timeout') throw error;
        }
        if (value?.repo && graphName(value.repo) === ctx.repo
            && (!value.storage || sameStorage(ctx, value.storage)))
          fail('Published graph worker has unresolved process identity');
      });
      continue;
    }
    if (target) verifiedAlive(identity);
    else target = { ticket: id(), generation: current.generation, identity, root: ctx.root };
    if (candidate.port) {
      if (target.port && target.port !== candidate.port) fail('Worker publication identity mismatch');
      target.port = candidate.port;
    }
    targets.set(candidate.pid, target);
  }
  const probeResults = await Promise.allSettled(probes.map(probe => probe()));
  for (const result of probeResults) if (result.status === 'rejected') throw result.reason;
  if (lock) {
    const target = targets.get(lock.pid);
    if (target) { validateLock(ctx, lock, target); target.lock = lock; }
    else if (processIdentity(lock.pid)) fail('Unresolved graph lock identity');
  }
  const movedProbes = [];
  const unlinked = path.join(ctx.graphsDir, 'Unlinked graphs');
  if (fs.existsSync(unlinked) && fs.statSync(unlinked).isDirectory()) {
    for (const directory of fs.readdirSync(unlinked, { withFileTypes: true })) {
      if (!directory.isDirectory()) continue;
      const moved = readJSON(path.join(unlinked, directory.name, 'db-worker.lock'));
      if (!moved || graphName(moved.repo) !== ctx.repo) continue;
      const target = targets.get(moved.pid);
      if (!target) continue;
      validateLock(ctx, moved, target);
      if (verifiedAlive(target.identity) && target.port) movedProbes.push(async () => {
        const value = await health(ctx, target.identity, target.port);
        if (value['lock-id'] !== moved['lock-id']) fail('Moved graph lock identity mismatch');
      });
      target.lock = moved;
    }
  }
  const movedResults = await Promise.allSettled(movedProbes.map(probe => probe()));
  for (const result of movedResults) if (result.status === 'rejected') throw result.reason;
  // Persist every adopted identity before requesting shutdown or allowing metadata removal.
  current.workers = [...targets.values()];
  writeJSON(ctx.stateFile, current);
  return { targets: current.workers, lock };
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
      if (previous && !processIdentity(previous.pid)) {
        if (readJSON(lockFile)?.['lock-id'] === previous['lock-id']) fs.unlinkSync(lockFile);
      }
      if (Date.now() >= deadline) fail('Timed out acquiring server-list lock');
      await sleep(25);
    }
  }
  try {
    const retained = entries(root).filter(entry => !removed.some(target => target.identity.pid === entry.pid && target.port === entry.port));
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
async function waitExit(identity, milliseconds) {
  const deadline = Date.now() + milliseconds;
  do {
    if (!verifiedAlive(identity)) return true;
    await sleep(50);
  } while (Date.now() < deadline);
  return !verifiedAlive(identity);
}
async function terminate(ctx, target, deleting) {
  if (!verifiedAlive(target.identity)) return;
  if (target.identity.pid === process.pid) fail('Cannot stop the calling process');
  let responsive = false;
  if (target.port) {
    try {
      await health(ctx, target.identity, target.port);
      responsive = true;
    } catch (error) {
      if (!['ECONNREFUSED', 'ECONNRESET'].includes(error.code) && error.message !== 'Worker request timeout') throw error;
    }
  }
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
    if (stage !== 'graceful') signalVerified(target.identity, stage);
    process.stderr.write(`[graph-lifecycle] ${JSON.stringify({ event: 'worker-termination',
      repo: ctx.repo, graphsDir: ctx.graphsDir, generation: target.generation,
      ticket: target.ticket, identity: target.identity, stage })}\n`);
    if (await waitExit(target.identity, milliseconds)) return;
  }
  fail(`Timed out stopping worker ${target.identity.pid}`, 'server-stop-timeout');
}
function removeMatchingLock(file, lock) {
  const actual = readJSON(file);
  if (!actual) return;
  if (actual.pid !== lock.pid || actual['lock-id'] !== lock['lock-id'] || actual.repo !== lock.repo)
    fail('Graph lock identity changed during cleanup');
  if (processIdentity(actual.pid)) fail('Cannot remove a live graph lock');
  fs.unlinkSync(file);
}
async function cleanup(ctx, current, targets, lock) {
  for (const target of targets) if (verifiedAlive(target.identity)) fail('Worker remains alive during cleanup');
  if (lock) removeMatchingLock(path.join(ctx.graphDir, 'db-worker.lock'), lock);
  else if (readJSON(path.join(ctx.graphDir, 'db-worker.lock'))) fail('Unexpected graph lock appeared during cleanup');
  const unlinked = path.join(ctx.graphsDir, 'Unlinked graphs');
  if (fs.existsSync(unlinked) && fs.statSync(unlinked).isDirectory()) {
    for (const directory of fs.readdirSync(unlinked, { withFileTypes: true })) {
      if (!directory.isDirectory()) continue;
      const file = path.join(unlinked, directory.name, 'db-worker.lock');
      const moved = readJSON(file);
      if (moved && graphName(moved.repo) === ctx.repo && targets.some(target => target.identity.pid === moved.pid
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
      if (!verifiedAlive(target.identity)) continue;
      const source = target.owner || target.lock?.['owner-source'];
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
async function startGraph({ storage, repo, script, owner = 'cli', createEmpty = false, generation, extraArgs = [] }) {
  const ctx = context(storage, repo);
  // Capture the instance before queuing for exclusion, not after a delete/recreate.
  const observed = snapshot(storage, repo)?.generation;
  const record = await withLease(ctx, 'start', async () => {
    const current = state(ctx);
    requireAvailable(ctx, current, generation || observed);
    const { targets, lock } = await discover(ctx, current);
    const live = targets.filter(target => verifiedAlive(target.identity));
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
    const identity = child.pid && processIdentity(child.pid);
    if (!identity) fail('Worker failed to spawn', 'server-start-failed');
    child.unref();
    const spawned = { ticket, generation: current.generation, identity, owner, root: ctx.root };
    current.workers = [spawned];
    try { writeJSON(ctx.stateFile, current); }
    catch (error) {
      // An unregistered child must exit before the parent releases admission exclusion.
      signalVerified(identity, 'SIGKILL');
      if (!await waitExit(identity, 2000)) fail('Unregistered worker did not exit');
      throw error;
    }
    return spawned;
  });
  const deadline = Date.now() + 30000;
  for (;;) {
    requireAvailable(ctx, readJSON(ctx.stateFile), record.generation);
    if (!verifiedAlive(record.identity)) fail('Worker exited before becoming ready', 'server-start-failed');
    const runtime = readJSON(runtimeFile(ctx, record.ticket));
    const port = runtime?.port || record.port;
    if (port) {
      const value = await health(ctx, record.identity, port);
      const lock = readJSON(path.join(ctx.graphDir, 'db-worker.lock'));
      if (!lock) fail('Worker has no canonical graph lock', 'server-start-failed');
      validateLock(ctx, lock, { ...record, lock: runtime?.lock || record.lock });
      if (value.status === 'ready') return { ...value, generation: record.generation };
    }
    if (Date.now() >= deadline) fail('Worker failed to become ready', 'server-start-failed');
    await sleep(50);
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

module.exports = { resolveStorage, context, snapshot, processIdentity, withLease, createGraph, admit, publish,
  checkAdmission, recordStop, abortAdmission, startGraph, stopGraph, deleteGraph, observe };
