const http = require("http");
const { spawn } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const wasm = process.argv[2];
const graphId = "11111111-1111-1111-1111-111111111111";
const root = fs.mkdtempSync(path.join(os.tmpdir(), "logseq-cli-wasm-sync-progress-"));

if (!wasm) {
  console.error("missing wasm bundle path");
  process.exit(1);
}

let eventsRequests = 0;
let downloadRequests = 0;

function invokeResponse(body) {
  if (body.includes("thread-api/set-db-sync-config")) {
    return "true";
  }
  if (body.includes("thread-api/db-sync-list-remote-graphs")) {
    return `[[\"^ \",\"~:graph-name\",\"alpha\",\"~:graph-id\",\"~u${graphId}\",\"~:graph-e2ee?\",false]]`;
  }
  if (body.includes("thread-api/q")) {
    return "0";
  }
  if (body.includes("thread-api/db-sync-download-graph-by-id")) {
    downloadRequests += 1;
    return "true";
  }
  throw new Error(`unexpected invoke body: ${body}`);
}

const server = http.createServer((req, res) => {
  let body = "";
  req.setEncoding("utf8");
  req.on("data", (chunk) => {
    body += chunk;
  });
  req.on("end", () => {
    if (req.method === "GET" && req.url === "/v1/events") {
      eventsRequests += 1;
      res.writeHead(200, { "Content-Type": "text/event-stream" });
      res.end(
        `data: {\"payload\":\"[\\\"~:rtc-log\\\",[\\\"^ \\\",\\\"~:type\\\",\\\"~:rtc.log/download\\\",\\\"~:graph-uuid\\\",\\\"~u${graphId}\\\",\\\"~:message\\\",\\\"downloaded 1 block\\\"]]\"}\n\n`
      );
      return;
    }

    if (req.method === "POST" && req.url === "/v1/invoke") {
      try {
        const resultTransit = invokeResponse(body);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ resultTransit }));
      } catch (error) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: { message: error.message } }));
      }
      return;
    }

    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: { message: "not found" } }));
  });
});

function finish(code) {
  server.close(() => process.exit(code));
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
      "sync",
      "download",
      "--progress",
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
      console.error(`expected wasm sync download to exit 0, got ${code}`);
      console.error(stdout);
      console.error(stderr);
      finish(1);
      return;
    }
    if (eventsRequests !== 1) {
      console.error(`expected one events request, got ${eventsRequests}`);
      finish(1);
      return;
    }
    if (downloadRequests !== 1) {
      console.error(`expected one download request, got ${downloadRequests}`);
      finish(1);
      return;
    }
    if (!stdout.includes("downloaded 1 block")) {
      console.error("expected progress output");
      console.error(stdout);
      finish(1);
      return;
    }
    if (!stdout.includes('{"status":"ok","data":{"result":true}}')) {
      console.error("expected success json output");
      console.error(stdout);
      finish(1);
      return;
    }
    finish(0);
  });
});
