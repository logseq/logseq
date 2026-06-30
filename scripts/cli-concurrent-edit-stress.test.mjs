import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
  classifyCliResult,
  stressConfigText,
  syncServerStartArgs,
  syncUploadArgs,
  staleIdsFromContext,
} from "./cli-concurrent-edit-stress.mjs";

test("classifies stale block conflicts as race outcomes", () => {
  const parsed = {
    status: "error",
    error: {
      code: "source-not-found",
      message: "source block uuid not found",
    },
  };

  assert.deepEqual(classifyCliResult({ code: 1 }, parsed, { id: 1911 }), {
    ok: false,
    level: "info",
    outcome: "race-conflict",
    expectedRace: true,
  });
});

test("keeps created-id resolution failures visible as errors", () => {
  const parsed = {
    status: "error",
    error: {
      code: "add-id-resolution-failed",
      message: "unable to resolve created ids",
    },
  };

  assert.deepEqual(classifyCliResult({ code: 1 }, parsed, { parentId: 710 }), {
    ok: false,
    level: "error",
    outcome: "failed",
    expectedRace: false,
  });
});

test("extracts stale ids from operation context", () => {
  assert.deepEqual(staleIdsFromContext({ id: 1, targetId: 2, parentId: 3, ids: [4, "x", 5] }), [1, 2, 3, 4, 5]);
});

test("builds local db-sync server start command from sync base", () => {
  const args = syncServerStartArgs({
    syncBase: "http://127.0.0.1:19090",
    authPath: "/tmp/auth.json",
    syncServerPidFile: "/tmp/stress/server.pid",
    syncServerLogFile: "/tmp/stress/server.log",
    syncServerDataDir: "/tmp/stress/server-data",
  });

  assert.deepEqual(args, [
    "cli-e2e/scripts/db_sync_server.py",
    "start",
    "--repo-root",
    "/Users/tiensonqin/Codes/projects/logseq",
    "--pid-file",
    "/tmp/stress/server.pid",
    "--log-file",
    "/tmp/stress/server.log",
    "--data-dir",
    "/tmp/stress/server-data",
    "--host",
    "127.0.0.1",
    "--port",
    "19090",
    "--startup-timeout-s",
    "25",
    "--auth-path",
    "/tmp/auth.json",
  ]);
});

test("stress config includes runtime auth to avoid refresh during sync start", () => {
  const dir = mkdtempSync(join(tmpdir(), "logseq-stress-auth-"));
  const authPath = join(dir, "auth.json");
  writeFileSync(
    authPath,
    JSON.stringify({
      "refresh-token": "refresh-1",
      "id-token": "id-1",
      "access-token": "access-1",
    }),
  );

  const text = stressConfigText({
    httpBase: "http://127.0.0.1:18080",
    wsUrl: "ws://127.0.0.1:18080/sync/%s",
    authPath,
  });

  assert.match(text, /:auth-path "/);
  assert.match(text, /:refresh-token "refresh-1"/);
  assert.match(text, /:id-token "id-1"/);
  assert.match(text, /:access-token "access-1"/);
});

test("builds sync upload initialization command with e2ee password", () => {
  assert.deepEqual(syncUploadArgs({ graph: "pi-memory", e2eePassword: "11111" }), [
    "sync",
    "upload",
    "--graph",
    "pi-memory",
    "--e2ee-password",
    "11111",
  ]);
});
