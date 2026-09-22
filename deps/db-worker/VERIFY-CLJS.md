# Verify cljs ↔ OCaml db-worker seam (devin/ocaml-db-worker)

Date: 2026-09-22. Scope: `remote-function` dispatch seam, node bundle
(`static/db-worker-ocaml.cjs`), cljs daemon tests, `dune runtest`.

## TL;DR

The dispatch seam itself is correct (registration check, transit round-trip,
tagged-error → thrown ex-info → HTTP status mapping all verified). The
double-open architecture gap (Blocker 1) is **fixed**: `start-db!`/
`on-become-master` now delegate graph open to OCaml when it claims
`thread-api/create-or-open-db`, so the OCaml worker owns `db.sqlite`
exclusively. E2E is now blocked only by the datascript-ocaml Instant codec
engine bug (Blocker 2), which fires inside OCaml's bootstrap transact on
first graph open.

- cljs-only daemon tests: **51 tests / 302 assertions / 0 failures** —
  unchanged with the delegation in place (`ocaml-registered?` is inert
  without `globalThis.LogseqDbWorker`).
- Same suite with `db-worker-ocaml.cjs` loaded: daemon startup aborts
  (`startup-close-failed` → `.exit 1`) on Blocker 2 — the delegation
  correctly surfaces the OCaml error as a rejection through
  `init-service`, which start-daemon treats as fatal.
- `dune runtest`: 2 failures, both documented below (one engine-owned,
  one from upstream `fbdf1ba491`).
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

## Blocker 1 — FIXED: cljs and OCaml both opened `db.sqlite` exclusively

Was: `build-proxy-object` ran `<init-service!` → `on-become-master` →
`start-db!` → cljs `<create-or-open-db!` opened `graphs/<enc>/db.sqlite`
with `PRAGMA locking_mode=exclusive` before the invoke reached OCaml →
`SQLITE_BUSY` on every OCaml open.

Fix (approved single-owner delegation):

- `thread_api.cljc`: new public `ocaml-registered?` and `<ocaml-invoke`
  helpers. `<ocaml-invoke` encodes args via `ldb/write-transit-str`, calls
  `LogseqDbWorker.invoke`, decodes the reply with `ldb/read-transit-str`
  and **throws** when the result decodes to `ExceptionInfo`/`js/Error`
  (`read-transit-str` returns the error as a value; the wire contract is
  identical to calling a cljs thread-api fn directly). It throws
  synchronously when the endpoint isn't registered — callers must gate
  with `ocaml-registered?` first.
- `db_core.cljs` `start-db!`: when
  `ocaml-registered? "thread-api/create-or-open-db"`, delegates graph open
  via `<ocaml-invoke` instead of cljs `<create-or-open-db!` — the cljs
  sqlite pool/datascript conn/search-db/client-ops-db are never opened;
  the OCaml worker owns `db.sqlite` exclusively. The cljs path is
  untouched and runs verbatim when the bundle is absent.
- `db_core.cljs` `on-become-master`: the
  `(assert (some? (get-datascript-conn repo)))` check now also accepts
  `ocaml-registered?` — the conn lives in OCaml `worker-state`, not cljs's.

The resulting flow calls OCaml `create_or_open_db` twice per open — once
via delegation inside `init-service`, once via `remote-function`
dispatch — matching the cljs shape (cljs `start-db!` opened the conn,
then `def-thread-api :thread-api/create-or-open-db` returned
`{:schema ...}` on the existing conn). OCaml `create_or_open_db` is
idempotent (early-returns `{:schema}` when `worker_state` already holds
the repo's conn), so this is safe.

### cljs conn-reader audit (who lost their conn)

`worker-state/get-datascript-conn`/`get-sqlite-conn` now return nil under
OCaml ownership. Reachability audit of every cljs reader outside
`def-thread-api`:

- **No-op readers**: `close-other-dbs!`, `close-db!`, `close-db-aux!`
  iterate cljs `*sqlite-conns` — empty → harmless. Caveat: internal cljs
  `close-db!` calls (e.g. `init-service` graph-switch) do **not** close
  OCaml's conns; OCaml `worker_state` keeps them per-repo and a later
  `create-or-open-db` reuses them. Closing OCaml conns on graph switch
  would need an OCaml `close-db` dispatch added to `close-db!` — not done
  here.
- **Endpoint-scoped readers** (reachable only through def-thread-api):
  all of `handler/*.cljs`, `publish.cljs`, `undo_redo.cljs`,
  `sync*.cljs`/`deps/sync/*` helpers, `<invalidate-search-db!`,
  `db-sync-dbs-open?`, `<create-or-open-db!` internals
  (`initial-data-exists?`, `check-and-fix-schema!`, `listen-db-changes!`,
  export/backup defs). The 20 unregistered endpoints will legitimately
  error `:db/missing-connection` until ported — expected per task spec.
- **Debug-only reader**: `frontend.worker.debug/get-conn` (REPL helper)
  returns nil under OCaml — `db` console helpers won't see OCaml's conn.
- **Daemon-side**: `db_worker_node.cljs` never reads `worker-state`
  conns; its graph lifecycle (`lifecycle/admit`, `assert-lock-owner!`,
  `write-guard-fn`) is a separate storage layer unaffected by this change.

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
around — per task scope (fix is landing in datascript-ocaml separately).
Now the **sole remaining e2e blocker**: with Blocker 1 fixed, OCaml
`create_or_open_db` runs its bootstrap `transact_conn` → kvs persist →
Instant encode → throw → tagged error → the delegated `start-db!`
propagates it as a rejection → daemon `start-daemon!` aborts via
`startup-close-failed` → `.exit 1`, so the OCaml-loaded daemon suite
currently cannot enumerate tests at all.

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
| `frontend.worker.db-worker-node-test` (OCaml loaded, before Blocker-1 fix) | 51 tests / 13 failures — all `database is locked` cascade |
| `frontend.worker.db-worker-node-test` (OCaml loaded, after fix) | process exits at daemon startup (`startup-close-failed`) — Blocker 2 Instant codec bug surfaces as a fatal init rejection; single remaining blocker |
| `frontend.worker.db-worker-node-test` (cljs-only control) | 51 tests / **0 failures** — cljs path byte-identical |
| worker + cli + handler suites, cljs-only (`db-worker-test`, `db-core-test`, `cli.common.db-worker-test`, `handler.worker-test`) | 178 tests / 2 failures — `export-client-ops-db-binary` normalized-path assertions (cljs-side, pre-existing, unrelated to seam) |
| `frontend.handler.db-based.property-test` + `page-test` (cljs-only) | 7 tests / 1 failure — `set-block-property-resolves-numeric-block-id-test`, "non-class tag insert should not set a tag property directly" (pre-existing on this branch; file untouched by OCaml work) |
| `dune runtest` | 2 failures: known engine-owned `frontend 7 recur-replace-uuid-in-block-title-test`, plus `db_test 23 get-block-alias-bidirectional-rule` — introduced by upstream `fbdf1ba491` ("restore faithful rule/:in queries"), fails in the fixture's `[:block/uuid ...]` lookup-ref resolution on `block/alias`; unrelated to this commit (not in its code path) |
| `node scripts/node-smoke.cjs` | 9/15 — create-or-open-db hits Blocker 2 |

## Commands

```
cd deps/db-worker && pnpm build        # dune + vite bundles
dune build && dune runtest
node scripts/node-smoke.cjs            # bundle smoke (repo root CWD)
pnpm cljs:test                          # compile :db-worker-node + :test
LOGSEQ_STABLE_IDENTS=1 node static/tests.js -n frontend.worker.db-worker-node-test
```
