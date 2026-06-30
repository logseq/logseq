#!/usr/bin/env node

import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync, appendFileSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { setTimeout as delay } from "node:timers/promises";

const repoRoot = resolve(new URL("..", import.meta.url).pathname);

function parseArgs(argv) {
  const opts = {
    graph: "pi-memory",
    page: "CLI Concurrent Stress",
    config: resolve(repoRoot, "tmp", "cli-concurrent-edit-stress", "cli.edn"),
    syncBase: "http://127.0.0.1:18080",
    concurrency: 8,
    maxOps: 0,
    timeoutMs: 20000,
    logFile: resolve(repoRoot, "tmp", "cli-concurrent-edit-stress", "events.jsonl"),
    sync: false,
    failFast: false,
    startSyncServer: true,
    e2eePassword: "11111",
    authPath: "/Users/tiensonqin/logseq/auth.json",
    syncServerPidFile: resolve(repoRoot, "tmp", "cli-concurrent-edit-stress", "db-sync-server.pid"),
    syncServerLogFile: resolve(repoRoot, "tmp", "cli-concurrent-edit-stress", "db-sync-server.log"),
    syncServerDataDir: resolve(repoRoot, "tmp", "cli-concurrent-edit-stress", "db-sync-server-data"),
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = () => {
      i += 1;
      if (i >= argv.length) {
        throw new Error(`Missing value for ${arg}`);
      }
      return argv[i];
    };

    switch (arg) {
      case "--graph":
        opts.graph = next();
        break;
      case "--page":
        opts.page = next();
        break;
      case "--config":
        opts.config = resolve(next());
        break;
      case "--sync-base":
        opts.syncBase = next();
        break;
      case "--concurrency":
        opts.concurrency = Number.parseInt(next(), 10);
        break;
      case "--max-ops":
        opts.maxOps = Number.parseInt(next(), 10);
        break;
      case "--timeout-ms":
        opts.timeoutMs = Number.parseInt(next(), 10);
        break;
      case "--log-file":
        opts.logFile = resolve(next());
        break;
      case "--sync":
        opts.sync = true;
        break;
      case "--no-start-sync-server":
        opts.startSyncServer = false;
        break;
      case "--auth-path":
        opts.authPath = resolve(next());
        break;
      case "--e2ee-password":
        opts.e2eePassword = next();
        break;
      case "--fail-fast":
        opts.failFast = true;
        break;
      case "--help":
      case "-h":
        printHelp();
        process.exit(0);
        break;
      default:
        throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (!Number.isInteger(opts.concurrency) || opts.concurrency < 1) {
    throw new Error("--concurrency must be a positive integer");
  }
  if (!Number.isInteger(opts.maxOps) || opts.maxOps < 0) {
    throw new Error("--max-ops must be 0 or a positive integer");
  }
  if (!Number.isInteger(opts.timeoutMs) || opts.timeoutMs < 1000) {
    throw new Error("--timeout-ms must be at least 1000");
  }

  opts.wsUrl = `${opts.syncBase.replace(/^http/, "ws").replace(/\/$/, "")}/sync/%s`;
  opts.httpBase = opts.syncBase.replace(/\/$/, "");
  return opts;
}

function printHelp() {
  console.log(`Usage: node scripts/cli-concurrent-edit-stress.mjs [options]

Runs parallel Logseq CLI writes against a dedicated stress page.

Options:
  --graph NAME          Graph to mutate. Default: pi-memory
  --page NAME           Stress page. Default: CLI Concurrent Stress
  --config PATH         Dedicated CLI config path under tmp/
  --sync-base URL       Local db-sync base URL. Default: http://127.0.0.1:18080
  --sync                Start db-sync client after verifying local /health
  --no-start-sync-server
                        Do not auto-start local db-sync when --sync is used
  --auth-path PATH      Auth JSON for local db-sync. Default: /Users/tiensonqin/logseq/auth.json
  --e2ee-password TEXT  Password used for local sync upload initialization. Default: 11111
  --concurrency N       Parallel workers. Default: 8
  --max-ops N           Stop after N operations. Default: 0, run forever
  --timeout-ms N        Per-CLI-command timeout. Default: 20000
  --log-file PATH       JSONL event log path
  --fail-fast           Exit on first CLI error
`);
}

function assertLocalUrl(url, label) {
  let parsed;
  try {
    parsed = new URL(url.replace("%s", "graph-id"));
  } catch {
    throw new Error(`${label} is not a valid URL: ${url}`);
  }

  const localHosts = new Set(["127.0.0.1", "localhost", "::1"]);
  if (!localHosts.has(parsed.hostname)) {
    throw new Error(`${label} must point to localhost/127.0.0.1, got ${url}`);
  }
}

function authConfigLines(opts) {
  const auth = JSON.parse(readFileSync(opts.authPath, "utf8"));
  const lines = [` :auth-path "${opts.authPath}"`];
  if (typeof auth["refresh-token"] === "string" && auth["refresh-token"].length > 0) {
    lines.push(` :refresh-token ${JSON.stringify(auth["refresh-token"])}`);
  }
  if (typeof auth["id-token"] === "string" && auth["id-token"].length > 0) {
    lines.push(` :id-token ${JSON.stringify(auth["id-token"])}`);
  }
  if (typeof auth["access-token"] === "string" && auth["access-token"].length > 0) {
    lines.push(` :access-token ${JSON.stringify(auth["access-token"])}`);
  }
  return lines;
}

export function stressConfigText(opts) {
  return [
    "{",
    " :output-format :json",
    ` :http-base "${opts.httpBase}"`,
    ` :ws-url "${opts.wsUrl}"`,
    ...authConfigLines(opts),
    "}",
    "",
  ].join("\n");
}

function ensureStressConfig(opts) {
  assertLocalUrl(opts.httpBase, "http-base");
  assertLocalUrl(opts.wsUrl, "ws-url");
  mkdirSync(dirname(opts.config), { recursive: true });
  writeFileSync(opts.config, stressConfigText(opts), "utf8");
}

function logEvent(opts, event) {
  const payload = {
    ts: new Date().toISOString(),
    graph: opts.graph,
    page: opts.page,
    ...event,
  };
  appendFileSync(opts.logFile, `${JSON.stringify(payload)}\n`, "utf8");
  if (event.level === "error" || event.level === "warn" || event.event === "summary") {
    console.log(JSON.stringify(payload));
  }
}

const expectedRaceErrorCodes = new Set(["block-not-found", "source-not-found", "target-not-found"]);

export function classifyCliResult(result, parsed) {
  const ok = result.code === 0 && (!parsed || parsed.status === "ok");
  const expectedRace = !ok && expectedRaceErrorCodes.has(parsed?.error?.code);
  return {
    ok,
    level: ok || expectedRace ? "info" : "error",
    outcome: ok ? "ok" : expectedRace ? "race-conflict" : "failed",
    expectedRace,
  };
}

export function staleIdsFromContext(context = {}) {
  const ids = [];
  for (const key of ["id", "targetId", "parentId"]) {
    if (Number.isInteger(context[key])) {
      ids.push(context[key]);
    }
  }
  if (Array.isArray(context.ids)) {
    for (const id of context.ids) {
      if (Number.isInteger(id)) {
        ids.push(id);
      }
    }
  }
  return ids;
}

function runProcess(command, args, opts) {
  return new Promise((resolvePromise) => {
    const startedAt = Date.now();
    const child = spawn(command, args, {
      cwd: repoRoot,
      env: {
        ...process.env,
        LOGSEQ_CLI_CONFIG: opts.config,
        LOGSEQ_CLI_GRAPH: opts.graph,
        LOGSEQ_CLI_TIMEOUT_MS: String(opts.timeoutMs),
        LOGSEQ_CLI_OUTPUT: "json",
      },
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill("SIGTERM");
      setTimeout(() => child.kill("SIGKILL"), 1500).unref();
    }, opts.timeoutMs + 3000);

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("close", (code, signal) => {
      clearTimeout(timer);
      resolvePromise({
        command,
        args,
        code,
        signal,
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        elapsedMs: Date.now() - startedAt,
      });
    });
  });
}

async function runCli(opts, args, context = {}) {
  const result = await runProcess(process.env.LOGSEQ_BIN || "logseq", args, opts);
  let parsed = null;
  if (result.stdout) {
    try {
      parsed = JSON.parse(result.stdout);
    } catch {
      parsed = null;
    }
  }

  const classification = classifyCliResult(result, parsed, context);
  const event = {
    event: "cli",
    level: classification.level,
    outcome: classification.outcome,
    context,
    args,
    code: result.code,
    signal: result.signal,
    elapsedMs: result.elapsedMs,
    status: parsed?.status,
    error: parsed?.error,
    stderr: result.stderr || undefined,
    stdout: parsed ? undefined : result.stdout,
  };
  logEvent(opts, event);

  if (!classification.ok && !classification.expectedRace && opts.failFast) {
    throw new Error(`CLI command failed: logseq ${args.join(" ")}`);
  }

  return { ...classification, parsed, result };
}

function resultIds(response) {
  const result = response.parsed?.data?.result;
  if (Array.isArray(result)) {
    return result.filter((value) => Number.isInteger(value));
  }
  if (Number.isInteger(result)) {
    return [result];
  }
  return [];
}

async function fetchJson(url, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    return { ok: response.ok, status: response.status, text: await response.text() };
  } finally {
    clearTimeout(timer);
  }
}

function syncBaseUrl(opts) {
  return new URL(opts.syncBase.replace(/\/$/, ""));
}

export function syncServerStartArgs(opts) {
  const base = syncBaseUrl(opts);
  return [
    "cli-e2e/scripts/db_sync_server.py",
    "start",
    "--repo-root",
    repoRoot,
    "--pid-file",
    opts.syncServerPidFile,
    "--log-file",
    opts.syncServerLogFile,
    "--data-dir",
    opts.syncServerDataDir,
    "--host",
    base.hostname,
    "--port",
    base.port || (base.protocol === "https:" ? "443" : "80"),
    "--startup-timeout-s",
    "25",
    "--auth-path",
    opts.authPath,
  ];
}

export function syncUploadArgs(opts) {
  return ["sync", "upload", "--graph", opts.graph, "--e2ee-password", opts.e2eePassword];
}

function syncStatusUninitialized(response) {
  const status = response.parsed?.data;
  return response.ok && status && (status["local-tx"] == null || status["remote-tx"] == null);
}

async function ensureLocalSyncServer(opts) {
  const healthUrl = `${opts.httpBase}/health`;
  const health = await fetchJson(healthUrl, 2500).catch((error) => ({
    ok: false,
    status: "fetch-error",
    text: String(error),
  }));
  if (health.ok) {
    logEvent(opts, { event: "db-sync-server", level: "info", status: "healthy", baseUrl: opts.httpBase });
    return;
  }

  if (!opts.startSyncServer) {
    throw new Error(`Local db-sync server is not healthy at ${healthUrl}; start it or remove --no-start-sync-server`);
  }

  logEvent(opts, { event: "db-sync-server", level: "info", status: "starting", baseUrl: opts.httpBase });
  const result = await runProcess("python3", syncServerStartArgs(opts), opts);
  let parsed = null;
  if (result.stdout) {
    try {
      parsed = JSON.parse(result.stdout);
    } catch {
      parsed = null;
    }
  }
  if (result.code !== 0 || parsed?.status !== "ok") {
    throw new Error(
      [
        `Failed to start local db-sync server at ${opts.httpBase}.`,
        result.stderr || "",
        result.stdout || "",
      ].filter(Boolean).join("\n"),
    );
  }
  logEvent(opts, {
    event: "db-sync-server",
    level: "info",
    status: "started",
    pid: parsed.pid,
    baseUrl: parsed.base_url,
    logFile: parsed.log_file,
  });
}

async function ensureLocalServers(opts) {
  await runCli(opts, ["server", "start", "--graph", opts.graph], { op: "server-start" });
  const serverList = await runCli(opts, ["server", "list"], { op: "server-list" });
  const servers = serverList.parsed?.data?.servers || [];
  const graphServer = servers.find((server) => server.graph === opts.graph);
  if (!graphServer || !String(graphServer["base-url"] || "").startsWith("http://127.0.0.1:")) {
    throw new Error(`No local db-worker-node server found for graph ${opts.graph}`);
  }
  logEvent(opts, { event: "db-worker-node", level: "info", server: graphServer });

  if (opts.sync) {
    await ensureLocalSyncServer(opts);
    const status = await runCli(opts, ["sync", "status", "--graph", opts.graph], { op: "sync-status-before-start" });
    if (syncStatusUninitialized(status)) {
      const upload = await runCli(opts, syncUploadArgs(opts), { op: "sync-upload-initialize" });
      if (!upload.ok) {
        throw new Error(`Failed to initialize local sync upload for ${opts.graph}`);
      }
    }
    const start = await runCli(opts, ["sync", "start", "--graph", opts.graph], { op: "sync-start" });
    if (!start.ok) {
      throw new Error(`Failed to start local sync for ${opts.graph}`);
    }
  }
}

function choose(set) {
  const values = Array.from(set);
  if (values.length === 0) {
    return null;
  }
  return values[Math.floor(Math.random() * values.length)];
}

function chooseMany(set, maxCount) {
  const values = Array.from(set);
  values.sort(() => Math.random() - 0.5);
  return values.slice(0, Math.max(1, Math.min(maxCount, values.length)));
}

function ednString(value) {
  return JSON.stringify(String(value));
}

function liveBlocksQuery(page) {
  return `[:find [(pull ?b [:db/id]) ...] :where [?p :block/name ${ednString(page.toLowerCase())}] [?b :block/page ?p] (not [?b :block/name])]`;
}

function liveIdsFromQueryResult(response) {
  const rows = response.parsed?.data?.result;
  if (!Array.isArray(rows)) {
    return [];
  }
  return rows.map((row) => row?.["db/id"]).filter((id) => Number.isInteger(id));
}

async function refreshLiveIds(opts, state, reason) {
  const response = await runCli(
    opts,
    ["query", "--graph", opts.graph, "--query", liveBlocksQuery(opts.page)],
    { op: "refresh-live-ids", reason },
  );
  const ids = liveIdsFromQueryResult(response);
  state.activeIds = new Set(ids);
  state.lastRefreshSeq = state.nextSeq;
  logEvent(opts, {
    event: "refresh-live-ids",
    level: "info",
    reason,
    activeIds: state.activeIds.size,
  });
}

async function refreshLiveIdsIfNeeded(opts, state, reason) {
  if (state.refreshing) {
    return;
  }
  if (state.activeIds.size >= opts.concurrency * 2 && state.nextSeq - state.lastRefreshSeq < 50) {
    return;
  }
  state.refreshing = true;
  try {
    await refreshLiveIds(opts, state, reason);
  } finally {
    state.refreshing = false;
  }
}

function pruneStaleIds(state, response, context) {
  if (!response.expectedRace) {
    return;
  }
  for (const id of staleIdsFromContext(context)) {
    state.activeIds.delete(id);
  }
}

function weightedOperation() {
  const operations = [
    ["create-root", 18],
    ["create-child", 18],
    ["update", 18],
    ["page-upsert", 10],
    ["move", 8],
    ["delete-single", 16],
    ["delete-batch", 8],
    ["delete-update-race", 4],
  ];
  const total = operations.reduce((sum, [, weight]) => sum + weight, 0);
  let cursor = Math.random() * total;
  for (const [name, weight] of operations) {
    cursor -= weight;
    if (cursor <= 0) {
      return name;
    }
  }
  return "create-root";
}

async function createBlock(opts, state, content, targetArgs, context) {
  const response = await runCli(
    opts,
    ["upsert", "block", "--graph", opts.graph, ...targetArgs, "--content", content],
    context,
  );
  pruneStaleIds(state, response, context);
  for (const id of resultIds(response)) {
    state.activeIds.add(id);
  }
}

async function runOperation(opts, state, workerId, seq) {
  const op = weightedOperation();
  const stamp = `${state.runId} worker=${workerId} seq=${seq} op=${op}`;
  await refreshLiveIdsIfNeeded(opts, state, "operation");

  if (state.activeIds.size < opts.concurrency && op !== "create-root") {
    await createBlock(opts, state, `seed ${stamp}`, ["--target-page", opts.page], {
      workerId,
      seq,
      op: "seed",
    });
    return;
  }

  switch (op) {
    case "create-root":
      await createBlock(opts, state, `root ${stamp}`, ["--target-page", opts.page], { workerId, seq, op });
      return;

    case "create-child": {
      const parentId = choose(state.activeIds);
      await createBlock(opts, state, `child ${stamp} parent=${parentId}`, ["--target-id", String(parentId), "--pos", "last-child"], {
        workerId,
        seq,
        op,
        parentId,
      });
      return;
    }

    case "update": {
      const id = choose(state.activeIds);
      const context = { workerId, seq, op, id };
      const response = await runCli(
        opts,
        ["upsert", "block", "--graph", opts.graph, "--id", String(id), "--content", `updated ${stamp} id=${id}`],
        context,
      );
      pruneStaleIds(state, response, context);
      return;
    }

    case "page-upsert": {
      await runCli(opts, ["upsert", "page", "--graph", opts.graph, "--page", opts.page], {
        workerId,
        seq,
        op,
      });
      return;
    }

    case "move": {
      const id = choose(state.activeIds);
      const targetId = choose(state.activeIds);
      if (!id || !targetId || id === targetId) {
        return;
      }
      const context = { workerId, seq, op, id, targetId };
      const response = await runCli(
        opts,
        ["upsert", "block", "--graph", opts.graph, "--id", String(id), "--target-id", String(targetId), "--pos", "last-child"],
        context,
      );
      pruneStaleIds(state, response, context);
      return;
    }

    case "delete-single": {
      const id = choose(state.activeIds);
      if (!id) {
        return;
      }
      const context = { workerId, seq, op, id };
      const response = await runCli(opts, ["remove", "block", "--graph", opts.graph, "--id", String(id)], context);
      pruneStaleIds(state, response, context);
      state.activeIds.delete(id);
      return;
    }

    case "delete-batch": {
      const ids = chooseMany(state.activeIds, 4);
      if (ids.length === 0) {
        return;
      }
      const context = {
        workerId,
        seq,
        op,
        ids,
      };
      const response = await runCli(opts, ["remove", "block", "--graph", opts.graph, "--id", JSON.stringify(ids)], context);
      pruneStaleIds(state, response, context);
      for (const id of ids) {
        state.activeIds.delete(id);
      }
      return;
    }

    case "delete-update-race": {
      const id = choose(state.activeIds);
      if (!id) {
        return;
      }
      const deleteContext = {
          workerId,
          seq,
          op: `${op}:delete`,
          id,
        };
      const updateContext = { workerId, seq, op: `${op}:update`, id };
      const responses = await Promise.all([
        runCli(opts, ["remove", "block", "--graph", opts.graph, "--id", String(id)], deleteContext),
        runCli(
          opts,
          ["upsert", "block", "--graph", opts.graph, "--id", String(id), "--content", `race update ${stamp} id=${id}`],
          updateContext,
        ),
      ]);
      pruneStaleIds(state, responses[0], deleteContext);
      pruneStaleIds(state, responses[1], updateContext);
      state.activeIds.delete(id);
      return;
    }

    default:
      throw new Error(`Unhandled operation: ${op}`);
  }
}

async function worker(opts, state, workerId) {
  let localSeq = 0;
  while (!state.stop) {
    const seq = state.nextSeq;
    state.nextSeq += 1;
    if (opts.maxOps > 0 && seq >= opts.maxOps) {
      state.stop = true;
      break;
    }

    try {
      await runOperation(opts, state, workerId, localSeq);
    } catch (error) {
      logEvent(opts, {
        event: "worker-error",
        level: "error",
        workerId,
        seq: localSeq,
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      if (opts.failFast) {
        state.stop = true;
        throw error;
      }
    }

    localSeq += 1;
    if (localSeq % 25 === 0) {
      logEvent(opts, {
        event: "summary",
        level: "info",
        workerId,
        localSeq,
        totalOpsStarted: state.nextSeq,
        activeIds: state.activeIds.size,
      });
    }
    await delay(Math.floor(Math.random() * 40));
  }
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  mkdirSync(dirname(opts.logFile), { recursive: true });
  ensureStressConfig(opts);

  const state = {
    runId: `stress-${Date.now()}`,
    activeIds: new Set(),
    nextSeq: 0,
    lastRefreshSeq: -Infinity,
    refreshing: false,
    stop: false,
  };

  logEvent(opts, {
    event: "start",
    level: "info",
    runId: state.runId,
    config: opts.config,
    httpBase: opts.httpBase,
    wsUrl: opts.wsUrl,
    concurrency: opts.concurrency,
    maxOps: opts.maxOps,
    sync: opts.sync,
  });

  await ensureLocalServers(opts);
  await runCli(opts, ["upsert", "page", "--graph", opts.graph, "--page", opts.page], {
    op: "upsert-stress-page",
  });
  await refreshLiveIds(opts, state, "startup");

  await Promise.all(Array.from({ length: opts.concurrency }, (_, index) => worker(opts, state, index + 1)));

  logEvent(opts, {
    event: "stop",
    level: "info",
    runId: state.runId,
    totalOpsStarted: state.nextSeq,
    activeIds: state.activeIds.size,
  });
}

function isMainModule() {
  return process.argv[1] && resolve(process.argv[1]) === resolve(new URL(import.meta.url).pathname);
}

if (isMainModule()) {
  main().catch((error) => {
  const opts = (() => {
    try {
      return parseArgs(process.argv.slice(2));
    } catch {
      return {
        graph: "pi-memory",
        page: "CLI Concurrent Stress",
        logFile: resolve(repoRoot, "tmp", "cli-concurrent-edit-stress", "events.jsonl"),
      };
    }
  })();
  mkdirSync(dirname(opts.logFile), { recursive: true });
  logEvent(opts, {
    event: "fatal",
    level: "error",
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
  });
  process.exitCode = 1;
  });
}
