const assert = require("node:assert/strict");
const fs = require("node:fs");
const http = require("node:http");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const transit = require("transit-js");
const { WebSocketServer } = require("ws");

const nodeJsApiModulePath = path.resolve(
  process.cwd(),
  process.env.LOGSEQ_MELANGE_JS_API_NODE,
);
const browserJsApiModulePath = path.resolve(
  process.cwd(),
  process.env.LOGSEQ_MELANGE_JS_API_BROWSER,
);
const { Platform: NodePlatform } = require(nodeJsApiModulePath);
const { Platform: BrowserPlatform } = require(browserJsApiModulePath);

const nodeShimMarkers = [
  "shims/keytar-node.js",
  "shims/node-sqlite.js",
  "shims/ws-node.js",
  "shims/zvec-node.js",
  "__logseqNodeRequire",
];

function assertFunction(object, key) {
  assert.equal(typeof object[key], "function", `${key} should be a function`);
}

function assertBrowserPlatformShape(browser) {
  assert.equal(browser.env.runtime, "browser");
  assert.equal(typeof browser.env["publishing?"], "boolean");
  assert.equal(browser.env["root-dir"], undefined);
  assert.equal(typeof browser.env["owner-source"], "string");

  for (const key of [
    "installOpfsPool",
    "install-opfs-pool",
    "listGraphs",
    "list-graphs",
    "dbExists",
    "db-exists?",
    "resolveDbPath",
    "resolve-db-path",
    "exportFile",
    "export-file",
    "importDb",
    "import-db",
    "removeVfs",
    "remove-vfs!",
    "readText",
    "read-text!",
    "writeText",
    "write-text!",
    "writeTextAtomic",
    "write-text-atomic!",
    "deleteFile",
    "delete-file!",
    "mirrorReadText",
    "mirror-read-text!",
    "assetReadBytes",
    "asset-read-bytes!",
    "assetWriteBytes",
    "asset-write-bytes!",
    "assetStat",
    "asset-stat",
    "assetDelete",
    "asset-delete!",
    "transfer",
  ]) {
    assertFunction(browser.storage, key);
  }

  assertFunction(browser.kv, "get");
  assertFunction(browser.kv, "set");
  assertFunction(browser.kv, "set!");
  assertFunction(browser.broadcast, "postMessage");
  assertFunction(browser.broadcast, "post-message!");
  assertFunction(browser.websocket, "connect");

  for (const key of [
    "init",
    "init!",
    "openDb",
    "open-db",
    "closeDb",
    "close-db",
    "exec",
    "transaction",
  ]) {
    assertFunction(browser.sqlite, key);
  }
  assert.equal(browser.sqlite.backupDb, undefined);
  assert.equal(browser.sqlite["backup-db"], undefined);

  assertFunction(browser.crypto, "saveSecretText");
  assertFunction(browser.crypto, "save-secret-text!");
  assertFunction(browser.crypto, "readSecretText");
  assertFunction(browser.crypto, "read-secret-text");
  assertFunction(browser.crypto, "deleteSecretText");
  assertFunction(browser.crypto, "delete-secret-text!");
  assertFunction(browser.timers, "setInterval");
  assertFunction(browser.timers, "set-interval!");
  assert.equal(browser.vector, undefined);
  assert.equal(browser.embedding, undefined);
}

async function startEmbeddingServer() {
  const requests = [];
  const server = http.createServer((request, response) => {
    let body = "";
    request.setEncoding("utf8");
    request.on("data", (chunk) => {
      body += chunk;
    });
    request.on("end", () => {
      const payload = JSON.parse(body);
      requests.push({
        method: request.method,
        url: request.url,
        payload,
      });
      const data = payload.input
        .map((text, index) => ({
          index,
          embedding: Array.from({ length: 1024 }, (_, offset) => index + offset),
          text,
        }))
        .reverse();
      response.writeHead(200, { "Content-Type": "application/json" });
      response.end(JSON.stringify({ data }));
    });
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));

  return {
    requests,
    url: `http://127.0.0.1:${server.address().port}`,
    close: () => new Promise((resolve) => server.close(resolve)),
  };
}

async function assertNodeSqlite(sqlite, rootDir) {
  assertFunction(sqlite, "init");
  assertFunction(sqlite, "init!");
  assertFunction(sqlite, "openDb");
  assertFunction(sqlite, "open-db");
  assertFunction(sqlite, "closeDb");
  assertFunction(sqlite, "close-db");
  assertFunction(sqlite, "exec");
  assertFunction(sqlite, "transaction");
  assertFunction(sqlite, "backupDb");
  assertFunction(sqlite, "backup-db");

  assert.equal(await sqlite["init!"](), undefined);

  const dbPath = path.join(rootDir, "sqlite-test.sqlite");
  const backupPath = path.join(rootDir, "sqlite-test-backup.sqlite");
  const db = await sqlite["open-db"]({ path: dbPath });

  try {
    sqlite.exec(
      db,
      "CREATE TABLE items(id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT)",
    );
    sqlite.exec(db, {
      sql: "INSERT INTO items(title) VALUES (?)",
      bind: ["alpha"],
    });
    sqlite.exec(db, {
      sql: "INSERT INTO items(title) VALUES ($title)",
      bind: { $title: "beta" },
    });

    assert.deepEqual(
      sqlite.exec(db, {
        sql: "SELECT id, title FROM items ORDER BY id",
        rowMode: "array",
        returnValue: "resultRows",
      }),
      [
        [1, "alpha"],
        [2, "beta"],
      ],
    );

    assert.deepEqual(
      sqlite
        .exec(db, {
          sql: "SELECT id, title FROM items WHERE title = :title",
          bind: { ":title": "beta" },
          rowMode: "object",
          returnValue: "resultRows",
        })
        .map((row) => ({ id: row.id, title: row.title })),
      [{ id: 2, title: "beta" }],
    );

    sqlite.transaction(db, (outerDb) => {
      sqlite.exec(outerDb, {
        sql: "INSERT INTO items(title) VALUES (?)",
        bind: ["outer"],
      });
      assert.throws(
        () =>
          sqlite.transaction(outerDb, (innerDb) => {
            sqlite.exec(innerDb, {
              sql: "INSERT INTO items(title) VALUES (?)",
              bind: ["inner"],
            });
            throw new Error("rollback inner transaction");
          }),
        /rollback inner transaction/,
      );
      sqlite.exec(outerDb, {
        sql: "INSERT INTO items(title) VALUES (?)",
        bind: ["outer-after"],
      });
      return null;
    });

    assert.deepEqual(
      sqlite.exec(db, {
        sql: "SELECT title FROM items WHERE title LIKE 'outer%' ORDER BY id",
        rowMode: "array",
        returnValue: "resultRows",
      }),
      [["outer"], ["outer-after"]],
    );

    await sqlite["backup-db"](db, backupPath);
    assert.equal(fs.existsSync(backupPath), true);
  } finally {
    sqlite["close-db"](db);
  }
}

async function assertNodeStorage(storage, rootDir) {
  assertFunction(storage, "installOpfsPool");
  assertFunction(storage, "install-opfs-pool");
  assertFunction(storage, "listGraphs");
  assertFunction(storage, "list-graphs");
  assertFunction(storage, "dbExists");
  assertFunction(storage, "db-exists?");
  assertFunction(storage, "resolveDbPath");
  assertFunction(storage, "resolve-db-path");
  assertFunction(storage, "exportFile");
  assertFunction(storage, "export-file");
  assertFunction(storage, "importDb");
  assertFunction(storage, "import-db");
  assertFunction(storage, "removeVfs");
  assertFunction(storage, "remove-vfs!");
  assertFunction(storage, "readText");
  assertFunction(storage, "read-text!");
  assertFunction(storage, "writeText");
  assertFunction(storage, "write-text!");
  assertFunction(storage, "writeTextAtomic");
  assertFunction(storage, "write-text-atomic!");
  assertFunction(storage, "deleteFile");
  assertFunction(storage, "delete-file!");
  assert.equal(storage.mirrorReadText, undefined);
  assert.equal(storage["mirror-read-text!"], undefined);
  assertFunction(storage, "assetReadBytes");
  assertFunction(storage, "asset-read-bytes!");
  assertFunction(storage, "assetWriteBytes");
  assertFunction(storage, "asset-write-bytes!");
  assertFunction(storage, "assetStat");
  assertFunction(storage, "asset-stat");
  assertFunction(storage, "assetDelete");
  assertFunction(storage, "asset-delete!");
  assert.equal(storage.transfer, undefined);

  const pool = await storage["install-opfs-pool"](null, "graph-a");
  assert.equal(
    storage["resolve-db-path"]("graph-a", pool, "/db.sqlite"),
    path.join(rootDir, "graphs", "graph-a", "db.sqlite"),
  );

  await storage["import-db"](pool, "/db.sqlite", "sqlite-bytes");
  assert.equal(await storage["db-exists?"]("graph-a"), true);
  assert.deepEqual(await storage["list-graphs"](), ["graph-a"]);
  assert.equal(await storage["export-file"](pool, "/db.sqlite"), "sqlite-bytes");

  const textPath = path.join(rootDir, "graphs", "notes", "a.txt");
  const atomicTextPath = path.join(rootDir, "graphs", "notes", "b.txt");
  await storage["write-text!"]("notes/a.txt", "alpha");
  assert.equal(fs.readFileSync(textPath, "utf8"), "alpha");
  assert.equal(await storage["read-text!"]("notes/a.txt"), "alpha");
  await storage["write-text-atomic!"]("notes/b.txt", "beta");
  assert.equal(fs.readFileSync(atomicTextPath, "utf8"), "beta");
  assert.equal(await storage.readText("notes/b.txt"), "beta");
  assert.equal(fs.existsSync(path.join(rootDir, "notes", "a.txt")), false);
  await storage["delete-file!"]("notes/a.txt");
  assert.equal(fs.existsSync(textPath), false);
  let missingRead;
  assert.doesNotThrow(() => {
    missingRead = storage["read-text!"]("notes/a.txt");
  });
  await assert.rejects(missingRead, /ENOENT/);

  await storage["asset-write-bytes!"]("graph-a", "asset.bin", "asset-bytes");
  assert.equal(
    await storage["asset-read-bytes!"]("graph-a", "asset.bin"),
    "asset-bytes",
  );
  assert.deepEqual(await storage["asset-stat"]("graph-a", "asset.bin"), {
    size: 11,
    isFile: true,
  });
  await storage["asset-delete!"]("graph-a", "asset.bin");
  assert.equal(await storage["asset-stat"]("graph-a", "asset.bin"), undefined);

  await storage["remove-vfs!"](pool);
  assert.equal(await storage["db-exists?"]("graph-a"), false);
}

async function assertNodeKv(kv) {
  assertFunction(kv, "get");
  assertFunction(kv, "set");
  assertFunction(kv, "set!");

  await kv["set!"]("plain-js-kv", { ok: true });
  assert.deepEqual(await kv.get("plain-js-kv"), { ok: true });
  await kv.set("plain-js-kv", null);
  assert.equal(await kv.get("plain-js-kv"), undefined);
}

async function assertNodeKvPreservesBinaryAcrossReload(rootDir) {
  const key = "rtc-encrypted-aes-key###graph-1";
  const payload = new Uint8Array([1, 2, 3, 255]);
  const freshNodePlatform = () => {
    delete require.cache[require.resolve(nodeJsApiModulePath)];
    return require(nodeJsApiModulePath).Platform.node_platform({
      "root-dir": rootDir,
      "owner-source": "cli",
    });
  };

  await freshNodePlatform().kv["set!"](key, payload);
  const reloaded = await freshNodePlatform().kv.get(key);

  assert.equal(reloaded instanceof Uint8Array, true);
  assert.deepEqual(Array.from(reloaded), [1, 2, 3, 255]);
}

async function assertNodeKvIsScopedByRootDir(rootDir) {
  const otherRootDir = fs.mkdtempSync(
    path.join(os.tmpdir(), "logseq-js-api-kv-other-root-"),
  );
  try {
    const rootNode = NodePlatform.node_platform({
      "root-dir": rootDir,
      "owner-source": "cli",
    });
    const otherNode = NodePlatform.node_platform({
      "root-dir": otherRootDir,
      "owner-source": "cli",
    });

    await rootNode.kv["set!"]("root-key", "root-value");
    assert.equal(await otherNode.kv.get("root-key"), undefined);
  } finally {
    fs.rmSync(otherRootDir, { recursive: true, force: true });
  }
}

async function assertNodeStorageIsScopedByRootDir(rootDir) {
  const otherRootDir = fs.mkdtempSync(
    path.join(os.tmpdir(), "logseq-js-api-storage-other-root-"),
  );
  try {
    const rootNode = NodePlatform.node_platform({
      "root-dir": rootDir,
      "owner-source": "cli",
    });
    NodePlatform.node_platform({
      "root-dir": otherRootDir,
      "owner-source": "cli",
    });

    await rootNode.storage["write-text!"]("graph-a/pages/a.md", "root");

    assert.equal(
      fs.readFileSync(
        path.join(rootDir, "graphs", "graph-a", "pages", "a.md"),
        "utf8",
      ),
      "root",
    );
    assert.equal(
      fs.existsSync(
        path.join(otherRootDir, "graphs", "graph-a", "pages", "a.md"),
      ),
      false,
    );
  } finally {
    fs.rmSync(otherRootDir, { recursive: true, force: true });
  }
}

async function assertNodeBroadcastIsScopedByOptions(rootDir) {
  const otherRootDir = fs.mkdtempSync(
    path.join(os.tmpdir(), "logseq-js-api-broadcast-other-root-"),
  );
  const rootEvents = [];
  const otherEvents = [];
  try {
    const rootNode = NodePlatform.node_platform({
      "root-dir": rootDir,
      "owner-source": "cli",
      "event-fn": (type, payload) => rootEvents.push([type, payload]),
    });
    NodePlatform.node_platform({
      "root-dir": otherRootDir,
      "owner-source": "cli",
      "event-fn": (type, payload) => otherEvents.push([type, payload]),
    });

    rootNode.broadcast["post-message!"]("root-event", { ok: true });

    assert.deepEqual(rootEvents, [["root-event", { ok: true }]]);
    assert.deepEqual(otherEvents, []);
  } finally {
    fs.rmSync(otherRootDir, { recursive: true, force: true });
  }
}

async function assertNodeCryptoIsScopedByRootDir(rootDir) {
  const otherRootDir = fs.mkdtempSync(
    path.join(os.tmpdir(), "logseq-js-api-crypto-other-root-"),
  );
  const previousCliE2e = process.env.CLI_E2E_TEST;
  process.env.CLI_E2E_TEST = "1";
  try {
    const rootNode = NodePlatform.node_platform({
      "root-dir": rootDir,
      "owner-source": "cli",
    });
    const otherNode = NodePlatform.node_platform({
      "root-dir": otherRootDir,
      "owner-source": "cli",
    });

    await rootNode.crypto["save-secret-text!"]("scoped-secret", "root-secret");

    assert.equal(await rootNode.kv.get("scoped-secret"), "root-secret");
    assert.equal(await otherNode.kv.get("scoped-secret"), undefined);
  } finally {
    if (previousCliE2e === undefined) {
      delete process.env.CLI_E2E_TEST;
    } else {
      process.env.CLI_E2E_TEST = previousCliE2e;
    }
    fs.rmSync(otherRootDir, { recursive: true, force: true });
  }
}

async function assertNodeSqliteIsScopedByOptions(rootDir) {
  const otherRootDir = fs.mkdtempSync(
    path.join(os.tmpdir(), "logseq-js-api-sqlite-other-root-"),
  );
  let rootGuardCalls = 0;
  let otherGuardCalls = 0;
  try {
    const rootNode = NodePlatform.node_platform({
      "root-dir": rootDir,
      "owner-source": "cli",
      "write-guard-fn": () => {
        rootGuardCalls += 1;
      },
    });
    NodePlatform.node_platform({
      "root-dir": otherRootDir,
      "owner-source": "cli",
      "write-guard-fn": () => {
        otherGuardCalls += 1;
      },
    });

    const dbPath = path.join(rootDir, "sqlite-scope.sqlite");
    const backupPath = path.join(rootDir, "backup", "sqlite-scope.sqlite");
    const db = await rootNode.sqlite["open-db"]({ path: dbPath });
    try {
      rootNode.sqlite.exec(db, "create table kvs(addr text primary key, content text)");
      await rootNode.sqlite["backup-db"](db, backupPath);
    } finally {
      rootNode.sqlite["close-db"](db);
    }

    assert.equal(rootGuardCalls, 1);
    assert.equal(otherGuardCalls, 0);
    assert.equal(fs.existsSync(backupPath), true);
  } finally {
    fs.rmSync(otherRootDir, { recursive: true, force: true });
  }
}

async function assertNodeEmbeddingIsScopedByOptions(rootDir) {
  const rootServer = await startEmbeddingServer();
  const otherServer = await startEmbeddingServer();
  const otherRootDir = fs.mkdtempSync(
    path.join(os.tmpdir(), "logseq-js-api-embedding-other-root-"),
  );
  try {
    const rootNode = NodePlatform.node_platform({
      "root-dir": rootDir,
      "owner-source": "cli",
      "embedding-endpoint": rootServer.url,
      "embedding-model-id": "BAAI/bge-m3",
    });
    NodePlatform.node_platform({
      "root-dir": otherRootDir,
      "owner-source": "cli",
      "embedding-endpoint": otherServer.url,
      "embedding-model-id": "Qwen/Qwen3-Embedding-4B",
    });

    const embeddings = await rootNode.embedding["embed-texts"](["root"]);

    assert.equal(rootServer.requests.length, 1);
    assert.equal(otherServer.requests.length, 0);
    assert.deepEqual(rootServer.requests[0].payload, {
      model: "BAAI/bge-m3",
      input: ["root"],
    });
    assert.equal(rootNode.embedding["model-id"], "BAAI/bge-m3");
    assert.equal(rootNode.embedding.dimension, 1024);
    assert.equal(embeddings[0].length, 1024);
  } finally {
    await rootServer.close();
    await otherServer.close();
    fs.rmSync(otherRootDir, { recursive: true, force: true });
  }
}

async function assertNodeVectorIsScopedByOptions(rootDir) {
  const otherRootDir = fs.mkdtempSync(
    path.join(os.tmpdir(), "logseq-js-api-vector-other-root-"),
  );
  let rootOpenCalls = 0;
  let otherOpenCalls = 0;
  try {
    const rootNode = NodePlatform.node_platform({
      "root-dir": rootDir,
      "owner-source": "cli",
      "open-vector-index-fn": (opts) => {
        rootOpenCalls += 1;
        return Promise.resolve({
          query: () => [{ id: "root-doc", page: opts.path, vectorScore: 1 }],
          "upsert!": () => {},
          "delete!": () => {},
          "truncate!": () => {},
          metadata: () => ({ owner: "root" }),
          "set-metadata!": () => {},
          "close!": () => {},
        });
      },
    });
    NodePlatform.node_platform({
      "root-dir": otherRootDir,
      "owner-source": "cli",
      "open-vector-index-fn": () => {
        otherOpenCalls += 1;
        return Promise.resolve({
          query: () => [{ id: "other-doc", vectorScore: 1 }],
          "upsert!": () => {},
          "delete!": () => {},
          "truncate!": () => {},
          metadata: () => ({ owner: "other" }),
          "set-metadata!": () => {},
          "close!": () => {},
        });
      },
    });

    const index = await rootNode.vector["open-index"]({
      path: path.join(rootDir, "root-vector"),
      dimension: 1024,
    });

    assert.equal(rootOpenCalls, 1);
    assert.equal(otherOpenCalls, 0);
    assert.deepEqual(index.metadata(), { owner: "root" });
    assert.deepEqual(index.query([1], 1, "page"), [
      {
        id: "root-doc",
        page: path.join(rootDir, "root-vector"),
        vectorScore: 1,
      },
    ]);
  } finally {
    fs.rmSync(otherRootDir, { recursive: true, force: true });
  }
}

async function assertNodeCrypto(crypto) {
  assertFunction(crypto, "saveSecretText");
  assertFunction(crypto, "save-secret-text!");
  assertFunction(crypto, "readSecretText");
  assertFunction(crypto, "read-secret-text");
  assertFunction(crypto, "deleteSecretText");
  assertFunction(crypto, "delete-secret-text!");

  const previousCliE2e = process.env.CLI_E2E_TEST;
  process.env.CLI_E2E_TEST = "1";
  try {
    await crypto["save-secret-text!"]("plain-js-secret", "secret-value");
    assert.equal(
      await crypto["read-secret-text"]("plain-js-secret"),
      "secret-value",
    );
    await crypto["delete-secret-text!"]("plain-js-secret");
    assert.equal(await crypto["read-secret-text"]("plain-js-secret"), undefined);
  } finally {
    if (previousCliE2e === undefined) {
      delete process.env.CLI_E2E_TEST;
    } else {
      process.env.CLI_E2E_TEST = previousCliE2e;
    }
  }
}

async function assertNodeTimers(timers) {
  assertFunction(timers, "setInterval");
  assertFunction(timers, "set-interval!");

  let ticks = 0;
  let interval;
  await new Promise((resolve) => {
    interval = timers["set-interval!"](() => {
      ticks += 1;
      if (ticks === 2) {
        clearInterval(interval);
        resolve();
      }
    }, 1);
  });
  assert.equal(ticks, 2);
}

async function assertNodeWebsocket(websocket) {
  assertFunction(websocket, "connect");

  const server = new WebSocketServer({ port: 0 });
  await new Promise((resolve) => server.once("listening", resolve));

  try {
    const connectionSeen = new Promise((resolve) => {
      server.once("connection", (socket) => {
        socket.close();
        resolve(true);
      });
    });
    const client = websocket.connect(`ws://127.0.0.1:${server.address().port}`);
    await new Promise((resolve, reject) => {
      client.once("open", resolve);
      client.once("error", reject);
    });
    assert.equal(await connectionSeen, true);
    client.close();
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

async function assertNodeEmbedding(embedding, requests) {
  assert.equal(embedding["model-id"], "BAAI/bge-m3");
  assert.equal(embedding.modelId, "BAAI/bge-m3");
  assert.equal(embedding.dimension, 1024);
  assertFunction(embedding, "embed-texts");
  assertFunction(embedding, "embedTexts");

  const embeddings = await embedding["embed-texts"](["first", "second"]);
  assert.equal(requests.length, 1);
  assert.equal(requests[0].method, "POST");
  assert.deepEqual(requests[0].payload, {
    model: "BAAI/bge-m3",
    input: ["first", "second"],
  });
  assert.equal(embeddings.length, 2);
  assert.equal(embeddings[0].length, 1024);
  assert.equal(embeddings[1].length, 1024);
  assert.equal(embeddings[0][0], 0);
  assert.equal(embeddings[1][0], 1);
}

test("Node JS API bundle does not depend on local runtime shims", () => {
  const bundleSource = fs.readFileSync(nodeJsApiModulePath, "utf8");

  for (const marker of nodeShimMarkers) {
    assert.equal(
      bundleSource.includes(marker),
      false,
      `node bundle should not contain ${marker}`,
    );
  }
});

test("Platform Js_api can be called from plain JavaScript", async () => {
  assertFunction(BrowserPlatform, "browser_platform");
  assert.equal(typeof BrowserPlatform.browser, "object");
  assert.equal(BrowserPlatform.node_platform, undefined);
  assert.equal(BrowserPlatform.node, undefined);
  assertFunction(NodePlatform, "node_platform");
  assert.equal(typeof NodePlatform.node, "object");
  assert.equal(NodePlatform.browser_platform, undefined);
  assert.equal(NodePlatform.browser, undefined);

  const browser = BrowserPlatform.browser_platform();
  assertBrowserPlatformShape(browser);

  const rootDir = fs.mkdtempSync(
    path.join(os.tmpdir(), "logseq-js-api-js-test-"),
  );
  let embeddingServer;
  let eventCalled = false;
  let guardCalled = false;
  let lockCalled = false;
  let openCalled = false;

  try {
    embeddingServer = await startEmbeddingServer();
    const vectorCalls = [];
    let vectorMetadata = { ready: true };
    const vectorIndex = {
      query: (embedding, limit, page) => {
        vectorCalls.push(["query", embedding, limit, page]);
        return [{ id: "doc-1", page, vectorScore: 0.9 }];
      },
      "upsert!": (docs) => {
        vectorCalls.push(["upsert!", docs]);
      },
      "delete!": (ids) => {
        vectorCalls.push(["delete!", ids]);
      },
      "truncate!": () => {
        vectorCalls.push(["truncate!"]);
      },
      metadata: () => vectorMetadata,
      "set-metadata!": (metadata) => {
        vectorMetadata = metadata;
        vectorCalls.push(["set-metadata!", metadata]);
      },
      "close!": () => {
        vectorCalls.push(["close!"]);
      },
    };

    const node = NodePlatform.node_platform({
      "root-dir": rootDir,
      "owner-source": "cli",
      "event-fn": () => {
        eventCalled = true;
      },
      "write-guard-fn": () => {
        guardCalled = true;
        return Promise.resolve();
      },
      "recreate-lock-fn": () => {
        lockCalled = true;
      },
      "embedding-endpoint": embeddingServer.url,
      "embedding-model-id": "BAAI/bge-m3",
      "open-vector-index-fn": () => {
        openCalled = true;
        return Promise.resolve(vectorIndex);
      },
    });

    assert.equal(node.env.runtime, "node");
    assert.equal(node.env["root-dir"], rootDir);
    assert.equal(node.env["owner-source"], "cli");

    node.env["recreate-lock-fn"]();
    assert.equal(lockCalled, true);

    node.broadcast["post-message!"]("event", null);
    assert.equal(eventCalled, true);

    await assertNodeEmbedding(node.embedding, embeddingServer.requests);

    assertFunction(node.vector, "open-index");
    assertFunction(node.vector, "openIndex");
    const index = await node.vector["open-index"]({
      path: path.join(rootDir, "vector"),
      dimension: 1024,
    });
    assert.equal(openCalled, true);
    assertFunction(index, "query");
    assertFunction(index, "upsert!");
    assertFunction(index, "delete!");
    assertFunction(index, "truncate!");
    assertFunction(index, "metadata");
    assertFunction(index, "set-metadata!");
    assertFunction(index, "close!");
    assert.deepEqual(index.query([0.1, 0.2], 1, "page-a"), [
      { id: "doc-1", page: "page-a", vectorScore: 0.9 },
    ]);
    index["upsert!"]([{ id: "doc-1", page: "page-a" }]);
    index["delete!"](["doc-1"]);
    index["truncate!"]();
    assert.deepEqual(index.metadata(), { ready: true });
    index["set-metadata!"]({ ready: false });
    assert.deepEqual(index.metadata(), { ready: false });
    index["close!"]();
    assert.deepEqual(
      vectorCalls.map((call) => call[0]),
      ["query", "upsert!", "delete!", "truncate!", "set-metadata!", "close!"],
    );

    await assertNodeSqlite(node.sqlite, rootDir);
    await assertNodeStorage(node.storage, rootDir);
    await assertNodeStorageIsScopedByRootDir(rootDir);
    await assertNodeKv(node.kv);
    await assertNodeKvIsScopedByRootDir(rootDir);
    await assertNodeKvPreservesBinaryAcrossReload(rootDir);
    await assertNodeBroadcastIsScopedByOptions(rootDir);
    await assertNodeCryptoIsScopedByRootDir(rootDir);
    await assertNodeCrypto(node.crypto);
    await assertNodeSqliteIsScopedByOptions(rootDir);
    await assertNodeEmbeddingIsScopedByOptions(rootDir);
    await assertNodeVectorIsScopedByOptions(rootDir);
    await assertNodeTimers(node.timers);
    await assertNodeWebsocket(node.websocket);

    await node.storage["write-text!"]("probe.txt", "content");
    assert.equal(guardCalled, true);
  } finally {
    if (embeddingServer !== undefined) {
      await embeddingServer.close();
    }
    fs.rmSync(rootDir, { recursive: true, force: true });
  }
});

test("Browser post-message uses Logseq transit payload semantics", () => {
  const originalPostMessage = globalThis.postMessage;
  const messages = [];

  try {
    globalThis.postMessage = (...args) => messages.push(args);

    const browser = BrowserPlatform.browser_platform();
    const payload = { ok: true };
    browser.broadcast["post-message!"]("event", payload);

    assert.equal(messages.length, 1);
    assert.equal(messages[0].length, 1);
    assert.equal(typeof messages[0][0], "string");

    const decoded = transit.reader("json").read(messages[0][0]);
    assert.equal(decoded[0], "event");
    assert.equal(decoded[1].get("ok"), true);
  } finally {
    if (originalPostMessage === undefined) {
      delete globalThis.postMessage;
    } else {
      globalThis.postMessage = originalPostMessage;
    }
  }
});

test("Node sqlite write guard accepts the synchronous db-worker lock check", async () => {
  const rootDir = fs.mkdtempSync(
    path.join(os.tmpdir(), "logseq-js-api-sync-write-guard-"),
  );
  let guardCalled = false;

  try {
    const node = NodePlatform.node_platform({
      "root-dir": rootDir,
      "owner-source": "electron",
      "write-guard-fn": () => {
        guardCalled = true;
      },
    });

    const dbPath = path.join(rootDir, "sqlite-sync-guard.sqlite");
    const backupPath = path.join(rootDir, "backup", "copy.sqlite");
    const db = await node.sqlite["open-db"]({ path: dbPath });
    try {
      await node.sqlite.exec(db, "create table kvs(addr text primary key, content text)");
      await node.sqlite.exec(db, {
        sql: "insert into kvs values (?, ?)",
        bind: ["a", "b"],
      });
      await node.sqlite["backup-db"](db, backupPath);
    } finally {
      node.sqlite["close-db"](db);
    }

    assert.equal(guardCalled, true);
    assert.equal(fs.existsSync(backupPath), true);
  } finally {
    fs.rmSync(rootDir, { recursive: true, force: true });
  }
});
