const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const transit = require("transit-js");

const Database = require("better-sqlite3");

const {
  parseFramedRows,
  parseCliArgs,
  sanitizeGraphIdForFilename,
  writeSnapshotSqlite,
} = require("./download_graph_db");

function runCli(args, env = {}) {
  return spawnSync(process.execPath, [path.join(__dirname, "download_graph_db.js"), ...args], {
    encoding: "utf8",
    env: { ...process.env, ...env },
  });
}

test("parseCliArgs accepts required args and defaults output", () => {
  const parsed = parseCliArgs([
    "--graph-id",
    "graph-1",
    "--admin-token",
    "admin-token-value",
  ]);

  assert.equal(parsed.graphId, "graph-1");
  assert.equal(parsed.baseUrl, "https://api.logseq.com");
  assert.equal(parsed.adminToken, "admin-token-value");
  assert.equal(parsed.output, path.resolve("tmp", "graph-graph-1.snapshot.sqlite"));
});

test("sanitizeGraphIdForFilename replaces unsafe chars", () => {
  assert.equal(sanitizeGraphIdForFilename("us-east-1:abc/def"), "us-east-1_abc_def");
});

test("CLI --help exits successfully", () => {
  const result = runCli(["--help"]);

  assert.equal(result.status, 0);
  assert.match(result.stdout, /Download a graph snapshot and store it as a local sqlite debug DB/);
});

test("CLI rejects missing --graph-id", () => {
  const result = runCli(["--admin-token", "admin-token-value"]);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /Missing required --graph-id\./);
});

test("CLI rejects missing admin-token when env is absent", () => {
  const result = runCli(["--graph-id", "graph-1"], { DB_SYNC_ADMIN_TOKEN: "" });

  assert.equal(result.status, 1);
  assert.match(result.stderr, /Missing admin token/);
});

test("parseFramedRows decodes framed transit batches", () => {
  const writer = transit.writer("json");
  const rowsA = [
    [1, "line-1", null],
    [2, "line-2", null],
  ];
  const rowsB = [
    [1000606, "line-1000606", "{\"1\":[2,3]}"],
  ];

  const encodeFrame = (rows) => {
    const payload = Buffer.from(writer.write(rows), "utf8");
    const frame = Buffer.allocUnsafe(4 + payload.length);
    frame.writeUInt32BE(payload.length, 0);
    payload.copy(frame, 4);
    return frame;
  };

  const framed = Buffer.concat([encodeFrame(rowsA), encodeFrame(rowsB)]);
  const parsed = parseFramedRows(framed);

  assert.deepEqual(parsed, [...rowsA, ...rowsB]);
});

test("writeSnapshotSqlite writes kvs-only sqlite like local dbs", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "db-sync-download-test-"));
  const dbPath = path.join(tmpDir, "graph-debug.sqlite");
  const rows = [
    [1, "line-1", null],
    [2, "line-2", null],
    [1000606, "line-1000606", "{\"1\":[2,3]}"],
  ];

  writeSnapshotSqlite({
    outputPath: dbPath,
    rows,
  });

  const db = new Database(dbPath, { readonly: true });
  const tableNames = db
    .prepare("select name from sqlite_master where type = 'table' order by name")
    .all()
    .map((row) => row.name);
  const rowCount = db.prepare("select count(1) as count from kvs").get().count;
  const row1000606 = db.prepare("select addr, content, addresses from kvs where addr = 1000606").get();

  assert.deepEqual(tableNames, ["kvs"]);
  assert.equal(rowCount, 3);
  assert.equal(row1000606.addr, 1000606);
  assert.equal(row1000606.content, "line-1000606");
  assert.equal(row1000606.addresses, "{\"1\":[2,3]}");

  db.close();
});
