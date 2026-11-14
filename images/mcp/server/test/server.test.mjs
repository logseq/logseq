import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const fakeBin = path.join(here, "fake-logseq.mjs");
const port = 18000 + Math.floor(Math.random() * 1000);
const baseUrl = `http://127.0.0.1:${port}`;
let home;
let child;
let stdout = "";

function readState() {
  return JSON.parse(fs.readFileSync(path.join(home, "fake", "state.json"), "utf8"));
}

async function waitForServer() {
  for (let i = 0; i < 100; i += 1) {
    try {
      await fetch(`${baseUrl}/health`);
      return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
  throw new Error("server did not start");
}

async function withClient(fn) {
  const client = new Client({ name: "test", version: "1.0.0" });
  await client.connect(new StreamableHTTPClientTransport(new URL(`${baseUrl}/mcp`)));
  try {
    return await fn(client);
  } finally {
    await client.close();
  }
}

async function call(client, name, args = {}) {
  const result = await client.callTool({ name, arguments: args });
  return { isError: Boolean(result.isError), data: JSON.parse(result.content[0].text) };
}

before(async () => {
  home = fs.mkdtempSync(path.join(os.tmpdir(), "logseq-mcp-test-"));
  fs.mkdirSync(path.join(home, "fake"));
  fs.chmodSync(fakeBin, 0o755);
  child = spawn(process.execPath, [path.join(here, "..", "src", "main.mjs")], {
    env: {
      ...process.env,
      HOME: home,
      LOGSEQ_BIN: fakeBin,
      FAKE_LOGSEQ_STATE: path.join(home, "fake"),
      MCP_PORT: String(port),
      LOGSEQ_SYNC_URL: "http://logseq-sync:8787/",
      LOGSEQ_USERNAME: "me@example.com",
      LOGSEQ_PASSWORD: "-starts-with-dash",
      LOGSEQ_E2EE_PASSWORD: "secret",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  child.stdout.on("data", (chunk) => {
    stdout += chunk;
  });
  await waitForServer();
});

after(() => {
  child.kill("SIGKILL");
  fs.rmSync(home, { recursive: true, force: true });
});

test("logs in on startup with password flags that start with a dash", () => {
  const login = readState().calls.find((args) => args[0] === "login");
  assert.deepEqual(login, [
    "login",
    "--username=me@example.com",
    "--password=-starts-with-dash",
    "--output",
    "json",
  ]);
});

test("lists the expected tools", async () => {
  await withClient(async (client) => {
    const { tools } = await client.listTools();
    const names = tools.map((t) => t.name).sort();
    for (const name of ["list_remote_graphs", "open_graph", "show", "insert_blocks", "logseq_cli"]) {
      assert.ok(names.includes(name), `missing tool ${name}`);
    }
  });
});

test("list_remote_graphs works before any graph is downloaded", async () => {
  await withClient(async (client) => {
    const result = await call(client, "list_remote_graphs");
    assert.equal(result.isError, false);
    assert.equal(result.data.graphs[0]["graph-name"], "notes");
    const local = await call(client, "list_local_graphs");
    assert.deepEqual(local.data, []);
  });
});

test("graph tools require open_graph first", async () => {
  await withClient(async (client) => {
    const result = await call(client, "show", { graph: "notes", page: "Home" });
    assert.equal(result.isError, true);
    assert.equal(result.data.error.code, "graph-not-open");
  });
});

test("open_graph downloads, starts sync with the e2ee password and persists state", async () => {
  await withClient(async (client) => {
    const result = await call(client, "open_graph", { graph: "notes" });
    assert.deepEqual(result.data, { graph: "notes", state: "ready" });

    const calls = readState().calls.map((args) => args.slice(0, 2).join(" "));
    assert.ok(calls.includes("sync download"));
    const start = readState().calls.find((args) => args[0] === "sync" && args[1] === "start");
    assert.ok(start.includes("--e2ee-password=secret"));

    const saved = JSON.parse(fs.readFileSync(path.join(home, "logseq-mcp", "state.json"), "utf8"));
    assert.deepEqual(saved.graphs, ["notes"]);

    const graphs = await call(client, "list_local_graphs");
    assert.equal(graphs.data[0].wsState, "open");
  });
});

test("insert_blocks passes markdown starting with a dash as a single option", async () => {
  await withClient(async (client) => {
    const result = await call(client, "insert_blocks", {
      graph: "notes",
      markdown: "- Parent\n  - Child",
      target_page: "Home",
      update_tags: ["AI", "Note \"quoted\""],
    });
    assert.equal(result.isError, false);
    assert.deepEqual(result.data.argv, [
      "upsert",
      "block",
      "--blocks=- Parent\n  - Child",
      "--target-page=Home",
      '--update-tags=["AI" "Note \\"quoted\\""]',
      "--graph=notes",
      "--output",
      "json",
    ]);
  });
});

test("open_graph reports CLI errors", async () => {
  await withClient(async (client) => {
    const result = await call(client, "open_graph", { graph: "missing" });
    assert.equal(result.isError, true);
    assert.equal(result.data.error.code, "remote-graph-not-found");
  });
});

test("logseq_cli blocks server-managed commands", async () => {
  await withClient(async (client) => {
    const result = await call(client, "logseq_cli", { args: ["logout"] });
    assert.equal(result.isError, true);
    assert.equal(result.data.error.code, "invalid-arguments");
  });
});

test("health reports open graphs", async () => {
  const response = await fetch(`${baseUrl}/health`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true, graphs: [{ graph: "notes", state: "open" }] });
});

test("logs tool errors without arguments", async () => {
  await withClient(async (client) => {
    await call(client, "search", { graph: "other", text: "private note" });
  });
  const line = stdout.split("\n").find((l) => l.includes('"tool-error"') && l.includes('"other"'));
  assert.ok(line, "tool-error not logged");
  const entry = JSON.parse(line);
  assert.equal(entry.tool, "search");
  assert.equal(entry.code, "graph-not-open");
  assert.ok(!line.includes("private note"));
});

test("forwards db-worker-node warnings to stdout", async () => {
  const dir = path.join(home, "logseq", "graphs", "notes");
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, "db-worker-node-20261114.log");
  fs.writeFileSync(file, "2026-11-14T10:00:00.000Z [info] [sync] \"connected\"\n");
  fs.appendFileSync(file, "2026-11-14T10:00:01.000Z [warning] [sync] \"ws closed\"\n");
  for (let i = 0; i < 50 && !stdout.includes("ws closed"); i += 1) {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  assert.ok(stdout.includes('[db-worker-node notes] 2026-11-14T10:00:01.000Z [warning] [sync] "ws closed"'));
  assert.ok(!stdout.includes("connected"));
});
