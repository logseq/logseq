import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
  bootstrapStressPageNames,
  blockByUuidQuery,
  blockExistsFromQueryResult,
  classifyHttpResult,
  classifyCliResult,
  clientRuntimeOptions,
  checksumDiagnosticsMatch,
  cliCommand,
  graphValidateArgs,
  isIdleSyncStatus,
  isSettledSyncStatus,
  mutableStressPageNames,
  offlineTodayJournalClientCount,
  operationNames,
  operationWeights,
  parseArgs,
  stressPageNames,
  stressConfigText,
  stressReferenceViewOrder,
  syncDownloadArgs,
  syncEnsureKeysArgs,
  syncNeedsEnsureKeys,
  syncServerStartArgs,
  syncStatusUninitialized,
  syncUploadArgs,
  staleIdsFromContext,
  todayJournalPageName,
  uniqueOperationPageTitle,
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

test("classifies stale task and recycled page conflicts as race outcomes", () => {
  for (const code of ["upsert-id-not-found", "recycled-page", "page-not-found"]) {
    assert.equal(
      classifyCliResult(
        { code: 1 },
        {
          status: "error",
          error: { code, message: "race" },
        },
        { id: 42 },
      ).outcome,
      "race-conflict",
    );
  }
});

test("classifies concurrent volatile property delete as a race outcome", () => {
  for (const code of ["property-not-found", "ambiguous-property-name"]) {
    assert.equal(
      classifyCliResult(
        { code: 1 },
        {
          status: "error",
          error: { code, message: "volatile property race" },
        },
        { op: "property-delete-recreate", phase: "delete" },
      ).outcome,
      "race-conflict",
    );
  }
});

test("classifies concurrent volatile tag delete as a race outcome", () => {
  assert.equal(
    classifyCliResult(
      { code: 1 },
      {
        status: "error",
        error: { code: "tag-not-found", message: "tag not found" },
      },
      { op: "tag-delete-recreate", phase: "delete" },
    ).outcome,
    "race-conflict",
  );
});

test("classifies stale raw outliner block property failures as race outcomes", () => {
  assert.equal(
    classifyHttpResult(
      { ok: false, status: 500 },
      {
        error: {
          code: "exception",
          message: "Set block property failed: block or property doesn't exist",
        },
      },
      { id: 525, op: "http-set-block-property" },
    ).outcome,
    "race-conflict",
  );
});

test("classifies stale raw view targets as race outcomes", () => {
  for (const message of [
    'Nothing found for entity id (:block/uuid #uuid "b5cf1ff2-1403-4eed-9449-d326b1e9efad")',
    'Nothing found for entity id [:block/uuid #uuid "b5cf1ff2-1403-4eed-9449-d326b1e9efad"]',
  ]) {
    assert.equal(
      classifyHttpResult(
        { ok: false, status: 500 },
        {
          error: {
            code: "exception",
            message,
          },
        },
        { id: 231, op: "http-create-unlinked-references-view" },
      ).outcome,
      "race-conflict",
    );
  }
});

test("builds block uuid lookup queries for raw view target checks", () => {
  assert.equal(
    blockByUuidQuery("b5cf1ff2-1403-4eed-9449-d326b1e9efad"),
    '[:find ?b . :where [?b :block/uuid #uuid "b5cf1ff2-1403-4eed-9449-d326b1e9efad"]]',
  );
});

test("detects existing blocks from uuid lookup query results", () => {
  assert.equal(blockExistsFromQueryResult({ parsed: { data: { result: 231 } } }), true);
  assert.equal(blockExistsFromQueryResult({ parsed: { data: { result: null } } }), false);
});

test("classifies required outliner no-op results as failures", () => {
  assert.deepEqual(
    classifyHttpResult(
      { ok: true, status: 200 },
      { result: null },
      { op: "http-recycle-delete-page", phase: "permanent-delete", requireTruthyResult: true },
    ),
    {
      ok: false,
      level: "error",
      outcome: "no-op",
      expectedRace: false,
    },
  );
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
    process.cwd(),
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

test("parses isolated local db-sync server paths", () => {
  const opts = parseArgs([
    "--sync-server-pid-file",
    "tmp/stress/server.pid",
    "--sync-server-log-file",
    "tmp/stress/server.log",
    "--sync-server-data-dir",
    "tmp/stress/server-data",
  ]);

  assert.equal(opts.syncServerPidFile.endsWith("/tmp/stress/server.pid"), true);
  assert.equal(opts.syncServerLogFile.endsWith("/tmp/stress/server.log"), true);
  assert.equal(opts.syncServerDataDir.endsWith("/tmp/stress/server-data"), true);
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
  assert.equal(syncNeedsEnsureKeys({ graphE2ee: true }), true);

  assert.deepEqual(syncEnsureKeysArgs({ e2eePassword: "11111" }), [
    "sync",
    "ensure-keys",
    "--upload-keys",
    "--e2ee-password",
    "11111",
  ]);

  assert.deepEqual(syncUploadArgs({ graph: "pi-memory", e2eePassword: "11111" }), [
    "sync",
    "upload",
    "--graph",
    "pi-memory",
    "--e2ee-password",
    "11111",
  ]);

  assert.equal(syncNeedsEnsureKeys({ graphE2ee: false }), false);
  assert.deepEqual(syncUploadArgs({ graph: "pi-memory", e2eePassword: "11111", graphE2ee: false }), [
    "sync",
    "upload",
    "--graph",
    "pi-memory",
  ]);
});

test("builds final graph validation command", () => {
  assert.deepEqual(graphValidateArgs({ graph: "pi-memory" }), ["graph", "validate", "--graph", "pi-memory"]);
});

test("builds isolated runtime options for additional sync clients", () => {
  const seed = clientRuntimeOptions(
    {
      graph: "pi-memory",
      config: "/tmp/stress/cli.edn",
      logFile: "/tmp/stress/events.jsonl",
      rootDir: "/tmp/stress/root",
      homeDir: "/tmp/stress/home",
      timeoutMs: 60000,
    },
    0,
  );
  const replica = clientRuntimeOptions(seed, 1);

  assert.equal(seed.graph, "pi-memory");
  assert.equal(replica.graph, "pi-memory");
  assert.equal(seed.config, "/tmp/stress/cli.edn");
  assert.equal(replica.config, "/tmp/stress/clients/client-2/cli.edn");
  assert.equal(seed.env.LOGSEQ_CLI_ROOT_DIR, "/tmp/stress/root");
  assert.equal(replica.env.LOGSEQ_CLI_ROOT_DIR, "/tmp/stress/clients/client-2/root");
  assert.equal(replica.env.HOME, "/tmp/stress/clients/client-2/home");
});

test("parses isolated root dir for the seed client", () => {
  const opts = parseArgs(["--root-dir", "/tmp/stress/root"]);

  assert.equal(opts.rootDir, "/tmp/stress/root");
});

test("runs staged JavaScript CLI bundles through node", () => {
  assert.deepEqual(cliCommand("/tmp/logseq-cli.js"), {
    command: process.execPath,
    args: ["/tmp/logseq-cli.js"],
  });
  assert.deepEqual(cliCommand("/usr/local/bin/logseq"), {
    command: "/usr/local/bin/logseq",
    args: [],
  });
});

test("builds sync download command for replica clients", () => {
  assert.deepEqual(syncDownloadArgs({ graph: "pi-memory", graphE2ee: false }), [
    "sync",
    "download",
    "--graph",
    "pi-memory",
  ]);
  assert.deepEqual(syncDownloadArgs({ graph: "pi-memory", graphE2ee: true, e2eePassword: "11111" }), [
    "sync",
    "download",
    "--graph",
    "pi-memory",
    "--e2ee-password",
    "11111",
  ]);
});

test("detects final sync convergence from status checks", () => {
  assert.equal(
    isSettledSyncStatus({
      ok: true,
      parsed: {
        data: {
          "pending-local": 0,
          "pending-server": 0,
          "local-checksum": "abc",
          "remote-checksum": "abc",
        },
      },
    }),
    true,
  );

  assert.equal(
    isSettledSyncStatus({
      ok: true,
      parsed: {
        data: {
          "pending-local": 1,
          "pending-server": 0,
          "local-checksum": "abc",
          "remote-checksum": "abc",
        },
      },
    }),
    false,
  );

  assert.equal(
    isSettledSyncStatus({
      ok: true,
      parsed: {
        data: {
          "pending-local": 0,
          "pending-server": 0,
          "local-checksum": "abc",
          "remote-checksum": "def",
        },
      },
    }),
    false,
  );
});

test("detects idle sync status separately from cached checksums", () => {
  assert.equal(
    isIdleSyncStatus({
      ok: true,
      parsed: {
        data: {
          "last-error": null,
          "pending-local": 0,
          "pending-server": 0,
          "local-tx": 40,
          "remote-tx": 40,
          "local-checksum": "old",
          "remote-checksum": "new",
        },
      },
    }),
    true,
  );

  assert.equal(
    isIdleSyncStatus({
      ok: true,
      parsed: {
        data: {
          "last-error": null,
          "pending-local": 0,
          "pending-server": 1,
          "local-tx": 40,
          "remote-tx": 40,
        },
      },
    }),
    false,
  );
});

test("matches recomputed checksum diagnostics against remote checksum", () => {
  assert.equal(
    checksumDiagnosticsMatch(
      new Map([
        ["recomputed-checksum", "abc"],
        ["remote-checksum", "abc"],
      ]),
    ),
    true,
  );
  assert.equal(
    checksumDiagnosticsMatch(
      new Map([
        ["recomputed-checksum", "abc"],
        ["remote-checksum", "def"],
      ]),
    ),
    false,
  );
});

test("does not re-upload when linked graph has no remote tx before websocket start", () => {
  assert.equal(
    syncStatusUninitialized({
      ok: true,
      parsed: {
        data: {
          "graph-id": "ea64137c-e829-49fb-98de-dc83b745377b",
          "local-tx": 55,
          "remote-tx": null,
        },
      },
    }),
    false,
  );

  assert.equal(
    syncStatusUninitialized({
      ok: true,
      parsed: {
        data: {
          "graph-id": null,
          "local-tx": 55,
          "remote-tx": null,
        },
      },
    }),
    true,
  );
});

test("builds a multi-page stress surface with journal pages", () => {
  assert.deepEqual(
    stressPageNames({
      page: "CLI Concurrent Stress",
      extraPages: 2,
      journalPages: 2,
      journalStart: "2026-07-01",
    }),
    [
      "CLI Concurrent Stress",
      "CLI Concurrent Stress page 2",
      "CLI Concurrent Stress page 3",
      "Jul 1st, 2026",
      "Jul 2nd, 2026",
    ],
  );
});

test("mutable stress pages exclude journal pages", () => {
  assert.deepEqual(
    mutableStressPageNames({
      page: "CLI Concurrent Stress",
      extraPages: 2,
      journalPages: 2,
      journalStart: "2026-07-01",
    }),
    ["CLI Concurrent Stress page 2", "CLI Concurrent Stress page 3"],
  );
});

test("bootstrap stress pages exclude auto-created journal pages", () => {
  assert.deepEqual(
    bootstrapStressPageNames({
      page: "CLI Concurrent Stress",
      extraPages: 2,
      journalPages: 2,
      journalStart: "2026-07-01",
    }),
    ["CLI Concurrent Stress", "CLI Concurrent Stress page 2", "CLI Concurrent Stress page 3"],
  );
});

test("today journal page name uses the local calendar date", () => {
  assert.equal(todayJournalPageName({}, new Date("2026-07-01T16:30:00+08:00")), "Jul 1st, 2026");
  assert.equal(todayJournalPageName({ todayDate: "2026-07-02" }), "Jul 2nd, 2026");
});

test("reference view stress orders stay in generated fractional-index form", () => {
  assert.equal(stressReferenceViewOrder({ seq: 0 }, 0), "a0");
  assert.equal(stressReferenceViewOrder({ seq: 30 }, 0), "ay");
  assert.equal(stressReferenceViewOrder({ seq: 31 }, 0), "b00");
  assert.equal(stressReferenceViewOrder({ seq: 61 }, 1), "b0z");
  assert.equal(stressReferenceViewOrder({ seq: 62 }, 0), "b10");

  for (let seq = 0; seq < 1000; seq += 1) {
    assert.match(stressReferenceViewOrder({ seq }, 0), /^(a[0-9A-Za-z]|b[0-9A-Za-z][0-9A-Za-z])$/);
    assert.match(stressReferenceViewOrder({ seq }, 1), /^(a[0-9A-Za-z]|b[0-9A-Za-z][0-9A-Za-z])$/);
    assert.notEqual(stressReferenceViewOrder({ seq }, 0), stressReferenceViewOrder({ seq }, 1));
  }
});

test("raw page delete/restore uses unique operation-owned page titles", () => {
  const state = { runId: "stress-1" };
  const first = uniqueOperationPageTitle("CLI HTTP Delete Restore", state, { workerId: 3, seq: 305 });
  const second = uniqueOperationPageTitle("CLI HTTP Delete Restore", state, { workerId: 3, seq: 305 });
  const third = uniqueOperationPageTitle("CLI HTTP Delete Restore", state, { workerId: 4, seq: 305 });

  assert.match(first, /^CLI HTTP Delete Restore stress-1 worker-3 seq-305 /);
  assert.notEqual(first, second);
  assert.notEqual(first, third);
});

test("operation set covers broad outliner and metadata mutations", () => {
  const names = operationNames({ sync: true, offline: true });

  for (const name of [
    "create-root",
    "create-child",
    "create-tree",
    "update",
    "move-child",
    "move-page",
    "move-sibling",
    "block-tags-add",
    "block-tags-remove",
    "block-properties-add",
    "block-properties-remove",
    "task-create",
    "task-update",
    "page-upsert",
    "page-properties-add",
    "page-properties-remove",
    "page-delete-restore",
    "tag-upsert",
    "tag-delete-recreate",
    "property-upsert",
    "property-delete-recreate",
    "http-insert-blocks",
    "http-delete-blocks",
    "http-move-blocks",
    "http-save-block",
    "http-move-up-down",
    "http-indent-outdent",
    "http-apply-template",
    "http-create-page",
    "http-rename-page",
    "http-delete-restore-page",
    "http-recycle-delete-page",
    "http-upsert-property",
    "http-set-block-property",
    "http-remove-block-property",
    "http-batch-set-property",
    "http-batch-remove-property",
    "http-batch-delete-property-value",
    "http-create-property-history",
    "http-create-linked-references-view",
    "http-create-unlinked-references-view",
    "http-toggle-reaction",
    "http-delete-view-target-with-related-entities",
    "http-insert-undo-redo",
    "delete-single",
    "delete-batch",
    "delete-update-race",
    "offline-window",
    "offline-today-journal-race",
  ]) {
    assert.equal(names.includes(name), true, `${name} should be in the operation set`);
  }
});

test("offline operation is available only when sync offline simulation is enabled", () => {
  assert.equal(operationNames({ sync: true, offline: true }).includes("offline-window"), true);
  assert.equal(operationNames({ sync: true, offline: false }).includes("offline-window"), false);
  assert.equal(operationNames({ sync: false, offline: true }).includes("offline-window"), false);
  assert.equal(operationNames({ sync: true, offline: true }).includes("offline-today-journal-race"), true);
  assert.equal(operationNames({ sync: true, offline: false }).includes("offline-today-journal-race"), false);
  assert.equal(operationNames({ sync: false, offline: true }).includes("offline-today-journal-race"), false);
  assert.ok(
    new Map(operationWeights({ sync: true, offline: true })).get("offline-today-journal-race") >= 8,
    "offline today journal race should run often enough to catch page creation conflicts",
  );
});

test("offline today journal race uses actual sync clients instead of worker concurrency", () => {
  assert.equal(offlineTodayJournalClientCount({ clients: 3, concurrency: 8 }), 3);
  assert.equal(offlineTodayJournalClientCount({ clients: 1, concurrency: 8 }), 2);
});

test("multi-client offline operations require sync, offline mode, and more than one client", () => {
  assert.equal(operationNames({ sync: true, offline: true, clients: 3 }).includes("multi-client-offline-rebase"), true);
  assert.equal(operationNames({ sync: true, offline: true, clients: 3 }).includes("multi-client-today-journal-race"), true);
  assert.equal(operationNames({ sync: true, offline: true, clients: 1 }).includes("multi-client-offline-rebase"), false);
  assert.equal(operationNames({ sync: true, offline: false, clients: 3 }).includes("multi-client-offline-rebase"), false);
  assert.equal(operationNames({ sync: false, offline: true, clients: 3 }).includes("multi-client-offline-rebase"), false);
});

test("3k sync stress includes view-related history references and reactions", () => {
  const maxOps = 3000;
  const weights = new Map(operationWeights({ sync: true, offline: true, clients: 3 }));
  const totalWeight = [...weights.values()].reduce((sum, weight) => sum + weight, 0);

  for (const name of [
    "http-create-property-history",
    "http-create-linked-references-view",
    "http-create-unlinked-references-view",
    "http-toggle-reaction",
    "http-delete-view-target-with-related-entities",
  ]) {
    assert.ok(weights.has(name), `${name} should be in the sync stress operation set`);
    assert.ok((weights.get(name) / totalWeight) * maxOps >= 10, `${name} should run often enough in a 3k-op stress run`);
  }
});

test("critical outliner mutations dominate the stress distribution", () => {
  const weights = new Map(operationWeights({ sync: true, offline: true }));
  const criticalOps = [
    "create-root",
    "create-child",
    "create-tree",
    "move-child",
    "move-page",
    "move-sibling",
    "http-insert-blocks",
    "http-delete-blocks",
    "http-move-blocks",
    "http-move-up-down",
    "http-indent-outdent",
    "http-delete-restore-page",
    "http-delete-view-target-with-related-entities",
    "http-insert-undo-redo",
    "delete-single",
    "delete-batch",
    "delete-update-race",
  ];
  const totalWeight = [...weights.values()].reduce((sum, weight) => sum + weight, 0);
  const criticalWeight = criticalOps.reduce((sum, name) => sum + (weights.get(name) || 0), 0);

  assert.ok(criticalWeight / totalWeight >= 0.65, "insert/delete/move/undo-redo operations should dominate the run");
  assert.ok((weights.get("http-insert-undo-redo") || 0) >= 8, "undo/redo should run often enough to catch regressions");
  assert.ok((weights.get("http-insert-blocks") || 0) >= 8, "raw insert should run often enough to catch regressions");
  assert.ok((weights.get("http-delete-blocks") || 0) >= 8, "raw delete should run often enough to catch regressions");
  assert.ok((weights.get("http-move-blocks") || 0) >= 8, "raw move should run often enough to catch regressions");
});
