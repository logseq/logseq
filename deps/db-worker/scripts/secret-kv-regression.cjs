'use strict';

// Real compiled Node runtime, isolated filesystem, synthetic keychain only.
// Run after `dune build js_api`: node --test scripts/secret-kv-regression.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const Module = require('node:module');
const { spawnSync } = require('node:child_process');
const { test } = require('node:test');

const binary = '\x00\xffraw';
const scenarios = [
  'failed-keychain-preserves-mixed-values',
  'reads-see-idb-updates',
  'delete-preserves-later-values',
  'failed-save-does-not-change-read-and-can-retry',
  'partial-write-keeps-persisted-values',
  'missing-directory',
  'missing-keytar',
  'cli-bypass',
  'successful-keychain',
  'concurrent-fallback-writes',
];

if (!process.argv.includes('--scenario') && !process.argv.includes('--reload')) {
  for (const name of scenarios) {
    test(name, () => {
      const result = spawnSync(process.execPath, [__filename, '--scenario', name],
        { encoding: 'utf8' });
      assert.equal(result.status, 0, result.stdout + result.stderr);
      process.stdout.write(result.stdout);
    });
  }
} else {
  const name = process.argv[3];
  const reload = process.argv.includes('--reload');
  const root = reload ? name : fs.mkdtempSync(path.join(os.tmpdir(), 'secret-kv-test-'));
  const dir = path.join(root, 'kv');
  const file = path.join(dir, 'kv-store.json');
  process.env.LOGSEQ_WORKER_KV_DIR = dir;
  process.env.LOGSEQ_OWNER_SOURCE = name === 'cli-bypass' ? 'cli' : 'electron';
  process.env.CLI_E2E_TEST = '1';

  let keytarCalls = 0;
  const keychain = new Map();
  const keytar = {
    async setPassword(service, key, text) {
      keytarCalls++;
      assert.equal(service, 'Logseq E2EE');
      if (name !== 'successful-keychain') throw new Error('synthetic-keychain-save-failure');
      keychain.set(key, text);
    },
    async getPassword(service, key) {
      keytarCalls++;
      if (name !== 'successful-keychain') throw new Error('synthetic-keychain-read-failure');
      return keychain.get(key) ?? null;
    },
    async deletePassword(service, key) {
      keytarCalls++;
      if (name !== 'successful-keychain') throw new Error('synthetic-keychain-delete-failure');
      return keychain.delete(key);
    },
  };
  const originalLoad = Module._load;
  Module._load = function (request, ...args) {
    if (request === 'keytar') {
      if (name === 'missing-keytar') throw new Error('synthetic-keytar-unavailable');
      return keytar;
    }
    return originalLoad.call(this, request, ...args);
  };
  const tree = path.resolve(__dirname, '../_build/default/js_api/js_api');
  const get = n => require(path.join(tree, 'runtime/melange', n + '.js'));
  const E = get('db_worker_effect');
  const Idb = get('idb');
  const Secret = get('secret_store');
  const awaitTask = t => new Promise((resolve, reject) => E.on_any(t, resolve, reject));
  const checkMixed = async () => {
    assert.equal(await awaitTask(Idb.get_binary('graph-key')), binary, '5-byte binary survives');
    assert.equal(await awaitTask(Idb.get('plain')), 'synthetic-string');
    assert.equal(await awaitTask(Secret.read('existing-secret')), 'synthetic-existing-secret');
  };
  const seed = async () => {
    fs.mkdirSync(dir, { recursive: true });
    await awaitTask(Idb.set_binary('graph-key', binary));
    await awaitTask(Idb.set('plain', 'synthetic-string'));
    await awaitTask(Idb.set('existing-secret', 'synthetic-existing-secret'));
  };
  const reopened = () => {
    const result = spawnSync(process.execPath, [__filename, '--reload', root], { encoding: 'utf8' });
    assert.equal(result.status, 0, result.stdout + result.stderr);
    process.stdout.write(result.stdout);
  };

  (async () => {
    if (reload) { await checkMixed(); return; }
    if (name === 'missing-directory') {
      await awaitTask(Secret.save('new-secret', 'synthetic-new-secret'));
      assert.equal(await awaitTask(Secret.read('new-secret')), 'synthetic-new-secret');
      assert.ok(fs.existsSync(file));
      return;
    }
    await seed();
    if (name === 'reads-see-idb-updates') {
      assert.equal(await awaitTask(Secret.read('plain')), 'synthetic-string');
      await awaitTask(Idb.set('plain', 'updated-string'));
      assert.equal(await awaitTask(Secret.read('plain')), 'updated-string');
    } else if (name === 'delete-preserves-later-values') {
      await awaitTask(Secret.read('existing-secret'));
      await awaitTask(Idb.set_binary('later-binary', binary));
      await awaitTask(Idb.set('later-string', 'later-value'));
      await awaitTask(Secret.$$delete('plain'));
      assert.equal(await awaitTask(Idb.get('plain')), undefined);
      assert.equal(await awaitTask(Idb.get_binary('later-binary')), binary);
      assert.equal(await awaitTask(Idb.get('later-string')), 'later-value');
      assert.equal(await awaitTask(Idb.get_binary('graph-key')), binary);
    } else if (name === 'failed-save-does-not-change-read-and-can-retry'
        || name === 'partial-write-keeps-persisted-values') {
      const before = fs.readFileSync(file, 'utf8');
      const originalWrite = fs.writeFileSync;
      fs.writeFileSync = function (target, ...args) {
        if (path.dirname(String(target)) === dir) {
          if (name === 'partial-write-keeps-persisted-values') originalWrite.call(this, target, 'partial');
          throw new Error('synthetic-kv-write-failure');
        }
        return originalWrite.call(this, target, ...args);
      };
      try {
        await assert.rejects(awaitTask(Secret.save('existing-secret', 'failed-replacement')));
      } finally { fs.writeFileSync = originalWrite; }
      assert.equal(fs.readFileSync(file, 'utf8'), before, 'failed save preserves persisted file');
      await checkMixed();
      reopened();
      await awaitTask(Secret.save('retry-secret', 'synthetic-retry'));
      assert.equal(await awaitTask(Secret.read('retry-secret')), 'synthetic-retry');
      await checkMixed();
    } else if (name === 'successful-keychain') {
      const before = fs.readFileSync(file, 'utf8');
      await awaitTask(Secret.save('new-secret', 'synthetic-keychain-secret'));
      assert.equal(await awaitTask(Secret.read('new-secret')), 'synthetic-keychain-secret');
      await awaitTask(Secret.$$delete('new-secret'));
      assert.equal(await awaitTask(Secret.read('new-secret')), undefined);
      assert.equal(fs.readFileSync(file, 'utf8'), before);
    } else if (name === 'concurrent-fallback-writes') {
      await Promise.all([
        awaitTask(Secret.save('new-secret', 'synthetic-new-secret')),
        awaitTask(Idb.set('later-string', 'later-value')),
        awaitTask(Idb.set_binary('later-binary', binary)),
        awaitTask(Secret.save('other-secret', 'synthetic-other-secret')),
      ]);
      await checkMixed();
      assert.equal(await awaitTask(Idb.get_binary('later-binary')), binary);
      assert.equal(await awaitTask(Idb.get('later-string')), 'later-value');
      assert.equal(await awaitTask(Secret.read('other-secret')), 'synthetic-other-secret');
      reopened();
    } else {
      await awaitTask(Secret.save('new-secret', 'synthetic-new-secret'));
      const after = await awaitTask(Idb.get_binary('graph-key'));
      console.log(JSON.stringify({ scenario: name, beforeBinaryLength: binary.length,
        afterBinaryPresent: after !== undefined, afterBinaryLength: after?.length }));
      await checkMixed();
      assert.equal(await awaitTask(Secret.read('new-secret')), 'synthetic-new-secret');
      reopened();
      if (name === 'cli-bypass') assert.equal(keytarCalls, 0);
    }
  })().then(() => {
    console.log(JSON.stringify({ scenario: reload ? 'fresh-process-reload' : name, result: 'pass' }));
    if (!reload) fs.rmSync(root, { recursive: true, force: true });
  }).catch(error => {
    console.error(error);
    if (!reload) fs.rmSync(root, { recursive: true, force: true });
    process.exitCode = 1;
  });
}
