import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
  buildPropertyReadbackDiagnostic,
  bootstrapStressPageNames,
  blockByUuidQuery,
  blockExistsFromQueryResult,
  classifyHttpResult,
  classifyCliResult,
  clientRuntimeOptions,
  completeVolatilePropertyDelete,
  checksumDiagnosticsMatch,
  cliCommand,
  createStressInvocationTracker,
  createVolatilePropertyDeleteHistory,
  graphValidateArgs,
  isIdleSyncStatus,
  isSettledSyncStatus,
  mutableStressPageNames,
  offlineTodayJournalClientCount,
  operationNames,
  operationWeights,
  parseArgs,
  runCli,
  runSyncStart,
  stressPageNames,
  stressConfigText,
  stressReferenceViewOrder,
  startVolatilePropertyDelete,
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

test("sync start accounts for recovered and exhausted fetch retries", async (t) => {
  const dir = mkdtempSync(join(tmpdir(), "logseq-stress-sync-retry-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const bin = join(dir, "cli.js");
  writeFileSync(bin, `
    const fs = require("node:fs");
    const marker = process.env.LOGSEQ_CLI_CONFIG + ".attempted";
    if (process.argv[2] === "sync" && (!fs.existsSync(marker) || process.env.FAIL_RETRY === "1")) {
      fs.writeFileSync(marker, "attempted");
      console.error("Failure(fetch failed)");
      process.exit(1);
    }
    console.log(JSON.stringify({ status: "ok" }));
  `);
  for (const failRetry of [false, true]) {
    const opts = {
      clientIndex: 0,
      clientClis: [bin],
      config: join(dir, `${failRetry}.edn`),
      graph: "stress-graph",
      logFile: join(dir, `${failRetry}.jsonl`),
      timeoutMs: 5000,
      env: { FAIL_RETRY: failRetry ? "1" : "0" },
      runSummary: { unexpectedErrors: 0, workerErrors: 0, operations: {} },
    };
    const response = await runSyncStart(opts, { op: "offline-today-journal-race", phase: "start" });
    assert.equal(response.ok, !failRetry);
    assert.equal(opts.runSummary.unexpectedErrors, failRetry ? 1 : 0);
    const counts = opts.runSummary.operations["cli:offline-today-journal-race"];
    assert.equal(counts.retried, 1);
    assert.equal(counts.unexpectedErrors, failRetry ? 1 : 0);
    const [first] = readFileSync(opts.logFile, "utf8").trim().split("\n").map(JSON.parse);
    assert.equal(first.outcome, "retried");
    assert.equal(first.level, "warn");
    assert.equal(first.stderr, "Failure(fetch failed)");
  }
});

test("logs bounded, content-free diagnostics only for unexpected create-tree ID failures", async (t) => {
  const dir = mkdtempSync(join(tmpdir(), "logseq-stress-trace-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const bin = join(dir, "cli.js");
  writeFileSync(bin, `
    const result = JSON.parse(process.argv[2]);
    if (process.env.LOGSEQ_CLI_STRESS_CREATE_TREE_TRACE !== process.argv[3]) process.exit(2);
    console.log(JSON.stringify(result));
    process.exitCode = result.status === "ok" ? 0 : 1;
  `);

  const tracker = createStressInvocationTracker();
  const opts = {
    clientName: "client-2",
    clientIndex: 1,
    clientClis: [null, bin],
    config: join(dir, "cli.edn"),
    graph: "stress-graph",
    page: "private page title",
    logFile: join(dir, "events.jsonl"),
    timeoutMs: 5000,
    runSummary: { unexpectedErrors: 0, workerErrors: 0, operations: {} },
    stressInvocations: tracker,
  };
  const requested = [1, 2, 3].map((i) => `96cbeb1e-2582-4e77-9b9e-9b1e47912b1${i}`);
  const trace = {
    "requested-uuids": requested,
    "target-uuid": "96cbeb1e-2582-4e77-9b9e-9b1e47912b14",
    "failed-uuid": requested[1],
    "apply-returned-result": true,
    "present-after-apply": [true, true, true],
    "present-at-lookup": [true, false, true],
    title: "private block content",
  };
  const failure = { status: "error", error: {
    code: "add-id-resolution-failed", message: "unable to resolve created ids", "create-tree-trace": trace,
  } };
  const context = { op: "create-tree", workerId: 2, seq: 49, page: opts.page };
  const run = (result, ctx = context) =>
    runCli(opts, [JSON.stringify(result), ctx.op === "create-tree" ? "1" : "", "private command content"], ctx);
  const unrelated = tracker.start("client-1", "cli", { op: "finished-before", workerId: 1, seq: 30 });
  unrelated.finish();
  const overlapping = tracker.start("client-3", "http", {
    op: "http-delete-restore-page", workerId: 3, seq: 55, phase: "delete", page: opts.page,
  });
  const pending = run(failure);
  overlapping.finish();
  for (let seq = 0; seq < 20; seq += 1) {
    tracker.start("client-1", "cli", { op: "delete-single", workerId: 1, seq, id: 901 }).finish();
  }
  await pending;
  await run({ status: "ok", data: trace });
  await run({ status: "error", error: { code: "target-not-found" } });
  await run({ ...failure, error: { ...failure.error, "create-tree-trace": undefined } },
    { ...context, op: "preflight-create-tree" });

  const events = readFileSync(opts.logFile, "utf8").trim().split("\n").map(JSON.parse);
  const [failed, ...other] = events;
  assert.equal(failed.outcome, "failed");
  assert.equal(failed.error.code, "add-id-resolution-failed");
  assert.equal(failed.context.client, "client-2");
  const diagnostics = failed.createTreeDiagnostics;
  assert.equal(diagnostics.targetUuid, trace["target-uuid"]);
  assert.equal(diagnostics.failedUuid, requested[1]);
  assert.equal(diagnostics.applyReturnedResult, true);
  assert.deepEqual(diagnostics.requested, [
    { uuid: requested[0], presentAfterApply: true, presentAtLookup: true },
    { uuid: requested[1], presentAfterApply: true, presentAtLookup: false },
    { uuid: requested[2], presentAfterApply: true, presentAtLookup: true },
  ]);
  assert.equal(diagnostics.overlapping.length, 16);
  assert.equal(diagnostics.overlappingOmitted, 5);
  assert.equal(diagnostics.overlapping[0].op, "http-delete-restore-page");
  assert.equal(diagnostics.overlapping[0].client, "client-3");
  assert.equal(diagnostics.overlapping[0].samePage, true);
  assert.doesNotMatch(JSON.stringify(failed), /private|finished-before/);
  assert.ok(other.every((event) => !("createTreeDiagnostics" in event)));
  assert.deepEqual(opts.runSummary.operations["cli:create-tree"], { ok: 1, expectedRace: 1, unexpectedErrors: 1 });
  assert.equal(opts.runSummary.unexpectedErrors, 2);
});

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

test("reports bounded volatile property readback candidates without claiming causality", () => {
  const property = "cli-stress-volatile-prop";
  const unsafePayload = {
    args: ["unsafe-args-value"],
    stdout: "unsafe-stdout-value",
    stderr: "unsafe-stderr-value",
    graph: "unsafe-graph-value",
    page: "unsafe-page-value",
  };
  const context = {
    clientIndex: 0,
    workerId: 1,
    seq: 10,
    op: "property-upsert",
    property,
    ...unsafePayload,
  };
  const parsed = {
    status: "error",
    error: { code: "property-not-found", message: "property not found after upsert" },
  };
  const addDelete = (history, { clientIndex = 1, workerId, seq, startMs, endMs, success, outcome }) => {
    const record = startVolatilePropertyDelete(history, {
      clientIndex,
      workerId,
      seq,
      startMs,
      ...unsafePayload,
    });
    if (endMs != null) {
      completeVolatilePropertyDelete(record, { endMs, success, outcome });
    }
  };
  const createHistoryWithDelete = (options) => {
    const history = createVolatilePropertyDeleteHistory();
    addDelete(history, options);
    return history;
  };
  const makeDiagnostic = (options) =>
    buildPropertyReadbackDiagnostic({
      clientIndex: 0,
      context,
      parsed,
      startMs: 10,
      endMs: 20,
      ...options,
    });
  const overlapCases = [
    {
      name: "completed overlap",
      history: createHistoryWithDelete({ workerId: 2, seq: 20, startMs: 15, endMs: 25, success: true, outcome: "ok" }),
      overlaps: true,
      inFlight: false,
      success: true,
      outcome: "ok",
    },
    {
      name: "completed non-overlap",
      history: createHistoryWithDelete({ workerId: 3, seq: 30, startMs: 0, endMs: 9, success: false, outcome: "failed" }),
      overlaps: false,
      inFlight: false,
      success: false,
      outcome: "failed",
    },
    {
      name: "in-flight overlap",
      history: createHistoryWithDelete({ workerId: 4, seq: 40, startMs: 18, endMs: null }),
      overlaps: true,
      inFlight: true,
      success: null,
      outcome: null,
    },
  ];

  for (const example of overlapCases) {
    const diagnostic = makeDiagnostic({ history: example.history });
    assert.equal(diagnostic.readbackOrdering, "unknown", example.name);
    assert.ok(typeof diagnostic.readbackOrderingReason === "string" && diagnostic.readbackOrderingReason.length > 0);
    assert.equal(diagnostic.deleteCandidates[0].commandOverlap, example.overlaps, example.name);
    assert.equal(diagnostic.deleteCandidates[0].inFlight, example.inFlight, example.name);
    assert.equal(diagnostic.deleteCandidates[0].success, example.success, example.name);
    assert.equal(diagnostic.deleteCandidates[0].outcome, example.outcome, example.name);
  }
  const safeDiagnostic = makeDiagnostic({ history: overlapCases[0].history });
  assert.deepEqual(safeDiagnostic.failedCommand, {
    clientIndex: 0,
    workerId: 1,
    seq: 10,
    startMs: 10,
    endMs: 20,
    elapsedMs: 10,
  });

  const recreateContext = { ...context, op: "property-delete-recreate", phase: "recreate" };
  assert.ok(makeDiagnostic({ history: createVolatilePropertyDeleteHistory(), context: recreateContext }));
  for (const options of [
    { context: { ...context, property: "another-property" } },
    { context: { ...context, op: "tag-upsert" } },
    { context: { ...context, op: "property-delete-recreate", phase: "delete" } },
    { parsed: { status: "error", error: { code: "ambiguous-property-name", message: "property not found after upsert" } } },
    { parsed: { status: "error", error: { code: "property-not-found", message: "different failure" } } },
    { parsed: { status: "ok", error: parsed.error } },
  ]) {
    assert.equal(makeDiagnostic({ history: createVolatilePropertyDeleteHistory(), ...options }), null);
  }

  const priorityHistory = createVolatilePropertyDeleteHistory();
  addDelete(priorityHistory, { workerId: 99, seq: 99, startMs: 0, endMs: 30, success: true, outcome: "ok" });
  for (let index = 0; index < 8; index += 1) {
    addDelete(priorityHistory, {
      workerId: index,
      seq: index,
      startMs: 30 + index,
      endMs: 31 + index,
      success: true,
      outcome: "ok",
    });
  }
  const priorityDiagnostic = makeDiagnostic({ history: priorityHistory });
  assert.equal(priorityDiagnostic.deleteCandidates.length, 8);
  assert.equal(priorityDiagnostic.deleteCandidates[0].workerId, 99);
  assert.equal(priorityDiagnostic.deleteCandidates[0].commandOverlap, true);

  const boundedHistory = createVolatilePropertyDeleteHistory();
  for (let index = 0; index < 65; index += 1) {
    addDelete(boundedHistory, {
      clientIndex: index % 3,
      workerId: index,
      seq: index,
      startMs: index,
      endMs: index + 0.5,
      success: true,
      outcome: "ok",
    });
  }
  const boundedDiagnostic = makeDiagnostic({ history: boundedHistory });
  assert.equal(boundedHistory.records.length, 64);
  assert.equal(boundedDiagnostic.deleteHistory.totalCount, 65);
  assert.equal(boundedDiagnostic.deleteHistory.evictedCount, 1);
  assert.equal(boundedDiagnostic.deleteHistory.truncated, true);
  assert.equal(boundedDiagnostic.deleteCandidates.length, 8);
  assert.equal(boundedDiagnostic.deleteCandidateListTruncated, true);
  assert.equal(boundedDiagnostic.deleteCandidateOmittedCount, 57);
  assert.equal(boundedDiagnostic.retainedDeleteOverlapCount, 11);
  assert.equal(boundedDiagnostic.deleteCandidates.filter((candidate) => candidate.commandOverlap).length, 8);
  assert.equal(Object.hasOwn(boundedDiagnostic, "graph"), false);
  assert.equal(Object.hasOwn(boundedDiagnostic, "page"), false);
  const serialized = JSON.stringify(boundedDiagnostic);
  for (const unsafeValue of [property, ...Object.values(unsafePayload).flat()]) {
    assert.equal(serialized.includes(unsafeValue), false, unsafeValue);
  }

  const classification = classifyCliResult({ code: 1 }, parsed, context);
  assert.equal(classification.outcome, "failed");
  assert.equal(classification.expectedRace, false);
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
