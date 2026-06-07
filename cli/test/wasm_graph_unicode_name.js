const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const wasm = process.argv[2];

if (!wasm) {
  console.error("missing wasm bundle path");
  process.exit(1);
}

const root = fs.mkdtempSync(path.join(os.tmpdir(), "logseq-cli-wasm-graph-unicode-"));
const graph = "啊啊啊啊";
const fallbackGraph = "fallback-env";
const encodedGraphDir = "~E5~95~8A~E5~95~8A~E5~95~8A~E5~95~8A";

function runCli(args, env = {}) {
  return spawnSync(process.execPath, [wasm, "--root-dir", root, ...args], {
    encoding: "utf8",
    env: { ...process.env, ...env },
  });
}

function assertExitZero(name, result) {
  if (result.status !== 0) {
    throw new Error(`${name}: expected exit 0, got ${result.status}\n${result.stdout}\n${result.stderr}`);
  }
}

function assertIncludes(name, text, needle) {
  if (!text.includes(needle)) {
    throw new Error(`${name}: missing ${JSON.stringify(needle)} in ${JSON.stringify(text)}`);
  }
}

function assertExitNonZero(name, result) {
  if (result.status === 0) {
    throw new Error(`${name}: expected non-zero exit\n${result.stdout}\n${result.stderr}`);
  }
}

try {
  fs.mkdirSync(root, { recursive: true });
  fs.writeFileSync(path.join(root, "current-graph"), "fallback-current", "utf8");
  fs.writeFileSync(path.join(root, "cli.edn"), '{:graph "fallback-file"}\n', "utf8");

  const createWithoutGraph = runCli(["graph", "create"], {
    LOGSEQ_CLI_GRAPH: fallbackGraph,
  });
  assertExitNonZero("graph create without -g", createWithoutGraph);
  assertIncludes("graph create without -g", createWithoutGraph.stdout, "graph name is required");
  if (fs.existsSync(path.join(root, "graphs", fallbackGraph))) {
    throw new Error("graph create without -g created fallback graph");
  }

  const createFallback = runCli(["graph", "create", "-g", fallbackGraph]);
  assertExitZero("fallback graph create", createFallback);

  const switchWithoutGraph = runCli(["graph", "switch"], {
    LOGSEQ_CLI_GRAPH: fallbackGraph,
  });
  assertExitNonZero("graph switch without -g", switchWithoutGraph);
  assertIncludes("graph switch without -g", switchWithoutGraph.stdout, "graph name is required");

  const removeWithoutGraph = runCli(["graph", "remove"], {
    LOGSEQ_CLI_GRAPH: fallbackGraph,
  });
  assertExitNonZero("graph remove without -g", removeWithoutGraph);
  assertIncludes("graph remove without -g", removeWithoutGraph.stdout, "graph name is required");
  if (!fs.existsSync(path.join(root, "graphs", fallbackGraph))) {
    throw new Error("graph remove without -g removed fallback graph");
  }

  const create = runCli(["graph", "create", "-g", graph]);
  assertExitZero("graph create", create);
  assertIncludes("graph create", create.stdout, graph);

  const graphDirs = fs.readdirSync(path.join(root, "graphs"));
  if (!graphDirs.includes(encodedGraphDir)) {
    throw new Error(`graph dir: expected ${encodedGraphDir}, got ${JSON.stringify(graphDirs)}`);
  }

  const humanList = runCli(["graph", "list"]);
  assertExitZero("human graph list", humanList);
  assertIncludes("human graph list", humanList.stdout, graph);

  const jsonList = runCli(["--output", "json", "graph", "list"]);
  assertExitZero("json graph list", jsonList);
  const parsed = JSON.parse(jsonList.stdout);
  if (!parsed.data.graphs.includes(graph)) {
    throw new Error(`json graph list: expected graph in ${JSON.stringify(parsed)}`);
  }
} finally {
  fs.rmSync(root, { recursive: true, force: true });
}
