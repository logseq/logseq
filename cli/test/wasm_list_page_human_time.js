const http = require("http");
const { spawn } = require("child_process");

const wasm = process.argv[2];

if (!wasm) {
  console.error("missing wasm bundle path");
  process.exit(1);
}

let requestCount = 0;

const resultTransit =
  '[{"~:db/id":1,"~:block/title":"Home","~:block/created-at":1700000000000,"~:block/updated-at":1780411164893}]';

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
      if (!body.includes("thread-api/cli-list-pages")) {
        throw new Error(`unexpected invoke method: ${body}`);
      }
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ resultTransit }));
    } catch (error) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: { message: error.message } }));
    }
  });
});

function finish(code) {
  server.close(() => process.exit(code));
}

function assertNotIncludes(name, haystack, needle) {
  if (haystack.includes(needle)) {
    throw new Error(`${name}: unexpected ${JSON.stringify(needle)} in ${JSON.stringify(haystack)}`);
  }
}

server.listen(0, "127.0.0.1", () => {
  const port = server.address().port;
  const env = {
    ...process.env,
    LOGSEQ_CLI_BASE_URL: `http://127.0.0.1:${port}`,
  };
  const child = spawn(
    process.execPath,
    [wasm, "--graph", "alpha", "list", "page"],
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
    try {
      if (code !== 0) {
        throw new Error(`expected wasm list page to exit 0, got ${code}\n${stdout}\n${stderr}`);
      }
      if (requestCount !== 1) {
        throw new Error(`expected one request, got ${requestCount}`);
      }
      assertNotIncludes("created timestamp raw", stdout, "1700000000000");
      assertNotIncludes("updated timestamp raw", stdout, "1780411164893");
      assertNotIncludes("zero years output", stdout, "zero years");
      finish(0);
    } catch (error) {
      console.error(error.stack || String(error));
      console.error(stdout);
      console.error(stderr);
      finish(1);
    }
  });
});
