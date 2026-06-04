const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawn } = require("child_process");

const wasm = process.argv[2];

if (!wasm) {
  console.error("missing wasm bundle path");
  process.exit(1);
}

const root = fs.mkdtempSync(path.join(os.tmpdir(), "logseq-cli-wasm-login-"));
const configPath = path.join(root, "cli.edn");
fs.writeFileSync(configPath, "{:open-browser false :login-timeout-ms 1}\n");

const child = spawn(
  process.execPath,
  [wasm, "--root-dir", root, "--config", configPath, "login"],
  { env: process.env }
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
  fs.rmSync(root, { recursive: true, force: true });
  process.exit(1);
});
child.on("exit", (code) => {
  fs.rmSync(root, { recursive: true, force: true });
  if (code === 0) {
    console.error("expected login to time out without a callback");
    console.error(stdout);
    process.exit(1);
    return;
  }
  if (stdout.includes("sockets are unavailable") || stderr.includes("sockets are unavailable")) {
    console.error("login should not use unavailable wasm sockets");
    console.error(stdout);
    console.error(stderr);
    process.exit(1);
    return;
  }
  if (!stdout.includes("login callback timed out") && !stderr.includes("login callback timed out")) {
    console.error("expected login callback timeout");
    console.error(stdout);
    console.error(stderr);
    process.exit(1);
    return;
  }
  process.exit(0);
});
