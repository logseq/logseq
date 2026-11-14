import fs from "node:fs/promises";
import path from "node:path";
import { CliError, runLogseqJson } from "./cli.mjs";

const AUTH_ERROR_CODES = new Set([
  "missing-auth",
  "invalid-auth-file",
  "invalid-auth-token",
  "auth-refresh-failed",
  "missing-id-token",
]);

const DOWNLOAD_TIMEOUT_MS = 35 * 60 * 1000;
const SYNC_START_TIMEOUT_MS = 2 * 60 * 1000;

function log(event, fields = {}) {
  console.log(JSON.stringify({ time: new Date().toISOString(), event, ...fields }));
}

function errorFields(error) {
  return error instanceof CliError
    ? { code: error.code, message: error.message, hint: error.hint }
    : { message: String(error?.message ?? error) };
}

function wsState(status) {
  const value = status?.["ws-state"];
  return typeof value === "string" ? value.replace(/^:/, "") : null;
}

/**
 * Owns the lifecycle of synced graphs inside the container: login, download,
 * starting sync, and keeping sync running for every graph opened via MCP.
 */
export class GraphManager {
  constructor(config) {
    this.config = config;
    this.statePath = path.join(config.dataDir, "logseq-mcp", "state.json");
    this.authPath = path.join(config.rootDir, "auth.json");
    this.openGraphs = new Set();
    this.jobs = new Map();
    this.lastErrors = new Map();
    this.watchdog = null;
  }

  async init() {
    await this.loadState();
    try {
      await this.ensureLoggedIn();
    } catch (error) {
      // Keep serving so MCP clients see the auth error instead of a crash loop.
      log("login-failed", errorFields(error));
    }
    const graphs = new Set([...this.openGraphs, ...this.config.autoOpenGraphs]);
    for (const graph of graphs) {
      this.startOpenJob(graph);
    }
    this.watchdog = setInterval(() => {
      this.checkSync().catch((error) => log("sync-watchdog-failed", errorFields(error)));
    }, this.config.syncCheckIntervalMs);
    this.watchdog.unref();
  }

  async loadState() {
    try {
      const state = JSON.parse(await fs.readFile(this.statePath, "utf8"));
      for (const graph of state.graphs ?? []) this.openGraphs.add(graph);
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }

  async saveState() {
    await fs.mkdir(path.dirname(this.statePath), { recursive: true });
    await fs.writeFile(
      this.statePath,
      `${JSON.stringify({ graphs: [...this.openGraphs].sort() }, null, 2)}\n`,
    );
  }

  hasCredentials() {
    return Boolean(this.config.username && this.config.password);
  }

  async login() {
    if (!this.hasCredentials()) {
      throw new CliError("Logseq login is required but LOGSEQ_USERNAME/LOGSEQ_PASSWORD are not set", {
        code: "missing-auth",
        hint: `Set LOGSEQ_USERNAME and LOGSEQ_PASSWORD, or place an auth.json at ${this.authPath}.`,
      });
    }
    const data = await runLogseqJson([
      "login",
      `--username=${this.config.username}`,
      `--password=${this.config.password}`,
    ]);
    log("login-ok", { email: data?.email });
  }

  async ensureLoggedIn() {
    try {
      await fs.access(this.authPath);
    } catch {
      await this.login();
    }
  }

  /** Runs a CLI call, re-logging in once when the stored auth is unusable. */
  async withAuth(fn) {
    try {
      return await fn();
    } catch (error) {
      if (error instanceof CliError && AUTH_ERROR_CODES.has(error.code) && this.hasCredentials()) {
        log("auth-retry", errorFields(error));
        await this.login();
        return fn();
      }
      throw error;
    }
  }

  e2eeArgs() {
    return this.config.e2eePassword ? [`--e2ee-password=${this.config.e2eePassword}`] : [];
  }

  async localGraphs() {
    const data = await runLogseqJson(["graph", "list"]);
    return data?.graphs ?? [];
  }

  async remoteGraphs() {
    return this.withAuth(() => runLogseqJson(["sync", "remote-graphs"]));
  }

  async syncStatus(graph) {
    return runLogseqJson(["sync", "status", `--graph=${graph}`]);
  }

  async startSync(graph) {
    return this.withAuth(() =>
      runLogseqJson(["sync", "start", `--graph=${graph}`, ...this.e2eeArgs()], {
        timeoutMs: SYNC_START_TIMEOUT_MS,
      }),
    );
  }

  async openGraphNow(graph) {
    const local = await this.localGraphs();
    if (!local.includes(graph)) {
      log("graph-download-start", { graph });
      await this.withAuth(() =>
        runLogseqJson(
          ["sync", "download", `--graph=${graph}`, "--progress", "false", ...this.e2eeArgs()],
          { timeoutMs: DOWNLOAD_TIMEOUT_MS },
        ),
      );
      log("graph-download-ok", { graph });
    }
    await this.startSync(graph);
    this.openGraphs.add(graph);
    this.lastErrors.delete(graph);
    await this.saveState();
    log("graph-open", { graph });
  }

  startOpenJob(graph) {
    const existing = this.jobs.get(graph);
    if (existing) return existing.promise;
    const job = { graph, startedAt: new Date().toISOString(), promise: null };
    job.promise = this.openGraphNow(graph)
      .catch((error) => {
        this.lastErrors.set(graph, { ...errorFields(error), at: new Date().toISOString() });
        log("graph-open-failed", { graph, ...errorFields(error) });
        throw error;
      })
      .finally(() => this.jobs.delete(graph));
    // Background jobs must not crash the process when nobody awaits them.
    job.promise.catch(() => {});
    this.jobs.set(graph, job);
    return job.promise;
  }

  /**
   * Opens a graph and waits up to `waitMs`. Returns `{state: "ready"}` or
   * `{state: "opening"}` when the download is still running in the background.
   */
  async openGraph(graph, waitMs) {
    const promise = this.startOpenJob(graph);
    let timer;
    const timeout = new Promise((resolve) => {
      timer = setTimeout(() => resolve("pending"), waitMs);
    });
    try {
      const outcome = await Promise.race([promise.then(() => "ready"), timeout]);
      return outcome === "ready"
        ? { graph, state: "ready" }
        : { graph, state: "opening", message: "Download still in progress; check list_local_graphs." };
    } finally {
      clearTimeout(timer);
    }
  }

  async closeGraph(graph, { removeLocal }) {
    const job = this.jobs.get(graph);
    if (job) {
      throw new CliError(`Graph ${graph} is still opening`, { code: "graph-opening" });
    }
    this.openGraphs.delete(graph);
    await this.saveState();
    const local = await this.localGraphs();
    if (local.includes(graph)) {
      await runLogseqJson(["sync", "stop", `--graph=${graph}`]).catch((error) =>
        log("sync-stop-failed", { graph, ...errorFields(error) }),
      );
      await runLogseqJson(["server", "stop", `--graph=${graph}`]).catch((error) =>
        log("server-stop-failed", { graph, ...errorFields(error) }),
      );
      if (removeLocal) await runLogseqJson(["graph", "remove", `--graph=${graph}`]);
    }
    this.lastErrors.delete(graph);
    log("graph-close", { graph, removeLocal });
    return { graph, closed: true, removedLocal: Boolean(removeLocal) };
  }

  /** Fails unless the graph was opened and is not mid-download. */
  assertReady(graph) {
    if (this.jobs.has(graph)) {
      throw new CliError(`Graph ${graph} is still opening`, {
        code: "graph-opening",
        hint: "Wait for the download to finish; check list_local_graphs.",
      });
    }
    if (!this.openGraphs.has(graph)) {
      throw new CliError(`Graph ${graph} is not open`, {
        code: "graph-not-open",
        hint: "Call open_graph first. Use list_remote_graphs to see available graphs.",
      });
    }
  }

  async describeGraphs() {
    const local = await this.localGraphs();
    const names = new Set([...local, ...this.openGraphs, ...this.jobs.keys()]);
    const graphs = [];
    for (const graph of [...names].sort()) {
      const entry = {
        graph,
        local: local.includes(graph),
        open: this.openGraphs.has(graph),
        opening: this.jobs.has(graph),
      };
      if (entry.open && !entry.opening) {
        try {
          const status = await this.syncStatus(graph);
          entry.wsState = wsState(status);
          entry.syncStatus = status;
        } catch (error) {
          entry.syncError = errorFields(error);
        }
      }
      if (this.lastErrors.has(graph)) entry.lastError = this.lastErrors.get(graph);
      graphs.push(entry);
    }
    return graphs;
  }

  async checkSync() {
    for (const graph of this.config.autoOpenGraphs) {
      if (!this.openGraphs.has(graph)) this.startOpenJob(graph);
    }
    for (const graph of this.openGraphs) {
      if (this.jobs.has(graph)) continue;
      try {
        const status = await this.syncStatus(graph);
        if (wsState(status) === "open") continue;
        log("sync-restart", { graph, wsState: wsState(status) });
        await this.startSync(graph);
        this.lastErrors.delete(graph);
      } catch (error) {
        this.lastErrors.set(graph, { ...errorFields(error), at: new Date().toISOString() });
        log("sync-check-failed", { graph, ...errorFields(error) });
      }
    }
  }

  /** Stops every db-worker-node so SQLite files are closed cleanly. */
  async shutdown() {
    clearInterval(this.watchdog);
    const graphs = await this.localGraphs().catch(() => []);
    await Promise.allSettled(
      graphs.map((graph) =>
        runLogseqJson(["server", "stop", `--graph=${graph}`], { timeoutMs: 15_000 }),
      ),
    );
    log("shutdown", { graphs });
  }

  async health() {
    const graphs = [];
    for (const graph of this.openGraphs) {
      if (this.jobs.has(graph)) {
        graphs.push({ graph, state: "opening" });
        continue;
      }
      try {
        graphs.push({ graph, state: wsState(await this.syncStatus(graph)) });
      } catch (error) {
        graphs.push({ graph, state: "error", error: errorFields(error) });
      }
    }
    return { ok: graphs.every((g) => g.state === "open" || g.state === "opening"), graphs };
  }
}
