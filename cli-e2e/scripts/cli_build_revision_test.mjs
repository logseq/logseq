import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'logseq-build-revision-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
  git('init', '-q');
  git('config', 'user.name', 'Build Test');
  git('config', 'user.email', 'build-test@example.invalid');
  const file = path.join(root, 'source');
  fs.writeFileSync(file, 'original');
  git('add', 'source');
  git('commit', '-qm', 'Initial fixture');
  return { root, file, git };
}

async function cliRevision(root, revision) {
  // Import the actual Vite configuration in a fresh process, as Dune does.
  const config = new URL('../../cli/vite.config.mjs', import.meta.url).href;
  const env = { ...process.env, DUNE_SOURCEROOT: root };
  delete env.LOGSEQ_REVISION;
  if (revision !== undefined) env.LOGSEQ_REVISION = revision;
  return execFileSync(process.execPath, ['--input-type=module', '-e',
    `const config = (await import(${JSON.stringify(config)})).default; console.log(JSON.parse(config.define.LOGSEQ_CLI_REVISION));`],
  { env, encoding: 'utf8' }).trim();
}

for (const state of ['clean', 'timestamp-only', 'modified', 'annotated-tag']) {
  test(`CLI and worker revisions agree for ${state} source`, async t => {
    const { root, file, git } = fixture(t);
    if (state === 'timestamp-only') {
      const changedTime = new Date(Date.now() + 5000);
      fs.utimesSync(file, changedTime, changedTime);
    }
    if (state === 'modified') fs.writeFileSync(file, 'changed');
    if (state === 'annotated-tag') git('tag', '-a', 'v1.0.0', '-m', 'Release fixture');
    const cli = await cliRevision(root);
    // Match the existing Shadow build-metadata-hook, after the CLI build.
    const worker = git('describe', '--long', '--always', '--dirty');
    assert.equal(cli, worker);
    if (state === 'timestamp-only') assert.equal(git('diff'), '');
    if (state === 'modified') assert.match(cli, /-dirty$/);
  });
}

test('an explicit build revision takes precedence over Git metadata', async t => {
  const { root } = fixture(t);
  assert.equal(await cliRevision(root, 'release-override'), 'release-override');
});
