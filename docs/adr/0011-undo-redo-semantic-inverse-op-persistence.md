# ADR 0011: Undo/Redo Semantic Inverse-Op Persistence and Local-Op Referenced UI History

Date: 2026-03-21
Status: Proposed

## Context
ADR 0010 deliberately classified undo and redo as canonical `:transact` actions.

That choice kept pending-row persistence simple, but it also preserved undo and redo as raw datom replay rather than preserving their intent.

That tradeoff is now the main weakness in the sync rebase model.

During client rebase, pending local actions are reversed, remote txs are applied, and then pending local actions are replayed.

That architecture works well when the persisted action is a semantic op such as `:save-block`, `:insert-blocks`, or `:move-blocks`.

It works poorly when the persisted action is a raw undo or redo tx payload because the replay logic can no longer distinguish commutative remote updates from true semantic conflicts.

The current undo/redo design also duplicates DB history across two places.

The main thread owns the undo and redo stacks because it stores UI state such as route state, editor cursor, and focus context.

At the same time, the worker already persists local DB actions in client-ops storage with a stable `tx-id`.

Those two histories are related but not unified.

As a result, sync rebase, undo/redo, and pending local action persistence can drift apart.

The user action identity is already represented in the worker by `:db-sync/tx-id`, but the UI undo stack still stores the DB tx payload itself instead of referencing that persisted action.

This ADR defines a plan to make the client-op row the source of truth for DB history while keeping the main thread as the source of truth for UI state.

Constraints:
- The main thread must continue to own UI-only undo state.
- The sync wire protocol should remain unchanged.
- Existing persisted pending rows without semantic metadata are intentionally out of scope for this change.
- Rebase should continue to preserve one logical pending row as one user action.
- The design must preserve redo, not just undo.

Related ADRs:
- Builds on ADR 0002.
- Builds on ADR 0010.
- Supersedes ADR 0010 decision 6, which treated undo/redo as canonical `:transact`.

## Problem Summary
The current model has three tightly coupled problems.

First, undo and redo are persisted as raw tx replay.

That makes rebase unable to reason about their semantics.

Second, the undo stack on the main thread stores DB payloads directly instead of referencing the persisted local action row in worker storage.

That means the UI history and worker history are not guaranteed to stay aligned.

Third, the current worker pending-row schema persists forward tx data and reverse tx data, but it does not persist both semantic forward ops and semantic inverse ops as first-class action metadata.

That prevents robust rebase and robust redo from using the same action identity.

The result is that a benign remote update such as a title edit can still force undo/redo to fall back to raw replay, which is unnecessarily lossy and much harder to classify correctly.

## Decision
1. The worker client-op row identified by `:db-sync/tx-id` becomes the source of truth for DB undo/redo history.
2. The main-thread undo/redo stacks will store UI state plus a reference to that worker action row, not the DB tx payload itself.
3. New client-op rows will persist both forward semantic outliner ops and inverse semantic outliner ops.
4. Redo will replay the persisted forward semantic ops for the referenced action row.
5. Undo will replay the persisted inverse semantic ops for the referenced action row.
6. New rebase logic will use semantic forward or inverse ops for new undo/redo-backed action rows instead of raw datom replay.
7. Existing `normalized-tx-data` and `reversed-tx-data` fields remain temporarily for debugging, validation, and controlled cleanup, but they will not define replay behavior for the new undo/redo architecture.
8. The logical `tx-id` remains stable across rebase rewrites so that main-thread stack entries do not break when the worker rewrites the row contents.
9. Undo/redo rows that cannot be represented with semantic inverse ops are unsupported until a semantic representation is added explicitly.

## Target Architecture
The architecture separates UI history from DB history while keeping both linked through one stable action identifier.

```text
+-------------------+          tx-id           +----------------------------+
| Main thread       | -----------------------> | Worker client-ops storage |
| undo/redo stack   |                          | one row per logical action |
|                   | <----------------------- | stable tx-id              |
| UI state          |      action result       | forward semantic ops       |
| editor cursor     |                          | inverse semantic ops       |
| route/sidebar     |                          | normalized tx data         |
+-------------------+                          | reverse tx data (legacy)   |
                                               +----------------------------+
                                                          |
                                                          v
                                               +----------------------------+
                                               | Sync rebase + upload       |
                                               | replay by semantic ops     |
                                               +----------------------------+
```

The main thread continues to own UI-only history because the worker should not become responsible for route or editor selection state.

The worker becomes responsible for DB action identity and replay semantics because that is the same place that already owns pending local action persistence, sync upload, and rebase.

## Data Model Changes
The client-op row needs to distinguish between the identity of a logical action and the concrete tx-data that happened to be generated on the current device revision.

The row should keep the existing logical `tx-id`.

The row should add explicit semantic operation fields for both directions.

Recommended schema additions:

| Field | Purpose |
| --- | --- |
| `:db-sync/forward-outliner-ops` | Canonical semantic ops that reapply the action. |
| `:db-sync/inverse-outliner-ops` | Canonical semantic ops that undo the action. |
| `:db-sync/history-kind` | Distinguishes regular action rows from specialized worker history rows if needed. |
| `:db-sync/source-tx-id` | Optional link from an undo/redo execution row back to the original action row during migration. |
| `:db-sync/semantic-persistence-version` | Marks rows that are safe for semantic replay. |

The existing fields should remain during migration:

| Existing field | Migration role |
| --- | --- |
| `:db-sync/normalized-tx-data` | Validation reference and emergency cleanup aid. |
| `:db-sync/reversed-tx-data` | Local safety checks and controlled cleanup aid. |
| `:db-sync/outliner-op` | Existing summary/debug field. |
| `:db-sync/outliner-ops` | Can be folded into `forward-outliner-ops` once migration is complete. |

The main-thread undo stack entry shape should change accordingly.

The DB portion of a stack entry should become a small reference object instead of an embedded tx payload.

Recommended main-thread DB history payload:

| Field | Purpose |
| --- | --- |
| `:local-op-tx-id` | Stable reference to worker client-op row. |
| `:history-direction` | `:forward` in undo stack and `:inverse` in redo stack if needed for UI bookkeeping. |
| `:history-version` | Allows invalidating stale stack entries across releases. |

The main-thread stack entry should continue to store editor cursor and UI route state as it does today.

## Semantic Persistence Rules
The plan depends on persisting semantic inverse ops instead of reconstructing them later from raw datoms.

That means the inverse ops must be created at the time a local action is first recorded into undo history.

The worker should never have to guess the inverse of an already-lost user intent from only tx-data if the action was produced by a known canonical outliner op.

The persistence rules are:

1. A regular local action row persists canonical forward ops.
2. The undo stack entry points at that action row by `tx-id`.
3. Undo execution uses the inverse semantic ops stored on the referenced row.
4. Redo execution uses the forward semantic ops stored on the referenced row.
5. If a row does not have semantic inverse ops, it must not enter the semantic rebase path.

## Canonical Op Surface
This ADR does not require every outliner op to become replay-visible immediately.

It does require the canonical replay-visible surface for undo/redo to be explicit and versioned.

Recommended canonical surface for forward and inverse persistence:
- `:save-block`
- `:insert-blocks`
- `:move-blocks`
- `:delete-blocks`
- `:set-block-property`
- `:remove-block-property`
- `:batch-set-property`
- `:batch-remove-property`
- `:delete-property-value`
- `:batch-delete-property-value`
- `:create-property-text-block`
- `:upsert-closed-value`
- `:delete-closed-value`
- `:add-existing-values-to-closed-values`
- `:create-page`
- `:delete-page`
- `:rename-page`

If an action cannot be expressed in that surface with a safe inverse, it should remain unsupported until a semantic representation is added deliberately.

That is preferable to reclassifying it as safe raw replay by accident.

## Inverse Op Generation Strategy
Inverse semantic ops should be created from the original action metadata and the pre-action DB state, not by reverse-engineering datoms after the fact.

The current main-thread undo history already retains the original tx meta, which includes `:outliner-ops` for many actions.

That existing signal should be preserved and extended rather than discarded.

The generation strategy should be:

1. Start from the original canonical forward ops attached to the local action.
2. Resolve all entity references to stable ids at persistence time.
3. Build inverse canonical ops while the pre-action DB state is still available.
4. Persist both directions on the action row under the same `tx-id`.

Representative inverse mappings:

| Forward op | Inverse op strategy |
| --- | --- |
| `:save-block` | Persist a `:save-block` payload built from pre-action block content and relevant pre-action refs. |
| `:insert-blocks` | Persist `:delete-blocks` for the created roots, or a more specific inverse if a safer canonical form exists. |
| `:move-blocks` | Persist `:move-blocks` back to the pre-action target with stable target id and structural opts. |
| `:delete-blocks` | Persist a hard-delete inverse only if block recreation is represented explicitly. Recycle-based restoration is no longer part of block deletion semantics. |
| `:set-block-property` | Persist `:set-block-property` or `:remove-block-property` depending on whether the property existed before the action. |
| `:batch-set-property` | Persist a batch inverse that restores prior values per block rather than a single blind batch overwrite. |
| `:create-page` | Persist `:delete-page` or a page retract inverse depending on page type. |
| `:delete-page` | Persist `:create-page` plus restoration of prior page content and relationships, or represent page restoration as a dedicated canonical op. |

The plan does not require every mapping to be implemented in one patch.

It does require the migration plan to make unsupported actions explicit so that they cannot silently flow into the new architecture.

## Why `tx-id` Must Be the Main-Thread DB History Reference
The UI stack needs a stable identifier for the DB action because that action may be:
- pending locally and not yet synced
- rebased by the worker
- acknowledged by the server
- rewritten during local compaction
- invalidated because the worker dropped it as unreplayable

If the main thread stores raw tx-data instead of `tx-id`, the UI stack and worker pending history can diverge.

If the main thread stores `tx-id`, the worker can rewrite the row contents while preserving logical action identity.

That makes the worker free to update the concrete replay payload during rebase without breaking the main-thread history pointer.

The worker must therefore treat `tx-id` as logical action identity rather than as a disposable row key.

## Cutover Plan
This change intentionally uses a strict cutover instead of a backward-compatible migration for old pending rows.

Cutover rules:

1. Existing pending rows without semantic persistence fields are cleared or dropped at startup.
2. Existing main-thread stack entries without `tx-id` are invalid after the cutover.
3. Old-format in-memory history is not preserved across the change.
4. New rows must always be written with the new semantic fields once the feature flag is enabled.

## Implementation Plan
### Phase 1. Add action-identity and semantic fields to client-op storage.
- Update `/Users/tiensonqin/Codes/projects/logseq/web/src/main/frontend/worker/sync/client_op.cljs` schema for forward and inverse semantic ops plus version metadata.
- Keep existing fields intact.
- Ensure `tx-id` remains stable when a pending row is rewritten after rebase.

### Phase 2. Make the worker action row the source of truth for DB history.
- Update `/Users/tiensonqin/Codes/projects/logseq/web/src/main/frontend/worker/sync/apply_txs.cljs` so local action persistence writes both directions when available.
- Split the meaning of existing `:db-sync/outliner-ops` from the new explicit forward and inverse fields rather than overloading one field for two roles.
- Preserve current `normalized-tx-data` and `reversed-tx-data` during migration.

### Phase 3. Change main-thread undo stack payloads from embedded tx data to `tx-id` references.
- Update `/Users/tiensonqin/Codes/projects/logseq/web/src/main/frontend/undo_redo.cljs` so stack entries keep UI state and worker action references instead of DB tx payloads.
- Keep cursor and route state on the main thread.
- Remove the assumption that main-thread history owns the DB replay payload.

### Phase 4. Add a worker API for undo and redo execution by `tx-id`.
- Introduce a worker-facing command that resolves the client-op row by `tx-id`.
- Undo execution should replay `inverse-outliner-ops`.
- Redo execution should replay `forward-outliner-ops`.
- The command should return enough result metadata for the main thread to restore cursor and UI state after the worker confirms DB success.

### Phase 5. Replace raw undo/redo sync persistence with semantic persistence.
- Stop classifying new undo/redo executions as canonical raw `:transact` in `/Users/tiensonqin/Codes/projects/logseq/web/src/main/frontend/worker/sync/apply_txs.cljs`.
- Instead, persist their semantic forward and inverse operations under the same logical action identity.
- Remove the old undo/redo raw replay path for pending-row persistence instead of keeping a compatibility branch.

### Phase 6. Extend rebase to use semantic inverse and forward ops for undo/redo rows.
- In `/Users/tiensonqin/Codes/projects/logseq/web/src/main/frontend/worker/sync/apply_txs.cljs`, route undo/redo rows through semantic replay only.
- Preserve one-row-per-user-action atomicity.
- If any op in a row becomes invalid, drop or quarantine the whole row rather than partially replaying it.

### Phase 7. Add explicit invalidation rules for main-thread stack entries.
- If the worker drops or quarantines a referenced action row, the main-thread stack entry that points at that `tx-id` must be invalidated.
- Add a worker-to-main-thread signal so the UI can clear stale history references without guessing.
- Avoid silent dangling `tx-id` references in the UI stack.

### Phase 8. Add compaction and cleanup rules.
- Decide when an acknowledged action row can be compacted while still remaining undoable.
- If compaction rewrites stored payloads, preserve `tx-id`.
- If compaction removes a row, invalidate any stack references to it first.

## Required Code Areas
The following files are expected to change.

| File | Responsibility |
| --- | --- |
| `/Users/tiensonqin/Codes/projects/logseq/web/src/main/frontend/undo_redo.cljs` | Change stack payloads to `tx-id` references and route DB replay to worker by action id. |
| `/Users/tiensonqin/Codes/projects/logseq/web/src/main/frontend/handler/history.cljs` | Keep UI restore flow but consume worker-driven undo/redo result metadata. |
| `/Users/tiensonqin/Codes/projects/logseq/web/src/main/frontend/worker/sync/client_op.cljs` | Extend client-op schema with semantic forward and inverse fields plus version metadata. |
| `/Users/tiensonqin/Codes/projects/logseq/web/src/main/frontend/worker/sync/apply_txs.cljs` | Persist semantic undo/redo ops, keep stable `tx-id`, and use semantic replay in rebase. |
| `/Users/tiensonqin/Codes/projects/logseq/web/deps/outliner/src/logseq/outliner/op.cljs` | Reuse canonical op shapes and extend replay-visible surface if new canonical ops are introduced. |
| `/Users/tiensonqin/Codes/projects/logseq/web/deps/outliner/src/logseq/outliner/recycle.cljs` | Provide a replay-safe restoration entrypoint if `:restore-recycled` becomes canonical. |
| `/Users/tiensonqin/Codes/projects/logseq/web/src/test/frontend/undo_redo_test.cljs` | Cover `tx-id`-referenced history behavior and main-thread invalidation. |
| `/Users/tiensonqin/Codes/projects/logseq/web/src/test/frontend/worker/db_sync_test.cljs` | Cover semantic persistence and rebase of undo/redo action rows. |
| `/Users/tiensonqin/Codes/projects/logseq/web/src/test/frontend/worker/db_sync_sim_test.cljs` | Cover multi-client rebase scenarios where remote txs commute or conflict with undo/redo. |

## Edge Cases That Must Be Designed Explicitly
### Remote non-conflicting updates.
A remote title update on an unrelated block should not invalidate a local undo stack entry.

### Remote updates on the same entity but different attrs.
The design should allow semantic replay when the attrs commute and reject it when they do not.

### Structural conflicts.
Parent, page, order, delete, recycle, and missing-ref conflicts must invalidate the whole action row, not a subset of its ops.

### Undo of a batch action.
One logical batch action should remain one `tx-id` and should not split into multiple undoable rows during persistence or rebase.

### Redo after rebase.
Redo must continue to point at the same action identity even if the worker rewrote the row payloads during remote rebase.

### Session boundary.
Main-thread stacks are in-memory only today.

That remains acceptable, but the new `tx-id` reference model must not assume the stack survives app restart unless a later ADR decides to persist it.

### Unsupported inverse mappings.
An unsupported op must be explicit and traceable.

It must not silently fall back to safe-looking semantic replay if it is actually raw replay.

### Old pending rows.
Existing rows without semantic fields are intentionally not supported after the cutover.

They should be cleared rather than replayed.

## Risks
The largest risk is trying to migrate everything at once.

Undo/redo touches the main thread, the worker, client-op persistence, and rebase logic.

The plan therefore intentionally stages the work so that logical action identity and schema changes land before the main-thread stack rewrite and before the semantic rebase cutover.

Another risk is under-specifying inverse mappings for high-level actions such as delete-page.

Those mappings should be treated as explicit product decisions, not left to raw tx fallback by accident.

Another risk is user-visible loss of old pending rows during the cutover.

That tradeoff is accepted because preserving old raw replay rows would preserve the exact failure mode this ADR is intended to remove.

## Verification Plan
Verification must cover both behavior and migration safety.

Required coverage:
- main-thread undo stack entry stores `tx-id` plus UI state, not raw DB tx payload
- worker persists semantic forward and inverse ops on new local action rows
- undo executes by `tx-id` and replays inverse semantic ops
- redo executes by `tx-id` and replays forward semantic ops
- new undo/redo rows no longer persist as canonical raw `:transact`
- rebase preserves logical `tx-id` while rewriting row payloads
- benign remote updates continue to allow undo/redo replay
- structural conflicts invalidate the whole referenced action row
- dropped or quarantined worker rows invalidate corresponding UI history entries
- old rows without semantic fields are cleared and do not replay

Targeted commands once implementation begins:
- `bb dev:test -v frontend.undo-redo-test`
- `bb dev:test -v frontend.worker.db-sync-test`
- `bb dev:test -v frontend.worker.db-sync-sim-test`

## Consequences
Positive consequences:
- Undo/redo DB history and sync pending history converge on one logical action model.
- Rebase can reason about intent instead of replaying raw datoms for new undo/redo rows.
- The main thread keeps ownership of UI-only state without also becoming the long-term store of DB replay payloads.
- `tx-id` becomes a durable action identity that can survive rebase rewrites.

Negative consequences:
- The worker schema and the main-thread undo model both change at the same time.
- Several inverse-op mappings require explicit product and implementation decisions.
- The cutover is intentionally strict and may discard old pending rows that cannot satisfy the new semantic contract.

## Follow-up Notes
This ADR intentionally does not specify the final retention policy for acknowledged action rows.

It only requires that action-row lifetime be compatible with undo/redo stack references.

If future work decides to persist the UI stack across restarts, that should be handled in a separate ADR after this action-identity model is in place.
