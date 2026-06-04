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
    "~:db/id": 1,
    "~:block/title": "Plain",
    "~:block/created-at": 1777063533827,
    "~:block/updated-at": 1779715760691,
  },
  {
    "~:db/id": 2,
    "~:block/title": "Property",
    "~:block/created-at": 1733130109047,
    "~:block/updated-at": 1779543495725,
    "~:db/ident": "~:user.property/Assignee-Xf-emnkZ",
    "~:logseq.property/type": "node",
  },
  {
    "~:db/id": 3,
    "~:block/title": "中文图谱Alpha",
    "~:block/created-at": 1700000000000,
    "~:block/updated-at": 1700000000000,
  },
];

const resultTransit = JSON.stringify(rows);
let requestCount = 0;

const server = http.createServer((req, res) => {
  req.resume();
  req.on("end", () => {
    requestCount += 1;
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ resultTransit }));
  });
});

function finish(code) {
  server.close(() => process.exit(code));
}

function charWidth(code) {
  if (
    code === 0 ||
    code < 32 ||
    (code >= 0x7f && code < 0xa0) ||
    (code >= 0x0300 && code <= 0x036f) ||
    (code >= 0x1ab0 && code <= 0x1aff) ||
    (code >= 0x1dc0 && code <= 0x1dff) ||
    (code >= 0x20d0 && code <= 0x20ff) ||
    (code >= 0xfe20 && code <= 0xfe2f)
  ) {
    return 0;
  }
  if (
    code >= 0x1100 &&
    (code <= 0x115f ||
      code === 0x2329 ||
      code === 0x232a ||
      (code >= 0x2e80 && code <= 0xa4cf && code !== 0x303f) ||
      (code >= 0xac00 && code <= 0xd7a3) ||
      (code >= 0xf900 && code <= 0xfaff) ||
      (code >= 0xfe10 && code <= 0xfe19) ||
      (code >= 0xfe30 && code <= 0xfe6f) ||
      (code >= 0xff00 && code <= 0xff60) ||
      (code >= 0xffe0 && code <= 0xffe6))
  ) {
    return 2;
  }
  return 1;
}

function displayWidth(text) {
  return [...text].reduce((width, ch) => width + charWidth(ch.codePointAt(0)), 0);
}

function assertCreatedAtColumnAligned(stdout) {
  const lines = stdout.trimEnd().split("\n");
  const header = lines[0];
  const expected = displayWidth(header.slice(0, header.indexOf("block/created-at")));
  for (const line of lines.slice(1, -1)) {
    const match = line.match(/\d+ [A-Za-z]+ ago/);
    if (!match) {
      throw new Error(`missing relative created-at cell in line: ${line}\n${stdout}`);
    }
    const actual = displayWidth(line.slice(0, match.index));
    if (actual !== expected) {
      throw new Error(
        `created-at column mismatch: expected ${expected}, got ${actual}\n${stdout.replace(/ /g, "·")}`
      );
    }
  }
}

server.listen(0, "127.0.0.1", () => {
  const port = server.address().port;
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), "logseq-cli-ragged-"));
  fs.writeFileSync(path.join(rootDir, "cli.edn"), "{:list-title-max-display-width 6}");
  const child = spawn(
    process.execPath,
    [wasm, "--root-dir", rootDir, "--graph", "alpha", "list", "page"],
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
      if (requestCount !== 1) {
        throw new Error(`expected one request, got ${requestCount}`);
      }
      if (!stdout.includes("user.property/Assignee-Xf-emnkZ")) {
        throw new Error(`missing db ident in output:\n${stdout}`);
      }
      if (!stdout.includes("中文…")) {
        throw new Error(`missing display-width title truncation:\n${stdout}`);
      }
      if (stdout.includes("中文图谱Alpha")) {
        throw new Error(`full title should not appear in human output:\n${stdout}`);
      }
      assertCreatedAtColumnAligned(stdout);
      if (!stdout.includes("-")) {
        throw new Error(`missing placeholder for ragged cells:\n${stdout}`);
      }
      finish(0);
    } catch (error) {
      console.error(error.stack || String(error));
      finish(1);
    }
  });
});
