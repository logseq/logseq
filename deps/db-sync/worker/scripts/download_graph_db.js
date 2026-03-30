#!/usr/bin/env node

const Database = require("better-sqlite3");
const fs = require("node:fs");
const path = require("node:path");
const zlib = require("node:zlib");
const { parseArgs } = require("node:util");
const { fail } = require("./graph_user_lib");

const defaultBaseUrl = "https://api.logseq.com";

function printHelp() {
  console.log(`Download a graph snapshot and store it as a local sqlite debug DB.

Usage:
  node worker/scripts/download_graph_db.js --graph-id <graph-id> --admin-token <token>
  node worker/scripts/download_graph_db.js --graph-id <graph-id> --output ./tmp/my-graph.sqlite

Options:
  --graph-id <id>        Target graph id. Required.
  --admin-token <token>  Admin token. Defaults to DB_SYNC_ADMIN_TOKEN.
  --base-url <url>       Worker base URL. Defaults to DB_SYNC_BASE_URL or https://api.logseq.com.
  --output <path>        SQLite output path. Defaults to ./tmp/graph-<graph-id>.snapshot.sqlite.
  --help                 Show this message.

Notes:
  The output sqlite matches local graph DB schema and contains only:
  kvs(addr, content, addresses).
`);
}

function sanitizeGraphIdForFilename(graphId) {
  return graphId.replaceAll(/[^a-zA-Z0-9.-]/g, "_");
}

function parseCliArgs(argv) {
  const { values } = parseArgs({
    args: argv,
    options: {
      "graph-id": { type: "string" },
      "admin-token": { type: "string", default: process.env.DB_SYNC_ADMIN_TOKEN },
      "base-url": { type: "string", default: process.env.DB_SYNC_BASE_URL || defaultBaseUrl },
      output: { type: "string" },
      help: { type: "boolean", default: false },
    },
    strict: true,
    allowPositionals: false,
  });

  if (values.help) {
    printHelp();
    process.exit(0);
  }

  if (!values["graph-id"]) {
    fail("Missing required --graph-id.");
  }

  if (!values["admin-token"]) {
    fail("Missing admin token. Pass --admin-token or set DB_SYNC_ADMIN_TOKEN.");
  }

  const output = values.output
    ? path.resolve(values.output)
    : path.resolve("tmp", `graph-${sanitizeGraphIdForFilename(values["graph-id"])}.snapshot.sqlite`);

  return {
    graphId: values["graph-id"],
    adminToken: values["admin-token"],
    baseUrl: values["base-url"],
    output,
  };
}

function authHeaders(adminToken) {
  return {
    "x-db-sync-admin-token": adminToken,
  };
}

function normalizeBaseUrl(baseUrl) {
  return baseUrl.replace(/\/+$/, "");
}

async function fetchJson(url, adminToken) {
  const response = await fetch(url, {
    method: "GET",
    headers: authHeaders(adminToken),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Request failed (${response.status}) for ${url}: ${body}`);
  }

  return response.json();
}

async function fetchSnapshotDescriptor(options) {
  const baseUrl = normalizeBaseUrl(options.baseUrl);
  const url = `${baseUrl}/sync/${encodeURIComponent(options.graphId)}/snapshot/download`;
  return fetchJson(url, options.adminToken);
}

async function fetchSnapshotBytes(url, adminToken) {
  const response = await fetch(url, {
    method: "GET",
    headers: authHeaders(adminToken),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Snapshot download failed (${response.status}) for ${url}: ${body}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  const contentEncoding = response.headers.get("content-encoding");

  return {
    buffer,
    contentEncoding,
  };
}

function hasGzipMagic(buffer) {
  return buffer.length >= 2 && buffer[0] === 0x1f && buffer[1] === 0x8b;
}

function maybeDecompressBuffer(buffer, contentEncoding) {
  if (contentEncoding === "gzip" && hasGzipMagic(buffer)) {
    return zlib.gunzipSync(buffer);
  }

  return buffer;
}

function snapshotBufferToLines(buffer) {
  const text = buffer.toString("utf8");
  return text
    .split(/\r?\n/)
    .filter((line) => line.length > 0);
}

function writeSnapshotSqlite({
  outputPath,
  lines,
}) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  if (fs.existsSync(outputPath)) {
    fs.rmSync(outputPath);
  }

  const db = new Database(outputPath);
  try {
    db.exec(`
      create table if not exists kvs (
        addr INTEGER primary key,
        content TEXT,
        addresses JSON
      );
    `);

    const upsertKvs = db.prepare(
      "insert into kvs (addr, content, addresses) values (?, ?, ?) on conflict(addr) do update set content = excluded.content, addresses = excluded.addresses",
    );

    const writeAll = db.transaction(() => {
      for (let index = 0; index < lines.length; index += 1) {
        upsertKvs.run(index + 1, lines[index], null);
      }
    });

    writeAll();
  } finally {
    db.close();
  }
}

async function main() {
  const options = parseCliArgs(process.argv.slice(2));
  const descriptor = await fetchSnapshotDescriptor(options);
  if (!descriptor || !descriptor.url) {
    fail("Snapshot download response missing URL.");
  }

  const snapshot = await fetchSnapshotBytes(descriptor.url, options.adminToken);
  const effectiveEncoding = descriptor["content-encoding"] || snapshot.contentEncoding || "";
  const decompressed = maybeDecompressBuffer(snapshot.buffer, effectiveEncoding);
  const lines = snapshotBufferToLines(decompressed);

  writeSnapshotSqlite({
    outputPath: options.output,
    lines,
  });

  console.log(`Saved graph snapshot sqlite to ${options.output}`);
  console.log(`Graph: ${options.graphId}`);
  console.log(`Rows: ${lines.length}`);
  if (descriptor.key) {
    console.log(`Snapshot key: ${descriptor.key}`);
  }
}

if (require.main === module) {
  main().catch((error) => {
    fail(error instanceof Error ? error.message : String(error));
  });
}

module.exports = {
  parseCliArgs,
  sanitizeGraphIdForFilename,
  snapshotBufferToLines,
  writeSnapshotSqlite,
};
