const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const wasm = process.argv[2];

if (!wasm) {
  console.error("missing wasm bundle path");
  process.exit(1);
}

const root = fs.mkdtempSync(path.join(os.tmpdir(), "logseq-cli-wasm-sync-download-graph-"));

try {
  fs.writeFileSync(path.join(root, "current-graph"), "fallback-current", "utf8");
  fs.writeFileSync(path.join(root, "cli.edn"), '{:graph "fallback-file"}\n', "utf8");

  const result = spawnSync(
    process.execPath,
    [wasm, "--root-dir", root, "sync", "download"],
    {
      encoding: "utf8",
      env: { ...process.env, LOGSEQ_CLI_GRAPH: "fallback-env" },
    }
  );

  if (result.status === 0) {
    console.error("expected sync download without --graph to fail");
    console.error(result.stdout);
    console.error(result.stderr);
    process.exit(1);
  }

  if (!result.stdout.includes("graph name is required")) {
    console.error("expected sync download missing graph error message");
    console.error(result.stdout);
    console.error(result.stderr);
    process.exit(1);
  }
} finally {
  fs.rmSync(root, { recursive: true, force: true });
}
