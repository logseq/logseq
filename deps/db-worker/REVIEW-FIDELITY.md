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

### 15. `commit_tx_report` replayed raw datoms; cljs delivers the pipeline report — `be08740242` + engine `6e618bd` (blocker)
- cljs `transact-sync` (`deps/db/src/logseq/db.cljs:175-178`):
  `compare-and-set!` + `run-callbacks conn tx-report` delivers THE PIPELINE
  REPORT — listeners see the pipeline's `tempids`, including
  `:db/current-tx` resolving to `db_after.max_tx` (the value the pipeline's
  `with_report` wrote into `block/tx-id`).
- Old OCaml `deps/db-worker/lib/db_tx.ml` `commit_tx_report`:
  `transact_conn conn (map Raw_datom report.tx_data)` — replayed the datoms
  as a *new* transaction, so listeners saw a different report identity
  (`tx = conn.db.max_tx + 1`, `tempids` missing `db/current-tx`).
- Fix: datascript-ocaml main `6e618bd` adds `Conn.apply_report` /
  `Datascript.apply_report` which installs a precomputed `tx_report`, does
  the storage-tail bookkeeping, and notifies listeners with that report;
  `commit_tx_report` calls it directly (`be08740242`).
- Was: `test_pipeline_native.exe` `temp-inner-mutations canonical
  revision` (`db/current-tx` tempid off by one). Now green.

### 16. `initial_max_eid` pre-scan shifted eid allocation vs upstream — engine `68587df` (high)
- cljs datascript `db.cljc:1362-1419`: `next-eid db = inc max-eid`;
  `advance-max-eid` bumps `max-eid` only when a datom with a larger explicit
  eid is *applied*. No pre-scan of tx ops.
- Old datascript-ocaml `impl/transact.ml` scanned all tx ops for explicit
  `Entity_id`/`Ref` eids (entity *and* value positions) and started
  allocation above them, so ops embedding resolved eids (e.g.
  `insert_tag_templates` ops carrying `Entity_id 76` computed against
  `template_db`) shifted allocation and left dangling refs (`block/parent
  Ref 76` on a ghost entity).
- Fix (engine, `68587df`): pre-scan now counts entity positions only —
  value-position refs are excluded, so forward refs to eids minted later
  in the same tx no longer shift tempid allocation. The same commit maps
  negative integer `:db/id`s to tempids, matching upstream.
- Residual divergence from upstream: the entity-position pre-scan still
  means a tempid can never collide with a later explicit eid, whereas
  upstream allocates strictly sequentially (`next-eid = inc max-eid`) and
  resolves such collisions via `retry-with-tempid` upsert. Observable in
  tempid→eid assignment on mixed txs (verified against upstream
  `datascript.js`). A fully sequential allocation + `retry-with-tempid`
  implementation matching upstream exactly sits on datascript-ocaml branch
  `devin/ocaml-db-worker` (`0aa9954`); whether to take it over the
  restricted pre-scan is an engine decision.
- Was: `test_pipeline_native.exe` `reschedule template child
  used-template` (ghost parent `e76`). Now green.

## Confirmed — listed for humans (not fixed)

### A. Other listed items (lower confidence / dead code / engine notes)
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

### B. Deferred / not fully reviewed
- Sync edges: `presence.cljs`, `transport.cljs`, `asset_db_listener.cljs`,
  `large_title.cljs` — budget exhausted after `sync_apply`/`sync_client`.
- `worker_core` adapter drops `errors_humanized` on the error path.

## Verified faithful (spot-checked, no divergence)
- `entity_dispatch_key`/`page?` tag-based dispatch — matches cljs.
- `qualified_schema` Keyword→String adapter — correct.
- `property_value_tx_m` transient String handling — correct.
- `journal_page`/`journal_page_or_title`/`page_ref_for`/`variable-rules`
  (`outliner_template.ml:41-136` vs `template.cljs:60-112`) — pure
  query-or-title, no journal creation; confirmed NOT the source of issue 16.
- `insert-tag-templates` structure (`worker_pipeline.ml:136-327` vs
  `pipeline.cljs:93-160`) — `tag->templates`, `raw-template-blocks`,
  `tag-additions` group-by-e, `insert-blocks {:sibling? false :keep-uuid?
  journal-template?}` — faithful; the only gap was the engine eid shift
  (issue 16).

## Test status
- `dune build` — green.
- `dune runtest` — fully green (0 failures); the previously tolerated
  `test_db_native` engine-owned failure is gone after the engine fixes.
- `test_pipeline_native.exe` — green (previously `temp-inner-mutations
  canonical revision` → issue 15 and `reschedule template child
  used-template` → issue 16).
- No test source was modified to work around either issue.
