import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve, join } from "node:path";

const root = mkdtempSync(join(tmpdir(), "logseq-publishing-tests-"));
const env = { ...process.env,
  LOGSEQ_PUBLISHING_GRAPH: join(root, "graph"),
  LOGSEQ_PUBLISHING_FIXTURE: join(root, "index.html") };
function run(command, args, cwd = process.cwd()) {
  const result = spawnSync(command, args, {cwd, env, stdio:"inherit", timeout:60000});
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} failed (${result.status ?? result.signal})`);
}
try {
  run(resolve("deps/db-worker/_build/default/test/native/test_publishing_native.exe"), [],
    resolve("deps/db-worker"));
  for (const script of ["test-publishing-cli.mjs", "test-publishing-browser.mjs", "test-publishing-export.mjs"])
    run(process.execPath, [join("scripts", script)]);
} finally { rmSync(root, {recursive:true, force:true}); }
