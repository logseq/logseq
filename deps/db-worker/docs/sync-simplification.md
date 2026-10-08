# Simplifying db-sync: from state-re-interpreting gates to journal-truth

Status: design exploration. No code changes accompany this document.

Scope: the OCaml db-worker sync layer (`deps/db-worker/lib/sync_*.ml`,
`db_sync_tx_sanitize.ml`) and its ClojureScript reference implementation
(`src/main/frontend/worker/` on `master`, `deps/db-sync` for the server).
The chaos harness is `deps/db-worker/test/native/test_db_sync_sim_native.ml`.

## 1. Executive summary

The sync layer's persistent complexity does not come from the pending model
itself — the two-conn split (durable `server_conn` = confirmed journal prefix;
display conn = server image + pending overlay) is already the right shape. It
comes from **~20 transformation sites where pull, confirm, unapply, and replay
re-derive journaled-or-confirmed data using the client's transient local
view** instead of the wire data. Every one of those sites is a divergence
source: the same journaled tx produces different results on different clients
depending on when it is applied and what else the client happens to have
pending.

The enabling observation that makes deep simplification possible: **the server
journal already contains fully-derived datoms**. On the server
(`deps/db-sync/src/logseq/db_sync/storage.cljs`, `append-tx-for-tx-report`),
each `tx_log` row stores `db-normalize/normalize-tx-data db-after db-before` of
the **post-transact tx-report** — i.e. after `tx-sanitize/sanitize-tx`, after
descendant-cascade expansion, after block/page fixups, after property-value
retract derivation, with all tempids resolved to concrete eids. A client whose
`server_conn` is a strict journal prefix can apply `tx-data` verbatim and is
guaranteed — by induction over journal order — to hold exactly the server's
image. Every gate the client currently re-runs on that data is redundant at
best and divergent at worst.

Proposals, in recommended order:

- **A. Verbatim pull** — pull applies journaled `tx-data` with ref resolution
  only; delete the pull-side `sanitize_tx`, `rewrite_missing_uuid_refs`, and
  stale-add drops. Preserves every chaos invariant by construction.
- **B. Confirm = bookkeeping + journal echo** — stop re-deriving own txs at
  confirm time; pull the contiguous own journal window that `tx/batch/ok`
  reports and apply it verbatim. The chaos harness already models this.
- **C. Display = server + verbatim pending overlay** — pending entries apply
  their *stored* normalized `tx` verbatim; semantic op re-execution survives
  only as upload-time rebase. This deletes unapply-on-restart, the
  `remote_deleted`/`remote_asserted`/`remote_retracted` sets, and the
  phantom/stub/stale-restore sweeps.
- **D. (Future) tombstone deletes** — replace entity retraction with a
  journaled `deleted-at`-style attr. Attractive but not required for A–C.
- **E. (Rejected) op-CRDT / per-entity LWW** — the journal already *is* a
  totally ordered op log; a CRDT layer adds machinery without removing any.
- **F. (Cheap adjunct) snapshot+replay self-heal** — on checksum mismatch,
  rebuild `server_conn` from snapshot + journal prefix instead of logging and
  continuing diverged.

Estimated removable divergence surface: ~2,100 lines of gate machinery in
`sync_replay.ml`/`sync_apply.ml`/`db_sync_tx_sanitize.ml`, plus the
`remote_*` set plumbing in `sync_state.ml`.

What is **load-bearing** and must stay: the persisted pending queue (offline
editing is the product), the two-conn split, upload-time sanitize (it shapes
the wire so the server accepts it — a different job from state derivation),
conflict-UX detection, E2EE, snapshot download, undo history, and the
display-only `fix_tx` dup-order repair.

## 2. Current architecture

```
author op
   │  persist_local_tx: emit report datoms → normalize_tx_data
   │  → reverse_tx_data → local_tx_entry {tx, reversed_tx,
   │     forward/inverse_outliner_ops, pending=1}
   ▼
datascript_conn (display) = server_conn image + pending overlay
   │
   │ upload: prepare_upload_tx_entries → sanitize_pending_tx_refs
   │         → drop_cycle_parent_edges → tx/batch → server
   ▼
server: sanitize_tx(op-keyed flags) → transact → journal post-report
        datoms at t (tx_log.t)
   │
   │ pull/ok: fetch-tx-since → {t, tx(transit normalized datoms), outliner-op}
   ▼
client pull: decrypt? → sanitize_tx(again) → rewrite_missing_uuid_refs
        → resolve_temp_id → drop_stale_adds → transact on server_conn
   │   + remote_deleted fold + record_remote_asserted
   │   + remote_sync_conflicts (display-keyed UX)
   ▼
rebuild_display / restart: split_off_server_if_remote →
        unapply_persisted_pending_txs → replay_pending_txs
        (semantic op re-execution) → fix_tx → listeners
   │
   │ tx/batch/ok: confirm_pending_txs (uploaded bytes OR orphan
   │         re-derivation) → mark_pending_txs_false → local_tx bump
   ▼
checksum listener on server_conn vs remote_checksum
```

Key state (`sync_state.ml`):

| State | Role | Lifetime |
|---|---|---|
| `server_conns` | confirmed journal-prefix image | per repo, durable |
| `datascript_conn` | display = server + pending | rebuilt per pull/confirm/restart |
| `client_ops_conns` | sqlite: `local_tx_entry` pending rows, local_tx, checksum | durable per repo |
| `remote_deleted_uuids` | uuids seen retractEntity'd in applied remote txs | ephemeral, rebuilt per session |
| `remote_asserted_keys` / `remote_retracted_keys` | (e,a,v)-ish keys of applied remote items | ephemeral |
| `pending_replay` flag | suppresses listeners during rebuild | transient |

The three ephemeral sets exist to answer one question — "has the server seen
a create/delete/assert for this uuid before?" — that the journal already
answers. They are rebuilt from scratch on every fresh download, which is
itself evidence they hold no information beyond the journal.

## 3. The catalog: every local-state-dependent transformation of journaled or confirmed data

Each entry: **site** — what local state it keys on → what it can diverge on →
the bug class it creates. "Keys on" lists the *transient* inputs only; inputs
that arrive on the wire (`tx-data`, `outliner-op`, `t`) are not counted.

### 3.1 Pull path (`apply_remote_txs` → `batch_transact_with_temp_conn` → `transact_remote_txs`, per journaled tx)

1. **`ingest_sanitize` / `sanitize_tx`** (`db_sync_tx_sanitize.ml:631`,
   invoked at `sync_replay.ml:1597`).
   Keys on: this conn's eid resolution, missing-positive-eid stamps,
   ignored-kv entity presence, `block/_parent` walks
   (`get_block_full_children_ids`), parent chain + page masks
   (`derive_block_page_fixups`, :299–575), `Avet` scans under property idents
   (`derive_property_value_retracts`, :587–629), encrypted-retract dedup.
   → Diverges whenever the client's apply-time base differs from the server's
   ingest-time base (other clients' interleaved txs already journaled, or the
   client skipped a window by `local_tx` bump).
   → Bug class: derived datoms differ → the journaled derived datoms
   *and* locally re-derived ones both land → duplicates, double retracts,
   wrong `block/page` fixups. The server journals the fixup *result*;
   re-deriving it client-side is pure hazard.

2. **`rewrite_missing_uuid_refs`** (`sync_replay.ml:1204–1537`).
   Keys on: entity existence in the local conn, `remote_deleted_uuids`,
   batch-scoped `stale` set (entities whose items were dropped earlier in the
   same pull batch), fixpoint `converge` loop cascading drops.
   → A `[:block/uuid u]` ref dropped because u is not-yet-known locally is
   **never re-delivered** — the journal row was consumed and dropped. The
   entity becomes a bare shell (uuid + nothing) on this client only.
   → Bug class: silent permanent divergence; uuid shells materialized to keep
   refs resolvable then orphan; cascade drops amplify a single missing ref
   into entity disappearance.

3. **`drop_stale_adds_after_remote_entity_delete`** (`sync_apply.ml:756`).
   Keys on: eid-scoped "deleted earlier in this same tx" bookkeeping. This one
   is wire-data-only (the tx's own items) — *not* a divergence source; it can
   stay or go harmlessly.

4. **`resolve_temp_id`** on journaled items.
   Keys on: local `block/uuid` → eid mapping.
   → Benign when it only resolves; harmful when callers let a failed
   resolution drop the item (see 2).

5. **`remote_deleted` fold-in** (`sync_replay.ml:1651–1659`): post-apply scan
   of raw wire items for `retractEntity`/`block-uuid` adds to grow/shrink the
   side-channel set. Keys on: cumulative local history of applied txs —
   resets to empty on fresh download, so a "deleted" entity the journal
   deleted before the client's earliest pulled `t` is invisible.
   → Bug class: same entity resurrects on one client and stays dead on
   another depending on how much journal each has seen.

6. **`record_remote_asserted`** (`sync_apply.ml:607`). Cumulative (e,a,v) key
   set + `remote_retracted` rescinds. Same lifetime/visibility problem as (5),
   and it exists only to feed unapply gates (§3.4).

7. **`remote_sync_conflicts`** (`sync_replay.ml:2896`). Keys on: display db +
   pending set. Produces `sync_conflicts` rows — UX, not state repair. Keep;
   its output is user-facing, not fed back into the journal image.

8. **`fix_tx`** (`sync_replay.ml:1144`): dup-order fixup ops computed on
   `server_conn`, refs resolved against `display_db`, fixes dropped on
   pending-deleted entities. Emitted display-only. Keys on: two different
   conns at once plus the pending set — the most state-coupled routine in the
   layer, and deliberately unjournaled (its output never reaches the server).
   → Bug class: order-key drift between clients that pulled different windows.

9. **`verify_sync_checksum`** — compares the server-conn checksum listener
   output against the server's checksum. Detection only, but today there is
   no repair path: a mismatch is logged and life continues diverged.

### 3.2 Confirm path (`confirm_pending_txs`, `sync_replay.ml:2022–2200`)

10. **Uploaded-bytes branch**: `rewrite_missing_uuid_refs ~remote_deleted:∅`
    (explicitly empty — the code comments that remote_deletes "cannot gate"
    own txs, proving the set is a poison source) + `resolve_temp_id` +
    `ingest_sanitize`.
    Keys on: `server_conn` at *client's* journal position — which lags the
    position the server sanitized at. A tx sanitized at server t=120 applied
    to a conn at t=117 derives different drops/cascades/fixups than the
    journaled row at t=120.
    → Bug class: confirmed-own-state ≠ journaled-own-state on the very client
    that authored it.

11. **Orphan/fallback branch** (pending row whose bytes are not in the last
    `upload_request` — lost-response path): `sanitize_pending_tx_refs`
    (uuid_exists on server conn; attr_live on **both** conns) +
    `rewrite_missing_uuid_refs ~remote_deleted` + `resolve_temp_id` +
    `ingest_sanitize` + `drop_cycle_parent_edges`.
    Keys on: everything in (10) plus remote_deleted, display conn liveness,
    pending attrs — five transient inputs.
    → Bug class: the worst diverger in the file; two clients confirming the
    same logical op produce different durable state.

12. Post-confirm `record_remote_asserted` + `remote_deleted` union from the
    emitted report — re-feeds the side channels from *locally applied*
    output, not from the journal.

### 3.3 Display replay path (`rebuild_display` → `replay_pending_txs`, `sync_replay.ml:1740–2013`)

13. **`replay_canonical_outliner_op`** (`sync_replay.ml:494–905`, ~410
    lines): per-op semantic re-execution — `rebase_resolve_target_and_sibling`
    (ancestor-chain walk on `db_before` + current db), sibling re-resolution,
    page-root fallback, create-page dedup by title on current db, template
    sanitize, restore-recycled re-derivation.
    Keys on: `rebase_db_before` + current display db + pending sets.
    → The same persisted op emits different datoms after every pull.
    → Bug class: the uploaded `.tx` is whatever the *last* replay resolved;
    `update_local_tx_resolved` rewrites the persisted row, so the durable
    record of "what the user did" drifts with transient state.

14. Verbatim-entry fallback inside replay: `expand_block_retracts_to_
    descendants` (re-walks `block/_parent` locally), `resolve_temp_id
    ~replay_created`, `drop_missing_block_ref_ops`.
    Keys on: local conn.
    → Bug class: delete-cascade re-expansion — the original tx deleted 3
    blocks; re-expansion on a fatter local tree retracts 5; server later
    journals the divergence.

15. `already_materialized` skip, `pending_property_attrs`,
    `references_pending_uuid` deferral — pending-set scans that reorder
    replay relative to authoring order.

16. **`sanitize_pending_tx_refs`** (`sync_apply.ml:1097–1404`, ~310 lines):
    fixpoint pass with `uuid_exists`, `attr_live` (db ∪ pending_attrs ∪
    rebase_db_before), `page_ref_of` parent fallback, deep missing-ref scans
    in collections, `created_e_keys` whole-entry failure, paired
    parent-edge-dropped cleanup.
    Keys on: *three* dbs-worth of liveness closures plus the pending set.
    → Bug class: same entry sanitized differently at upload time vs replay
    time vs confirm time — the "which tx did I actually send" ambiguity.

17. **`drop_cycle_parent_edges`** (`sync_apply.ml:1425`): drops parent adds
    closing a cycle against post-tx image; shared `kept` table across a
    batch. Keys on: the db it's evaluated against — server conn at upload,
    display conn at replay, *different results*.

18. `rebuild_display` loop (`sync_replay.ml:1950`): rebind floor + drain
    failures + re-replay until clean + synthesized jump report. The
    convergence loop exists because replay is non-deterministic over the
    pending set; verbatim overlay needs no loop.

19. **`display_db_rebind_floor`**: max_tx counter massage so the UI sees
    monotonic revision. Keep regardless — it's cheap and confined.

### 3.4 Unapply path (`unapply_persisted_pending_txs`, `sync_replay.ml:2212–2770`, ~560 lines)

Exists because pre-split code persisted forward datoms of pending txs onto
the same conn. Under the current split it is a one-shot legacy migration —
yet it carries the densest gate set in the codebase:

20. `touches_kv_item` — `logseq.kv/*` bookkeeping exempt from unapply.
21. `touches_builtin_attr` — non-`user.*` ident retraction skip (dropping a
    `:db/index` datom crashes `:avet`).
22. `is_retract_entity_item` — failed rows skip retractEntity.
23. **`stale_restores`** — a card-one restore only lands if the forward value
    is still present / attr still empty / entity still absent-and-not-
    remote-deleted. Three live-db predicates per item.
24. **`confirmed_owned_retract`** — remote_asserted membership OR live datom
    with non-unconfirmed tx stamp (`unconfirmed_tx_stamps` from stored
    normalized data). Eavt scan per item.
25. **`remote_superseded_add`** — remote_retracted membership OR card-one
    prefix scan showing a different remote-asserted live value.
26. **`stubs_of`** — materialize uuid-only stub entities so reversed adds
    resolve. Creates entities that may never exist anywhere else.
27. `drop_missing_block_ref_ops` post-unapply — another missing-ref drop.
28. **Phantom-entity sweep** — pending-created uuids whose every datom has an
    unconfirmed stamp get retractEntity'd wholesale.
29. `mark_pending_unapply_done` latch — the only piece that must outlive the
    migration window.

### 3.5 Upload prep (`prepare_upload_tx_entries`, `sync_apply.ml:1543`)

30. `sanitize_pending_tx_refs` with `uuid_available` = server conn ∪
    created-delta ∖ retracted-delta accumulated **across the batch** —
    legitimate: it shapes what the wire may legally reference, and the
    server would reject the batch otherwise. Keys on local state, but its
    output is the wire, not local state. **Keep** — this is the one place
    local-state-dependent sanitize is the *job*.
31. `drop_cycle_parent_edges ~kept` against `server_db` — same verdict.
32. Group/chunk machinery (`upload_tx_item_group_keys`,
    `cap_upload_request_tx_entries`, `merge_upload_tx_ranges`,
    `next_large_upload_request_chunk`) — preserves intra-batch dependency
    order so each chunk is self-contained for the server. Mechanism, keep.

### 3.6 Persist (authoring time — deterministic, essential)

33. `persist_local_tx`: `normalize_tx_data` + `reverse_tx_data` +
    `derive_history_outliner_ops` on the tx-report at authoring time.
    Keys on db-before/db-after of the authoring tx only — by definition the
    correct base. The stored `.tx` is normalized resolved datoms; the
    `forward_outliner_ops` column is the semantic form for rebase.

### Summary table

| Path | Transform sites | Keyed on transient local state | Essential? |
|---|---|---|---|
| Pull | 8 (1–9 above) | 7 | only ref resolution |
| Confirm | 3 (10–12) | 3 | none — journal echo replaces |
| Replay | 6 (13–19) | 5 | rebase-for-upload only |
| Unapply | 10 (20–29) | 9 | one-shot migration residue |
| Upload prep | 3 (30–32) | 2 (legitimately) | wire shaping — keep |
| Persist | 1 (33) | authoring base only | keep |

## 4. What the server's ingest actually guarantees

From `deps/db-sync` (the production Cloudflare worker):

- `apply-tx-entry!` runs `tx-sanitize/sanitize-tx` with flags keyed on the
  entry's `outliner-op` (`drop-missing-retract-ops?` for `fix`+deletes,
  `drop-ops-targeting-retracted-entities?` + `retract-touched-descendants?`
  for deletes) and transacts the sanitized data.
- `append-tx-for-tx-report` (`storage.cljs`) journals **the tx-report's
  emitted datoms**, normalized — every sanitize drop is already absent, every
  derived cascade/fixup/property-retract is already present, every tempid is
  a concrete eid, and `normalize-tx-data` rewrites them to uuid-keyed forms.
- `tx_log` rows are totally ordered by `t`; `fetch-tx-since` returns a
  contiguous ordered suffix; the checksum folds the same normalized data.
- Large txs are chunked into multiple transacts (`reduce-ordered-tx-chunks`)
  — each chunk's report journals as its own `t` row, so the journal
  linearizes them; verbatim pull needs no special case.
- `tx/batch/ok`'s `t` is the server's position *after* the batch; a client's
  own journaled rows occupy the contiguous window `(old_t, new_t]` — no other
  client's txs can interleave inside a batch (applied under one lock).

Two consequence pairs:

1. **Missing refs cannot exist in a correct journal.** Every ref target was
   present at ingest (created earlier in the journal or inside the tx), or
   the server sanitize would have dropped the item — and that drop is already
   reflected in the journaled datoms. So a client applying a strict prefix
   can never hit a genuinely missing ref. Any missing ref seen locally means
   *the prefix isn't strict* (skipped window, corrupt download) — i.e.
   fail-fast evidence, not a case to repair silently.
2. **Client-side re-sanitization can only ever *change* the answer.** The
   sanitize output is a function of the db at ingest. The client at a later
   pull has a *different* (prefix) db — re-running the function returns a
   different result which is then *wrong* relative to the journal. The only
   self-consistent value for "sanitized tx at position t" is the one the
   server already computed and journaled.

## 5. Proposals

### A. Verbatim pull — "apply journaled tx-data verbatim"

**Pull becomes**: for each `{t, tx-data, outliner-op}` in `txs`, in order:
`decrypt?` → resolve uuid-refs to local eids (never drop) → `transact` on
`server_conn` → checksum listener. Delete pull-side `sanitize_tx` (all flags),
`rewrite_missing_uuid_refs` (whole function — it exists only because pull
wasn't trusted), `drop_stale_adds_after_remote_entity_delete`,
`remote_deleted` fold, `record_remote_asserted` on this path.

**What breaks?** Nothing that was correct:

- *Missing refs that never journaled* — can't exist (§4). If one is hit, the
  conn is not a strict prefix: fail-fast / trigger resync (F), don't patch.
- *Delete cascades, block/page fixups, property-value retracts* — journaled
  already; re-derivation is the hazard, verbatim is the fix.
- *Schema/eid mismatches* — journaled items use uuid-keyed lookup refs, so
  eid mapping is pure resolution, not re-derivation.
- *E2EE* — decrypt-then-apply is unchanged.
- *db-migrate txs* — journaled `outliner-op` still supplies tx-meta (e.g.
  skip-validate) verbatim.
- *Upsert/lookup-ref semantics* — constraint: client and server datascript
  must agree on upsert rules. They already must, since confirm applies
  uploaded bytes today; verbatim pull just widens the blast radius of a
  version-skew bug from "own txs" to "all txs". Mitigation: same normalize
  pipeline both sides (already shared code in the cljs world; the OCaml port
  is 1:1).

**Invariants**: preserves all of them — pending drains (orthogonal), validate
clean (server conn only ever holds journaled output), checksum = server image
(verbatim fold), full_attr_map equality (consequence of journal equality).

### B. Confirm = bookkeeping + journal echo

Today's confirm re-derives own txs client-side *and* bumps `local_tx` past
the journaled window, so own txs are never pulled — the confirm output **is**
the client's permanent copy of its own write, and it's locally-derived. The
chaos sim already demonstrates the repair: after an ack, it pulls the own
window `[old_local_tx, remote_tx_n]` and applies the journaled form.

**Proposed**: on `tx/batch/ok` (and the partial-success arm of `tx/reject`),
mark confirmed ids pending=false (bookkeeping only — rebuild display, no
writes to `server_conn`), then issue `pull(old_local_tx)` — which now returns
the own window verbatim. `local_tx` advances only when the pull is applied.
`confirm_pending_txs`'s entire transform pipeline (both branches) deletes;
what remains is "unpend + rebuild display".

- Protocol cost: none. `fetch-tx-since` is already unfiltered and the window
  is contiguous (§4). One extra round trip per batch — or zero, if the server
  echoes the journaled rows in `tx/batch/ok` (small wire-format extension;
  optional).
- Latency: server conn reflects own write one pull later than today. If that
  matters, apply the *uploaded bytes verbatim* optimistically and let the
  echo overwrite — the uploaded form was sanitized against this exact conn
  lineage so divergence is bounded and repaired by the echo either way.
- Lost-response / orphan path disappears: a tx that never uploaded isn't in
  the journal, so it's simply never confirmed — the client re-uploads from
  the pending queue as today.

**Invariants**: checksum = server image becomes *exact* (server conn is a
pure journal fold — today confirm-written data isn't journaled-form);
validate clean; pending drains identically. The orphan-re-derivation bug
class deletes wholesale.

### C. Display = server conn + verbatim pending overlay; delete unapply and the remote_* sets

Two-conn split already exists — this finishes the job it started:

- **Overlay apply**: each pending row contributes its stored normalized `.tx`
  (resolved datoms, uuid-keyed). Display replay = resolve refs → transact.
  An entry whose refs can't resolve is *deferred* (stays pending), not failed
  — upload-time rebase (below) decides its fate. Rows that rebase can't
  salvage → `mark_failed`, same drain semantics as today.
- **Unapply deleted**: the durable server conn never receives pending datoms,
  so there is nothing to reverse-replay on restart. `unapply_persisted_
  pending_txs` shrinks to a tiny one-shot migration sweep for rows written by
  pre-split versions (the latch already exists) — ~560 lines → ~50.
- **`remote_deleted` / `remote_asserted` / `remote_retracted` deleted**: their
  consumers were confirm-fallback (gone in B) and unapply gates (gone here).
  "Did the server delete u?" is answered by the journal image itself — the
  deleted entity is simply absent from `server_conn`, identically on all
  clients.
- **Semantic replay (`replay_canonical_outliner_op`) relocates to upload
  time**: when a queued entry can't apply verbatim onto the current base —
  or at prep time for a freshest view — re-derive `.tx` from
  `forward_outliner_ops` via the existing rebase machinery and rewrite the
  row (`update_local_tx_resolved`, already exists). The ~410-line engine
  stays, but runs once per upload against the freshest server image instead
  of once per pull/restart per entry against shifting local state. Display
  between pulls shows the *stored* resolution — correct-by-construction
  relative to the last known base.
- **Restart** becomes: open server conn (already journal image) → overlay
  pending `.tx`s → done. The "pending must not grow on restart" invariant is
  preserved trivially — nothing writes to the queue.

**Costs**: rebuild is a pure fold of pending `.tx`s — strictly cheaper than
today's semantic re-execution; memory unchanged (stored forms already
persisted); rebuild frequency unchanged. The one genuinely lost behavior:
**cross-pull salvage display**. Today a moved-onto-deleted-block op re-
resolves its target on every pull, so the display can show the move "healed"
onto a live parent before upload. Under C the display shows the stored
target until upload-time rebase runs (immediately after drain-ready, on the
normal flush cadence). The user-visible delta is a display lag of seconds,
and only for ops racing remote deletes.

**Invariants**: all preserved; `pending drains` gets *more* honest (defer vs
fail is an explicit decision at one site instead of emergent from gate
interactions).

### D. Tombstone deletes (future direction — not part of A–C)

Replace `retractEntity`-based remote deletes with a journaled tombstone attr
(`logseq.property/deleted-at` already exists and the test projection already
filters on it). "Deleted" becomes data, not absence: verbatim application
lands tombstones trivially; restores are attr writes; the missing-entity
problem class evaporates; per-field retention for undo survives.

Cost: every read path must filter tombstoned entities (queries, exports,
search, UI), server ingest/schema and D1 migrations change, cljs parity
rewrite, and a data migration of existing deletes. Large surface —
recommended only as a separate decision after A–C land and the remaining
pain is measured. **Not required for the wins in §5.A–C** since the journal
already carries deletes; the current absence-model is divergent only when
clients re-interpret it.

### E. Rejected: op-CRDT / per-entity LWW

Per-entity last-writer stamps journaled by the server would make convergence
trivial — but the journal **already is** a totally ordered op log with
server-timestamped positions; LWW adds stamps to make merges order-agnostic,
which matters exactly when no total order exists. Here one exists. A CRDT
rewrite changes the wire protocol, the server, the schema, the cljs worker,
and every stored pending row — to solve a problem A–C solve by deleting
code. Full journal replay from snapshot+checkpoint (F) covers the self-heal
use case cheaply.

### F. Adjunct: journal-driven self-heal on checksum mismatch

Today a checksum mismatch is logged and ignored — the client stays diverged
indefinitely. With verbatim pull, `server_conn` is a pure function of the
journal prefix, so repair is mechanical: refetch snapshot → apply journal
suffix → recheck. Small, high-value addition independent of A–C ordering
(needs A to be meaningful).

## 6. Chaos-harness invariant mapping

| Invariant (`test_db_sync_sim_native.ml`) | A | B | C | D | E | F |
|---|---|---|---|---|---|---|
| pending drains to empty | ✓ | ✓ (unpend is bookkeeping) | ✓ (defer→upload→fail still drains) | — | — | ✓ |
| `full_attr_map` equal across conns + server | strengthened | strengthened | ✓ | — | — | repairs |
| `Db_validate.validate_db` clean | ✓ (only journaled output on server conn) | ✓ | ✓ | — | — | ✓ |
| checksum = server image | ✓ | exact (was: locally-derived) | ✓ | — | — | enforced |
| pending must not grow on restart | ✓ | ✓ | trivially ✓ | — | — | ✓ |
| no invalid tx | ✓ | ✓ | ✓ (defer-not-fail) | — | — | ✓ |

Behavioral deltas the harness will surface intentionally: entries that used
to be re-salvaged by per-pull semantic replay may sit deferred longer (then
rebase at upload); some may fail that previously healed — both drain.
`create-page` title-dedup races produce consistent duplicate titles
everywhere (server accepts verbatim), which is *more* consistent than the
current client-dependent dedup.

## 7. cljs worker parity

`src/main/frontend/worker/` (deleted on this branch, live on `master`) is the
production implementation. The honest parity story:

- **Wire protocol unchanged** — `tx/batch`, `pull/ok`, `tx/reject`, journal
  format, snapshots, checksums all identical. The server (`deps/db-sync`)
  needs *zero* changes for A/B/C (the optional own-tx echo in `tx/batch/ok`
  is additive).
- Parity therefore reduces to internal machinery: the cljs worker has the
  same gate family (the OCaml layer is a 1:1 port of it). The two workers can
  adopt A→B→C in either order per release because the observable contract —
  checksum equality, projection equality, pending drain — is what tests pin
  down, not internal path shape.
- Recommended sequencing: land A–C in the OCaml worker first (the chaos
  harness lives there and proved the bugs), then port the *deleted* gates
  out of cljs — a much easier port than adding parity to divergent
  machinery.
- Version skew between server sanitize changes and old clients is already
  managed by op-keyed flags in the journal (`outliner-op` travels with the
  row); verbatim clients read it as tx-meta only.

## 8. Comparison with mature local-first systems

| System | Model | Pending/optimistic handling | Journal truth? |
|---|---|---|---|
| ElectricSQL / Electric sync | server-authoritative shape stream → materialized local replicas | not a general offline-write model (writes go through app paths) | yes — the shape log is authoritative; client doesn't re-interpret |
| Livestore | eventlog: client events committed to a single ordered log, materialized state = fold | optimistic local commit + leader confirm; replay is pure | yes — "state = fold(events)", projection is re-derivable at will |
| Automerge (sync protocol) | op-based CRDT; peers exchange ops, no server authority | concurrent ops merge by op order, not by local filters | ops verbatim; convergence by construction |
| PowerSync / Zero-class | server queries + write-through queue | optimistic overlay + server reconcile | server decides; client applies results |
| **Logseq db-sync (target)** | server journal = post-ingest normalized datoms; client = strict-prefix fold + pending overlay | pending stored verbatim, uploaded verbatim, confirmed by journal echo | yes — A/B/C get exactly this |

The pattern shared by Electric, Livestore, and Automerge: **the replica
applies the authoritative op stream verbatim; local state lives in a
separate lane (overlay/optimistic) that never mutates the replica**. Logseq's
pending model is already structurally this — what diverges is that the
confirmed lane re-derives data instead of folding it, and the overlay lane
writes into the durable conn (necessitating unapply). A–C close precisely
those two gaps; nothing in the mature-systems comparison suggests the pending
queue itself is accidental — every system with real offline editing has an
optimistic lane.

## 9. Essential vs accidental complexity — verdict

**Essential (keep)**:

- Persisted pending queue + normalized `.tx`/`reversed_tx` capture at author
  time — offline editing *is* the product; verbatim forms are the honest
  record.
- Two-conn split — isolates confirmed truth from optimistic view.
- Upload-prep sanitize + cycle-edge + chunking — shapes legal wire txs and
  prevents server rejects; local-state-dependent *by job description*.
- Semantic op machinery — but relocated to upload-time rebase only.
- Conflict-UX detection, E2EE, snapshot download, undo history, checksum,
  `fix_tx` display-only repair (with a note: its output is divergent-by-
  design; if order-key drift matters, move fixups server-side later).

**Accidental (delete or shrink)**:

- Pull-side `sanitize_tx`, `rewrite_missing_uuid_refs`, stale-add drops,
  `remote_deleted` fold — ~500 lines, all divergence sources.
- Confirm transform pipeline (both branches) — ~180 lines → bookkeeping.
- `unapply_persisted_pending_txs` — ~560 lines → ~50-line migration sweep.
- `remote_deleted`/`remote_asserted`/`remote_retracted` sets + all
  maintenance — ~120 lines + the entire "which client saw which deletes"
  question.
- Per-pull semantic replay of pending entries — replaced by verbatim overlay;
  the engine survives only at upload rebase.
- Phantom/stub/stale-restore/`confirmed_owned`/`remote_superseded` sweeps —
  ~250 lines of unapply support, all gone with unapply.

**Migration cost estimate**: A and B are small (delete + a pull call); C is
the medium piece (overlay apply + defer rule + migration sweep + upload-time
rebase hook — all inside `sync_replay.ml`/`sync_apply.ml`); D/E are separate
decisions. No D1 schema change; no wire break; rollback = revert client code.

## 10. Questions

1. Should `tx/batch/ok` echo the journaled own-window rows (saves a round
   trip) or is the extra pull acceptable? Wire-format question for the
   server team.
2. Is the deferred-vs-failed UX for unsalvageable offline ops acceptable to
   product, or do we need an explicit "conflict pending" lane (the
   `sync_conflicts` table already exists as the reporting surface)?
3. Tombstone deletes (D): worth a separate decision doc? The `deleted-at`
   attr already exists but is not the general delete mechanism.
4. `fix_tx` dup-order repair: keep display-only, or should dup-order fixups
   be journaled by the server so all clients see one order?
