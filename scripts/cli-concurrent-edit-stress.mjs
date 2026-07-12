#!/usr/bin/env node

import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { mkdirSync, writeFileSync, appendFileSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { setTimeout as delay } from "node:timers/promises";

const repoRoot = resolve(new URL("..", import.meta.url).pathname);
const require = createRequire(import.meta.url);
const transit = require(require.resolve("transit-js", { paths: [resolve(repoRoot, "cli")] }));
const transitWriter = transit.writer("json");
const transitReader = transit.reader("json");

export function parseArgs(argv) {
  const opts = {
    graph: "pi-memory",
    page: "CLI Concurrent Stress",
    extraPages: 2,
    journalPages: 2,
    journalStart: new Date().toISOString().slice(0, 10),
    todayDate: null,
    config: resolve(repoRoot, "tmp", "cli-concurrent-edit-stress", "cli.edn"),
    syncBase: "http://127.0.0.1:18080",
    clients: 1,
    concurrency: 8,
    maxOps: 0,
    timeoutMs: 20000,
    settleAttempts: 30,
    settleMs: 1000,
    logFile: resolve(repoRoot, "tmp", "cli-concurrent-edit-stress", "events.jsonl"),
    sync: false,
    offline: false,
    offlineMs: 2500,
    failFast: false,
    startSyncServer: true,
    graphE2ee: true,
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
      case "--extra-pages":
        opts.extraPages = Number.parseInt(next(), 10);
        break;
      case "--journal-pages":
        opts.journalPages = Number.parseInt(next(), 10);
        break;
      case "--journal-start":
        opts.journalStart = next();
        break;
      case "--today-date":
        opts.todayDate = next();
        break;
      case "--config":
        opts.config = resolve(next());
        break;
      case "--root-dir":
        opts.rootDir = resolve(next());
        break;
      case "--sync-base":
        opts.syncBase = next();
        break;
      case "--clients":
        opts.clients = Number.parseInt(next(), 10);
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
      case "--settle-attempts":
        opts.settleAttempts = Number.parseInt(next(), 10);
        break;
      case "--settle-ms":
        opts.settleMs = Number.parseInt(next(), 10);
        break;
      case "--log-file":
        opts.logFile = resolve(next());
        break;
      case "--sync-server-pid-file":
        opts.syncServerPidFile = resolve(next());
        break;
      case "--sync-server-log-file":
        opts.syncServerLogFile = resolve(next());
        break;
      case "--sync-server-data-dir":
        opts.syncServerDataDir = resolve(next());
        break;
      case "--sync":
        opts.sync = true;
        break;
      case "--offline":
        opts.offline = true;
        break;
      case "--offline-ms":
        opts.offlineMs = Number.parseInt(next(), 10);
        break;
      case "--no-start-sync-server":
        opts.startSyncServer = false;
        break;
      case "--no-e2ee":
        opts.graphE2ee = false;
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
  if (!Number.isInteger(opts.clients) || opts.clients < 1) {
    throw new Error("--clients must be a positive integer");
  }
  if (opts.clients > 1 && !opts.sync) {
    throw new Error("--clients greater than 1 requires --sync");
  }
  if (!Number.isInteger(opts.maxOps) || opts.maxOps < 0) {
    throw new Error("--max-ops must be 0 or a positive integer");
  }
  if (!Number.isInteger(opts.timeoutMs) || opts.timeoutMs < 1000) {
    throw new Error("--timeout-ms must be at least 1000");
  }
  if (!Number.isInteger(opts.settleAttempts) || opts.settleAttempts < 1) {
    throw new Error("--settle-attempts must be a positive integer");
  }
  if (!Number.isInteger(opts.settleMs) || opts.settleMs < 100) {
    throw new Error("--settle-ms must be at least 100");
  }
  if (!Number.isInteger(opts.extraPages) || opts.extraPages < 0) {
    throw new Error("--extra-pages must be 0 or a positive integer");
  }
  if (!Number.isInteger(opts.journalPages) || opts.journalPages < 0) {
    throw new Error("--journal-pages must be 0 or a positive integer");
  }
  if (!Number.isInteger(opts.offlineMs) || opts.offlineMs < 100) {
    throw new Error("--offline-ms must be at least 100");
  }
  if (opts.todayDate && Number.isNaN(new Date(`${opts.todayDate}T00:00:00.000Z`).getTime())) {
    throw new Error("--today-date must be a valid YYYY-MM-DD date");
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
  --extra-pages N       Additional normal pages to mutate. Default: 2
  --journal-pages N     Auto-created journal-style pages to mutate. Default: 2
  --journal-start DATE  First journal date, YYYY-MM-DD. Default: today
  --today-date DATE     Override today's journal date, YYYY-MM-DD
  --config PATH         Dedicated CLI config path under tmp/
  --root-dir PATH       Dedicated root dir for the seed CLI client
  --sync-base URL       Local db-sync base URL. Default: http://127.0.0.1:18080
  --sync                Start db-sync client after verifying local /health
  --clients N           Independent local clients synced to one remote graph. Default: 1
  --offline             Simulate offline windows by stopping sync during writes
  --offline-ms N        Duration of each offline window. Default: 2500
  --no-start-sync-server
                        Do not auto-start local db-sync when --sync is used
  --no-e2ee            Initialize the stress graph as non-E2EE for local sync
  --auth-path PATH      Auth JSON for local db-sync. Default: /Users/tiensonqin/logseq/auth.json
  --e2ee-password TEXT  Password used for local sync upload initialization. Default: 11111
  --concurrency N       Parallel workers. Default: 8
  --max-ops N           Stop after N operations. Default: 0, run forever
  --timeout-ms N        Per-CLI-command timeout. Default: 20000
  --settle-attempts N   Final sync status polling attempts. Default: 30
  --settle-ms N         Delay between sync status polls. Default: 1000
  --log-file PATH       JSONL event log path
  --sync-server-pid-file PATH
                        Local db-sync server pid file
  --sync-server-log-file PATH
                        Local db-sync server log file
  --sync-server-data-dir PATH
                        Local db-sync server data dir
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
  if (opts.rootDir) {
    mkdirSync(opts.rootDir, { recursive: true });
  }
  if (opts.homeDir) {
    mkdirSync(opts.homeDir, { recursive: true });
  }
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

const expectedRaceErrorCodes = new Set([
  "block-not-found",
  "page-not-found",
  "recycled-page",
  "source-not-found",
  "target-not-found",
  "upsert-id-not-found",
]);

function expectedCliRace(parsed, context = {}) {
  return (
    expectedRaceErrorCodes.has(parsed?.error?.code) ||
    (context.op === "property-delete-recreate" &&
      context.phase === "delete" &&
      (parsed?.error?.code === "property-not-found" || parsed?.error?.code === "ambiguous-property-name")) ||
    (context.op === "tag-delete-recreate" && context.phase === "delete" && parsed?.error?.code === "tag-not-found")
  );
}

export function classifyCliResult(result, parsed, context = {}) {
  const ok = result.code === 0 && (!parsed || parsed.status === "ok");
  const expectedRace = !ok && expectedCliRace(parsed, context);
  return {
    ok,
    level: ok || expectedRace ? "info" : "error",
    outcome: ok ? "ok" : expectedRace ? "race-conflict" : "failed",
    expectedRace,
  };
}

const rawViewHistoryOps = new Set([
  "http-create-property-history",
  "http-create-linked-references-view",
  "http-create-unlinked-references-view",
  "http-delete-view-target-with-related-entities",
]);

function expectedHttpRace(parsed, context = {}) {
  const message = parsed?.error?.message || "";
  return (
    (Number.isInteger(context.id) &&
      parsed?.error?.code === "exception" &&
      message === "Set block property failed: block or property doesn't exist") ||
    (Number.isInteger(context.id) &&
      rawViewHistoryOps.has(context.op) &&
      parsed?.error?.code === "exception" &&
      (message.startsWith("Nothing found for entity id (:block/uuid") ||
        message.startsWith("Nothing found for entity id [:block/uuid")))
  );
}

export function classifyHttpResult(result, parsed, context = {}) {
  const noOp = result.ok && context.requireTruthyResult && !parsed?.result;
  const ok = result.ok && !noOp;
  const expectedRace = !ok && !noOp && expectedHttpRace(parsed, context);
  return {
    ok,
    level: ok || expectedRace ? "info" : "error",
    outcome: ok ? "ok" : expectedRace ? "race-conflict" : noOp ? "no-op" : "failed",
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
        ...(opts.env || {}),
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
  const command = cliCommand(process.env.LOGSEQ_BIN);
  const result = await runProcess(command.command, [...command.args, ...args], opts);
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

export function cliCommand(bin = null) {
  const command = bin || "logseq";
  if (command.endsWith(".js")) {
    return { command: process.execPath, args: [command] };
  }
  return { command, args: [] };
}

function cliFetchFailed(response) {
  return (
    !response.ok &&
    (String(response.result?.stderr || "").includes("fetch failed") ||
      String(response.result?.stdout || "").includes("fetch failed") ||
      response.parsed?.error?.message === "fetch failed")
  );
}

async function runSyncStart(opts, context = {}) {
  let response = await runCli(opts, ["sync", "start", "--graph", opts.graph], context);
  if (cliFetchFailed(response)) {
    await delay(500);
    await runCli(opts, ["server", "list"], { ...context, op: "server-list-before-sync-start-retry" });
    response = await runCli(opts, ["sync", "start", "--graph", opts.graph], {
      ...context,
      retry: "fetch-failed",
    });
  }
  return response;
}

async function invokeThreadApi(opts, state, method, args, context = {}) {
  const startedAt = Date.now();
  let response = null;
  let text = "";
  let parsed = null;
  let error = null;

  const invokeOnce = async () => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), opts.timeoutMs + 3000);
    try {
      const nextResponse = await fetch(`${state.workerBaseUrl}/v1/invoke`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          method,
          argsTransit: transitWriter.write(args),
        }),
        signal: controller.signal,
      });
      const nextText = await nextResponse.text();
      let nextParsed = null;
      if (nextText) {
        nextParsed = JSON.parse(nextText);
      }
      if (nextParsed?.resultTransit) {
        nextParsed.result = transitReader.read(nextParsed.resultTransit);
      }
      return { response: nextResponse, text: nextText, parsed: nextParsed, error: null };
    } catch (caught) {
      return { response: null, text: "", parsed: null, error: caught };
    } finally {
      clearTimeout(timer);
    }
  };

  ({ response, text, parsed, error } = await invokeOnce());
  if (error && String(error instanceof Error ? error.message : error).includes("fetch failed")) {
    const refreshed = await refreshWorkerBaseUrl(opts, state, context);
    if (refreshed) {
      ({ response, text, parsed, error } = await invokeOnce());
    }
  }

  const classification = classifyHttpResult({ ok: !error && response?.ok, status: response?.status }, parsed, context);
  if (classification.expectedRace) {
    for (const id of staleIdsFromContext(context)) {
      state.activeIds.delete(id);
      state.activeBlockUuids.delete(id);
      state.taskIds.delete(id);
    }
  }
  logEvent(opts, {
    event: "http",
    level: classification.level,
    outcome: classification.outcome,
    context,
    method,
    elapsedMs: Date.now() - startedAt,
    status: response?.status,
    error: error ? { message: error instanceof Error ? error.message : String(error) } : parsed?.error,
    stdout: classification.ok ? undefined : text,
  });

  if (!classification.ok && !classification.expectedRace && opts.failFast) {
    throw new Error(`HTTP invoke failed: ${method}`);
  }

  return { ...classification, parsed, text, error };
}

async function refreshWorkerBaseUrl(opts, state, context = {}) {
  const serverList = await runCli(opts, ["server", "list"], {
    ...context,
    op: "refresh-worker-base-url",
    client: opts.clientName,
  });
  const servers = serverList.parsed?.data?.servers || [];
  let graphServer = servers.find((server) => server.graph === opts.graph);
  if (!graphServer) {
    graphServer = await startDbWorkerNode(opts);
  }
  const baseUrl = graphServer?.["base-url"];
  if (!baseUrl) {
    return false;
  }
  if (baseUrl !== state.workerBaseUrl) {
    logEvent(opts, {
      event: "db-worker-node",
      level: "warn",
      status: "base-url-refreshed",
      client: opts.clientName,
      previousBaseUrl: state.workerBaseUrl,
      baseUrl,
    });
  }
  state.workerBaseUrl = baseUrl;
  state.repo = graphServerRepo(opts, graphServer);
  return true;
}

async function applyOutlinerOps(opts, state, ops, options, context = {}) {
  return invokeThreadApi(
    opts,
    state,
    "thread-api/apply-outliner-ops",
    [state.repo, ops, options || transit.map()],
    context,
  );
}

async function transactRaw(opts, state, txData, txMeta, context = {}) {
  return invokeThreadApi(
    opts,
    state,
    "thread-api/transact",
    [state.repo, txData, txMeta || tmap(), null],
    context,
  );
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
  const args = ["sync", "upload", "--graph", opts.graph];
  if (opts.graphE2ee !== false) {
    args.push("--e2ee-password", opts.e2eePassword);
  }
  return args;
}

export function syncDownloadArgs(opts) {
  const args = ["sync", "download", "--graph", opts.graph];
  if (opts.graphE2ee !== false) {
    args.push("--e2ee-password", opts.e2eePassword);
  }
  return args;
}

export function syncEnsureKeysArgs(opts) {
  return ["sync", "ensure-keys", "--upload-keys", "--e2ee-password", opts.e2eePassword];
}

export function syncNeedsEnsureKeys(opts) {
  return opts.graphE2ee !== false;
}

export function graphValidateArgs(opts) {
  return ["graph", "validate", "--graph", opts.graph];
}

export function syncStatusUninitialized(response) {
  const status = response.parsed?.data;
  return response.ok && status && status["graph-id"] == null;
}

function numberStatusValue(value) {
  return Number.isInteger(value) ? value : Number.parseInt(String(value), 10);
}

export function isSettledSyncStatus(response) {
  const status = response.parsed?.data;
  if (!response.ok || !status) {
    return false;
  }
  const pendingLocal = numberStatusValue(status["pending-local"]);
  const pendingServer = numberStatusValue(status["pending-server"]);
  const localChecksum = status["local-checksum"];
  const remoteChecksum = status["remote-checksum"];
  return (
    pendingLocal === 0 &&
    pendingServer === 0 &&
    typeof localChecksum === "string" &&
    localChecksum.length > 0 &&
    localChecksum === remoteChecksum
  );
}

export function isIdleSyncStatus(response) {
  const status = response.parsed?.data;
  if (!response.ok || !status || status["last-error"] != null) {
    return false;
  }
  const pendingLocal = numberStatusValue(status["pending-local"]);
  const pendingServer = numberStatusValue(status["pending-server"]);
  const localTx = numberStatusValue(status["local-tx"]);
  const remoteTx = numberStatusValue(status["remote-tx"]);
  return pendingLocal === 0 && pendingServer === 0 && Number.isInteger(localTx) && localTx === remoteTx;
}

function transitValueGet(value, key) {
  if (value && typeof value.get === "function") {
    return value.get(key) ?? value.get(kw(key)) ?? value.get(`:${key}`);
  }
  if (value && typeof value === "object") {
    return value[key] ?? value[`:${key}`];
  }
  return undefined;
}

export function checksumDiagnosticsMatch(result) {
  const recomputed = transitValueGet(result, "recomputed-checksum");
  const remote = transitValueGet(result, "remote-checksum");
  return typeof recomputed === "string" && recomputed.length > 0 && recomputed === remote;
}

export function clientRuntimeOptions(opts, clientIndex) {
  const clientNumber = clientIndex + 1;
  const clientName = `client-${clientNumber}`;
  const baseDir = resolve(dirname(opts.config), "clients", clientName);
  const rootDir = clientIndex === 0 ? opts.rootDir || process.env.LOGSEQ_CLI_ROOT_DIR : join(baseDir, "root");
  const homeDir = clientIndex === 0 ? opts.homeDir || process.env.HOME : join(baseDir, "home");
  const config = clientIndex === 0 ? opts.config : join(baseDir, "cli.edn");
  const env = { ...(opts.env || {}) };
  if (rootDir) {
    env.LOGSEQ_CLI_ROOT_DIR = rootDir;
  }
  if (homeDir) {
    env.HOME = homeDir;
  }
  return {
    ...opts,
    clientIndex,
    clientName,
    config,
    rootDir,
    homeDir,
    env,
  };
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

function graphServerRepo(opts, graphServer) {
  return graphServer.repo || `logseq_db_${opts.graph}`;
}

async function startDbWorkerNode(opts) {
  await runCli(opts, ["server", "start", "--graph", opts.graph], { op: "server-start", client: opts.clientName });
  const serverList = await runCli(opts, ["server", "list"], { op: "server-list", client: opts.clientName });
  const servers = serverList.parsed?.data?.servers || [];
  const graphServer = servers.find((server) => server.graph === opts.graph);
  if (!graphServer || !String(graphServer["base-url"] || "").startsWith("http://127.0.0.1:")) {
    throw new Error(`No local db-worker-node server found for graph ${opts.graph} on ${opts.clientName || "client-1"}`);
  }
  logEvent(opts, { event: "db-worker-node", level: "info", client: opts.clientName, server: graphServer });
  return graphServer;
}

async function setLocalGraphE2ee(opts, graphServer, graphE2ee) {
  const state = {
    workerBaseUrl: graphServer["base-url"],
    repo: graphServerRepo(opts, graphServer),
    activeIds: new Set(),
    activeBlockUuids: new Map(),
    taskIds: new Set(),
  };
  const response = await invokeThreadApi(
    opts,
    state,
    "thread-api/transact",
    [
      state.repo,
      [
        tmap([
          kw("db/ident"),
          kw("logseq.kv/graph-rtc-e2ee?"),
          kw("kv/value"),
          graphE2ee,
        ]),
      ],
      tmap([kw("outliner-op"), kw("set-kvs")]),
      null,
    ],
    { op: "set-local-graph-e2ee", graphE2ee },
  );
  if (!response.ok) {
    throw new Error(`Failed to set local graph E2EE metadata for ${opts.graph}`);
  }
}

async function ensureLocalServers(opts) {
  const graphServer = await startDbWorkerNode(opts);

  if (opts.sync) {
    await ensureLocalSyncServer(opts);
    const status = await runCli(opts, ["sync", "status", "--graph", opts.graph], { op: "sync-status-before-start" });
    if (syncStatusUninitialized(status)) {
      if (opts.graphE2ee === false) {
        await setLocalGraphE2ee(opts, graphServer, false);
      }
      if (syncNeedsEnsureKeys(opts)) {
        const keys = await runCli(opts, syncEnsureKeysArgs(opts), { op: "sync-ensure-keys" });
        if (!keys.ok) {
          throw new Error(`Failed to initialize local sync keys for ${opts.graph}`);
        }
      }
      const upload = await runCli(opts, syncUploadArgs(opts), { op: "sync-upload-initialize" });
      if (!upload.ok) {
        throw new Error(`Failed to initialize local sync upload for ${opts.graph}`);
      }
    }
    const start = await runSyncStart(opts, { op: "sync-start" });
    if (!start.ok) {
      throw new Error(`Failed to start local sync for ${opts.graph}`);
    }
  }
  return graphServer;
}

async function ensureReplicaLocalServers(opts) {
  await ensureLocalSyncServer(opts);
  const download = await runCli(opts, syncDownloadArgs(opts), { op: "sync-download-replica", client: opts.clientName });
  if (!download.ok) {
    throw new Error(`Failed to download remote sync graph ${opts.graph} for ${opts.clientName}`);
  }
  const graphServer = await startDbWorkerNode(opts);
  const start = await runSyncStart(opts, {
    op: "sync-start",
    client: opts.clientName,
  });
  if (!start.ok) {
    throw new Error(`Failed to start local sync for ${opts.graph} on ${opts.clientName}`);
  }
  return graphServer;
}

function choose(set) {
  const values = Array.from(set);
  if (values.length === 0) {
    return null;
  }
  return values[Math.floor(Math.random() * values.length)];
}

function chooseArray(values) {
  if (!Array.isArray(values) || values.length === 0) {
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

function ordinalDay(day) {
  if (day % 100 >= 11 && day % 100 <= 13) {
    return `${day}th`;
  }
  switch (day % 10) {
    case 1:
      return `${day}st`;
    case 2:
      return `${day}nd`;
    case 3:
      return `${day}rd`;
    default:
      return `${day}th`;
  }
}

function journalPageName(date) {
  return `${date.toLocaleString("en-US", { month: "short", timeZone: "UTC" })} ${ordinalDay(date.getUTCDate())}, ${date.getUTCFullYear()}`;
}

function journalPageNameForYmd(ymd) {
  const date = new Date(`${ymd}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid journal date: ${ymd}`);
  }
  return journalPageName(date);
}

function localYmd(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function todayJournalPageName(opts = {}, now = new Date()) {
  return journalPageNameForYmd(opts.todayDate || localYmd(now));
}

export function stressPageNames(opts) {
  const pages = [opts.page];
  for (let index = 0; index < opts.extraPages; index += 1) {
    pages.push(`${opts.page} page ${index + 2}`);
  }

  const start = new Date(`${opts.journalStart}T00:00:00.000Z`);
  if (Number.isNaN(start.getTime())) {
    throw new Error(`Invalid --journal-start date: ${opts.journalStart}`);
  }
  for (let index = 0; index < opts.journalPages; index += 1) {
    const date = new Date(start.getTime() + index * 24 * 60 * 60 * 1000);
    pages.push(journalPageName(date));
  }
  return pages;
}

export function bootstrapStressPageNames(opts) {
  const pages = [opts.page];
  for (let index = 0; index < opts.extraPages; index += 1) {
    pages.push(`${opts.page} page ${index + 2}`);
  }
  return pages;
}

export function mutableStressPageNames(opts) {
  const pages = [];
  for (let index = 0; index < opts.extraPages; index += 1) {
    pages.push(`${opts.page} page ${index + 2}`);
  }
  return pages.length > 0 ? pages : [opts.page];
}

export function operationWeights(opts = {}) {
  const operations = [
    ["create-root", 18],
    ["create-child", 18],
    ["create-tree", 10],
    ["update", 8],
    ["move-child", 14],
    ["move-page", 12],
    ["move-sibling", 12],
    ["block-tags-add", 3],
    ["block-tags-remove", 2],
    ["block-properties-add", 3],
    ["block-properties-remove", 2],
    ["task-create", 3],
    ["task-update", 2],
    ["page-upsert", 2],
    ["page-properties-add", 1],
    ["page-properties-remove", 1],
    ["page-delete-restore", 6],
    ["tag-upsert", 1],
    ["tag-delete-recreate", 1],
    ["property-upsert", 1],
    ["property-delete-recreate", 1],
    ["http-insert-blocks", 12],
    ["http-delete-blocks", 12],
    ["http-move-blocks", 12],
    ["http-save-block", 4],
    ["http-move-up-down", 8],
    ["http-indent-outdent", 8],
    ["http-apply-template", 1],
    ["http-create-page", 1],
    ["http-rename-page", 1],
    ["http-delete-restore-page", 8],
    ["http-recycle-delete-page", 4],
    ["http-upsert-property", 1],
    ["http-set-block-property", 2],
    ["http-remove-block-property", 1],
    ["http-batch-set-property", 2],
    ["http-batch-remove-property", 1],
    ["http-batch-delete-property-value", 1],
    ["http-create-property-history", 2],
    ["http-create-linked-references-view", 2],
    ["http-create-unlinked-references-view", 2],
    ["http-toggle-reaction", 1],
    ["http-delete-view-target-with-related-entities", 4],
    ["http-insert-undo-redo", 12],
    ["delete-single", 18],
    ["delete-batch", 12],
    ["delete-update-race", 8],
  ];
  if (opts.sync && opts.offline) {
    operations.push(["offline-window", 2]);
    operations.push(["offline-today-journal-race", 8]);
    if ((opts.clients || 1) > 1) {
      operations.push(["multi-client-offline-rebase", 12]);
      operations.push(["multi-client-today-journal-race", 10]);
    }
  }
  return operations;
}

export function operationNames(opts = {}) {
  return operationWeights(opts).map(([name]) => name);
}

export function uniqueOperationPageTitle(prefix, state, context = {}) {
  const workerId = context.workerId ?? "unknown-worker";
  const seq = context.seq ?? "unknown-seq";
  return `${prefix} ${state.runId} worker-${workerId} seq-${seq} ${crypto.randomUUID()}`;
}

export function offlineTodayJournalClientCount(opts = {}) {
  return Math.max(2, opts.clients ?? 1);
}

function liveBlocksQuery(page) {
  return `[:find [(pull ?b [:db/id :block/uuid]) ...] :where [?p :block/name ${ednString(page.toLowerCase())}] [?b :block/page ?p] (not [?b :block/name])]`;
}

export function blockByUuidQuery(uuidValue) {
  return `[:find ?b . :where [?b :block/uuid #uuid ${ednString(uuidValue)}]]`;
}

function pageByNameQuery(page) {
  return `[:find (pull ?p [:db/id :block/uuid :block/name :block/title]) . :where [?p :block/name ${ednString(page.toLowerCase())}]]`;
}

function normalizedUuidString(value) {
  if (typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
    return value;
  }
  if (value && typeof value === "object" && typeof value.value === "string") {
    return normalizedUuidString(value.value);
  }
  return null;
}

function pageUuidFromQueryResult(response) {
  return normalizedUuidString(response.parsed?.data?.result?.["block/uuid"]);
}

export function blockExistsFromQueryResult(response) {
  return Number.isInteger(response.parsed?.data?.result);
}

function liveBlocksFromQueryResult(response) {
  const rows = response.parsed?.data?.result;
  if (!Array.isArray(rows)) {
    return [];
  }
  return rows
    .map((row) => {
      const id = row?.["db/id"];
      const uuid = normalizedUuidString(row?.["block/uuid"]);
      return Number.isInteger(id) && uuid ? { id, uuid } : null;
    })
    .filter(Boolean);
}

async function findPageUuid(opts, page, context = {}) {
  const response = await runCli(
    opts,
    ["query", "--graph", opts.graph, "--query", pageByNameQuery(page)],
    { op: "find-page-uuid", page, ...context },
  );
  return pageUuidFromQueryResult(response);
}

async function refreshLiveIds(opts, state, reason) {
  const ids = new Set();
  const blockUuids = new Map();
  for (const page of state.pageNames) {
    const response = await runCli(
      opts,
      ["query", "--graph", opts.graph, "--query", liveBlocksQuery(page)],
      { op: "refresh-live-ids", reason, page },
    );
    for (const block of liveBlocksFromQueryResult(response)) {
      ids.add(block.id);
      blockUuids.set(block.id, block.uuid);
    }
  }
  state.activeIds = ids;
  state.activeBlockUuids = blockUuids;
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

function weightedOperation(opts) {
  const operations = operationWeights(opts);
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

function randomPage(state) {
  return chooseArray(state.pageNames) || state.pageNames[0];
}

function mutablePage(state) {
  return chooseArray(state.mutablePageNames) || state.pageNames[0];
}

function stressTag(state) {
  return chooseArray(state.stableTags);
}

function stressProperty(state) {
  return chooseArray(state.stableProperties);
}

function stressTagId(state) {
  return chooseArray(Array.from(state.stableTagIds.values()));
}

function rawPropertyIdent(state) {
  return state.rawPropertyIdent || "user.property/cli-http-prop";
}

function propertyMap(name, value) {
  return `{${ednString(name)} ${ednString(value)}}`;
}

function propertyVector(name) {
  return `[${ednString(name)}]`;
}

function kw(name) {
  return transit.keyword(name);
}

function uuid(value) {
  return transit.uuid(value);
}

function tmap(entries = []) {
  return transit.map(entries);
}

function localTxMeta(entries = []) {
  return tmap([kw("db-sync/tx-id"), uuid(crypto.randomUUID()), kw("local-tx?"), true, ...entries]);
}

function blockMap(entries) {
  return tmap(entries.flatMap(([key, value]) => [kw(key), value]));
}

function lookupRef(attr, value) {
  return [kw(attr), value];
}

function blockUuidRef(uuidValue) {
  return lookupRef("block/uuid", uuid(uuidValue));
}

function chooseActiveUuid(state) {
  const id = choose(state.activeIds);
  if (!id) {
    return null;
  }
  const uuidValue = state.activeBlockUuids.get(id);
  return uuidValue ? { id, uuid: uuidValue } : null;
}

async function blockStillExists(opts, block, context = {}) {
  const response = await runCli(
    opts,
    ["query", "--graph", opts.graph, "--query", blockByUuidQuery(block.uuid)],
    { ...context, op: "check-live-block", sourceOp: context.op, id: block.id, uuid: block.uuid },
  );
  return blockExistsFromQueryResult(response);
}

async function chooseLiveActiveUuid(opts, state, context = {}) {
  const candidates = Array.from(state.activeIds)
    .map((id) => {
      const uuidValue = state.activeBlockUuids.get(id);
      return uuidValue ? { id, uuid: uuidValue } : null;
    })
    .filter(Boolean);
  candidates.sort(() => Math.random() - 0.5);

  for (const block of candidates.slice(0, 4)) {
    if (await blockStillExists(opts, block, context)) {
      return block;
    }

    state.activeIds.delete(block.id);
    state.activeBlockUuids.delete(block.id);
    logEvent(opts, {
      event: "skip-stale-raw-target",
      level: "info",
      context,
      id: block.id,
      uuid: block.uuid,
    });
  }

  return null;
}

function chooseDistinctActiveUuids(state) {
  const first = chooseActiveUuid(state);
  if (!first) {
    return null;
  }
  const candidates = Array.from(state.activeBlockUuids.entries())
    .filter(([id]) => id !== first.id)
    .map(([id, uuidValue]) => ({ id, uuid: uuidValue }));
  const second = chooseArray(candidates);
  return second ? [first, second] : null;
}

async function ensureStressMetadata(opts, state) {
  for (const page of state.bootstrapPageNames) {
    await runCli(opts, ["upsert", "page", "--graph", opts.graph, "--page", page], {
      op: "bootstrap-page",
      page,
    });
  }
  for (const name of [...state.stableTags, state.volatileTag]) {
    await runCli(opts, ["upsert", "tag", "--graph", opts.graph, "--name", name], {
      op: "bootstrap-tag",
      name,
    });
  }
  for (const name of [...state.stableProperties, state.volatileProperty]) {
    await runCli(opts, ["upsert", "property", "--graph", opts.graph, "--name", name, "--type", "default", "--cardinality", "one", "--public", "true"], {
      op: "bootstrap-property",
      name,
    });
  }
  await refreshStressTagIds(opts, state, "bootstrap");
  await applyRawUpsertProperty(opts, state, { op: "bootstrap-http-upsert-property" });
}

async function refreshStressTagIds(opts, state, reason) {
  const response = await runCli(opts, ["list", "tag", "--graph", opts.graph], {
    op: "refresh-stress-tags",
    reason,
  });
  const items = response.parsed?.data?.items || [];
  state.stableTagIds = new Map();
  for (const name of state.stableTags) {
    const item = items.find((candidate) => candidate?.["block/title"] === name);
    const id = item?.["db/id"];
    if (Number.isInteger(id)) {
      state.stableTagIds.set(name, id);
    }
  }
}

async function applyRawSaveBlock(opts, state, context, title) {
  const block = chooseActiveUuid(state);
  if (!block) {
    return;
  }
  const response = await applyOutlinerOps(
    opts,
    state,
    [
      [
        kw("save-block"),
        [
          blockMap([
            ["block/uuid", uuid(block.uuid)],
            ["block/title", title],
          ]),
          tmap(),
        ],
      ],
    ],
    tmap(),
    { ...context, id: block.id, uuid: block.uuid },
  );
  if (!response.ok) {
    state.activeIds.delete(block.id);
    state.activeBlockUuids.delete(block.id);
  }
}

async function applyRawInsertBlocks(opts, state, context, title) {
  const target = chooseActiveUuid(state);
  if (!target) {
    return;
  }
  const newUuid = crypto.randomUUID();
  const block = blockMap([
    ["block/uuid", uuid(newUuid)],
    ["block/title", title],
  ]);
  await applyOutlinerOps(
    opts,
    state,
    [[kw("insert-blocks"), [[block], uuid(target.uuid), tmap([kw("sibling?"), false, kw("keep-uuid?"), true])]]],
    tmap(),
    { ...context, targetId: target.id, targetUuid: target.uuid, uuid: newUuid },
  );
  await refreshLiveIds(opts, state, "http-insert-blocks");
}

async function applyRawDeleteBlocks(opts, state, context) {
  const block = chooseActiveUuid(state);
  if (!block) {
    return;
  }
  await applyOutlinerOps(
    opts,
    state,
    [[kw("delete-blocks"), [[uuid(block.uuid)], tmap()]]],
    tmap(),
    { ...context, id: block.id, uuid: block.uuid },
  );
  state.activeIds.delete(block.id);
  state.activeBlockUuids.delete(block.id);
}

async function applyRawMoveBlocks(opts, state, context) {
  const pair = chooseDistinctActiveUuids(state);
  if (!pair) {
    return;
  }
  const [block, target] = pair;
  await applyOutlinerOps(
    opts,
    state,
    [[kw("move-blocks"), [[uuid(block.uuid)], uuid(target.uuid), tmap([kw("sibling?"), Math.random() < 0.5])]]],
    tmap(),
    { ...context, id: block.id, uuid: block.uuid, targetId: target.id, targetUuid: target.uuid },
  );
}

async function applyRawMoveUpDown(opts, state, context, up) {
  const block = chooseActiveUuid(state);
  if (!block) {
    return;
  }
  await applyOutlinerOps(
    opts,
    state,
    [[kw("move-blocks-up-down"), [[uuid(block.uuid)], up]]],
    tmap(),
    { ...context, id: block.id, uuid: block.uuid, up },
  );
}

async function applyRawIndentOutdent(opts, state, context, indent) {
  const block = chooseActiveUuid(state);
  if (!block) {
    return;
  }
  await applyOutlinerOps(
    opts,
    state,
    [[kw("indent-outdent-blocks"), [[uuid(block.uuid)], indent, tmap()]]],
    tmap(),
    { ...context, id: block.id, uuid: block.uuid, indent },
  );
}

async function applyRawApplyTemplate(opts, state, context, title) {
  const target = chooseActiveUuid(state);
  if (!target) {
    return;
  }
  const templateUuid = crypto.randomUUID();
  const insertedUuid = crypto.randomUUID();
  const templateBlock = blockMap([
    ["block/uuid", uuid(insertedUuid)],
    ["block/title", title],
  ]);
  await applyOutlinerOps(
    opts,
    state,
    [
      [
        kw("apply-template"),
        [
          uuid(templateUuid),
          uuid(target.uuid),
          tmap([kw("template-blocks"), [templateBlock], kw("sibling?"), false]),
        ],
      ],
    ],
    tmap(),
    { ...context, targetId: target.id, targetUuid: target.uuid, templateUuid, uuid: insertedUuid },
  );
  await refreshLiveIds(opts, state, "http-apply-template");
}

async function applyRawCreatePage(opts, state, context, title) {
  await applyOutlinerOps(
    opts,
    state,
    [[kw("create-page"), [title, tmap()]]],
    tmap(),
    { ...context, page: title },
  );
  state.pageNames.push(title);
  state.mutablePageNames.push(title);
}

async function applyRawRenamePage(opts, state, context, title) {
  const page = mutablePage(state);
  const pageUuid = await findPageUuid(opts, page, context);
  if (!pageUuid) {
    return;
  }
  const temporaryTitle = `${title} ${Date.now()}`;
  await applyOutlinerOps(
    opts,
    state,
    [[kw("rename-page"), [uuid(pageUuid), temporaryTitle]]],
    tmap(),
    { ...context, page, pageUuid, phase: "rename-away", temporaryTitle },
  );
  await applyOutlinerOps(
    opts,
    state,
    [[kw("rename-page"), [uuid(pageUuid), page]]],
    tmap(),
    { ...context, page, pageUuid, phase: "rename-back", temporaryTitle },
  );
}

async function applyRawDeleteRestorePage(opts, state, context, title) {
  const page = title || uniqueOperationPageTitle("CLI HTTP Delete Restore", state, context);
  await applyOutlinerOps(
    opts,
    state,
    [[kw("create-page"), [page, tmap()]]],
    tmap(),
    { ...context, page, phase: "create", requireTruthyResult: true },
  );
  const pageUuid = await findPageUuid(opts, page, context);
  if (!pageUuid) {
    return;
  }
  await applyOutlinerOps(
    opts,
    state,
    [[kw("delete-page"), [uuid(pageUuid), tmap()]]],
    tmap(),
    { ...context, page, pageUuid, phase: "delete", requireTruthyResult: true },
  );
  await applyOutlinerOps(
    opts,
    state,
    [[kw("restore-recycled"), [uuid(pageUuid)]]],
    tmap(),
    { ...context, page, pageUuid, phase: "restore", requireTruthyResult: true },
  );
  await refreshLiveIds(opts, state, "http-delete-restore-page");
}

async function applyRawRecycleDeletePage(opts, state, context, title) {
  await applyOutlinerOps(
    opts,
    state,
    [[kw("create-page"), [title, tmap()]]],
    tmap(),
    { ...context, page: title, phase: "create", requireTruthyResult: true },
  );
  const pageUuid = await findPageUuid(opts, title, context);
  if (!pageUuid) {
    return;
  }
  await applyOutlinerOps(
    opts,
    state,
    [[kw("delete-page"), [uuid(pageUuid), tmap()]]],
    tmap(),
    { ...context, page: title, pageUuid, phase: "delete", requireTruthyResult: true },
  );
  await applyOutlinerOps(
    opts,
    state,
    [[kw("recycle-delete-permanently"), [uuid(pageUuid)]]],
    tmap(),
    { ...context, page: title, pageUuid, phase: "permanent-delete", requireTruthyResult: true },
  );
}

async function applyRawUpsertProperty(opts, state, context) {
  await applyOutlinerOps(
    opts,
    state,
    [
      [
        kw("upsert-property"),
        [
          kw(rawPropertyIdent(state)),
          tmap([kw("logseq.property/type"), kw("default"), kw("db/cardinality"), kw("db.cardinality/one")]),
          tmap([kw("property-name"), state.rawPropertyName || "cli-http-prop"]),
        ],
      ],
    ],
    tmap(),
    context,
  );
}

async function applyRawSetBlockProperty(opts, state, context, value) {
  const block = chooseActiveUuid(state);
  if (!block) {
    return;
  }
  await applyOutlinerOps(
    opts,
    state,
    [[kw("set-block-property"), [uuid(block.uuid), kw(rawPropertyIdent(state)), value]]],
    tmap(),
    { ...context, id: block.id, uuid: block.uuid },
  );
}

async function applyRawRemoveBlockProperty(opts, state, context) {
  const block = chooseActiveUuid(state);
  if (!block) {
    return;
  }
  await applyOutlinerOps(
    opts,
    state,
    [[kw("remove-block-property"), [uuid(block.uuid), kw(rawPropertyIdent(state))]]],
    tmap(),
    { ...context, id: block.id, uuid: block.uuid },
  );
}

async function applyRawBatchSetProperty(opts, state, context, value) {
  const blocks = chooseMany(state.activeIds, 3)
    .map((id) => ({ id, uuid: state.activeBlockUuids.get(id) }))
    .filter((block) => block.uuid);
  if (blocks.length === 0) {
    return;
  }
  await applyOutlinerOps(
    opts,
    state,
    [[kw("batch-set-property"), [blocks.map((block) => uuid(block.uuid)), kw(rawPropertyIdent(state)), value, tmap()]]],
    tmap(),
    { ...context, ids: blocks.map((block) => block.id) },
  );
}

async function applyRawBatchRemoveProperty(opts, state, context) {
  const blocks = chooseMany(state.activeIds, 3)
    .map((id) => ({ id, uuid: state.activeBlockUuids.get(id) }))
    .filter((block) => block.uuid);
  if (blocks.length === 0) {
    return;
  }
  await applyOutlinerOps(
    opts,
    state,
    [[kw("batch-remove-property"), [blocks.map((block) => uuid(block.uuid)), kw(rawPropertyIdent(state))]]],
    tmap(),
    { ...context, ids: blocks.map((block) => block.id) },
  );
}

async function applyRawBatchDeletePropertyValue(opts, state, context) {
  const block = chooseActiveUuid(state);
  const tagId = stressTagId(state);
  if (!block || !tagId) {
    return;
  }
  await applyOutlinerOps(
    opts,
    state,
    [[kw("batch-set-property"), [[uuid(block.uuid)], kw("block/tags"), tagId, tmap()]]],
    tmap(),
    { ...context, id: block.id, uuid: block.uuid, tagId, phase: "set-tag" },
  );
  await applyOutlinerOps(
    opts,
    state,
    [[kw("batch-delete-property-value"), [[uuid(block.uuid)], kw("block/tags"), tagId]]],
    tmap(),
    { ...context, id: block.id, uuid: block.uuid, tagId, phase: "delete-tag-value" },
  );
}

function referenceViewBlock(viewUuid, viewsPageUuid, target, featureType, title, order, now) {
  return blockMap([
    ["block/uuid", uuid(viewUuid)],
    ["block/title", title],
    ["block/page", blockUuidRef(viewsPageUuid)],
    ["block/parent", blockUuidRef(viewsPageUuid)],
    ["block/order", order],
    ["block/created-at", now],
    ["block/updated-at", now],
    ["block/refs", blockUuidRef(target.uuid)],
    ["logseq.property/view-for", blockUuidRef(target.uuid)],
    ["logseq.property.view/type", kw("logseq.property.view/type.list")],
    ["logseq.property.view/group-by-property", kw("block/page")],
    ["logseq.property.view/feature-type", kw(featureType)],
  ]);
}

function propertyHistoryBlock(historyUuid, targetRef, statusIdent, now) {
  return blockMap([
    ["block/uuid", uuid(historyUuid)],
    ["block/created-at", now],
    ["block/updated-at", now],
    ["logseq.property.history/block", targetRef],
    ["logseq.property.history/property", kw("logseq.property/status")],
    ["logseq.property.history/ref-value", kw(statusIdent)],
  ]);
}

function statusHistoryValue(context, offset = 0) {
  const statuses = ["logseq.property/status.todo", "logseq.property/status.doing", "logseq.property/status.done"];
  const seq = Number.isInteger(context.seq) ? context.seq : 0;
  return statuses[(seq + offset) % statuses.length];
}

function reactionEmojiId(context) {
  const emojiIds = ["+1", "eyes", "tada"];
  const seq = Number.isInteger(context.seq) ? context.seq : 0;
  return emojiIds[seq % emojiIds.length];
}

export function stressReferenceViewOrder(context = {}, offset = 0) {
  const base62Digits = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  const seq = Number.isInteger(context.seq) ? context.seq : 0;
  const index = Math.abs(seq * 2 + offset);
  const digit = base62Digits[index % base62Digits.length];
  if (index < base62Digits.length) {
    return `a${digit}`;
  }
  const bucket = base62Digits[Math.floor((index - base62Digits.length) / base62Digits.length)];
  return `b${bucket}${digit}`;
}

async function findViewsPageUuid(opts, context = {}) {
  return findPageUuid(opts, "$$$views", context);
}

async function createReferenceView(opts, state, context, featureType, title) {
  const target = await chooseLiveActiveUuid(opts, state, context);
  if (!target) {
    return null;
  }
  const viewsPageUuid = await findViewsPageUuid(opts, context);
  if (!viewsPageUuid) {
    return null;
  }
  const now = Date.now();
  const viewUuid = crypto.randomUUID();
  await transactRaw(
    opts,
    state,
    [referenceViewBlock(viewUuid, viewsPageUuid, target, featureType, title, stressReferenceViewOrder(context), now)],
    localTxMeta([kw("outliner-op"), kw("create-view")]),
    { ...context, id: target.id, uuid: target.uuid, viewUuid, featureType },
  );
  return { target, viewUuid };
}

async function applyRawCreatePropertyHistory(opts, state, context) {
  const target = await chooseLiveActiveUuid(opts, state, context);
  if (!target) {
    return;
  }
  const viewsPageUuid = await findViewsPageUuid(opts, context);
  if (!viewsPageUuid) {
    return;
  }
  const now = Date.now();
  const historyUuid = crypto.randomUUID();
  await transactRaw(
    opts,
    state,
    [propertyHistoryBlock(historyUuid, blockUuidRef(target.uuid), statusHistoryValue(context), now)],
    localTxMeta([kw("outliner-op"), kw("record-property-history")]),
    { ...context, id: target.id, uuid: target.uuid, historyUuid },
  );
}

async function applyRawCreateReferenceView(opts, state, context, featureType, title) {
  await createReferenceView(opts, state, context, featureType, title);
}

async function applyRawToggleReactionForBlock(opts, state, block, context) {
  await applyOutlinerOps(
    opts,
    state,
    [[kw("toggle-reaction"), [uuid(block.uuid), reactionEmojiId(context), null]]],
    tmap(),
    { ...context, id: block.id, uuid: block.uuid },
  );
}

async function applyRawToggleReaction(opts, state, context) {
  const block = chooseActiveUuid(state);
  if (!block) {
    return;
  }
  await applyRawToggleReactionForBlock(opts, state, block, context);
}

async function applyRawDeleteViewTargetWithRelatedEntities(opts, state, context) {
  const target = await chooseLiveActiveUuid(opts, state, context);
  if (!target) {
    return;
  }
  const viewsPageUuid = await findViewsPageUuid(opts, context);
  if (!viewsPageUuid) {
    return;
  }
  const now = Date.now();
  const linkedViewUuid = crypto.randomUUID();
  const unlinkedViewUuid = crypto.randomUUID();
  const targetHistoryUuid = crypto.randomUUID();
  const linkedViewHistoryUuid = crypto.randomUUID();
  const unlinkedViewHistoryUuid = crypto.randomUUID();
  await transactRaw(
    opts,
    state,
    [
      referenceViewBlock(
        linkedViewUuid,
        viewsPageUuid,
        target,
        "linked-references",
        "Linked references",
        stressReferenceViewOrder(context),
        now,
      ),
      referenceViewBlock(
        unlinkedViewUuid,
        viewsPageUuid,
        target,
        "unlinked-references",
        "Unlinked references",
        stressReferenceViewOrder(context, 1),
        now,
      ),
      propertyHistoryBlock(targetHistoryUuid, blockUuidRef(target.uuid), statusHistoryValue(context), now),
      propertyHistoryBlock(linkedViewHistoryUuid, blockUuidRef(linkedViewUuid), statusHistoryValue(context, 1), now),
      propertyHistoryBlock(unlinkedViewHistoryUuid, blockUuidRef(unlinkedViewUuid), statusHistoryValue(context, 2), now),
    ],
    localTxMeta([kw("outliner-op"), kw("create-view")]),
    {
      ...context,
      id: target.id,
      uuid: target.uuid,
      linkedViewUuid,
      unlinkedViewUuid,
      targetHistoryUuid,
      linkedViewHistoryUuid,
      unlinkedViewHistoryUuid,
      phase: "create-related-entities",
    },
  );
  await applyRawToggleReactionForBlock(opts, state, target, { ...context, phase: "create-reaction" });
  await applyOutlinerOps(
    opts,
    state,
    [[kw("delete-blocks"), [[uuid(target.uuid)], tmap()]]],
    tmap(),
    { ...context, id: target.id, uuid: target.uuid, phase: "delete-target" },
  );
  state.activeIds.delete(target.id);
  state.activeBlockUuids.delete(target.id);
}

async function applyRawInsertUndoRedo(opts, state, context, title) {
  const target = chooseActiveUuid(state);
  if (!target) {
    return;
  }
  const newUuid = crypto.randomUUID();
  const block = blockMap([
    ["block/uuid", uuid(newUuid)],
    ["block/title", title],
  ]);
  const forward = [[kw("insert-blocks"), [[block], uuid(target.uuid), tmap([kw("sibling?"), false, kw("keep-uuid?"), true])]]];
  const inverse = [[kw("delete-blocks"), [[uuid(newUuid)], tmap()]]];
  await applyOutlinerOps(opts, state, forward, tmap(), {
    ...context,
    phase: "redo-initial",
    targetId: target.id,
    targetUuid: target.uuid,
    uuid: newUuid,
  });
  await applyOutlinerOps(opts, state, inverse, tmap(), {
    ...context,
    phase: "undo",
    targetId: target.id,
    targetUuid: target.uuid,
    uuid: newUuid,
  });
  await applyOutlinerOps(opts, state, forward, tmap(), {
    ...context,
    phase: "redo",
    targetId: target.id,
    targetUuid: target.uuid,
    uuid: newUuid,
  });
  await refreshLiveIds(opts, state, "http-insert-undo-redo");
}

async function offlineWindow(opts, state, context) {
  if (state.offlineRunning) {
    return;
  }
  state.offlineRunning = true;
  try {
    await runCli(opts, ["sync", "stop", "--graph", opts.graph], { ...context, phase: "stop" });
    logEvent(opts, {
      event: "offline-window",
      level: "warn",
      status: "offline",
      context,
      durationMs: opts.offlineMs,
    });
    await delay(opts.offlineMs);
    const start = await runSyncStart(opts, { ...context, phase: "start" });
    if (!start.ok && opts.failFast) {
      throw new Error(`Failed to restart sync after offline window for ${opts.graph}`);
    }
  } finally {
    state.offlineRunning = false;
  }
}

async function offlineTodayJournalRace(opts, state, context) {
  if (state.offlineRunning) {
    return;
  }
  state.offlineRunning = true;
  const page = todayJournalPageName(opts);
  if (!state.pageNames.includes(page)) {
    state.pageNames.push(page);
  }

  const clientCount = offlineTodayJournalClientCount(opts);
  try {
    await runCli(opts, ["sync", "stop", "--graph", opts.graph], { ...context, phase: "stop", page });
    logEvent(opts, {
      event: "offline-today-journal-race",
      level: "warn",
      status: "offline",
      context: { ...context, page, clientCount },
      durationMs: opts.offlineMs,
    });

    const responses = await Promise.all(
      Array.from({ length: clientCount }, (_, index) => {
        const clientId = index + 1;
        return runCli(
          opts,
          [
            "upsert",
            "block",
            "--graph",
            opts.graph,
            "--target-page",
            page,
            "--content",
            `offline today journal ${state.runId} client=${clientId} seq=${context.seq}`,
          ],
          { ...context, phase: "write", page, clientId, clientCount },
        );
      }),
    );
    for (const response of responses) {
      for (const id of resultIds(response)) {
        state.activeIds.add(id);
      }
    }

    await delay(opts.offlineMs);
    const start = await runSyncStart(opts, { ...context, phase: "start", page });
    if (!start.ok && opts.failFast) {
      throw new Error(`Failed to restart sync after offline today journal race for ${opts.graph}`);
    }
    await refreshLiveIds(opts, state, "offline-today-journal-race");
  } finally {
    state.offlineRunning = false;
  }
}

async function waitForSyncSettled(opts, context = {}, required = false) {
  if (!opts.sync) {
    return true;
  }
  let last = null;
  for (let attempt = 1; attempt <= opts.settleAttempts; attempt += 1) {
    const status = await runCli(opts, ["sync", "status", "--graph", opts.graph], {
      ...context,
      op: context.op || "sync-status-settle",
      attempt,
      client: opts.clientName,
    });
    last = status;
    const settled = required ? isSettledSyncStatus(status) : isIdleSyncStatus(status);
    if (settled) {
      return true;
    }
    await delay(opts.settleMs);
  }
  logEvent(opts, {
    event: "sync-settle",
    level: required ? "error" : "warn",
    context,
    status: last?.parsed?.data,
  });
  if (required) {
    throw new Error(`Sync did not settle for ${opts.graph} on ${opts.clientName || "client-1"}`);
  }
  return false;
}

async function validateClientChecksum(client) {
  if (!client.opts.sync) {
    return;
  }
  const response = await invokeThreadApi(
    client.opts,
    client.state,
    "thread-api/recompute-checksum-diagnostics",
    [client.state.repo],
    { op: "final-recompute-checksum", client: client.opts.clientName },
  );
  const diagnostics = response.parsed?.result;
  const ok = response.ok && checksumDiagnosticsMatch(diagnostics);
  logEvent(client.opts, {
    event: "checksum-diagnostics",
    level: ok ? "info" : "error",
    context: { op: "final-recompute-checksum", client: client.opts.clientName },
    recomputedChecksum: transitValueGet(diagnostics, "recomputed-checksum"),
    localChecksum: transitValueGet(diagnostics, "local-checksum"),
    remoteChecksum: transitValueGet(diagnostics, "remote-checksum"),
  });
  if (!ok) {
    throw new Error(`Final checksum validation failed for ${client.opts.graph} on ${client.opts.clientName}`);
  }
}

const localRebaseOps = [
  "create-root",
  "create-child",
  "update",
  "move-child",
  "move-sibling",
  "delete-single",
  "http-insert-blocks",
  "http-delete-blocks",
  "http-move-blocks",
  "http-insert-undo-redo",
];

function chooseDistinctClients(clients) {
  if (!Array.isArray(clients) || clients.length < 2) {
    return null;
  }
  const first = chooseArray(clients);
  const candidates = clients.filter((client) => client !== first);
  return [first, chooseArray(candidates)];
}

async function multiClientOfflineRebase(opts, cluster, context) {
  if (cluster.offlineRunning) {
    return;
  }
  const pair = chooseDistinctClients(cluster.clients);
  if (!pair) {
    return;
  }
  const [offlineClient, onlineClient] = pair;
  cluster.offlineRunning = true;
  try {
    await runCli(offlineClient.opts, ["sync", "stop", "--graph", offlineClient.opts.graph], {
      ...context,
      phase: "stop-offline-client",
      client: offlineClient.opts.clientName,
    });
    logEvent(opts, {
      event: "multi-client-offline-rebase",
      level: "warn",
      context: {
        ...context,
        offlineClient: offlineClient.opts.clientName,
        onlineClient: onlineClient.opts.clientName,
      },
      durationMs: opts.offlineMs,
    });

    for (let index = 0; index < 3; index += 1) {
      const op = chooseArray(localRebaseOps);
      offlineClient.state.nextSeq += 1;
      await runOperation(offlineClient.opts, offlineClient.state, context.workerId, context.seq * 10 + index, op);
    }

    for (let index = 0; index < 3; index += 1) {
      const op = chooseArray(localRebaseOps);
      onlineClient.state.nextSeq += 1;
      await runOperation(onlineClient.opts, onlineClient.state, context.workerId, context.seq * 10 + index + 3, op);
    }

    await waitForSyncSettled(
      onlineClient.opts,
      { ...context, op: "multi-client-online-settle", onlineClient: onlineClient.opts.clientName },
      false,
    );
    await delay(opts.offlineMs);
    const start = await runSyncStart(offlineClient.opts, {
      ...context,
      phase: "start-offline-client",
      client: offlineClient.opts.clientName,
    });
    if (!start.ok && opts.failFast) {
      throw new Error(`Failed to restart sync for ${offlineClient.opts.clientName}`);
    }
    await waitForSyncSettled(
      offlineClient.opts,
      { ...context, op: "multi-client-offline-settle", offlineClient: offlineClient.opts.clientName },
      false,
    );
    await Promise.all([
      refreshLiveIds(offlineClient.opts, offlineClient.state, "multi-client-offline-rebase"),
      refreshLiveIds(onlineClient.opts, onlineClient.state, "multi-client-offline-rebase"),
    ]);
  } finally {
    cluster.offlineRunning = false;
  }
}

async function multiClientTodayJournalRace(opts, cluster, context) {
  if (cluster.offlineRunning) {
    return;
  }
  const pair = chooseDistinctClients(cluster.clients);
  if (!pair) {
    return;
  }
  const [first, second] = pair;
  const page = todayJournalPageName(opts);
  cluster.offlineRunning = true;
  try {
    for (const client of [first, second]) {
      if (!client.state.pageNames.includes(page)) {
        client.state.pageNames.push(page);
      }
      await runCli(client.opts, ["sync", "stop", "--graph", client.opts.graph], {
        ...context,
        phase: "stop",
        client: client.opts.clientName,
        page,
      });
    }

    await Promise.all(
      [first, second].map((client, index) =>
        runCli(
          client.opts,
          [
            "upsert",
            "block",
            "--graph",
            client.opts.graph,
            "--target-page",
            page,
            "--content",
            `multi-client offline today journal ${client.state.runId} client=${client.opts.clientName} seq=${context.seq}`,
          ],
          { ...context, phase: "offline-write", client: client.opts.clientName, page, index },
        ),
      ),
    );

    const firstStart = await runSyncStart(first.opts, {
      ...context,
      phase: "start-first",
      client: first.opts.clientName,
      page,
    });
    if (!firstStart.ok && opts.failFast) {
      throw new Error(`Failed to start sync for ${first.opts.clientName}`);
    }
    await waitForSyncSettled(first.opts, { ...context, op: "multi-client-today-first-settle", page }, false);

    await delay(opts.offlineMs);
    const secondStart = await runSyncStart(second.opts, {
      ...context,
      phase: "start-second",
      client: second.opts.clientName,
      page,
    });
    if (!secondStart.ok && opts.failFast) {
      throw new Error(`Failed to start sync for ${second.opts.clientName}`);
    }
    await waitForSyncSettled(second.opts, { ...context, op: "multi-client-today-second-settle", page }, false);
    await Promise.all([
      refreshLiveIds(first.opts, first.state, "multi-client-today-journal-race"),
      refreshLiveIds(second.opts, second.state, "multi-client-today-journal-race"),
    ]);
  } finally {
    cluster.offlineRunning = false;
  }
}

async function runOperation(opts, state, workerId, seq, forcedOp = null) {
  const op = forcedOp || weightedOperation(opts);
  const stamp = `${state.runId} worker=${workerId} seq=${seq} op=${op}`;
  await refreshLiveIdsIfNeeded(opts, state, "operation");

  if (state.activeIds.size < opts.concurrency && !["create-root", "offline-window", "offline-today-journal-race"].includes(op)) {
    await createBlock(opts, state, `seed ${stamp}`, ["--target-page", randomPage(state)], {
      workerId,
      seq,
      op: "seed",
    });
    return;
  }

  switch (op) {
    case "create-root":
      await createBlock(opts, state, `root ${stamp}`, ["--target-page", randomPage(state)], { workerId, seq, op });
      return;

    case "create-child": {
      const parentId = choose(state.activeIds);
      await createBlock(
        opts,
        state,
        `child ${stamp} parent=${parentId}`,
        ["--target-id", String(parentId), "--pos", Math.random() < 0.5 ? "first-child" : "last-child"],
        {
          workerId,
          seq,
          op,
          parentId,
        },
      );
      return;
    }

    case "create-tree": {
      const page = randomPage(state);
      const blocks = `[
        {:block/title ${ednString(`tree root ${stamp}`)}
         :block/children [{:block/title ${ednString(`tree child ${stamp}`)}}]}
        {:block/title ${ednString(`tree sibling ${stamp}`)}}]`;
      const response = await runCli(
        opts,
        ["upsert", "block", "--graph", opts.graph, "--target-page", page, "--blocks", blocks],
        { workerId, seq, op, page },
      );
      for (const id of resultIds(response)) {
        state.activeIds.add(id);
      }
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

    case "move-child": {
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

    case "move-page": {
      const id = choose(state.activeIds);
      const page = randomPage(state);
      if (!id) {
        return;
      }
      const context = { workerId, seq, op, id, page };
      const response = await runCli(
        opts,
        ["upsert", "block", "--graph", opts.graph, "--id", String(id), "--target-page", page],
        context,
      );
      pruneStaleIds(state, response, context);
      return;
    }

    case "move-sibling": {
      const id = choose(state.activeIds);
      const targetId = choose(state.activeIds);
      if (!id || !targetId || id === targetId) {
        return;
      }
      const context = { workerId, seq, op, id, targetId };
      const response = await runCli(
        opts,
        ["upsert", "block", "--graph", opts.graph, "--id", String(id), "--target-id", String(targetId), "--pos", "sibling"],
        context,
      );
      pruneStaleIds(state, response, context);
      return;
    }

    case "block-tags-add": {
      const id = choose(state.activeIds);
      const tag = stressTag(state);
      if (!id || !tag) {
        return;
      }
      const context = { workerId, seq, op, id, tag };
      const response = await runCli(
        opts,
        ["upsert", "block", "--graph", opts.graph, "--id", String(id), "--update-tags", `[${ednString(tag)}]`],
        context,
      );
      pruneStaleIds(state, response, context);
      return;
    }

    case "block-tags-remove": {
      const id = choose(state.activeIds);
      const tag = stressTag(state);
      if (!id || !tag) {
        return;
      }
      const context = { workerId, seq, op, id, tag };
      const response = await runCli(
        opts,
        ["upsert", "block", "--graph", opts.graph, "--id", String(id), "--remove-tags", `[${ednString(tag)}]`],
        context,
      );
      pruneStaleIds(state, response, context);
      return;
    }

    case "block-properties-add": {
      const id = choose(state.activeIds);
      const property = stressProperty(state);
      if (!id || !property) {
        return;
      }
      const context = { workerId, seq, op, id, property };
      const response = await runCli(
        opts,
        ["upsert", "block", "--graph", opts.graph, "--id", String(id), "--update-properties", propertyMap(property, `value ${stamp}`)],
        context,
      );
      pruneStaleIds(state, response, context);
      return;
    }

    case "block-properties-remove": {
      const id = choose(state.activeIds);
      const property = stressProperty(state);
      if (!id || !property) {
        return;
      }
      const context = { workerId, seq, op, id, property };
      const response = await runCli(
        opts,
        ["upsert", "block", "--graph", opts.graph, "--id", String(id), "--remove-properties", propertyVector(property)],
        context,
      );
      pruneStaleIds(state, response, context);
      return;
    }

    case "task-create": {
      const page = randomPage(state);
      const response = await runCli(
        opts,
        [
          "upsert",
          "task",
          "--graph",
          opts.graph,
          "--target-page",
          page,
          "--content",
          `task ${stamp}`,
          "--status",
          "todo",
          "--priority",
          "high",
        ],
        { workerId, seq, op, page },
      );
      for (const id of resultIds(response)) {
        state.activeIds.add(id);
        state.taskIds.add(id);
      }
      return;
    }

    case "task-update": {
      const id = choose(state.taskIds.size > 0 ? state.taskIds : state.activeIds);
      if (!id) {
        return;
      }
      const context = { workerId, seq, op, id };
      const response = await runCli(
        opts,
        ["upsert", "task", "--graph", opts.graph, "--id", String(id), "--status", "doing", "--priority", "low"],
        context,
      );
      pruneStaleIds(state, response, context);
      return;
    }

    case "page-upsert": {
      await runCli(opts, ["upsert", "page", "--graph", opts.graph, "--page", randomPage(state)], {
        workerId,
        seq,
        op,
      });
      return;
    }

    case "page-properties-add": {
      const page = randomPage(state);
      const property = stressProperty(state);
      await runCli(
        opts,
        ["upsert", "page", "--graph", opts.graph, "--page", page, "--update-properties", propertyMap(property, `page ${stamp}`)],
        { workerId, seq, op, page, property },
      );
      return;
    }

    case "page-properties-remove": {
      const page = randomPage(state);
      const property = stressProperty(state);
      await runCli(
        opts,
        ["upsert", "page", "--graph", opts.graph, "--page", page, "--remove-properties", propertyVector(property)],
        { workerId, seq, op, page, property },
      );
      return;
    }

    case "page-delete-restore": {
      const page = mutablePage(state);
      await runCli(opts, ["remove", "page", "--graph", opts.graph, "--page", page], {
        workerId,
        seq,
        op,
        page,
        phase: "delete",
      });
      await runCli(opts, ["upsert", "page", "--graph", opts.graph, "--page", page, "--restore"], {
        workerId,
        seq,
        op,
        page,
        phase: "restore",
      });
      await refreshLiveIds(opts, state, "page-delete-restore");
      return;
    }

    case "tag-upsert": {
      const tag = chooseArray([...state.stableTags, state.volatileTag]);
      await runCli(opts, ["upsert", "tag", "--graph", opts.graph, "--name", tag], {
        workerId,
        seq,
        op,
        tag,
      });
      return;
    }

    case "tag-delete-recreate": {
      const tag = state.volatileTag;
      await runCli(opts, ["remove", "tag", "--graph", opts.graph, "--name", tag], {
        workerId,
        seq,
        op,
        tag,
        phase: "delete",
      });
      await runCli(opts, ["upsert", "tag", "--graph", opts.graph, "--name", tag], {
        workerId,
        seq,
        op,
        tag,
        phase: "recreate",
      });
      return;
    }

    case "property-upsert": {
      const property = chooseArray([...state.stableProperties, state.volatileProperty]);
      await runCli(
        opts,
        ["upsert", "property", "--graph", opts.graph, "--name", property, "--type", "default", "--cardinality", "one", "--public", "true"],
        { workerId, seq, op, property },
      );
      return;
    }

    case "property-delete-recreate": {
      const property = state.volatileProperty;
      await runCli(opts, ["remove", "property", "--graph", opts.graph, "--name", property], {
        workerId,
        seq,
        op,
        property,
        phase: "delete",
      });
      await runCli(
        opts,
        ["upsert", "property", "--graph", opts.graph, "--name", property, "--type", "default", "--cardinality", "one", "--public", "true"],
        { workerId, seq, op, property, phase: "recreate" },
      );
      return;
    }

    case "http-insert-blocks":
      await applyRawInsertBlocks(opts, state, { workerId, seq, op }, `http insert ${stamp}`);
      return;

    case "http-delete-blocks":
      await applyRawDeleteBlocks(opts, state, { workerId, seq, op });
      return;

    case "http-move-blocks":
      await applyRawMoveBlocks(opts, state, { workerId, seq, op });
      return;

    case "http-save-block":
      await applyRawSaveBlock(opts, state, { workerId, seq, op }, `http save ${stamp}`);
      return;

    case "http-move-up-down":
      await applyRawMoveUpDown(opts, state, { workerId, seq, op }, Math.random() < 0.5);
      return;

    case "http-indent-outdent":
      await applyRawIndentOutdent(opts, state, { workerId, seq, op }, Math.random() < 0.5);
      return;

    case "http-apply-template":
      await applyRawApplyTemplate(opts, state, { workerId, seq, op }, `http template ${stamp}`);
      return;

    case "http-create-page":
      await applyRawCreatePage(
        opts,
        state,
        { workerId, seq, op },
        uniqueOperationPageTitle("CLI HTTP Page", state, { workerId, seq, op }),
      );
      return;

    case "http-rename-page":
      await applyRawRenamePage(opts, state, { workerId, seq, op }, `CLI HTTP Rename ${state.runId} ${seq}`);
      return;

    case "http-delete-restore-page":
      await applyRawDeleteRestorePage(opts, state, { workerId, seq, op });
      return;

    case "http-recycle-delete-page":
      await applyRawRecycleDeletePage(
        opts,
        state,
        { workerId, seq, op },
        uniqueOperationPageTitle("CLI HTTP Recycle", state, { workerId, seq, op }),
      );
      return;

    case "http-upsert-property":
      await applyRawUpsertProperty(opts, state, { workerId, seq, op });
      return;

    case "http-set-block-property":
      await applyRawSetBlockProperty(opts, state, { workerId, seq, op }, `http property ${stamp}`);
      return;

    case "http-remove-block-property":
      await applyRawRemoveBlockProperty(opts, state, { workerId, seq, op });
      return;

    case "http-batch-set-property":
      await applyRawBatchSetProperty(opts, state, { workerId, seq, op }, `http batch ${stamp}`);
      return;

    case "http-batch-remove-property":
      await applyRawBatchRemoveProperty(opts, state, { workerId, seq, op });
      return;

    case "http-batch-delete-property-value":
      await applyRawBatchDeletePropertyValue(opts, state, { workerId, seq, op });
      return;

    case "http-create-property-history":
      await applyRawCreatePropertyHistory(opts, state, { workerId, seq, op });
      return;

    case "http-create-linked-references-view":
      await applyRawCreateReferenceView(opts, state, { workerId, seq, op }, "linked-references", "Linked references");
      return;

    case "http-create-unlinked-references-view":
      await applyRawCreateReferenceView(opts, state, { workerId, seq, op }, "unlinked-references", "Unlinked references");
      return;

    case "http-toggle-reaction":
      await applyRawToggleReaction(opts, state, { workerId, seq, op });
      return;

    case "http-delete-view-target-with-related-entities":
      await applyRawDeleteViewTargetWithRelatedEntities(opts, state, { workerId, seq, op });
      return;

    case "http-insert-undo-redo":
      await applyRawInsertUndoRedo(opts, state, { workerId, seq, op }, `http undo redo ${stamp}`);
      return;

    case "offline-window":
      await offlineWindow(opts, state, { workerId, seq, op });
      return;

    case "offline-today-journal-race":
      await offlineTodayJournalRace(opts, state, { workerId, seq, op });
      return;

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

async function clusterWorker(opts, cluster, workerId) {
  let localSeq = 0;
  while (!cluster.stop) {
    const seq = cluster.nextSeq;
    cluster.nextSeq += 1;
    if (opts.maxOps > 0 && seq >= opts.maxOps) {
      cluster.stop = true;
      break;
    }

    const op = weightedOperation(opts);
    try {
      if (op === "multi-client-offline-rebase") {
        await multiClientOfflineRebase(opts, cluster, { workerId, seq, op });
      } else if (op === "multi-client-today-journal-race") {
        await multiClientTodayJournalRace(opts, cluster, { workerId, seq, op });
      } else {
        const client = chooseArray(cluster.clients);
        client.state.nextSeq += 1;
        await runOperation(client.opts, client.state, workerId, localSeq, op);
      }
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
        cluster.stop = true;
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
        totalOpsStarted: cluster.nextSeq,
        activeIds: cluster.clients.reduce((sum, client) => sum + client.state.activeIds.size, 0),
        clients: cluster.clients.length,
      });
    }
    await delay(Math.floor(Math.random() * 40));
  }
}

function createStressState(opts, runId) {
  const state = {
    runId,
    pageNames: stressPageNames(opts),
    bootstrapPageNames: bootstrapStressPageNames(opts),
    mutablePageNames: [],
    stableTags: ["cli-stress-tag-a", "cli-stress-tag-b"],
    stableTagIds: new Map(),
    stableProperties: ["cli-stress-prop-a", "cli-stress-prop-b"],
    volatileTag: "cli-stress-volatile-tag",
    volatileProperty: "cli-stress-volatile-prop",
    rawPropertyIdent: "user.property/cli-http-prop",
    rawPropertyName: "cli-http-prop",
    activeIds: new Set(),
    activeBlockUuids: new Map(),
    taskIds: new Set(),
    nextSeq: 0,
    lastRefreshSeq: -Infinity,
    refreshing: false,
    offlineRunning: false,
    stop: false,
  };
  state.mutablePageNames = mutableStressPageNames(opts);
  return state;
}

async function validateClientGraph(client, phase) {
  const validation = await runCli(client.opts, graphValidateArgs(client.opts), {
    op: `${phase}-graph-validate`,
    client: client.opts.clientName,
  });
  if (!validation.ok) {
    throw new Error(`${phase} graph validation failed for ${client.opts.graph} on ${client.opts.clientName}`);
  }
}

async function buildSeedClient(opts, runId) {
  const clientOpts = clientRuntimeOptions(opts, 0);
  ensureStressConfig(clientOpts);
  const graphServer = await ensureLocalServers(clientOpts);
  const state = createStressState(clientOpts, runId);
  state.workerBaseUrl = graphServer["base-url"];
  state.repo = graphServerRepo(clientOpts, graphServer);
  await validateClientGraph({ opts: clientOpts }, "preflight");
  await ensureStressMetadata(clientOpts, state);
  await refreshLiveIds(clientOpts, state, "startup");
  await waitForSyncSettled(clientOpts, { op: "seed-startup-settle", client: clientOpts.clientName }, false);
  return { opts: clientOpts, state, graphServer };
}

async function buildReplicaClient(opts, clientIndex, runId) {
  const clientOpts = clientRuntimeOptions(opts, clientIndex);
  ensureStressConfig(clientOpts);
  const graphServer = await ensureReplicaLocalServers(clientOpts);
  const state = createStressState(clientOpts, runId);
  state.workerBaseUrl = graphServer["base-url"];
  state.repo = graphServerRepo(clientOpts, graphServer);
  await validateClientGraph({ opts: clientOpts }, "preflight");
  await waitForSyncSettled(clientOpts, { op: "replica-startup-settle", client: clientOpts.clientName }, false);
  await refreshStressTagIds(clientOpts, state, "replica-startup");
  await refreshLiveIds(clientOpts, state, "replica-startup");
  return { opts: clientOpts, state, graphServer };
}

async function buildStressClients(opts, runId) {
  const clients = [await buildSeedClient(opts, runId)];
  for (let index = 1; index < opts.clients; index += 1) {
    clients.push(await buildReplicaClient(opts, index, runId));
  }
  return clients;
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  mkdirSync(dirname(opts.logFile), { recursive: true });
  const runId = `stress-${Date.now()}`;

  logEvent(opts, {
    event: "start",
    level: "info",
    runId,
    config: opts.config,
    httpBase: opts.httpBase,
    wsUrl: opts.wsUrl,
    clients: opts.clients,
    concurrency: opts.concurrency,
    maxOps: opts.maxOps,
    sync: opts.sync,
    offline: opts.offline,
    graphE2ee: opts.graphE2ee,
    pageNames: stressPageNames(opts),
  });

  const clients = await buildStressClients(opts, runId);
  let totalOpsStarted = clients[0]?.state.nextSeq || 0;

  if (clients.length === 1) {
    await Promise.all(Array.from({ length: opts.concurrency }, (_, index) => worker(clients[0].opts, clients[0].state, index + 1)));
    totalOpsStarted = clients[0].state.nextSeq;
  } else {
    const cluster = {
      clients,
      nextSeq: 0,
      stop: false,
      offlineRunning: false,
    };
    await Promise.all(Array.from({ length: opts.concurrency }, (_, index) => clusterWorker(opts, cluster, index + 1)));
    totalOpsStarted = cluster.nextSeq;
  }

  for (const client of clients) {
    await waitForSyncSettled(client.opts, { op: "final-sync-settle", client: client.opts.clientName }, true);
    await validateClientChecksum(client);
    await validateClientGraph(client, "final");
  }

  logEvent(opts, {
    event: "stop",
    level: "info",
    runId,
    totalOpsStarted,
    activeIds: clients.reduce((sum, client) => sum + client.state.activeIds.size, 0),
    clients: clients.length,
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
