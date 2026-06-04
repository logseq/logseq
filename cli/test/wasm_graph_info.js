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

const root = fs.mkdtempSync(path.join(os.tmpdir(), "logseq-cli-wasm-graph-info-"));
let requestCount = 0;

const resultTransit =
  '["~#set",[["~:logseq.kv/graph-created-at",1700000000],["~:logseq.kv/schema-version",77],["~:logseq.kv/custom","demo"]]]';

const server = http.createServer((req, res) => {
  let body = "";
  req.setEncoding("utf8");
  req.on("data", (chunk) => {
    body += chunk;
  });
  req.on("end", () => {
    requestCount += 1;
    try {
      if (req.method !== "POST" || req.url !== "/v1/invoke") {
        throw new Error(`unexpected request: ${req.method} ${req.url}`);
      }
      if (!body.includes("thread-api/q")) {
        throw new Error(`unexpected invoke method: ${body}`);
      }
      if (!body.includes("logseq_db_alpha")) {
        throw new Error(`missing repo in request: ${body}`);
      }
      if (!body.includes("logseq.kv")) {
        throw new Error(`missing graph info query namespace: ${body}`);
      }
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ resultTransit }));
    } catch (error) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: { message: error.message } }));
    }
  });
});

function runCli(baseUrl, args) {
  return new Promise((resolve, reject) => {
    const env = {
      ...process.env,
      LOGSEQ_CLI_BASE_URL: baseUrl,
    };
    const child = spawn(
      process.execPath,
      [wasm, "--root-dir", root, "--graph", "alpha", ...args],
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
    child.on("error", reject);
    child.on("exit", (code) => {
      resolve({ code, stdout, stderr });
    });
  });
}

function assertIncludes(name, haystack, needle) {
  if (!haystack.includes(needle)) {
    throw new Error(`${name}: missing ${JSON.stringify(needle)} in ${JSON.stringify(haystack)}`);
  }
}

function assertNotIncludes(name, haystack, needle) {
  if (haystack.includes(needle)) {
    throw new Error(`${name}: unexpected ${JSON.stringify(needle)} in ${JSON.stringify(haystack)}`);
  }
}

function assertLineStartsWith(name, text, prefix) {
  const lines = text.trim().split(/\r?\n/);
  if (!lines.some((line) => line.startsWith(prefix))) {
    throw new Error(`${name}: missing line starting with ${JSON.stringify(prefix)} in ${JSON.stringify(text)}`);
  }
}

async function main() {
  const baseUrl = await new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      resolve(`http://127.0.0.1:${server.address().port}`);
    });
  });

  const human = await runCli(baseUrl, ["graph", "info"]);
  if (human.code !== 0) {
    throw new Error(`expected human graph info to exit 0, got ${human.code}\n${human.stdout}\n${human.stderr}`);
  }
  assertIncludes("human graph", human.stdout, "graph");
  assertIncludes("human schema", human.stdout, "logseq.kv/schema-version    77");
  assertIncludes("human created", human.stdout, "ago");
  assertLineStartsWith("human custom kv row", human.stdout, "logseq.kv/custom");
  assertNotIncludes("human created fallback", human.stdout, "ms ago");
  assertNotIncludes("human unreasonable created seconds", human.stdout, "56 years");
  assertNotIncludes("human no field header", human.stdout, "Field");
  assertNotIncludes("human no value header", human.stdout, "Value");
  assertNotIncludes("human no kv aggregate", human.stdout, "kv     {");
  assertNotIncludes("human missing created", human.stdout, "logseq.kv/graph-created-at  -");
  assertNotIncludes("human empty kv", human.stdout, "kv     {}");

  const json = await runCli(baseUrl, ["--output", "json", "graph", "info"]);
  if (json.code !== 0) {
    throw new Error(`expected json graph info to exit 0, got ${json.code}\n${json.stdout}\n${json.stderr}`);
  }
  assertIncludes("json created", json.stdout, '"logseq.kv/graph-created-at":1700000000');
  assertIncludes("json schema", json.stdout, '"logseq.kv/schema-version":77');
  assertIncludes("json kv", json.stdout, '"logseq.kv/custom":"demo"');

  if (requestCount !== 2) {
    throw new Error(`expected two graph info requests, got ${requestCount}`);
  }
}

main()
  .then(() => {
    server.close(() => {
      fs.rmSync(root, { recursive: true, force: true });
      process.exit(0);
    });
  })
  .catch((error) => {
    console.error(error.stack || String(error));
    server.close(() => {
      fs.rmSync(root, { recursive: true, force: true });
      process.exit(1);
    });
  });
