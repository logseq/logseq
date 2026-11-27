import fs from "node:fs/promises";
import path from "node:path";

export function log(event, fields = {}) {
  console.log(JSON.stringify({ time: new Date().toISOString(), event, ...fields }));
}

const LOG_FILE_RE = /^db-worker-node-\d{8}\.log$/;
const LINE_LEVEL_RE = /^\S+ \[(\w+)\]/;
const WARN_LEVELS = new Set(["shout", "severe", "warning", "error", "fatal", "warn"]);

/**
 * Forwards db-worker-node log files (written per graph under
 * <root-dir>/graphs/<graph>/) to stdout so sync errors show up in
 * `docker logs`. Only lines appended after startup are forwarded.
 */
export class WorkerLogForwarder {
  constructor({ graphsDir, level, intervalMs = 2000 }) {
    this.graphsDir = graphsDir;
    this.level = level;
    this.intervalMs = intervalMs;
    this.offsets = new Map();
    this.partial = new Map();
    this.timer = null;
    this.startedAt = Date.now();
  }

  start() {
    if (this.level === "off") return;
    this.timer = setInterval(() => {
      this.poll().catch((error) => log("worker-log-forward-failed", { message: error.message }));
    }, this.intervalMs);
    this.timer.unref();
  }

  stop() {
    clearInterval(this.timer);
  }

  shouldForward(line) {
    if (this.level === "all") return true;
    const level = LINE_LEVEL_RE.exec(line)?.[1]?.toLowerCase();
    return level ? WARN_LEVELS.has(level) : false;
  }

  async listLogFiles() {
    let graphDirs;
    try {
      graphDirs = await fs.readdir(this.graphsDir, { withFileTypes: true });
    } catch (error) {
      if (error.code === "ENOENT") return [];
      throw error;
    }
    const files = [];
    for (const dir of graphDirs) {
      if (!dir.isDirectory()) continue;
      const graphDir = path.join(this.graphsDir, dir.name);
      for (const name of await fs.readdir(graphDir).catch(() => [])) {
        if (LOG_FILE_RE.test(name)) files.push({ graph: dir.name, file: path.join(graphDir, name) });
      }
    }
    return files;
  }

  async poll() {
    for (const { graph, file } of await this.listLogFiles()) {
      const stat = await fs.stat(file).catch(() => null);
      if (!stat) continue;
      if (!this.offsets.has(file)) {
        // Skip history for files that existed before startup.
        this.offsets.set(file, stat.mtimeMs < this.startedAt ? stat.size : 0);
      }
      let offset = this.offsets.get(file);
      if (stat.size < offset) offset = 0;
      if (stat.size === offset) continue;

      const handle = await fs.open(file, "r");
      try {
        const length = stat.size - offset;
        const buffer = Buffer.alloc(length);
        await handle.read(buffer, 0, length, offset);
        this.offsets.set(file, stat.size);
        const text = (this.partial.get(file) ?? "") + buffer.toString("utf8");
        const lines = text.split("\n");
        this.partial.set(file, lines.pop());
        for (const line of lines) {
          if (line.trim() && this.shouldForward(line)) {
            console.log(`[db-worker-node ${graph}] ${line}`);
          }
        }
      } finally {
        await handle.close();
      }
    }
  }
}
