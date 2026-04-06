#!/usr/bin/env node

const Database = require("better-sqlite3");
const fs = require("node:fs");
const path = require("node:path");
const zlib = require("node:zlib");
const { parseArgs } = require("node:util");
const transit = require("transit-js");
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

function parseFramedRows(buffer) {
  const rows = [];
  const reader = transit.reader("json");
  let offset = 0;

  while (offset < buffer.length) {
    if (buffer.length - offset < 4) {
      throw new Error("Invalid snapshot payload: incomplete frame header");
    }

    const frameLength = buffer.readUInt32BE(offset);
    offset += 4;

    if (buffer.length - offset < frameLength) {
      throw new Error("Invalid snapshot payload: incomplete frame payload");
    }

    const payload = buffer.subarray(offset, offset + frameLength);
    offset += frameLength;

    const batch = reader.read(payload.toString("utf8"));
    if (!Array.isArray(batch)) {
      throw new Error("Invalid snapshot payload: decoded frame is not an array");
    }

    for (const row of batch) {
      if (!Array.isArray(row) || row.length < 2) {
        throw new Error("Invalid snapshot payload: row must be [addr, content, addresses?]");
      }
      rows.push(row);
    }
  }

  return rows;
}

function writeSnapshotSqlite({
  outputPath,
  rows,
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
      for (const row of rows) {
        const [addr, content, addresses] = row;
        upsertKvs.run(addr, content, addresses ?? null);
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
  const rows = parseFramedRows(decompressed);

  writeSnapshotSqlite({
    outputPath: options.output,
    rows,
  });

  console.log(`Saved graph snapshot sqlite to ${options.output}`);
  console.log(`Graph: ${options.graphId}`);
  console.log(`Rows: ${rows.length}`);
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
  parseFramedRows,
  sanitizeGraphIdForFilename,
  writeSnapshotSqlite,
};
