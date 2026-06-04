const fs = require("fs");
const http = require("http");
const os = require("os");
const path = require("path");
const { spawn } = require("child_process");

const wasm = process.argv[2];
const expectedChecksum = "d59386e0ae435e292fbe0ebcdb954b75ed5fb3922091277cb19f798fc5d50718";

if (!wasm) {
  console.error("missing wasm bundle path");
  process.exit(1);
}

const root = fs.mkdtempSync(path.join(os.tmpdir(), "logseq-cli-wasm-upsert-asset-"));
const sourcePath = path.join(root, "logo.png");
fs.writeFileSync(sourcePath, "asset");

let step = 0;

function responseForInvoke(body) {
  step += 1;
  if (step === 1 && body.includes("thread-api/pull") && body.includes("logseq.class/Asset")) {
    return "[\"^ \",\"~:db/id\",77]";
  }
  if (step === 2 && body.includes("thread-api/q") && body.includes("home")) {
    return "[\"~#list\",[[\"^ \",\"~:db/id\",1,\"~:block/uuid\",\"~u11111111-1111-1111-1111-111111111111\",\"~:block/name\",\"home\"]]]";
  }
  if (step === 3 && body.includes("thread-api/apply-outliner-ops")) {
    if (!body.includes(expectedChecksum)) {
      throw new Error("missing asset checksum");
    }
    if (!body.includes("logseq.property.asset/type") || !body.includes("png")) {
      throw new Error("missing asset type metadata");
    }
    return "[]";
  }
  if (step === 4 && body.includes("thread-api/pull")) {
    return "[\"^ \",\"~:db/id\",10]";
  }
  throw new Error(`unexpected request at step ${step}: ${body}`);
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
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ resultTransit: responseForInvoke(body) }));
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
      "upsert",
      "asset",
      "--path",
      sourcePath,
      "--target-page",
      "Home",
      "--content",
      "Logo",
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
      console.error(`expected wasm upsert asset to exit 0, got ${code}`);
      console.error(stdout);
      console.error(stderr);
      finish(1);
      return;
    }
    if (step !== 4) {
      console.error(`expected four invoke requests, got ${step}`);
      finish(1);
      return;
    }
    if (!stdout.includes('{"status":"ok","data":{"result":[10]}}')) {
      console.error("expected success json output");
      console.error(stdout);
      finish(1);
      return;
    }
    const assetsDir = path.join(root, "graphs", "alpha", "assets");
    const copied = fs.existsSync(assetsDir) ? fs.readdirSync(assetsDir) : [];
    if (copied.length !== 1) {
      console.error(`expected one copied asset, got ${copied.length}`);
      finish(1);
      return;
    }
    const copiedContent = fs.readFileSync(path.join(assetsDir, copied[0]), "utf8");
    if (copiedContent !== "asset") {
      console.error("expected copied asset content");
      finish(1);
      return;
    }
    finish(0);
  });
});
