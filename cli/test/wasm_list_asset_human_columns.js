const http = require("http");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawn } = require("child_process");

const wasm = process.argv[2];

if (!wasm) {
  console.error("missing wasm bundle path");
  process.exit(1);
}

const rows = [
  {
    "~:block/updated-at": 1779715760691,
    "~:logseq.property.asset/checksum": "abc123",
    "~:logseq.property.asset/size": 4096,
    "~:block/title": "logo.png",
    "~:block/created-at": 1777063533827,
    "~:db/id": 10,
    "~:logseq.property.asset/type": "png",
  },
];

const resultTransit = JSON.stringify(rows);
let requestCount = 0;

function resultForBody(body) {
  if (requestCount === 1 && body.includes("thread-api/pull") && body.includes("logseq.class/Asset")) {
    return "[\"^ \",\"~:db/id\",77]";
  }
  if (requestCount === 2) {
    return resultTransit;
  }
  throw new Error(`unexpected request ${requestCount}: ${body}`);
}

const server = http.createServer((req, res) => {
  let body = "";
  req.setEncoding("utf8");
  req.on("data", (chunk) => {
    body += chunk;
  });
  req.on("end", () => {
    requestCount += 1;
    try {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ resultTransit: resultForBody(body) }));
    } catch (error) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: { message: error.message } }));
    }
  });
});

function finish(code) {
  server.close(() => process.exit(code));
}

function headersFrom(stdout) {
  return stdout.trimEnd().split("\n")[0].trim().split(/\s+/);
}

server.listen(0, "127.0.0.1", () => {
  const port = server.address().port;
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), "logseq-cli-list-asset-"));
  const child = spawn(
    process.execPath,
    [wasm, "--root-dir", rootDir, "--graph", "alpha", "list", "asset"],
    {
      env: {
        ...process.env,
        LOGSEQ_CLI_BASE_URL: `http://127.0.0.1:${port}`,
      },
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
  child.on("exit", (code) => {
    try {
      if (code !== 0) {
        throw new Error(`expected exit 0, got ${code}\n${stdout}\n${stderr}`);
      }
      if (requestCount !== 2) {
        throw new Error(`expected two requests, got ${requestCount}`);
      }
      const headers = headersFrom(stdout);
      const expectedPrefix = [
        "db/id",
        "block/title",
        "logseq.property.asset/size",
        "logseq.property.asset/type",
      ];
      const actualPrefix = headers.slice(0, expectedPrefix.length);
      if (JSON.stringify(actualPrefix) !== JSON.stringify(expectedPrefix)) {
        throw new Error(`unexpected asset header prefix: ${headers.join(",")}\n${stdout}`);
      }
      const expectedSuffix = ["block/created-at", "block/updated-at"];
      const actualSuffix = headers.slice(-expectedSuffix.length);
      if (JSON.stringify(actualSuffix) !== JSON.stringify(expectedSuffix)) {
        throw new Error(`unexpected asset header suffix: ${headers.join(",")}\n${stdout}`);
      }
      if (!headers.includes("logseq.property.asset/checksum")) {
        throw new Error(`missing middle asset column:\n${stdout}`);
      }
      if (headers.includes("node/type")) {
        throw new Error(`asset output must not render node/type:\n${stdout}`);
      }
      finish(0);
    } catch (error) {
      console.error(error.stack || String(error));
      finish(1);
    }
  });
});
