import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);
const zvec = require('@zvec/zvec');
const executable = resolve(process.argv[2]);
zvec.ZVecInitialize({ logLevel: zvec.ZVecLogLevel.WARN });
const schema = new zvec.ZVecCollectionSchema({
  name: 'blocks',
  vectors: [{ name: 'embedding', dataType: zvec.ZVecDataType.VECTOR_FP32, dimension: 3,
    indexParams: { indexType: zvec.ZVecIndexType.HNSW, metricType: zvec.ZVecMetricType.COSINE } }],
  fields: [{ name: 'page', dataType: zvec.ZVecDataType.STRING,
    indexParams: { indexType: zvec.ZVecIndexType.INVERT } },
  { name: 'title', dataType: zvec.ZVecDataType.STRING }],
});
const query = { fieldName: 'embedding', topk: 10, vector: [1, 0, 0],
  outputFields: ['page', 'title'], params: { indexType: zvec.ZVecIndexType.HNSW, ef: 300 } };
const doc = (id, page, title, embedding) => ({ id, fields: { page, title }, vectors: { embedding } });
const native = (operation, path) => execFileSync(executable, [operation, path], {
  env: { ...process.env, LOGSEQ_EMBEDDINGS_URL: 'http://127.0.0.1:1' }, encoding: 'utf8', timeout: 30000,
});

test('Node and native reopen, query, update and delete the same zvec index', () => {
  const directory = mkdtempSync(join(tmpdir(), 'worker-vector-interop-'));
  try {
    const nodePath = join(directory, 'from-node');
    let collection = zvec.ZVecCreateAndOpen(nodePath, schema, { enableMMAP: true });
    collection.upsertSync([doc('node', '页面', 'Node title', [1, 0, 0]),
      doc('remove', 'other', 'Remove me', [0, 1, 0])]);
    collection.closeSync();
    native('update', nodePath);
    collection = zvec.ZVecOpen(nodePath, { enableMMAP: true });
    const results = collection.querySync(query);
    assert.equal(results.length, 1);
    assert.equal(results[0].id, 'node');
    assert.equal(results[0].fields.page, '页面');
    assert.equal(results[0].fields.title, 'Updated from native');
    collection.closeSync();
    assert.equal(JSON.parse(readFileSync(join(nodePath, 'metadata.json')) )['embedding-dimension'], 3);

    const nativePath = join(directory, 'from-native');
    native('seed', nativePath);
    collection = zvec.ZVecOpen(nativePath, { enableMMAP: true });
    assert.equal(collection.querySync(query)[0].fields.page, '原生');
    collection.upsertSync([doc('native', 'updated', 'Updated from Node', [1, 0, 0])]);
    collection.closeSync();
    const reopened = JSON.parse(native('inspect', nativePath));
    assert.equal(reopened[0].title, 'Updated from Node');
    assert.equal(reopened[0].page, 'updated');
    assert.ok(Math.abs(reopened[0].score - 1) < 0.0001);
  } finally { rmSync(directory, { recursive: true, force: true }); }
});
