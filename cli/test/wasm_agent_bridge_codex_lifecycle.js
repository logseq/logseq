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

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "logseq-cli-agent-wasm-"));
const configPath = path.join(tmp, "cli.edn");
const codexBin = path.join(tmp, "fake-codex.js");
const markerPath = path.join(tmp, "codex-marker.txt");
const workerScript = "/tmp/logseq-cli-test-db-worker-node.js";

fs.writeFileSync(
  codexBin,
  `#!/usr/bin/env node
const fs = require("fs");
const marker = process.env.AGENT_BRIDGE_TEST_MARKER;
if (process.argv.includes("--version")) process.exit(0);
process.stdout.on("error", () => process.exit(73));
console.log(JSON.stringify({session_id: "wasm-live-session"}));
setTimeout(() => {
  process.stdout.write("still alive after session id\\n");
}, 200);
setTimeout(() => {
  fs.writeFileSync(marker, process.env.LOGSEQ_DB_WORKER_NODE_SCRIPT || "");
}, 500);
setTimeout(() => {}, 5000);
`
);
fs.chmodSync(codexBin, 0o755);
fs.writeFileSync(
  configPath,
  `{:agent-name "agent-a" :codex-bin "${codexBin.replace(/\\/g, "\\\\")}"}`
);

const registryPage =
  '{"~:db/id":100,"~:block/uuid":"~uaaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","~:block/name":"agentbridge","~:block/title":"AgentBridge"}';
const agentPage =
  '{"~:db/id":101,"~:block/uuid":"~ubbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb","~:block/name":"agent-a","~:block/title":"agent-a"}';
const masterBlock =
  '{"~:db/id":110,"~:block/uuid":"~ucccccccc-cccc-4ccc-8ccc-cccccccccccc","~:block/title":"AgentBridge master prompt","~:block/order":1,"~:block/_parent":[{"~:db/id":111,"~:block/title":"Graph master prompt","~:block/order":1,"~:block/tags":[{"~:db/ident":"~:logseq.class/Code-block"}]}]}';

const responses = [
  registryPage,
  agentPage,
  agentPage,
  masterBlock,
  registryPage,
  "",
  "",
];

let postIndex = 0;
let eventResponse = null;

const server = http.createServer((req, res) => {
  let body = "";
  req.setEncoding("utf8");
  req.on("data", (chunk) => {
    body += chunk;
  });
  req.on("end", () => {
    if (req.method === "GET" && req.url === "/v1/events") {
      res.writeHead(200, { "Content-Type": "text/event-stream" });
      res.write("\n");
      eventResponse = res;
      return;
    }
    if (req.method !== "POST" || req.url !== "/v1/invoke") {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: { message: `unexpected ${req.method} ${req.url}` } }));
      return;
    }
    const transit = responses[postIndex++];
    if (transit == null) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: { message: `unexpected extra request: ${body}` } }));
      return;
    }
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ resultTransit: transit === "" ? "[]" : `[${transit}]` }));
  });
});

function finish(code, child) {
  if (child && child.exitCode == null) child.kill("SIGTERM");
  if (eventResponse) eventResponse.end();
  server.close(() => {
    fs.rmSync(tmp, { recursive: true, force: true });
    process.exit(code);
  });
}

server.listen(0, "127.0.0.1", () => {
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  const child = spawn(
    process.execPath,
    [
      wasm,
      "--root-dir",
      tmp,
      "--config",
      configPath,
      "--graph",
      "alpha",
      "agent",
      "bridge",
    ],
    {
      env: {
        ...process.env,
        LOGSEQ_CLI_BASE_URL: baseUrl,
        LOGSEQ_DB_WORKER_NODE_SCRIPT: workerScript,
        AGENT_BRIDGE_TEST_MARKER: markerPath,
      },
      stdio: ["ignore", "pipe", "pipe"],
    }
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

  let remainingAttempts = 50;
  const interval = setInterval(() => {
    if (fs.existsSync(markerPath)) {
      clearInterval(interval);
      const marker = fs.readFileSync(markerPath, "utf8");
      try {
        if (marker !== workerScript) {
          throw new Error(`worker script env was not forwarded: ${JSON.stringify(marker)}`);
        }
        if (!stdout.includes("Codex master session started: wasm-live-session")) {
          throw new Error(`master session log missing:\nstdout:\n${stdout}\nstderr:\n${stderr}`);
        }
        finish(0, child);
      } catch (error) {
        console.error(error.message);
        finish(1, child);
      }
    } else if (--remainingAttempts <= 0) {
      clearInterval(interval);
      console.error(`fake codex did not stay alive long enough to write marker\nstdout:\n${stdout}\nstderr:\n${stderr}`);
      finish(1, child);
    }
  }, 100);

  child.on("exit", (code) => {
    if (!fs.existsSync(markerPath)) {
      clearInterval(interval);
      console.error(`agent bridge exited before fake codex marker; code=${code}\nstdout:\n${stdout}\nstderr:\n${stderr}`);
      finish(1, child);
    }
  });
});
