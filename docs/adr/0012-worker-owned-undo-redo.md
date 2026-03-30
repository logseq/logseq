# ADR 0012: Move Undo/Redo Recording and Replay to the DB Worker

Date: 2026-03-21
Status: Proposed

## Context
`frontend.undo-redo` currently runs on the main thread.

That means undo and redo recording depends on main-thread listeners observing DB
tx reports after they have already crossed the worker boundary.

This split has become a recurring source of drift:

- the worker is the source of truth for the browser Datascript DB
- the worker already persists local actions in client-op storage
- the worker already owns rebase and semantic replay
- the main thread still owns undo/redo stack mutation for DB history

That architecture forces the main thread to reconstruct DB history from a
worker-synchronized tx report instead of observing the DB change at the place
where it actually happens.

The result is fragile metadata flow.

We have already seen bugs caused by:

- `:outliner-ops` being stripped or reshaped during worker-to-main-thread sync
- undo/redo-generated tx rows overwriting the original client-op row
- semantic forward and inverse ops diverging between worker persistence and
  main-thread undo stack payloads
- special cases such as `:replace-empty-target?`, block concat, and
  `:set-block-property` depending on worker-local replay behavior anyway

The one main-thread-only input that `frontend.undo-redo` still needs is
`@state/*editor-info`.

Today that atom is read and reset on the main thread inside
`frontend.undo-redo/gen-undo-ops!`.

If undo/redo recording moves to the worker, the worker can no longer deref the
main-thread atom directly.

## Decision
1. DB undo/redo recording and replay move to the DB worker.
2. The worker becomes the only place that listens to DB tx reports for DB
   history generation.
3. The main thread remains responsible for UI-derived history inputs only:
   editor cursor/focus metadata and UI-state snapshots.
4. `@state/*editor-info` will not be read from the worker directly.
   It will be replaced by an explicit main-thread-to-worker handoff protocol.
5. The worker owns the undo stack and redo stack for DB actions and UI-adjacent
   metadata attached to those actions.
6. The main thread will invoke worker APIs for:
   - recording pending editor info
   - recording UI-only state history entries
   - undo
   - redo
   - clear history
7. The main thread will stop generating DB undo history from `:db/sync-changes`
   events.
8. The worker-owned history row should not keep a separate persisted
   `:db-sync/outliner-ops` field.
   `:db-sync/forward-outliner-ops` is the only canonical persisted forward
   semantic field.

## Rationale
The worker is already the place where all browser DB facts become real:

- local outliner ops are applied there
- remote sync txs are applied there
- pending local rows are persisted there
- semantic forward and inverse ops are canonicalized there
- rebase happens there

Undo/redo recording should therefore observe worker DB tx reports directly
instead of reconstructing them after the worker has serialized, sanitized, and
rebroadcast them.

That removes an entire class of metadata transport bugs.

It also matches ADR 0011 more closely: the worker action row is supposed to be
the source of truth for DB history. Recording DB history on the main thread is
in tension with that decision.

## Target Architecture
```text
+------------------------------+          thread-api            +---------------------------+
| Main thread                  | ----------------------------> | DB worker                  |
|                              |                               |                           |
| editor lifecycle             |  push pending editor-info     | pending editor-info store |
| route/sidebar state          |  push ui-state entries        | undo stack                |
| history handler              |  undo / redo / clear          | redo stack                |
| restore cursor + route       | <---------------------------- | DB replay + result meta   |
+------------------------------+                               +---------------------------+
```

The worker stack entry becomes the single logical history item for both:

- DB replay metadata
- UI-adjacent metadata needed after replay

Representative worker stack item:

```clojure
{:tx-id #uuid "..."
 :kind :db-action ; or :ui-state-only
 :editor-info {:block-uuid ...
               :container-id ...
               :start-pos ...
               :end-pos ...}
 :ui-state-str "...optional transit..."
 :forward-outliner-ops [...]
 :inverse-outliner-ops [...]
 :outliner-op :save-block}
```

The target row schema is therefore:

- `:db-sync/tx-id`
- `:db-sync/outliner-op`
- `:db-sync/forward-outliner-ops`
- `:db-sync/inverse-outliner-ops`
- worker-owned cursor/UI metadata as needed

It intentionally does not include a separate persisted
`:db-sync/outliner-ops`.

## `*editor-info` Handoff
The worker must not read `@state/*editor-info` directly.

That atom lives on the main thread and represents ephemeral UI state.

Instead, we will replace the implicit shared-state read with an explicit
handoff.

### Rule
The main thread owns editor-info production.
The worker owns editor-info consumption.

### Mechanism
Add a worker-side pending editor-info slot keyed by repo.

Suggested API:

- `:thread-api/undo-redo-set-pending-editor-info`
  - args: `repo`, `editor-info-or-nil`
- `:thread-api/undo-redo-record-ui-state`
  - args: `repo`, `ui-state-str`
- `:thread-api/undo-redo-undo`
  - args: `repo`
- `:thread-api/undo-redo-redo`
  - args: `repo`
- `:thread-api/undo-redo-clear-history`
  - args: `repo`

### Consumption and reset semantics
When the worker records a new local DB action into undo history:

1. read pending editor-info for the repo
2. attach it to the new stack item if present
3. clear the pending editor-info slot immediately after the stack item is
   created

This preserves the current one-shot semantics of `@state/*editor-info` without
requiring the worker to deref or mutate main-thread state directly.

### Main-thread responsibilities
The main thread should:

- capture editor-info at the same points it does today
- send the current snapshot to the worker before the local DB action is
  submitted or immediately when editor focus/cursor changes, whichever path is
  simpler and consistent
- stop relying on worker `:db/sync-changes` to retroactively capture cursor
  state

The main thread may still keep a local `*editor-info` atom for editor UI code,
but it is no longer the undo recorder’s source of truth.

## UI-State History
UI-state-only undo entries such as route/sidebar snapshots cannot be generated
by the worker from DB tx reports.

Those entries should be pushed explicitly from the main thread into the worker
history stack.

Two entry classes will therefore exist in the worker stack:

1. `:db-action`
2. `:ui-state-only`

Undo/redo execution will return enough metadata for the main thread to restore:

- route
- sidebar state
- editor cursor

The worker should not attempt to perform UI restoration itself.

## Consequences
### Positive
- DB undo/redo history is recorded at the actual DB source of truth.
- No more dependence on `:db/sync-changes` preserving semantic metadata exactly.
- Worker persistence, worker replay, and worker history all use the same action
  identity.
- Main-thread history bugs caused by tx-meta sanitization disappear.
- Undo/redo debugging becomes simpler because the worker owns the full DB
  history lifecycle.

### Negative
- The worker history stack now stores UI-adjacent metadata that originates on
  the main thread.
- New thread APIs are required.
- Main-thread editor lifecycle code must actively synchronize pending
  `editor-info`.
- The migration touches both undo/redo and worker message flow at once.

## Implementation Plan
### Phase 1. Introduce worker-owned undo/redo module
- Create a worker namespace, e.g.
  `/Users/tiensonqin/Codes/projects/logseq/web/src/main/frontend/worker/undo_redo.cljs`
- Move stack storage and DB history generation there.
- Register worker DB listener(s) against the worker Datascript conn.
- Remove persisted `:db-sync/outliner-ops` from the target worker history row
  shape instead of carrying it forward as a parallel field.

### Phase 2. Replace main-thread DB history generation
- Remove DB-history recording from
  `/Users/tiensonqin/Codes/projects/logseq/web/src/main/frontend/undo_redo.cljs`
- Keep only main-thread coordination helpers if still needed.
- Route history handler calls through worker thread APIs.

### Phase 3. Add pending editor-info handoff
- Add worker API to set pending editor-info.
- Update
  `/Users/tiensonqin/Codes/projects/logseq/web/src/main/frontend/modules/outliner/ui.cljc`
  and any direct local transact paths to send editor-info to the worker.
- Consume and clear the pending editor-info slot when a local history item is
  recorded.

### Phase 4. Move UI-state history writes to worker
- Replace `record-ui-state!` main-thread stack mutation with worker API calls.
- Keep route/sidebar serialization on the main thread.

### Phase 5. Return worker-owned undo/redo result metadata
- Worker undo/redo APIs should return:
  - `:undo?`
  - `:editor-info`
  - `:ui-state-str`
  - optional block content or replay diagnostics
- Main-thread history handler restores cursor and route from that result.

## Files Expected to Change
| File | Change |
| --- | --- |
| `/Users/tiensonqin/Codes/projects/logseq/web/src/main/frontend/undo_redo.cljs` | Remove main-thread DB listener ownership, keep only coordinator logic if still needed. |
| `/Users/tiensonqin/Codes/projects/logseq/web/src/main/frontend/handler/history.cljs` | Call worker undo/redo APIs and restore UI from returned metadata. |
| `/Users/tiensonqin/Codes/projects/logseq/web/src/main/frontend/modules/outliner/ui.cljc` | Send editor-info snapshots to the worker before local action submission. |
| `/Users/tiensonqin/Codes/projects/logseq/web/src/main/frontend/handler/editor/lifecycle.cljs` | Stop recording editor-info directly into main-thread undo stack; feed worker pending editor-info instead. |
| `/Users/tiensonqin/Codes/projects/logseq/web/src/main/frontend/worker/db_worker.cljs` | Expose worker thread APIs for pending editor-info, UI-state history, undo, redo, and clear-history. |
| `/Users/tiensonqin/Codes/projects/logseq/web/src/main/frontend/worker/db_listener.cljs` | Attach worker undo/redo recording directly to worker DB tx reports. |
| `/Users/tiensonqin/Codes/projects/logseq/web/src/main/frontend/worker/sync/client_op.cljs` | Remove `:db-sync/outliner-ops` from the target worker-owned undo/redo row model and use `:db-sync/forward-outliner-ops` instead. |
| `/Users/tiensonqin/Codes/projects/logseq/web/src/main/frontend/worker/sync/apply_txs.cljs` | Keep worker replay aligned with worker-owned history rows. |
| `/Users/tiensonqin/Codes/projects/logseq/web/src/test/frontend/undo_redo_test.cljs` | Replace main-thread DB-history expectations with coordinator/result expectations. |
| `/Users/tiensonqin/Codes/projects/logseq/web/src/test/frontend/worker/db_sync_test.cljs` | Add worker-owned history recording and replay coverage. |

## Alternatives Considered
### 1. Keep `frontend.undo-redo` on the main thread and preserve more tx-meta
Rejected.

This keeps the wrong ownership boundary.
It reduces one transport bug at a time but does not remove the architectural
duplication between main-thread history and worker DB history.

### 2. Let the worker call back into the main thread to read `@state/*editor-info`
Rejected.

That would create an implicit cross-thread read dependency around ephemeral UI
state.
It is harder to reason about than explicit handoff, and reset semantics become
ambiguous.

### 3. Keep DB history in the worker and UI history in a separate main-thread stack
Possible, but inferior to a single worker-owned stack item keyed by `tx-id`.

It still splits one logical action across two structures and reintroduces
alignment problems.

## Open Questions
1. Should pending editor-info be pushed:
   - only at transact boundaries
   - or eagerly on every cursor change with last-write-wins semantics?

Recommendation:
push at transact boundaries first.
It matches current one-shot behavior and avoids unnecessary worker chatter.

2. Should `:ui-state-only` entries live in the same stack as DB actions?

Recommendation:
yes.
One logical undo/redo stream is simpler than coordinating two stacks.

3. Do we still need `@state/*editor-info` after the migration?

Recommendation:
keep it as a UI helper until the move is complete, but stop using it as undo
history source of truth.
