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
    await lifecycle.stopOutdatedWorkers(storage, 'revision-1');
    assert.equal(lifecycle.snapshot(storage, 'linked').phase, 'available');
  }));
