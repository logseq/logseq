const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const lifecycle = require('../index.cjs');

test('graph workers default to system CAs and preserve explicit configuration', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'worker-ca-'));
  const envKey = 'NODE_USE_SYSTEM_CA';
  const windows = process.platform === 'win32';
  const explicitKey = windows ? envKey.toLowerCase() : envKey;
  const previousKey = windows ? Object.keys(process.env).find(key => key.toUpperCase() === envKey) : envKey;
  const previous = process.env[envKey];
  const fixture = path.resolve(__dirname, '../../../cli-e2e/scripts/db-worker-node-lifecycle-fixture.cjs');
  const script = path.join(root, 'worker.cjs');
  const output = path.join(root, 'worker-env.json');
  fs.writeFileSync(script, `
    require('node:fs').writeFileSync(${JSON.stringify(output)}, JSON.stringify({
      systemCA: process.env.NODE_USE_SYSTEM_CA ?? null
    }));
    require(${JSON.stringify(fixture)});
  `);
  const storage = lifecycle.resolveStorage(root, path.join(root, 'graphs'));
  try {
    for (const owner of ['electron', 'cli']) {
      for (const configured of [undefined, '0']) {
        delete process.env[envKey];
        if (configured !== undefined) process.env[explicitKey] = configured;
        const repo = `${owner}-${configured ?? 'default'}`;
        await lifecycle.createGraph(storage, repo);
        await lifecycle.startGraph({ storage, repo, script, owner, extraArgs: ['--mode', 'normal'] });
        try {
          const env = JSON.parse(fs.readFileSync(output, 'utf8'));
          assert.equal(env.systemCA, configured ?? '1', `${owner} with ${explicitKey}=${configured}`);
        } finally {
          await lifecycle.stopGraph(storage, repo, owner);
        }
      }
    }
  } finally {
    delete process.env[envKey];
    if (previous !== undefined) process.env[previousKey ?? envKey] = previous;
    fs.rmSync(root, { recursive: true, force: true });
  }
});
