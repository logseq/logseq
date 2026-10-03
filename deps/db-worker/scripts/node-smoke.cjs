#!/usr/bin/env node
// Node smoke test for the bundled OCaml db-worker (static/db-worker-ocaml.cjs).
// Exercises the same path the cljs seam uses:
//   require bundle -> init() -> registered(name) -> invoke(name, transitArgs)
// Args/results are transit-json strings, encoded/decoded with transit-js
// (same lib + format as cljs-bean write-transit-str/read-transit-str).
//
// Usage: node deps/db-worker/scripts/node-smoke.cjs

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

process.env.LOGSEQ_WORKER_DB_DIR = fs.mkdtempSync(
  path.join(os.tmpdir(), "dbw-smoke-"),
);

const transit = require("transit-js");
const writer = transit.writer("json");
const reader = transit.reader("json");

const bundlePath = path.resolve(
  __dirname,
  "../../../static/db-worker-ocaml.cjs",
);
const worker = require(bundlePath);

const kw = transit.keyword;
const tmap = (...kvs) => transit.map(kvs);

let passed = 0;
let failed = 0;
function check(label, cond, extra) {
  if (cond) {
    passed += 1;
    console.log(`PASS ${label}`);
  } else {
    failed += 1;
    console.log(`FAIL ${label}${extra ? " :: " + extra : ""}`);
  }
}

async function invoke(name, args) {
  const res = await worker.invoke(name, writer.write(args));
  return { raw: res, decoded: reader.read(res) };
}

(async () => {
  check("bundle loads", typeof worker === "object" || typeof worker === "function");
  check("exports init", typeof worker.init === "function");
  check("exports invoke", typeof worker.invoke === "function");
  check("exports registered", typeof worker.registered === "function");

  worker.init();
  check("init() no-throw", true);

  check('registered "thread-api/q"', worker.registered("thread-api/q") === true);
  check('registered "thread-api/nope" false', worker.registered("thread-api/nope") === false);

  const repo = "test/node-smoke-graph";

  // create-or-open-db
  let r = await invoke("thread-api/create-or-open-db", [
    repo,
    tmap(
      kw("schema"),
      tmap(kw("db/ident"), tmap(kw("db/unique"), kw("db.unique/identity"))),
    ),
  ]);
  check("create-or-open-db no error", !r.raw.includes('"~#error"') && !String(r.raw).includes("error"), r.raw.slice(0, 200));

  // transact: [repo tx-data tx-meta tx-opts]
  // Writes a db-ident + kv/value entity — a bare attribute entity (no
  // db/ident, block/uuid, or tags) is rejected by tx-report validation in
  // both the cljs and OCaml workers (dispatch key resolves to no schema
  // branch).
  r = await invoke("thread-api/transact", [
    repo,
    [
      [kw("db/add"), -1, kw("db/ident"), kw("logseq.kv/smoke-test")],
      [kw("db/add"), -1, kw("kv/value"), "hello"],
    ],
    null,
    null,
  ]);
  check("transact no error", !String(r.raw).includes("error"), r.raw.slice(0, 200));

  // q: [repo [query-string inputs...]]
  r = await invoke("thread-api/q", [
    repo,
    ['[:find ?e :where [?e :db/ident :logseq.kv/smoke-test]]'],
  ]);
  const qDecoded = r.decoded;
  // datascript q returns a set of rows; transit decodes it to either a JS
  // Array of rows or a transit Set depending on the writer's tagging.
  const qRows = Array.isArray(qDecoded)
    ? qDecoded
    : qDecoded && typeof qDecoded.entries === "function"
      ? [...qDecoded.values()]
      : null;
  check(
    "q returns entity",
    qRows !== null && qRows.length === 1 && Number.isInteger(qRows[0][0]),
    JSON.stringify(qDecoded),
  );
  const eid = qRows && qRows[0] && qRows[0][0];

  // pull: [repo selector eid]
  r = await invoke("thread-api/pull", [repo, [kw("db/ident")], eid]);
  check(
    "pull returns map with db/ident",
    r.raw.includes("db/ident") && r.raw.includes("smoke-test"),
    r.raw.slice(0, 200),
  );

  // datoms
  r = await invoke("thread-api/datoms", [repo, kw("eavt")]);
  check("datoms contains db/ident", r.raw.includes("db/ident"), r.raw.slice(0, 200));

  // unopened repo: cljs def-thread-api fns are (when-let [conn ...]) so
  // they return nil — the port must match (null, not an error).
  r = await invoke("thread-api/q", [
    "test/nonexistent-graph",
    ["[:find ?e :where [?e :db/ident :logseq.kv/smoke-test]]"],
  ]);
  check(
    "unopened-repo q returns nil like cljs when-let",
    r.decoded === null,
    r.raw.slice(0, 200),
  );

  // error path: a handler that raises synchronously makes invoke reject,
  // matching cljs remoteInvoke (async task failures resolve to tagged
  // error transit instead).
  let rejected = false;
  try {
    await invoke("thread-api/q", [repo, ["[:find ?e :where [?e :block/name"]]);
  } catch {
    rejected = true;
  }
  check("malformed query rejects invoke like cljs remoteInvoke", rejected);

  // close
  r = await invoke("thread-api/close-db", [repo]);
  check("close-db no error", !String(r.raw).includes('"~#error"'), r.raw.slice(0, 200));

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed === 0 ? 0 : 1);
})().catch((e) => {
  console.log(`FAIL threw: ${e && e.stack ? e.stack : e}`);
  process.exit(1);
});
