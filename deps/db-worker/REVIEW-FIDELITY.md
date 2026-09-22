# REVIEW-FIDELITY: cljs→OCaml db-worker port

Behavioral diff of `deps/db-worker/lib/` (~54k LOC) against its cljs sources in
`deps/db`, `deps/outliner`, `deps/sync`, `src/main/frontend/worker/`.

Method: walk the cljs fn and the OCaml fn side by side; diff behavior, not
syntax. Severity: **blocker** = crashes or corrupts data at runtime; **high** =
wrong results in common paths; **low** = edge cases / dead code.

## Confirmed and fixed (commits on `devin/ocaml-db-worker`)

### 1. Negative cljs tempids crashed the tx path — `f240241bd3` (blocker)
- cljs: datascript tempids are negative numbers (`(dec (- idx))`,
  `deps/outliner/src/logseq/outliner/core.cljc` `assign-temp-id`).
- OCaml: `deps/db-worker/lib/block_map.ml` `entity_ref_of_value` /
  `value_to_tx_value` emitted `Entity_id n` / `Ref n` for `n < 0`; the engine
  (`datascript-ocaml impl/db.ml:20` `validate_entity_id`) raises
  `Invalid_argument("entity id must not be negative")` in
  `impl/transact.ml` `apply_tx` / `resolve_entity_ref`.
- Fix: `id_ref_of` maps `n < 0` to `Temp_id (string_of_int n)`, matching the
  engine's tempid surface. Read path was already safe (`entity (Entity_id -1)`
  → `None`).
- Verified: reproduces on upstream `069591b4fc` (pre-existing engine-facing
  bug, not introduced by this branch).

### 2. `build-new-property` merged schema over canonical — `f79b72a3aa` (high)
- cljs: `(merge property-schema canonical-property)` — canonical attrs win.
- OCaml: `deps/db-worker/lib/db_property_build.ml` used
  `x |> Block_map.merge [kvs]` which is `Block_map.merge [kvs] x` — the piped
  value wins, the *opposite* order. Every property entity's
  `logseq.property/type` was stored as `String` instead of the canonical
  `Keyword`, breaking all tag validation.
- Fix: `Block_map.merge (dissoc prop_schema ["db/cardinality"]) [canonical]`.

### 3. `:double` schema rejected integer values — `a531f714dc` (high)
- cljs malli `:double` accepts integers (double? is `number?`-like in cljs).
- OCaml `deps/db-worker/lib/malli.ml` required `PDouble`, rejecting `Int`.
- Fix: accept `Int` where `:double` is expected.

### 4. `transact` bypassed `transact-sync` pipeline+validation — `6ef5ff6a01` (blocker)
- cljs: all worker transacts go through `db/transact-sync`
  (`deps/db/src/logseq/db.cljs:155-190`): `d/with` → `*transact-pipeline-fn*`
  → `throw-if-page-has-block-parent!` → `db-validate/validate-tx-report` → CAS.
- OCaml `deps/db-worker/lib/db_transact.ml` called `transact_conn` directly,
  skipping the pipeline (fix-tx-data, insert-tag-templates, etc.) and
  validation entirely.
- Fix: route through `Db_tx.transact_sync`; also isolate the batch temp conn
  (`Batch.transact` shared the live conn, leaking temp state).

### 5. db-listener checksum + persist-local-tx handlers unwired — `19f151fe08` (high)
- cljs: `db-listener` computes a checksum on commit and persists local txs.
- OCaml `deps/db-worker/lib/sync_client.ml` never invoked the handlers.
- Fix: wire both into the commit path.

### 6. Outliner insert/move semantic drift — `26d79c2027` (blocker)
- cljs `insert-blocks` computes parent/order per block with full
  target/sibling context; `move-block` validates same-page and target
  reachability before mutating.
- OCaml `deps/db-worker/lib/outliner_core.ml` `insert_blocks` (~139 lines
  reworked) and `outliner_op.ml` diverged: order keys miscomputed, parent
  assigned before sibling resolution, `move-block` clause order differed.
- Fix: re-ported to match cljs control flow and arities 1:1.

### 7. `create-or-open-db` dep + eager require of thread fns in prepare-import — `f83b53f717` (high)
- cljs `prepare-import` resolves `create-or-open-db` and thread fns upfront.
- OCaml `deps/db-worker/lib/sync_download.ml` resolved them lazily → nil calls
  on cold start.
- Fix: require upfront, matching cljs init order.

### 8. `upload-graph` used wrong e2ee predicate — `379a339d46` (high)
- cljs: `upload-graph` gates on `normalize-graph-e2ee?`.
- OCaml `deps/db-worker/lib/sync_upload.ml` checked a different flag.
- Fix: match cljs semantics.

### 9. `Sync_deps` crypt/history hooks not wired at init — `437951df7d` (blocker)
- cljs: sync deps inject crypt + history hooks at module init.
- OCaml `deps/db-worker/lib/sync_deps.ml` left them unbound → encrypt/decrypt
  and history ops were no-ops.
- Fix: wire at init (`sync_crypt.ml`, `sync_client.ml`, `sync_assets.ml`).

### 10. `sync_apply` remote-tx apply order — `28d4c13314` (blocker)
- cljs: remote txs applied in order with client-ops queue flush and state
  transitions (`deps/sync/src/logseq/sync/*`).
- OCaml `deps/db-worker/lib/sync_apply.ml` (~89 lines reworked) applied txs
  out of order and skipped queue flush semantics.
- Fix: match cljs apply order + state transitions.

### 11. `property-keys` computed over partial datoms — `02921fc51a` (high)
- cljs `entity_plus.cljc:129-136` `get-property-keys`: `(d/datoms db :eavt eid)`
  → all datoms, distinct attr, filter `db-property/property?`.
- OCaml `deps/db-worker/lib/plain_value.ml` iterated only the entity's forward
  attrs — missing datoms not materialized in the forward map.
- Fix: compute over all `:eavt` datoms for the eid.

### 12. `get-down`/`has-children?`/`last-direct-child` used raw `_parent` — `d3de96ab92` (high)
- cljs: `deps/db/src/logseq/db.cljs:496,638,647` all use
  `(:block/_parent e)` — the *filtered* reverse lookup
  (`entity_plus.cljc:168-172` removes `logseq.property/created-from-property`
  and `block/closed-value-property` children).
- OCaml `deps/db-worker/lib/ldb.ml` used the raw reverse index, including
  property-created and closed-value children.
- Fix: use filtered `:block/_parent` in all three fns.

### 13. `close-db!` didn't close OCaml conns — `7d0d826a95` (high)
- cljs `db-core.cljs` `close-db!` closes the conn; OCaml conn leaked.
- Fix: close OCaml conns from cljs `close-db!` (`db_core.cljs`).

### 14. Graph open didn't delegate to OCaml worker — `e4c3ea1dc3` (high)
- cljs: graph open routes to the registered worker.
- Fix: delegate to OCaml worker when registered (`thread_api.cljc`,
  `db_core.cljs`).

## Confirmed — listed for humans (not fixed)

### A. `commit_tx_report` replays raw datoms; cljs delivers the pipeline report — **blocker**, needs engine API
- cljs `transact-sync` (`deps/db/src/logseq/db.cljs:175-178`):
  `compare-and-set!` + `run-callbacks conn tx-report` delivers THE PIPELINE
  REPORT — listeners see the pipeline's `tempids`, including
  `:db/current-tx` resolving to `db_after.max_tx` (the value the pipeline's
  `with_report` wrote into `block/tx-id`).
- OCaml `deps/db-worker/lib/db_tx.ml:149-151` `commit_tx_report`:
  `transact_conn conn (map Raw_datom report.tx_data)` — replays the datoms as
  a *new* transaction. Listeners see a different report identity:
  `tx = conn.db.max_tx + 1` (one higher than the pipeline's inner tx) and
  `tempids` lack `db/current-tx`. Any listener that resolves
  `(:tempids tx-report)` gets wrong/missing values.
- Why not fixed: `Datascript.Conn` exposes `transact`/`reset`/`notify_listeners`
  but no `commit-report`/`apply-report` API that installs a precomputed
  `tx_report`. Adding one is an engine change (`impl/conn.ml:115,143-163`).
- Trigger: `test_pipeline_native.exe` `temp-inner-mutations canonical
  revision` — expects `db/current-tx` tempid = `m+2` (pipeline tx-id), gets
  `m+1` (replay tx).
- Suggested fix: add `Conn.commit (conn : conn) (report : tx_report) : unit`
  to datascript-ocaml that sets `conn.db := report.db_after` and runs
  `notify_listeners conn report`, then use it in `commit_tx_report`.

### B. `initial_max_eid` pre-scan shifts eid allocation vs upstream — **high**, engine-owned
- cljs datascript `db.cljc:1362-1419`: `next-eid db = inc max-eid`;
  `advance-max-eid` bumps `max-eid` only when a datom with a larger explicit
  eid is *applied*. No pre-scan of tx ops.
- datascript-ocaml `impl/transact.ml:428`:
  `let initial_max_eid = List.fold_left max_explicit_tx_op db.max_eid tx_ops`
  — scans all ops for explicit `Entity_id`/`Ref` eids and starts allocation
  above them.
- Consequence (confirmed in `test_pipeline_native` `reschedule template child
  used-template`): `insert_tag_templates` computes insert ops against
  `template_db` where the journal is `e76`; ops embed `Entity_id 76`. The
  final `with_report report.db_after extra_tx_data` pre-scans, sees the
  explicit `76`, bumps `initial_max_eid` to 76, so the journal op allocates
  `e77`. `block/parent Ref 76` now points to a ghost entity (never allocated,
  zero datoms). The child's parent/page land on a nonexistent entity.
- cljs has the same shape (ops embed resolved `(:db/id object)` = 76) but
  cljs datascript allocates sequentially — the journal op still creates `e76`
  because allocation happens in op order, not pre-scanned.
- Suggested fix (engine): drop `initial_max_eid` pre-scan; allocate from
  `db.max_eid` and advance on explicit encounters only (`advance-max-eid`
  already exists — `context.max_eid_with_entity_id`).
- Note: pre-scan also changes tempid→eid assignment order vs upstream —
  upstream allows a tempid to collide with a later explicit eid (upsert
  semantics resolve it); the pre-scan avoids the collision by
  over-allocating. This is the divergence root.

### C. Other listed items (lower confidence / dead code / engine notes)
- `Db_listener.main_thread_sync` unwired — no main-thread sync hook.
- `Db_tx.batch_transact` dead code path — batch temp conn unused after fix 4.
- `entity_of_wire_ref` missing map/ref shapes — wire deserialization partial.
- `transact-failed` logging absent in OCaml.
- `move_block` `parent_ref = -1` dead fallback at
  `deps/db-worker/lib/outliner_core.ml:2269` — unreachable
  (`target_without_parent` raises first; same as cljs).
- `remote_sync_conflicts` `sort_uniq` vs cljs `distinct` ordering.
- `sanitize_template_block` `uuid?` handling.
- `deferred_handlers` raw `tx_report` — engine object leaks across the wire
  boundary instead of serialized form.

### D. Deferred / not fully reviewed
- Sync edges: `presence.cljs`, `transport.cljs`, `asset_db_listener.cljs`,
  `large_title.cljs` — budget exhausted after `sync_apply`/`sync_client`.
- `worker_core` adapter drops `errors_humanized` on the error path.

## Verified faithful (spot-checked, no divergence)
- `entity_dispatch_key`/`page?` tag-based dispatch — matches cljs.
- `qualified_schema` Keyword→String adapter — correct.
- `property_value_tx_m` transient String handling — correct.
- `journal_page`/`journal_page_or_title`/`page_ref_for`/`variable-rules`
  (`outliner_template.ml:41-136` vs `template.cljs:60-112`) — pure
  query-or-title, no journal creation; confirmed NOT the source of issue B.
- `insert-tag-templates` structure (`worker_pipeline.ml:136-327` vs
  `pipeline.cljs:93-160`) — `tag->templates`, `raw-template-blocks`,
  `tag-additions` group-by-e, `insert-blocks {:sibling? false :keep-uuid?
  journal-template?}` — faithful; the only gap is the engine eid shift
  (issue B).

## Test status
- `dune build` — green.
- `dune runtest` — one known engine-owned failure in `test_db_native`
  (tolerated per task brief).
- `test_pipeline_native.exe` — 2 documented failures remaining, both rooted
  in the engine issues above:
  - `temp-inner-mutations canonical revision` → issue A.
  - `reschedule template child used-template` → issue B.
- No test source was modified to work around either issue.
