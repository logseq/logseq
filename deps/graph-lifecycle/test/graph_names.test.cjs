const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const lifecycle = require('../index.cjs');

test('graph creation shares trimmed identities without changing the storage root', async () => {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'graph-name-trim-'));
  try {
    const root = path.join(temporary, ' storage root ');
    fs.mkdirSync(root);
    const storage = lifecycle.resolveStorage(root, path.join(root, 'graphs'));
    const first = await lifecycle.createGraph(storage, '  logseq_db_ space name/child  ');
    const second = await lifecycle.createGraph(storage, 'space name/child');
    assert.equal(first, second);
    assert.deepEqual(fs.readdirSync(storage.graphsDir), ['space name~2Fchild']);
    assert.equal(lifecycle.snapshot(storage, ' logseq_db_space name/child ').generation, first);
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
  }
});

test('graph creation rejects names that become empty after trimming', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'graph-name-empty-'));
  try {
    const storage = lifecycle.resolveStorage(root, path.join(root, 'graphs'));
    for (const repo of ['   ', ' logseq_db_ ']) {
      await assert.rejects(lifecycle.createGraph(storage, repo), { code: 'missing-repo' });
    }
    assert.deepEqual(fs.readdirSync(storage.graphsDir), []);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
