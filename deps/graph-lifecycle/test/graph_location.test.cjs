const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const lifecycle = require('../index.cjs');

function withTemporary(prefix, action) {
  const temporary = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), prefix)));
  return Promise.resolve(action(temporary)).finally(() => fs.rmSync(temporary, { recursive: true, force: true }));
}

test('graph creation in a custom location links the graph into graphsDir', () =>
  withTemporary('graph-location-', async temporary => {
    const storage = lifecycle.resolveStorage(temporary, path.join(temporary, 'graphs'));
    const location = path.join(temporary, 'elsewhere');
    fs.mkdirSync(location);
    await lifecycle.createGraph(storage, 'notes/work', true, location);
    const target = path.join(location, 'notes~2Fwork');
    const link = path.join(storage.graphsDir, 'notes~2Fwork');
    assert.ok(fs.statSync(target).isDirectory());
    assert.ok(fs.lstatSync(link).isSymbolicLink());
    assert.equal(fs.realpathSync(link), target);
    assert.equal(lifecycle.snapshot(storage, 'notes/work').phase, 'available');
    fs.writeFileSync(path.join(link, 'db.sqlite'), 'data');
    assert.equal(fs.readFileSync(path.join(target, 'db.sqlite'), 'utf8'), 'data');
  }));

test('graph creation without a location keeps a real directory in graphsDir', () =>
  withTemporary('graph-location-default-', async temporary => {
    const storage = lifecycle.resolveStorage(temporary, path.join(temporary, 'graphs'));
    await lifecycle.createGraph(storage, 'plain', true);
    const dir = path.join(storage.graphsDir, 'plain');
    assert.ok(fs.lstatSync(dir).isDirectory());
  }));

test('graph creation refuses a location that already holds the graph folder', () =>
  withTemporary('graph-location-exists-', async temporary => {
    const storage = lifecycle.resolveStorage(temporary, path.join(temporary, 'graphs'));
    const location = path.join(temporary, 'elsewhere');
    fs.mkdirSync(path.join(location, 'taken'), { recursive: true });
    await assert.rejects(lifecycle.createGraph(storage, 'taken', true, location), { code: 'graph-location-exists' });
    assert.equal(fs.existsSync(path.join(storage.graphsDir, 'taken')), false);
  }));

test('graph creation rejects relative locations', () =>
  withTemporary('graph-location-relative-', async temporary => {
    const storage = lifecycle.resolveStorage(temporary, path.join(temporary, 'graphs'));
    await assert.rejects(lifecycle.createGraph(storage, 'rel', true, 'relative/dir'), { code: 'invalid-graph-location' });
  }));

test('deleting a graph in a custom location unlinks it and keeps its data', () =>
  withTemporary('graph-location-delete-', async temporary => {
    const storage = lifecycle.resolveStorage(temporary, path.join(temporary, 'graphs'));
    const location = path.join(temporary, 'elsewhere');
    fs.mkdirSync(location);
    await lifecycle.createGraph(storage, 'kept', true, location);
    fs.writeFileSync(path.join(location, 'kept', 'db.sqlite'), 'data');
    const result = await lifecycle.deleteGraph(storage, 'kept');
    assert.equal(result.existed, true);
    assert.equal(fs.existsSync(path.join(storage.graphsDir, 'kept')), false);
    assert.equal(fs.readFileSync(path.join(location, 'kept', 'db.sqlite'), 'utf8'), 'data');
    assert.equal(fs.realpathSync(result.destination), path.join(location, 'kept'));
  }));

test('outdated worker cleanup visits graphs linked from another location', () =>
  withTemporary('graph-location-upgrade-', async temporary => {
    const storage = lifecycle.resolveStorage(temporary, path.join(temporary, 'graphs'));
    const location = path.join(temporary, 'elsewhere');
    fs.mkdirSync(location);
    await lifecycle.createGraph(storage, 'linked', true, location);
    fs.symlinkSync(path.join(temporary, 'missing'), path.join(storage.graphsDir, 'dangling'));
    // Cleanup recreates lifecycle state only for graphs it visits.
    const { stateFile } = lifecycle.context(storage, 'linked');
    fs.rmSync(stateFile);
    await lifecycle.stopOutdatedWorkers(storage, 'revision-1');
    assert.equal(fs.existsSync(stateFile), true);
    assert.equal(lifecycle.snapshot(storage, 'linked').phase, 'available');
  }));

test('outdated worker cleanup skips links whose target is not reachable', {
  skip: process.platform === 'win32' || process.getuid?.() === 0
}, () =>
  withTemporary('graph-location-eacces-', async temporary => {
    const storage = lifecycle.resolveStorage(temporary, path.join(temporary, 'graphs'));
    await lifecycle.createGraph(storage, 'local', true);
    const shared = path.join(temporary, 'shared');
    fs.mkdirSync(shared);
    await lifecycle.createGraph(storage, 'locked', true, shared);
    fs.chmodSync(shared, 0o000);
    try {
      await lifecycle.stopOutdatedWorkers(storage, 'revision-1');
    } finally { fs.chmodSync(shared, 0o755); }
    assert.equal(lifecycle.snapshot(storage, 'local').phase, 'available');
  }));

test('recreating a graph replaces a link whose folder was moved away', () =>
  withTemporary('graph-location-moved-', async temporary => {
    const storage = lifecycle.resolveStorage(temporary, path.join(temporary, 'graphs'));
    const oldLocation = path.join(temporary, 'old');
    const newLocation = path.join(temporary, 'new');
    fs.mkdirSync(oldLocation);
    fs.mkdirSync(newLocation);
    await lifecycle.createGraph(storage, 'work', true, oldLocation);
    fs.renameSync(path.join(oldLocation, 'work'), path.join(temporary, 'moved'));
    await lifecycle.createGraph(storage, 'work', true, newLocation);
    assert.equal(fs.realpathSync(path.join(storage.graphsDir, 'work')), path.join(newLocation, 'work'));
    assert.equal(fs.existsSync(path.join(temporary, 'moved')), true);
  }));

test('a failed link leaves no empty graph folder behind', () =>
  withTemporary('graph-location-link-fail-', async temporary => {
    const storage = lifecycle.resolveStorage(temporary, path.join(temporary, 'graphs'));
    const location = path.join(temporary, 'elsewhere');
    fs.mkdirSync(location);
    const symlink = fs.symlinkSync;
    fs.symlinkSync = () => { throw Object.assign(new Error('link refused'), { code: 'EPERM' }); };
    try {
      await assert.rejects(lifecycle.createGraph(storage, 'work', true, location), { code: 'EPERM' });
    } finally { fs.symlinkSync = symlink; }
    assert.equal(fs.existsSync(path.join(location, 'work')), false);
  }));
