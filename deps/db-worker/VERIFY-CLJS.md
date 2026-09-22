# Verify cljs ↔ OCaml db-worker seam (devin/ocaml-db-worker)

Date: 2026-09-22. Scope: `remote-function` dispatch seam, node bundle
(`static/db-worker-ocaml.cjs`), cljs daemon tests, `dune runtest`.

## TL;DR

The dispatch seam itself is correct (registration check, transit round-trip,
tagged-error → thrown ex-info → HTTP status mapping all verified). E2E is
**blocked** by one seam-side architecture gap and one datascript-ocaml engine
bug, both characterized below.

- cljs-only daemon tests: **51 tests / 302 assertions / 0 failures**.
- Same suite with `db-worker-ocaml.cjs` loaded: **13 failures**, every one
  cascading from `Sqlite.Sqlite_error(database is locked)` on
  `thread-api/create-or-open-db`.
- `dune runtest`: all green except the known engine-owned
  `frontend 7 recur-replace-uuid-in-block-title-test`.
- `node scripts/node-smoke.cjs`: 9/15; create-or-open-db fails on the
  Instant-encode engine bug below.

## Verified working

1. **Bundle load + registration**: `load-ocaml-db-worker!` in
   `db_worker_node.cljs` `main` requires `static/db-worker-ocaml.cjs`,
   exposes `globalThis.LogseqDbWorker`, `init()` is a no-throw.
   `registered("thread-api/q")` → true; `registered("thread-api/nope")` →
   false; 144/164 endpoints registered.
2. **Transit round-trip**: `invoke` resolves transit strings; plain results
   decode correctly. Handler failures come back as `["~#error", ...]` which
   `ldb/read-transit-str` decodes to `ex-info` → the daemon maps
   `(:error data)=:parser/query` → 400 invalid-query, `:type :notification` →
   400, `#{:missing-repo :repo-mismatch :repo-locked}` → 409, else 500 —
   exercised end-to-end (unregistered → cljs fallback; missing conn → 500).
3. **Storage-dir wiring (fixed here)**: daemon `start-daemon!` now sets
   `LOGSEQ_WORKER_DB_DIR=<graphsDir>` and `LOGSEQ_WORKER_KV_DIR=<root-dir>`
   for the OCaml bundle (nothing cljs-side set them). Confirmed effective:
   OCaml opens the same `<graphs>/<encoded>/db.sqlite` cljs uses — which is
   exactly how the lock conflict in Blocker 1 became visible.
4. **Test env coverage**: `frontend.worker.db-worker-node-test` calls
   `db-worker-node/main` via `run-main-with-overrides` →
   `load-ocaml-db-worker!` sets `globalThis.LogseqDbWorker` for the rest of
   the process. Every in-process `remoteInvoke` afterwards routes through
   OCaml — including handler tests batched into the same `node static/tests.js`
   process (dispatch is process-global, not per-graph).

## Integration bugs found and fixed (seam side)

In `deps/db-worker/` unless noted:

- `src/main/frontend/worker/db_worker_node.cljs`: `start-daemon!` now exports
  `LOGSEQ_WORKER_DB_DIR`/`LOGSEQ_WORKER_KV_DIR` for the OCaml bundle.
- `lib/endpoint_lifecycle.ml`:
  - `db_dir`/`db_path` now use the cljs layout
    `<LOGSEQ_WORKER_DB_DIR>/<encoded-graph-dir>/db.sqlite`
    (`Graph_dir.repo_to_encoded_graph_dir_name`) instead of flat
    `<dir>/<repo>.sqlite`, so OCaml and cljs agree on the on-disk location.
  - `create_or_open_db` creates the graph dir (`File_sys.mkdir_p`), uses the
    built-in `Db_schema.schema ()` (cljs `get-storage-conn` always uses
    `db-schema/schema`, never the caller's opts schema), seeds
    `Sqlite_create_graph.initial_tx_data` via
    `transact_conn ~tx_meta:["initial-db?", Bool true]` on first open
    (cljs `initial-data-exists?` check = `:logseq.class/Root` entity +
    `logseq.kv/db-type`="db"), then runs `Db_migrate.migrate`.
  - `list-db` emits cljs's shape `[{:name "logseq_db_<decoded-key>"}]`
    decoded from the graphs dir; non-pooled path reads disk + decodes
    canonical dir keys.
  - `unsafe-unlink-db` removes the whole graph dir (cljs removes the pool
    vfs, i.e. the directory).
- `lib/graph_dir.ml`: ported `decode-canonical-graph-dir-key` —
  `uri_decode` with UTF-8 validation, rejects `++`/`+3A+` legacy encodings,
  non-trim-equal/empty decoded names, and decoded names starting with
  `logseq_db_`.
- `lib/db_schema.ml`: added `schema ()` — the verbatim cljs
  `db-schema/schema` map (not the test-only variant).
- `lib/templates.ml` (new): verbatim `templates/config.edn` for the initial
  config when `config` opt is absent (partial `resolve-initial-config`).
- `lib/dispatcher.ml` (earlier this thread): sync handler exceptions no
  longer escape; they encode as tagged-error transit.
- `scripts/node-smoke.cjs` (new): 15-assert bundle smoke — registered/invoke
  round-trip, error transit shape, missing-conn semantics.

## Blocker 1 — cljs and OCaml both open `db.sqlite` exclusively

For every `create-or-open-db` invoke, `build-proxy-object` first runs
`<init-service!` → `on-become-master` → `start-db!` → cljs
`<create-or-open-db!`, which opens `graphs/<enc>/db.sqlite` with
`PRAGMA locking_mode=exclusive` (+WAL, `wal_autocheckpoint=0`). Only then
does the invoke reach `remote-function` → OCaml `create_or_open_db` → opens
the same file → `SQLITE_BUSY` (`database is locked`) → tagged error → 500.

Evidence: the suite is 0-failures with the .cjs moved aside; 13 failures
with it loaded, all `database is locked` or cascade (`:db/missing-connection`,
`repo-locked`, `graph not opened`).

Deeper than locking: two conns can't share the datoms file at all — cljs
persists its own kvs flushes and would overwrite/diverge OCaml's. So e2e
needs a single-owner decision, e.g. when
`LogseqDbWorker.registered("thread-api/create-or-open-db")`, `start-db!` /
`on-become-master` delegates to OCaml `invoke` and skips the cljs conn
(including the `get-datascript-conn` assert). Consequence: unregistered
cljs endpoints (20 today — imports, exports, publishing, ensure-id, a-api,
search-index progress) would have no datascript conn at all until ported,
so full e2e depends on finishing that port anyway. Left unimplemented —
it's a design call in `db_core.cljs`, not a small seam tweak.

## Blocker 2 — datascript-ocaml storage codec can't encode Instant (engine bug)

In `datascript-ocaml-melange` (pinned dep, `melange/datascript_melange_storage.ml`):

```ocaml
| Instant value -> Transit.Tagged ("m", Transit.Int value)
| Uuid value    -> Transit.Tagged ("u", Transit.String value)
```

Three problems:

1. **Crash**: cljs writes instants/uuids as real transit dates/uuids
   (`~t`, `~u`; their handlers define `getVerboseHandler`). The generic
   `TaggedHandler` has none, and transit-js `emitEncoded` calls
   `handler.getVerboseHandler()` whenever `verbose && (asMapKey ||
   preferStrings)` and the rep isn't a string — `preferStrings` defaults to
   true — so **every Instant write throws**
   `TypeError: n.getVerboseHandler is not a function` →
   `Tag "m" cannot be encoded as string`. This is what makes the node smoke's
   `create-or-open-db` fail during the bootstrap transact
   (`file/created-at`, `block/created-at`, `db/txInstant` are all Instants).
   `Uuid` survives only by accident (its rep is a string).
2. **Wrong wire format**: `~#m`/`~#u` tagged maps aren't what cljs writes
   (`~t<ms>`, `~u<uuid>`), and cljs has no `m` read handler — kvs blobs are
   not byte-compatible with the cljs storage format.
3. **int32 truncation**: `Instant` holds `int` (melange = int32) and the
   codec does `Int64.to_int` on read/write — real ms timestamps wrap
   negative (observed `rep=-941763180`).

Expected fix (engine side): `Instant -> Transit.Date` (Int64 ms), make the
`Instant` type carry int64, `Uuid -> Transit.Uuid`. Reported, not worked
around — per task scope. Currently masked in the daemon by Blocker 1 but
blocks all persistence immediately after.

## Still-unported gaps (documented, not regressions)

- `create-or-open-db` cljs also does: client-ops db open,
  `check-and-fix-schema!`, `handle-migrate-result-local-txs!`,
  `maybe-enqueue-built-in-sync-repair!`, `maybe-run-recycle-gc!`,
  `db-sync/handle-local-tx!`, `listen-db-changes!`, datoms bootstrap path —
  none ported; `Db_migrate.migrate` return value is dropped (no local-tx
  handling). `resolve-initial-config` only partially (config opt + template).
- 20 endpoints fall back to cljs (import-file-graph, import-edn,
  import-db-binary, export-*, ensure-id, page-exists, favorited-page,
  display-properties, publish, a-api, db-sync-upload-stopped,
  export-client-ops-db-binary, search-index-build-progress). Under
  Blocker-1 fix they'd have no conn until ported.

## Test results

| Suite | Result |
|---|---|
| `frontend.worker.db-worker-node-test` (OCaml loaded) | 51 tests / 13 failures — all cascade from Blocker 1 |
| `frontend.worker.db-worker-node-test` (cljs-only control) | 51 tests / **0 failures** |
| worker + cli + handler suites, cljs-only (`db-worker-test`, `db-core-test`, `cli.common.db-worker-test`, `handler.worker-test`) | 178 tests / 2 failures — `export-client-ops-db-binary` normalized-path assertions (cljs-side, pre-existing, unrelated to seam) |
| `frontend.handler.db-based.property-test` + `page-test` (cljs-only) | 7 tests / 1 failure — `set-block-property-resolves-numeric-block-id-test`, "non-class tag insert should not set a tag property directly" (pre-existing on this branch; file untouched by OCaml work) |
| `dune runtest` | all green except known engine-owned `frontend 7 recur-replace-uuid-in-block-title-test` |
| `node scripts/node-smoke.cjs` | 9/15 — create-or-open-db hits Blocker 2 |

## Commands

```
cd deps/db-worker && pnpm build        # dune + vite bundles
dune build && dune runtest
node scripts/node-smoke.cjs            # bundle smoke (repo root CWD)
pnpm cljs:test                          # compile :db-worker-node + :test
LOGSEQ_STABLE_IDENTS=1 node static/tests.js -n frontend.worker.db-worker-node-test
```
