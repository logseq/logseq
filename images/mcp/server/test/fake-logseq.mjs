#!/usr/bin/env node
// Minimal stand-in for the Logseq CLI used by the MCP server tests.
import fs from "node:fs";
import path from "node:path";

const argv = process.argv.slice(2);
const stateDir = process.env.FAKE_LOGSEQ_STATE;
const statePath = path.join(stateDir, "state.json");
const state = fs.existsSync(statePath)
  ? JSON.parse(fs.readFileSync(statePath, "utf8"))
  : { local: [], syncing: [], calls: [] };
state.calls.push(argv);

function option(name) {
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === `--${name}`) return argv[i + 1];
    if (argv[i].startsWith(`--${name}=`)) return argv[i].slice(name.length + 3);
  }
  return undefined;
}

function done(payload, exitCode = 0) {
  fs.writeFileSync(statePath, JSON.stringify(state));
  process.stdout.write(typeof payload === "string" ? payload : JSON.stringify(payload));
  process.exit(exitCode);
}

const ok = (data) => done({ status: "ok", data });
const error = (code, message) => done({ status: "error", error: { code, message } }, 1);
const positional = argv.filter((arg) => !arg.startsWith("--"));
const command = positional.slice(0, 2).join(" ");
const graph = option("graph");

if (argv.includes("--help")) done(`Usage: logseq ${positional.join(" ")} [options]\n`);
if (command === "skill show") done("# Logseq CLI skill\n");

switch (positional[0] === "login" ? "login" : command) {
  case "login": {
    const authDir = path.join(process.env.HOME, "logseq");
    fs.mkdirSync(authDir, { recursive: true });
    fs.writeFileSync(path.join(authDir, "auth.json"), "{}");
    ok({ email: "me@example.com" });
    break;
  }
  case "graph list":
    ok({ graphs: state.local });
    break;
  case "sync remote-graphs":
    ok({ graphs: [{ "graph-name": "notes", "graph-e2ee?": true }] });
    break;
  case "sync download":
    if (graph === "missing") error("remote-graph-not-found", "remote graph not found");
    state.local.push(graph);
    ok({ graph });
    break;
  case "sync start":
    if (!state.local.includes(graph)) error("graph-not-exists", "graph not exists");
    state.syncing.push(graph);
    ok({ "ws-state": "open" });
    break;
  case "sync status":
    ok({ "ws-state": state.syncing.includes(graph) ? "open" : "closed" });
    break;
  case "sync stop":
    state.syncing = state.syncing.filter((g) => g !== graph);
    ok({});
    break;
  case "server stop":
    ok({});
    break;
  default:
    ok({ argv });
}
