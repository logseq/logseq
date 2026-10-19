'use strict';

// Bounded sequential-upgrade adapter. Remove when the minimum upgrade source uses sqlite-v1.
// Supported sources: ticket/generation registrations and pre-registration HTTP workers
// with a disk lock ID (their health payload may omit that ID).
const fs = require('node:fs');
const path = require('node:path');

module.exports = function ({ fail, readJSON, writeJSON, graphName, canonicalRoot, sameStorage,
  pidExists, entries, request, shutdownAndWait, removeEntries, runtimeFile }) {
  function artifact(file) {
    try { return fs.readFileSync(file, 'utf8'); }
    catch (error) { if (error.code === 'ENOENT') return null; throw error; }
  }
  function parse(raw) {
    if (raw === null) return null;
    try { return JSON.parse(raw); } catch (error) { if (error instanceof SyntaxError) return null; throw error; }
  }
  function unresolved(ctx, reason) {
    fail(`Legacy ownership unresolved for ${ctx.graphDir}: ${reason}. Close old applications and daemons before explicit offline recovery.`);
  }
  async function retireGraph(ctx, current, scan) {
    const file = path.join(ctx.graphDir, 'db-worker.lock');
    const original = artifact(file);
    const disk = parse(original);
    const records = current.workers.filter(record => record['ownership-protocol'] === undefined);
    if (original === null && !records.length) return [];
    const recordsBefore = JSON.stringify(current.workers);
    const runtimeBefore = new Map(records.map(record => [record.ticket, artifact(runtimeFile(ctx, record.ticket))]));
    const roots = new Set([ctx.root, ...records.map(record => record.root)]);
    const publications = [...roots].flatMap(root => (scan ? scan.entries(root) : entries(root)).map(entry => ({ ...entry, root })));
    const dead = publications.filter(entry => !pidExists(entry.pid));
    const candidates = new Map();
    for (const record of records) {
      const raw = runtimeBefore.get(record.ticket);
      const runtime = raw === null ? null : JSON.parse(raw);
      if (raw !== null && (!runtime || typeof runtime !== 'object' || Array.isArray(runtime)))
        unresolved(ctx, 'invalid legacy runtime metadata');
      if (runtime && ['ticket', 'generation', 'pid', 'owner', 'root', 'graphsDir', 'lifecycleDir', 'repo']
        .some(key => runtime[key] !== record[key])) unresolved(ctx, 'registration/runtime identity mismatch');
      candidates.set(record.pid, { ...record, ...runtime, record });
    }
    if (disk && Number.isSafeInteger(disk.pid) && disk.pid > 0) {
      if (graphName(disk.repo) !== ctx.repo || !disk['lock-id'] || !['cli', 'electron', 'unknown'].includes(disk['owner-source']))
        unresolved(ctx, 'invalid disk lock identity');
      candidates.set(disk.pid, { ...candidates.get(disk.pid), pid: disk.pid, disk });
    }
    const unresolvedPublications = publications.filter(entry => !dead.includes(entry)
      && !candidates.has(entry.pid) && !current.workers.some(record => record.pid === entry.pid));
    const probes = await Promise.allSettled(unresolvedPublications.map(async publication =>
      scan ? scan.probe(publication) : JSON.parse((await request(publication.port, '/healthz')).body)));
    for (const publication of publications.filter(entry => !dead.includes(entry))) {
      if (current.workers.some(record => record.pid === publication.pid && record['ownership-protocol'] !== undefined)) continue;
      const target = candidates.get(publication.pid);
      if (target) {
        if (target.port && target.port !== publication.port) unresolved(ctx, 'publication port mismatch');
        Object.assign(target, { port: publication.port, root: publication.root });
        continue;
      }
      // A publication for a sibling graph must not block graph-targeted retirement.
      let value;
      const probe = probes[unresolvedPublications.indexOf(publication)];
      if (probe.status === 'fulfilled') value = probe.value;
      else {
        if (original !== null || records.length) unresolved(ctx, `unavailable publication ${publication.pid}:${publication.port}`);
        continue;
      }
      if (!value.repo || graphName(value.repo) !== ctx.repo) continue;
      if (value['ownership-protocol'] !== undefined) {
        if (value['ownership-protocol'] !== 'sqlite-v1') unresolved(ctx, 'unknown ownership protocol');
        continue;
      }
      if (!value['root-dir']) unresolved(ctx, 'unregistered graph endpoint lacks root identity');
      if (canonicalRoot(value['root-dir']) !== ctx.root || (value.storage && !sameStorage(ctx, value.storage))) continue;
      unresolved(ctx, 'legacy publication has no correlating lock or registration');
    }
    if (original !== null && !disk && !records.length) unresolved(ctx, 'malformed lock without independent registration');
    if (original !== null && disk && !candidates.size) unresolved(ctx, 'invalid lock');
    const retired = [];
    for (const target of candidates.values()) {
      if (!pidExists(target.pid)) continue;
      if (!target.port) unresolved(ctx, `unidentified live PID ${target.pid}`);
      const probe = async () => {
        let response;
        try { response = await request(target.port, '/healthz'); }
        catch (error) { unresolved(ctx, `unavailable endpoint ${target.pid}:${target.port}: ${error.message}`); }
        const value = JSON.parse(response.body);
        if (![200, 503].includes(response.status) || value.pid !== target.pid || value.port !== target.port
            || value.host !== '127.0.0.1' || graphName(value.repo) !== ctx.repo
            || typeof value.revision !== 'string' || !value.revision
            || !['cli', 'electron'].includes(value['owner-source'])
            || value['ownership-protocol'] !== undefined
            || canonicalRoot(value['root-dir']) !== canonicalRoot(target.root)
            || (value.storage && !sameStorage(ctx, value.storage))) unresolved(ctx, 'endpoint identity mismatch');
        if (target.disk && (target.disk['owner-source'] !== value['owner-source']
          || (value['lock-id'] !== undefined && value['lock-id'] !== target.disk['lock-id'])))
          unresolved(ctx, 'disk lock identity mismatch');
        if (target.record) {
          const r = target.record;
          if (r.repo !== ctx.repo || r.generation !== current.generation || r.graphsDir !== ctx.graphsDir
            || r.lifecycleDir !== ctx.lifecycleDir || r.owner !== value['owner-source']
            || value.ticket !== r.ticket || value.generation !== r.generation || !sameStorage(ctx, value.storage))
            unresolved(ctx, 'registered endpoint identity mismatch');
          if (target.lock && (target.lock.pid !== r.pid || target.lock.ticket !== r.ticket
            || target.lock.generation !== r.generation || target.lock['owner-source'] !== r.owner
            || value['lock-id'] !== target.lock['lock-id'])) unresolved(ctx, 'registered lock identity mismatch');
        }
        return value;
      };
      const value = await probe();
      const confirmed = await probe();
      if (JSON.stringify(value) !== JSON.stringify(confirmed)) unresolved(ctx, 'identity changed before shutdown');
      await shutdownAndWait(ctx, target, false, true);
      retired.push(target);
    }
    // Recheck exact evidence; a successor's record must never be removed.
    const actual = artifact(file);
    if (actual !== original && actual !== null) unresolved(ctx, 'lock identity changed during cleanup');
    const latest = readJSON(ctx.stateFile);
    if (JSON.stringify(latest.workers) !== recordsBefore)
      unresolved(ctx, 'registration changed during cleanup');
    for (const record of records) {
      const before = parse(runtimeBefore.get(record.ticket));
      const after = readJSON(runtimeFile(ctx, record.ticket));
      if (after && ['pid', 'ticket', 'generation', 'owner', 'root', 'graphsDir', 'lifecycleDir', 'repo']
        .some(key => after[key] !== record[key])) unresolved(ctx, 'runtime changed during cleanup');
      if (before?.lock && after?.lock && JSON.stringify(before.lock) !== JSON.stringify(after.lock))
        unresolved(ctx, 'runtime lock changed during cleanup');
      if (after?.error) unresolved(ctx, `worker close failed: ${after.error}`);
    }
    if (actual !== null) fs.unlinkSync(file);
    for (const root of roots) {
      const removed = publications.filter(entry => entry.root === root && (dead.includes(entry) || candidates.has(entry.pid)));
      if (removed.length) await removeEntries(root, removed);
    }
    for (const record of records) fs.rmSync(runtimeFile(ctx, record.ticket), { force: true });
    if (records.length) {
      current.workers = current.workers.filter(record => record['ownership-protocol'] !== undefined);
      writeJSON(ctx.stateFile, current);
    }
    return retired;
  }
  return { retireGraph };
};
