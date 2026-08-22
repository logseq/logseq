import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import test from "node:test";

const workerDir = path.dirname(fileURLToPath(import.meta.url));
const dbSyncDir = path.dirname(workerDir);
const startScript = path.join(dbSyncDir, "start.sh");

function runStart(overrides = {}) {
  const fakeBin = mkdtempSync(path.join(tmpdir(), "db-sync-start-"));
  const commandLog = path.join(fakeBin, "commands.log");

  for (const command of ["node", "pnpm"]) {
    const executable = path.join(fakeBin, command);
    writeFileSync(
      executable,
      `#!/bin/sh\nprintf '%s|%s|%s\\n' '${command}' "$PWD" "$*" >> "$COMMAND_LOG"\n`,
      { mode: 0o755 },
    );
  }

  const env = {
    ...process.env,
    PATH: `${fakeBin}:${process.env.PATH}`,
    COMMAND_LOG: commandLog,
    ...overrides,
  };
  delete env.COGNITO_ISSUER;
  delete env.COGNITO_CLIENT_ID;
  delete env.COGNITO_JWKS_URL;

  const result = spawnSync("bash", [startScript], {
    cwd: tmpdir(),
    env,
    encoding: "utf8",
  });

  try {
    assert.equal(result.status, 0, result.stderr);
    return readFileSync(commandLog, "utf8").trim().split("\n");
  } finally {
    rmSync(fakeBin, { recursive: true, force: true });
  }
}

test("starts the local Worker with Wrangler on all interfaces", () => {
  assert.deepEqual(runStart(), [
    `pnpm|${dbSyncDir}|release`,
    `pnpm|${dbSyncDir}|build:api-docs`,
    `pnpm|${dbSyncDir}|migrate:local`,
    `pnpm|${workerDir}|exec wrangler dev --local --ip 0.0.0.0 --port 8787`,
  ]);
});

test("allows explicitly overriding the local bind address and port", () => {
  assert.deepEqual(runStart({ DB_SYNC_IP: "127.0.0.1", DB_SYNC_PORT: "9876" }), [
    `pnpm|${dbSyncDir}|release`,
    `pnpm|${dbSyncDir}|build:api-docs`,
    `pnpm|${dbSyncDir}|migrate:local`,
    `pnpm|${workerDir}|exec wrangler dev --local --ip 127.0.0.1 --port 9876`,
  ]);
});
