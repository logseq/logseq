const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const lifecycle = require('../index.cjs');

test('desktop workers use system CAs by default and preserve explicit CA configuration', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'worker-ca-'));
  const previous = process.env.NODE_USE_SYSTEM_CA;
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
    for (const [owner, configured, expected] of [
      ['electron', undefined, '1'],
      ['electron', '0', '0'],
      ['cli', undefined, null],
    ]) {
      if (configured === undefined) delete process.env.NODE_USE_SYSTEM_CA;
      else process.env.NODE_USE_SYSTEM_CA = configured;
      const repo = `${owner}-${configured ?? 'default'}`;
      await lifecycle.createGraph(storage, repo);
      try {
        await lifecycle.startGraph({ storage, repo, script, owner, extraArgs: ['--mode', 'normal'] });
        const env = JSON.parse(fs.readFileSync(output, 'utf8'));
        assert.equal(env.systemCA, expected, `${owner} with NODE_USE_SYSTEM_CA=${configured}`);
      } finally {
        await lifecycle.stopGraph(storage, repo, owner);
      }
    }
  } finally {
    if (previous === undefined) delete process.env.NODE_USE_SYSTEM_CA;
    else process.env.NODE_USE_SYSTEM_CA = previous;
    fs.rmSync(root, { recursive: true, force: true });
  }
});
