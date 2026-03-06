# ADR 0001: Undo/Redo scoped to local changes in worker sync

Date: 2026-01-28
Status: Accepted

## Context
The worker-based db-sync flow applies remote updates directly to the local DB.
Undo/redo must remain usable for the current user without replaying or reverting
server changes. The system already supports tx-meta flags (e.g., :local-tx?,
:gen-undo-ops?, :undo?, :redo?) and has conflict checks in undo logic.

We must ensure undo/redo never attempts a transaction that would result in
invalid client or server data. We also want a simple, sane model that avoids
tracking per-remote update history.

Constraints and goals:
- No server echo of the user's own txs back to the same client.
- Best effort undo: if conflicts make an undo unsafe, skip it and keep data
  valid (never force invalid data).
- Remote updates must not create undo history.
- Local updates must create undo history as before.

## Decision
1) Only local txs may generate undo/redo ops. A tx is local if and only if
   tx-meta contains :local-tx? true.
2) All remote/apply/rebase/import paths must set :local-tx? false and
   :gen-undo-ops? false.
3) Undo/redo will be "best effort": if reversing a tx would violate invariants
   (e.g., moved block, deleted parent, remaining children), the undo op is
   dropped and history is cleared for that repo to prevent invalid data.

This keeps undo/redo stable and ensures remote updates never appear in the
user's undo stack.

## Architecture
### Source of truth for origin
- :local-tx? is the sole origin flag.
- Local changes (UI/outliner ops) attach :local-tx? true at the time of
  submission to the worker.
- Remote changes (db-sync apply-remote, rtc remote update, snapshot import) set
  :local-tx? false and :gen-undo-ops? false.

### Undo/redo recording
- Undo history is recorded only when tx-meta has :local-tx? true.
- Additional existing gates remain: :outliner-op is present, :gen-undo-ops?
  is not false, and :create-today-journal? is not true.
- Redo stack is cleared on any new local undo-recorded op (existing behavior).

### Undo/redo execution safety
- Reverse datoms are computed from original tx-data.
- Conflict detection remains in place (moved blocks, deleted parents, children
  still exist). These are treated as safe failures for best-effort undo.
- If a conflict is detected or reverse-tx is empty, the undo op is dropped and
  history cleared for that repo to avoid invalid transacts.
- Undo/redo execution uses tx-meta flags :undo?/:redo? and :gen-undo-ops? false
  to avoid recursive undo generation.

## Consequences
- Undo/redo only affects user-originated changes, never server updates.
- In rare cases, undo may be skipped after a remote conflict, but the database
  remains valid.
- The model stays simple: no remote history tracking or per-entity versioning.

## Plan
1) Confirm the origin flag path
   - Verify all local transact entry points set :local-tx? true
     (e.g., frontend.db.transact/transact, apply-outliner-ops).
   - Verify all remote/apply/rebase/import paths set :local-tx? false and
     :gen-undo-ops? false (db-sync apply-remote, rtc remote updates,
     snapshot import, db restore).

2) Gate undo generation on :local-tx?
   - Update frontend.undo-redo/gen-undo-ops! to require :local-tx? true in
     tx-meta in addition to existing checks.

3) Enforce best-effort safety
   - On conflict (moved block, deleted parent, remaining children) or on
     missing reverse tx data, drop the undo op and clear history for repo.

4) Documentation
   - Update relevant internal docs or comments near undo/redo about the origin
     flag and best-effort semantics.

## Test Scenarios (Manual)
1) Local change only
   - Create a block, undo, redo.
   - Expected: undo/redo works and affects only local changes.

2) Remote change only
   - Receive a server update that modifies a block.
   - Expected: undo stack is unchanged; undo does not revert remote update.

3) Local change after remote update
   - Remote updates a block; user edits same block; undo.
   - Expected: undo reverts only the user's edit; remote update remains.

4) Remote delete of parent before undo
   - User creates child; remote deletes parent; user tries undo.
   - Expected: undo is skipped safely; history cleared; no invalid data.

5) Remote move before undo
   - User moves block; remote moves or deletes target; user tries undo.
   - Expected: undo is skipped safely; history cleared; no invalid data.

6) Mixed local ops and remote tx batch
   - Interleave local edits and remote sync.
   - Expected: only local edits appear in undo stack; undo never produces
     invalid data.

## Open Questions
- Do we need a user-visible notification when undo is skipped due to conflicts,
  or is silent failure acceptable?
  Silent failure acceptable.
