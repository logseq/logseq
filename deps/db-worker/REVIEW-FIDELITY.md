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

---

# Pass 2 — sync edges + deferred C-list

Method: same as pass 1 — walked each cljs fn next to its OCaml port,
diffed behavior not syntax. Scope: `presence.cljs`, `transport.cljs`,
`asset_db_listener.cljs`, `large_title.cljs`, `handle_message.cljs` (e2ee
envelope + checksum/cursor paths) vs `lib/sync_*.ml`, plus all deferred
section-C items.

## Confirmed & fixed

1. **Stale ws event can kill a live reconnect — high** — commit
   `c1d78e3110`.
   - cljs: `client.cljs` calls `detach-ws-handlers!` before `.close()` in
     `stop-client!`, so a late Close event from the old socket never
     reaches `schedule-reconnect`.
   - OCaml: `runtime/melange/web_socket.ml` `addEventListener` has no
     detach equivalent, so `stop_client`/`connect` left the previous
     client's handlers live. A delayed `Close` from the superseded socket
     called `schedule_reconnect`, which could `stop`/tear down a freshly
     connected replacement client (or schedule a reconnect on top of a
     healthy one).
   - Fix: `Sync_state.client.conn_gen` bumped on stop/connect; ws event
     handlers capture the generation at install and ignore events from an
     older generation (`sync_client.ml`).
2. **`sanitize_template_block` diverged on `uuid?`/truthiness — low** —
   commit `e903eed815` (`sync_apply.ml` vs `apply_txs.cljs:1384-1400`).
   - cljs reads `(or (:block/uuid m) ...)` — any truthy value wins raw;
     `uuid?` is only checked when assoc'ing back, so a non-uuid
     `:block/uuid` (string, number) stays verbatim in the output block.
     OCaml replaced non-uuid values with a db-lookup result.
   - cljs `[:block/uuid u]` db/id form required nothing of `u`; OCaml now
     requires `Wire.Uuid` — tightened to the lookup-ref contract.
   - `nil`/`false` `:block/uuid` was treated as present (dropped the
     fallbacks cljs runs); now uses `wire_truthy`.
   - `block/uuid` was appended, producing duplicate keys; now `assoc`
     (replace) like cljs.
   - missing `:block/parent` now emits `nil` (cljs `update` always writes
     the key).
   - apply-template's `replace-empty` and keep filters used non-nil
     instead of cljs `when` truthiness (`block/uuid` = `false`/`nil`
     wrongly counted as present).
3. **Missing/nil `:t` tolerated where cljs fail-fasts — low** — commit
   `511891c532` (`sync_handle_message.ml`).
   - `tx/batch/ok` and `changed` skipped `require_non_negative` on nil
     `:t`; cljs `(require-non-negative remote-tx)` is unconditional.
   - `pull/ok` evaluated `remote_tx_n = 0` and silently skipped the body;
     cljs `(> remote-tx local-tx)` throws on nil before the branch.
4. **`format_ws_url` replaced only the first `%s` — low** — commit
   `191f3dd426` (`sync_transport.ml` vs `transport.cljs:15`).
   cljs `string/replace` replaces every occurrence.
5. **`transact-failed` logging absent — low** — commit `d4a4723e97`
   (`db_tx.ml` vs `db.cljs:185-190`). cljs `transact-sync` logs
   `transact-failed` with tx-meta + error on the catch path, gated by
   `db-sync/suppress-transact-failed-log?` and the stale-rebase
   `entity-id/missing` suppression; rethrows. OCaml propagated silently.
6. **`errors_humanized` dropped on the error path — low** — commit
   `986f183308` (`worker_core.ml` vs `db_core.cljs:1078-1091`).
   `notify-invalid-data` serializes `{:entity-map, :errors}`; the adapter
   sent only `entity-map`, so `:capture-error` consumers lose the
   humanized errors.
7. **`sort_uniq` vs cljs `distinct` ordering — low** — commits
   `e903eed815` + `99a18b8d2e` (`sync_apply.ml`,
   `sync_large_title.ml:245,254`). cljs `distinct` keeps first-occurrence
   order at `apply_txs.cljs:1209,1214` and `large_title.cljs:171,178`;
   `sort_uniq` re-sorted. Now `Sync_state.distinct_by Fun.id`.

## Items left for humans (documented, not fixed)

### P2-A. `Db_listener.main_thread_sync` unwired — **high** for melange target
- `lib/db_listener.ml:26-27`: `main_thread_sync = ref (fun _ _ _ -> ())`
  is never assigned; invoked at `:46`.
- cljs `db_listener.cljs:243-279` runs a whole post-commit pipeline:
  `main-thread-sync-result` (handler-keys selectivity,
  `publish-render-delta?` gating, `worker-pipeline/invoke-hooks` →
  `{:tx-report :affected-keys :deleted-block-uuids :deleted-assets
  :pages :blocks}`, route-candidates Task/Comment tagging,
  `report-post-commit-error!`, `log-outliner-op-perf!`) then
  `broadcast-main-thread-sync!` → `:sync-db-changes`.
- Consequence: the renderer never receives `:sync-db-changes`; UI does
  not re-render on tx-report deltas. In-process `deferred_handlers`
  still run (search/markdown mirrors) but get the raw `tx_report`
  object — this resolves the section-C "leak" worry: cljs handlers also
  receive the in-process report object (invoke-hooks wraps, not
  transforms it); the real gap is the missing pipeline + broadcast,
  not wire serialization.
- Suggested fix: port `invoke-hooks`/`publish-render-delta?`/broadcast
  or deliberately document the melange listener contract; note it does
  not affect the native/CLI target the same way.

### P2-B. `Db_tx.batch_transact` — dead AND divergent — **low**
- `lib/db_tx.ml:307-333` has no callers in `lib/`/`js_api/`; cljs
  `batch-transact!` (`db.cljs:305-353`) is also only referenced by
  `db_test.cljs`.
- OCaml re-transacts the collected datoms as a new tx; cljs synthesizes
  a `batch-final-tx-report?` report, runs `d/store` + rollback on error,
  and marks the report. If ever wired, behavior diverges (extra tx,
  wrong `tx`/`tempids`, no rollback semantics).
- Suggested fix: delete it, or port the cljs synthesized-report path
  (needs `Conn.apply_report`, already pinned).

### P2-C. Sync-edge polish (all **low**, edge-case fidelity)
- `update_latest_remote_state` (`sync_handle_message.ml:383-387`) stores
  only `Wire.String` checksums; cljs `(assoc repo remote-checksum)`
  stores any value — a nil `:checksum` clobbers the stored checksum.
- `handle_presence` (`sync_handle_message.ml:321-332`) requires
  `Wire.Uuid` user-id and String/Uuid editing-uuid; cljs passes any
  shape through to `update-user-presence!`.
- `verify_sync_checksum` warn drops the mismatch map detail (cljs logs
  the whole `mismatch-data`; OCaml logs only `repo`).
- `update_user_presence` (`sync_presence.ml:148`) guards `<> ""`; cljs
  `(and user-id* editing-block-uuid)` accepts empty strings.
- `normalize_online_users` (`sync_presence.ml:67-99`) requires
  String `username`/`name`; cljs `(or username name user-id)` accepts
  any truthy shape.
- `send` tx-id normalization (`sync_transport.ml:136-172`) converts
  `Wire.Uuid` only; cljs `(str tx-id)` stringifies any truthy value.
- `datom_to_op` (`sync_asset_db_listener.ml:8-17`) drops ops whose
  entity lacks a uuid; cljs `datom=>op` emits `{:block-uuid nil}` and
  the whole `add-asset-ops` batch is what coercion would reject — OCaml
  silently degrades instead.
- `resolve_large_title_item_eid` (`sync_large_title.ml:87-97`) accepts
  `Wire.Int` only for the `e` position; cljs `(number? e)` also accepts
  doubles. Also the cljs pattern matches only exactly-4-element vectors
  (`(nth item 0..3)`); OCaml pattern is equivalent — verified.
- `normalize_string_list` non-seq passthrough: cljs `(mapv f ids)`
  throws on non-seq; OCaml returns the value unchanged (edge — coerce
  schema rejects anyway).

### P2-D. Engine pin drift — operational
- `datascript-ocaml` was pinned at upstream `main`; upstream `c215a55`
  widened `Instant` to `int64`, breaking `ds_wire.ml` mid-session.
  Concurrent commit `debca7ea5e` ported the lib to `int64`, so the
  packages are now pinned at `#ee483e6` (upstream HEAD with `int64`
  Instant AND `apply_report`). Recommend the blueprint/maintenance pin
  to a sha rather than a moving branch.
- `test_db_native.exe test` baseline: 23 failures / 187 at pin
  `#ee483e6` (29 at `#1013dcf`), a strict subset of the pre-pass
  baseline — engine-side failures, none introduced by these changes.

---

# Pass 3 — faithful port + fix all P2 items (implemented)

## Confirmed & fixed (commits on `devin/ocaml-db-worker`)

### P2-A FIXED — main-thread sync pipeline — `b0b5f90475`
Full port of the cljs `process-committed-tx!` pipeline:
- `worker_pipeline.ml:invoke_hooks` — cljs `compute-hooks`: outliner-op
  handlers, affected-keys, deleted block uuids/assets, pages/blocks, and
  the post-hook tx-report.
- `render_delta.ml` (new) — cljs `render-delta/build`: input validation,
  membership ops (parent+order), ordered ops, per-parent children
  patches, `{:graph-id :rev :op-id :blocks :deleted :children
  :affected-keys}` delta.
- `render_affected_keys.ml` (new) — cljs `compute-affected-keys`:
  entity/property/class/status/task/source/children invalidation keys.
- `db_listener.ml` — cljs `process-committed-tx!` order:
  update-checksum → persist-local-tx (timed) → main-thread-sync-result
  (handler-keys selectivity, `publish-render-delta?` gating,
  route-candidates) → deferred listeners on the processed report →
  `:sync-db-changes` broadcast → perf/outliner-op recording keyed by
  `:ui/perf-id`. `report-post-commit-error!` posts `:capture-error`.

### P2-B FIXED — `batch_transact` cljs semantics — `a6871b6df3`
Rewritten to cljs `batch-transact!`: inner txs run on the real conn
with `:skip-store?` + `:batch-tx-report?` meta, datoms collected via a
listen hook, one synthesized `:batch-final-tx-report?` report commits
the aggregate; error path rolls back to db-before silently (cljs
`reset!` — empty-tx-data apply_report) then re-raises.

### P2-C FIXED — all nine sync-edge divergences — `c918e7f9ba`
Checksum `Nil` clears stored checksum + full mismatch map logging;
presence accepts any user-id wire shape and truthy editing-uuid;
`normalize-online-users` `(or username name user-id)`; `send!`
stringifies any truthy tx-id; `tx/reject-field` accepts seqables and
raises on non-seqable; asset `datom->op` emits `{:block-uuid nil}`;
large-title `e` accepts all numeric wire values.

## New divergences found & fixed while activating the pipeline

Linking `Worker_pipeline` (via `invoke_hooks`) activated the previously
dead-linked `transact_pipeline`, unmasking two latent port bugs — both
engine-side-looking but actually fidelity bugs in db-worker code:

### P2-E. `remove-inline-page-class-from-title` raw attr read — `da8d4de55e`
Read `block/raw-title` as a plain attr; cljs `(:block/raw-title e)` is
an entity-plus alias falling back to `:block/title` (and journal
title). New pages without explicit raw-title got their
`block/title`/`block/name` rewritten to `""` by `toggle-page-and-block`
— broke create-namespace-pages, create-page-with-tag, and
insert-blocks-reuses-page tests. Fixed via `Ldb.raw_title`.

### P2-F. `:_reverse` lookups required `:db/index` — `da8d4de55e`
`Ldb.values` routed `:x/_attr` through the engine's `entity_attr`,
which reverse-looks-up over the AVET index and raises on unindexed
attrs (`logseq.property/template-applied-to` — the crash behind the
41-vs-23 test regression). cljs `entity-attr` does an unindexed
`-search` scan, so `Ldb.values` now scans the AEVT index for
`:_reverse` attrs — no `:db/index` requirement, cljs-identical result.

## Test status after pass 3
- `dune build` — green.
- `test_db_native.exe test` — 23 failures / 187, byte-identical to the
  `#ee483e6` baseline set (all engine-side, pre-existing). Verified by
  A/B: pipeline-active-with-bugs peaked at 41; after the P2-E/P2-F
  fixes the failing set equals the baseline exactly.

## Verified faithful (pass 2 spot-checks, no divergence)
- `handle_pull_ok` e2ee envelope: `graph_e2ee` → `ensure_graph_aes_key`
  → fail on missing key → per-tx `decrypt_tx_data` → apply →
  update-local-tx → broadcast → verify-checksum → flush, catch →
  `set_last_sync_error` — matches `handle_message.cljs:341-384`.
- `request_pull!` dedup/`pending_pull_since` min-wins semantics.
- `handle_tx_reject` validation, inflight filtering, per-tx
  success/failed handling, rollback-all fallback, ordering of
  inflight-clear/broadcast/rtc-log/fail-fast.
- `verify_sync_checksum` gating (`dev-or-test?`, ready predicates,
  mismatch compare).
- `handle_online_users` seq check + nil→[]; `handle_hello` ordering
  (require → verify → broadcast → pull → assets → log → flush).
- `update_latest_remote_state` authoritative/stale tx + max semantics
  (except the checksum note above).
- `entity_of_wire_ref` (section C): `Wire.Map`/unresolvable ref shapes
  fall through `entity_ref_of_transit` → caught → `None`, matching cljs
  `(d/entity db m)` → nil. Not a bug.
- `deferred_handlers` raw `tx_report`: cljs passes the same in-process
  report object; the gap is the unwired pipeline (P2-A), not a wire
  leak.
- `reconnect_delay_ms`, `append_token`, `coerce_ws_{client,server}_message`,
  `normalize_legacy_tx_reject`, `parse_message`, `send!` tx/batch
  normalization (except notes above) — faithful.
- `update_online_users` broadcast-on-change; `normalize_online_users`
  shape + distinct-by-user/uuid ordering.
