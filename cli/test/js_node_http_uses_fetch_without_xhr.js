const fs = require("fs");
const http = require("http");
const os = require("os");
const path = require("path");
const { spawn } = require("child_process");

const bundle = process.argv[2];

if (!bundle) {
  console.error("missing js bundle path");
  process.exit(1);
}

let requestCount = 0;
const preloadPath = path.join(
  os.tmpdir(),
  `logseq-cli-no-xhr-${process.pid}.js`,
);

fs.writeFileSync(
  preloadPath,
  `
globalThis.XMLHttpRequest = class {
  open() {
    throw new Error("XMLHttpRequest must not be used");
  }
};
`,
  "utf8",
);

const server = http.createServer((req, res) => {
  let body = "";
  req.setEncoding("utf8");
  req.on("data", (chunk) => {
    body += chunk;
  });
  req.on("end", () => {
    requestCount += 1;
    if (!body.includes("thread-api/cli-list-pages")) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: { message: "unexpected request" } }));
      return;
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ resultTransit: "[]" }));
  });
});

function finish(code) {
  server.close(() => {
    fs.rmSync(preloadPath, { force: true });
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
      "--require",
      preloadPath,
      bundle,
      "--graph",
      "alpha",
      "--output",
      "json",
      "list",
      "page",
    ],
    { env },
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
      console.error("expected js list page to succeed without XMLHttpRequest");
      console.error(stdout);
      console.error(stderr);
      finish(1);
      return;
    }
    if (requestCount !== 1) {
      console.error(`expected one request, got ${requestCount}`);
      console.error(stdout);
      console.error(stderr);
      finish(1);
      return;
    }
    finish(0);
  });
});
