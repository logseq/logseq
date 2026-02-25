# Electron Db Worker Switch Graph Implementation Plan

Goal: Fix Electron graph switching with db-worker-node so switching to a new graph never leaves the renderer bound to a stopped runtime.

Architecture: Keep db-worker runtime lifecycle in the `db-worker-runtime` path and window close path, and treat `setCurrentGraph` as window graph metadata synchronization only.

Architecture: Remove or guard the duplicate release path in `setCurrentGraph` that can stop the newly started runtime after `persist-db/<fetch-init-data` already switched the window to the new repo.

Architecture: Add regression tests for the switch order and run manual Electron smoke checks that validate runtime continuity and no stale runtime ownership after repeated switches.

Tech Stack: ClojureScript, Electron main process IPC, Promesa, db-worker-node, babashka tests.

Related: Builds on `docs/agent-guide/033-desktop-db-worker-node-backend.md`.

Related: Relates to `docs/agent-guide/034-db-worker-node-owner-process-management.md`.

## Problem statement

Current graph switching in the renderer calls `persist-db/<fetch-init-data` before `state/set-current-repo!`.

In Electron mode, `persist-db/<fetch-init-data` calls `ipc/ipc "db-worker-runtime"` and binds the window to the new repo runtime via `/Users/rcmerci/gh-repos/logseq/src/electron/electron/db_worker.cljs`.

After the runtime is already switched, `state/set-current-repo!` calls `ipc/ipc "setCurrentGraph"` from `/Users/rcmerci/gh-repos/logseq/src/main/frontend/state.cljs`.

`handle :setCurrentGraph` in `/Users/rcmerci/gh-repos/logseq/src/electron/electron/handler.cljs` currently calls `db-worker/release-window!` whenever graph path changes.

That second release runs after the window has already been rebound to the new repo, so it can stop the new runtime and make switch graph fail with downstream invoke errors.

The issue is reproducible when switching between two db graphs in one window with db-worker-node backend enabled.

The expected behavior is that switching from graph A to graph B stops graph A when needed and keeps graph B alive for immediate reads and writes.

## Current and target event sequence

```text
Current sequence.
Renderer restore graph B.
  -> persist-db/<fetch-init-data B.
  -> ipc "db-worker-runtime" B.
  -> main db-worker manager switches A -> B.
  -> state/set-current-repo! B.
  -> ipc "setCurrentGraph" B.
  -> handler calls release-window! again.
  -> B runtime may be stopped unexpectedly.

Target sequence.
Renderer restore graph B.
  -> persist-db/<fetch-init-data B.
  -> ipc "db-worker-runtime" B.
  -> main db-worker manager switches A -> B.
  -> state/set-current-repo! B.
  -> ipc "setCurrentGraph" B.
  -> handler only updates window graph path.
  -> B runtime stays available.
```

## Testing Plan

I will follow `@test-driven-development` and add failing tests before each behavior change.

I will add a failing regression test in `/Users/rcmerci/gh-repos/logseq/src/test/electron/db_worker_manager_test.cljs` that encodes the expected post-switch invariant that the new runtime remains active until explicit release on window close.

I will add a failing test in `/Users/rcmerci/gh-repos/logseq/src/test/frontend/persist_db_test.cljs` for the graph switch flow to assert runtime rebinding happens once per target repo and is not reinitialized by graph metadata sync.

I will add a focused unit test file `/Users/rcmerci/gh-repos/logseq/src/test/electron/graph_switch_flow_test.cljs` for extracted pure graph-switch decision logic so the release/no-release condition is testable without Electron GUI dependencies.

I will run focused tests after each phase and finish with `bb dev:lint-and-test`.

I will perform manual Electron smoke checks that open graph A, switch to graph B, execute thread-api reads and writes, and then switch back to graph A.

I will review changes against `@prompts/review.md` before merge.

NOTE: I will write *all* tests before I add any implementation behavior.

## Implementation plan

### Phase 1: Add failing tests that reproduce the switch-order regression.

1. Add a failing test in `/Users/rcmerci/gh-repos/logseq/src/test/electron/db_worker_manager_test.cljs` that simulates A -> B switch and asserts no stop is triggered for B before explicit release.
2. Add a failing test in `/Users/rcmerci/gh-repos/logseq/src/test/frontend/persist_db_test.cljs` for the sequence `<fetch-init-data B` followed by `set-current-repo! B`.
3. Add `/Users/rcmerci/gh-repos/logseq/src/test/electron/graph_switch_flow_test.cljs` with a failing case that `setCurrentGraph` graph-path synchronization does not request runtime release on normal switch.
4. Run `bb dev:test -v 'electron.db-worker-manager-test'` and confirm failures match the new assertions.
5. Run `bb dev:test -v 'frontend.persist-db-test'` and confirm failures match the new assertions.

### Phase 2: Extract graph switch release decision into a pure helper.

6. Add `/Users/rcmerci/gh-repos/logseq/src/electron/electron/graph_switch_flow.cljs` with a pure function that decides when runtime release is allowed during `setCurrentGraph`.
7. Keep the helper contract explicit with inputs for previous graph identity and next graph identity so race-prone implicit state is avoided.
8. Make `/Users/rcmerci/gh-repos/logseq/src/test/electron/graph_switch_flow_test.cljs` pass with minimal logic.
9. Run `bb dev:test -v 'electron.graph-switch-flow-test'` and confirm green.

### Phase 3: Update Electron `setCurrentGraph` handler to avoid stopping the new runtime.

10. Update `handle :setCurrentGraph` in `/Users/rcmerci/gh-repos/logseq/src/electron/electron/handler.cljs` to use the new pure decision helper.
11. Remove direct unconditional `db-worker/release-window!` on graph-path change from `/Users/rcmerci/gh-repos/logseq/src/electron/electron/handler.cljs`.
12. Keep window graph-path state updates in `/Users/rcmerci/gh-repos/logseq/src/electron/electron/handler.cljs` unchanged so existing window routing semantics remain stable.
13. Preserve runtime cleanup responsibility in `/Users/rcmerci/gh-repos/logseq/src/electron/electron/db_worker.cljs` and `/Users/rcmerci/gh-repos/logseq/src/electron/electron/window.cljs`.
14. Run `bb dev:test -v 'electron.graph-switch-flow-test'` and confirm green.

### Phase 4: Harden manager behavior for repeated switch calls.

15. Add a guard in `/Users/rcmerci/gh-repos/logseq/src/electron/electron/db_worker.cljs` that keeps switch idempotency for repeated `ensure-started!` calls to the same repo and window.
16. Ensure stale release operations cannot remove a window mapping for a newer repo assignment in `/Users/rcmerci/gh-repos/logseq/src/electron/electron/db_worker.cljs`.
17. Update `/Users/rcmerci/gh-repos/logseq/src/test/electron/db_worker_manager_test.cljs` assertions to cover stale-release no-op behavior.
18. Run `bb dev:test -v 'electron.db-worker-manager-test'` and confirm green.

### Phase 5: Verify renderer remote runtime rebinding contract.

19. Update `/Users/rcmerci/gh-repos/logseq/src/main/frontend/persist_db.cljs` only if needed to keep `<ensure-remote!` single-responsibility for runtime rebinding.
20. Ensure `/Users/rcmerci/gh-repos/logseq/src/main/frontend/db/restore.cljs` keeps order `<fetch-init-data` before `set-current-repo!` unchanged unless tests prove a safer order is required.
21. Extend `/Users/rcmerci/gh-repos/logseq/src/test/frontend/persist_db_test.cljs` to assert no duplicate remote stop/start on metadata-only sync.
22. Run `bb dev:test -v 'frontend.persist-db-test'` and confirm green.

### Phase 6: Add targeted diagnostics and manual smoke script.

23. Add temporary structured logs with `lambdaisland.glogi` in `/Users/rcmerci/gh-repos/logseq/src/electron/electron/db_worker.cljs` around repo switch and release decisions.
24. Add temporary structured logs in `/Users/rcmerci/gh-repos/logseq/src/electron/electron/handler.cljs` around `setCurrentGraph` branch selection.
25. Execute manual smoke flow in Electron dev mode by switching A -> B -> A and invoking read and write actions after each switch.
26. Validate no immediate invoke failures after switch and confirm runtime stays available for the active graph.
27. Remove temporary logs that are not needed for long-term maintainability.

### Phase 7: Final verification and review gate.

28. Run `bb dev:test -v 'electron.graph-switch-flow-test'`.
29. Run `bb dev:test -v 'electron.db-worker-manager-test'`.
30. Run `bb dev:test -v 'frontend.persist-db-test'`.
31. Run `bb dev:lint-and-test`.
32. Confirm each command reports `0 failures, 0 errors`.
33. Run final review checklist pass against `@prompts/review.md`.

## Edge cases

| Scenario | Expected behavior |
|---|---|
| Switch A -> B in one window where both graphs are local db graphs. | Runtime for B remains active and calls succeed immediately after switch. |
| Switch A -> B -> A quickly before all async handlers settle. | Late `setCurrentGraph` sync does not stop the currently active runtime. |
| Two windows share graph A and one window switches to graph B. | Graph A runtime remains alive for the other window and graph B runtime starts for the switching window. |
| Re-select current graph B from UI without actual graph change. | No runtime restart and no runtime release occurs. |
| Window closes right after switch to B. | Runtime release happens exactly once via close flow and does not leave stale window mapping. |
| Runtime ownership is external (`:owned? false`). | Graph switch does not attempt to stop external runtime unexpectedly. |
| Restore fails after runtime bind but before UI route redirect. | Failure handling does not silently stop the newly bound runtime unless explicit cleanup path runs. |

## Verification commands and expected outputs

```bash
bb dev:test -v 'electron.graph-switch-flow-test'
bb dev:test -v 'electron.db-worker-manager-test'
bb dev:test -v 'frontend.persist-db-test'
bb dev:lint-and-test
```

Each command should finish with `0 failures, 0 errors`.

Manual Electron switch checks should show successful read and write operations immediately after each switch.

No `db-worker invoke failed` errors should appear during normal A -> B -> A switching.

## Testing Details

The new tests verify behavior around event ordering and runtime lifecycle boundaries instead of implementation details.

The manager tests validate that stale or duplicate release operations cannot terminate the active repo runtime.

The frontend tests validate that runtime rebinding is driven by repo changes and not by metadata synchronization calls.

Manual smoke checks validate real Electron runtime behavior that unit tests cannot fully represent.

## Implementation Details

- Keep `setCurrentGraph` focused on graph-path synchronization and remove lifecycle side effects from that path.
- Keep runtime start and stop orchestration centralized in `electron.db-worker` manager APIs.
- Use a small pure helper for release decision logic so regression tests do not depend on Electron runtime modules.
- Preserve existing `db-worker-runtime` IPC contract from renderer to main process.
- Keep old graph cleanup tied to explicit switch lifecycle and window close lifecycle only.
- Validate switch behavior with both single-window and multi-window tests.
- Use `@test-driven-development` for red-green implementation order.
- Follow `@prompts/review.md` checks before merging.

## Question

Decision: On failed graph restore, keep the newly bound runtime alive for fast retry in the same window.

Decision: Do not add a short-lived debug flag for switch sequencing logs in development builds.

Decision: Add an E2E scenario in `/Users/rcmerci/gh-repos/logseq/clj-e2e` for switch graph with db-worker-node and treat it as a release gate.

---
