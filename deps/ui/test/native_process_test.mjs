import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const binary = process.argv[2] ? resolve(process.argv[2])
  : fileURLToPath(new URL("../_build/default/gpui/drive_test.exe", import.meta.url));

test("native view scenarios persist only in the supplied application state directory", async t => {
  const stateDir = await mkdtemp(join(tmpdir(), "logseq-native-ui-"));
  try {
    const stateFile = join(stateDir, "ui-state.json");
    await writeFile(stateFile, JSON.stringify({ "scenario-marker": "preserved" }));
    const result = spawnSync(binary, [], {
      env: { ...process.env, LOGSEQ_UI_STATE_DIR: stateDir, LOGSEQ_ROOT_DIR: join(stateDir, "graphs-root"), LOGSEQ_NO_LOGIN_DAEMON: "1" },
      encoding: "utf8",
      timeout: 30000,
    });
    assert.equal(result.status, 0, result.error?.message ?? result.stdout + result.stderr);
    t.diagnostic(result.stdout.trim());
    const saved = JSON.parse(await readFile(stateFile, "utf8"));
    assert.equal(saved["scenario-marker"], "preserved");
    assert.equal(saved["ls-left-sidebar-open?"], "false");
  } finally {
    await rm(stateDir, { recursive: true, force: true });
  }
});

test("an empty native state directory fails before application startup", () => {
  const result = spawnSync(binary, [], {
    env: { ...process.env, LOGSEQ_UI_STATE_DIR: "", LOGSEQ_ROOT_DIR: "/nonexistent/logseq-test-root", LOGSEQ_NO_LOGIN_DAEMON: "1" },
    encoding: "utf8",
    timeout: 30000,
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /LOGSEQ_UI_STATE_DIR must not be empty/);
});
