const fs = require("fs");
const http = require("http");
const os = require("os");
const path = require("path");
const { spawn } = require("child_process");

const wasm = process.argv[2];

if (!wasm) {
  console.error("missing wasm bundle path");
  process.exit(1);
}

const root = fs.mkdtempSync(path.join(os.tmpdir(), "logseq-cli-wasm-graph-backup-"));
let backupRequests = 0;

function extractSnapshotPath(body) {
  const marker = 'logseq_db_alpha\\",\\"';
  const start = body.indexOf(marker);
  if (start < 0) {
    throw new Error(`missing snapshot path marker in ${body}`);
  }
  const valueStart = start + marker.length;
  const end = body.indexOf('\\"', valueStart);
  if (end < 0) {
    throw new Error(`unterminated snapshot path in ${body}`);
  }
  return body.slice(valueStart, end);
}

const server = http.createServer((req, res) => {
  let body = "";
  req.setEncoding("utf8");
  req.on("data", (chunk) => {
    body += chunk;
  });
  req.on("end", () => {
    if (req.method !== "POST" || req.url !== "/v1/invoke") {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: { message: "not found" } }));
      return;
    }
    try {
      if (!body.includes("thread-api/backup-db-sqlite")) {
        throw new Error(`unexpected invoke body: ${body}`);
      }
      const snapshotPath = extractSnapshotPath(body);
      if (!snapshotPath.includes(path.join(root, "graphs", "alpha", "backup"))) {
        throw new Error(`unexpected snapshot path: ${snapshotPath}`);
      }
      fs.mkdirSync(path.dirname(snapshotPath), { recursive: true });
      fs.writeFileSync(snapshotPath, "sqlite-bytes");
      backupRequests += 1;
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ resultTransit: "true" }));
    } catch (error) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: { message: error.message } }));
    }
  });
});

function finish(code) {
  server.close(() => {
    fs.rmSync(root, { recursive: true, force: true });
    process.exit(code);
  });
}

server.listen(0, "127.0.0.1", () => {
  const port = server.address().port;
  const env = {
    ...process.env,
    LOGSEQ_CLI_BASE_URL: `http://127.0.0.1:${port}`,
  };
  const child = spawn(
    process.execPath,
    [
      wasm,
      "--root-dir",
      root,
      "--graph",
      "alpha",
      "--output",
      "json",
      "graph",
      "backup",
      "create",
      "--name",
      "nightly",
    ],
    { env }
  );
  let stdout = "";
  let stderr = "";
  child.stdout.setEncoding("utf8");
  child.stderr.setEncoding("utf8");
  child.stdout.on("data", (chunk) => {
    stdout += chunk;
  });
  child.stderr.on("data", (chunk) => {
    stderr += chunk;
  });
  child.on("error", (error) => {
    console.error(error.stack || String(error));
    finish(1);
  });
  child.on("exit", (code) => {
    if (code !== 0) {
      console.error(`expected wasm graph backup to exit 0, got ${code}`);
      console.error(stdout);
      console.error(stderr);
      finish(1);
      return;
    }
    if (backupRequests !== 1) {
      console.error(`expected one backup request, got ${backupRequests}`);
      finish(1);
      return;
    }
    if (!stdout.includes('"backup-name":"alpha-nightly-') || !stdout.includes('"path":"')) {
      console.error("expected backup result json");
      console.error(stdout);
      finish(1);
      return;
    }
    const backupRoot = path.join(root, "graphs", "alpha", "backup");
    const backups = fs.readdirSync(backupRoot);
    if (backups.length !== 1) {
      console.error(`expected one backup directory, got ${backups.length}`);
      finish(1);
      return;
    }
    const backupDir = path.join(backupRoot, backups[0]);
    if (fs.readFileSync(path.join(backupDir, "db.sqlite"), "utf8") !== "sqlite-bytes") {
      console.error("expected sqlite backup bytes");
      finish(1);
      return;
    }
    if (!fs.readFileSync(path.join(backupDir, "metadata.edn"), "utf8").includes(":source :cli")) {
      console.error("expected backup metadata");
      finish(1);
      return;
    }
    finish(0);
  });
});
