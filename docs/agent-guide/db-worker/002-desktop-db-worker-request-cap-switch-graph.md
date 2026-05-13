# Desktop db-worker-node Request Cap and Graph Failover Plan

Goal: Stop the Desktop app from repeatedly issuing db-worker-node requests after the db-worker-node server for the current graph has exited.

Goal: Cap failed db-worker-node request attempts for the active Desktop graph at 3 consecutive failures.

Goal: If the active graph still cannot reach its db-worker-node after 3 failed request attempts, switch the Desktop app to another graph using the same user-visible switch flow as current graph deletion.

## Background

Desktop graph persistence currently uses a remote db-worker-node runtime:

- Renderer facade: `src/main/frontend/persist_db.cljs`
  - `frontend.persist-db/<ensure-remote!` calls Electron IPC `"db-worker-runtime"` for the repo.
  - It then creates `frontend.persist-db.remote/InRemote` through `remote/start!`.
  - The remote client is cached in `remote-db`, keyed by `remote-repo`.
- Remote HTTP/SSE client: `src/main/frontend/persist_db/remote.cljs`
  - `invoke!` sends each worker API call to `POST /v1/invoke`.
  - `connect-events!` opens `GET /v1/events` and schedules reconnects after SSE errors.
- Electron main process IPC: `src/electron/electron/handler.cljs`
  - `:db-worker-runtime` delegates to `electron.db-worker/ensure-runtime!`.
  - `:setCurrentGraph` updates the Electron window graph path and releases runtime only when `graph-switch-flow` says it should.
  - `:deleteGraph` releases the graph runtime before unlinking the graph.
- Electron db-worker manager: `src/electron/electron/db_worker.cljs`
  - `ensure-started!` starts or reuses one runtime per repo and window set.
  - Cached runtimes are restarted only when `runtime-ready?` is checked during `ensure-started!`.
  - A renderer that already holds an `InRemote` client can keep calling a dead `base-url` until something explicitly clears/rebinds it.
- Shared lifecycle: `src/main/logseq/cli/server.cljs` and `src/main/logseq/db_worker/daemon.cljs`
  - Start, readiness, health checks, lock handling, stop, and version-mismatch restart are shared by CLI and Electron.

Current graph deletion already switches away from the deleted current graph:

- `src/main/frontend/handler/repo.cljs`
  - `remove-repo!` removes the repo from state.
  - If the deleted repo was the current repo, it calls `state/set-current-repo! nil`.
  - It picks the first remaining repo from `state/get-repos`.
  - It publishes `[:graph/switch graph {:persist? false}]`.
- `src/main/frontend/handler/events.cljs`
  - `:graph/switch` executes the normal persisted graph switch path through `graph-switch-on-persisted`.

The new failover behavior should reuse this graph switch path without deleting the failed graph.

## Problem statement

When the db-worker-node server for the current Desktop graph exits unexpectedly:

1. The renderer can keep the old `remote-db` client and stale `base-url`.
2. Later worker API calls keep attempting `POST /v1/invoke` against the dead server.
3. SSE can also keep scheduling reconnects while the remote client remains connected from the renderer's perspective.
4. The Desktop app logs or surfaces repeated failures instead of stopping after a bounded number of attempts.
5. The user remains on a graph that cannot serve db requests.

## Target behavior

For the active Desktop graph only:

1. Track consecutive db-worker-node request failures for the active remote runtime session.
2. Reset the failure count to 0 after any successful db-worker-node invoke for that graph. For example, if the first or second request failed but a later request succeeds before the cap is reached, the next server-unavailable failure starts again at count 1.
3. Reset the failure count when the Desktop app switches to a different graph or creates a fresh remote runtime session.
4. After the 3rd consecutive server-unavailable db-worker-node request failure for the active graph:
   - stop retrying requests for that stale remote client,
   - disconnect SSE for that stale remote client,
   - clear renderer remote runtime state,
   - release the Electron main-process runtime association for the failed graph when appropriate,
   - show a localized notification explaining that the current graph's db-worker-node is unavailable and Desktop is switching away,
   - switch to another graph through the same `:graph/switch` event path used after current graph deletion.
5. If no other graph is available:
   - clear the current repo using the same deletion-flow behavior,
   - show a localized notification explaining that the current graph's db-worker-node is unavailable and no fallback graph is available,
   - do not continue retrying the dead db-worker-node server,
   - leave the app in a no-current-graph state rather than masking the failure with a default graph.

The request cap is exactly `3` consecutive server-unavailable db-worker-node request failures per active graph session.

## Scope

In scope:

- Desktop renderer db-worker-node request failure tracking.
- db-worker-node HTTP invoke failures caused by server exit, connection refusal, network failure, or explicit server-unavailable transport/runtime errors.
- db-worker-node SSE connection failures caused by server exit, connection refusal, or network failure.
- Localized user notification after the failure cap is reached.
- Stopping the stale remote client after the cap is reached.
- Switching to another graph without deleting the failed graph.
- Unit tests for the renderer remote runtime facade and remote HTTP client behavior.
- Unit tests for any shared graph failover helper added to `frontend.handler.repo` or a nearby namespace.

Out of scope:

- CLI behavior.
- db-worker-node startup/version-mismatch restart policy in `logseq.cli.server`.
- Retrying individual worker API calls indefinitely.
- Deleting, unlinking, or mutating the failed graph's data.
- Adding backward compatibility for invalid or missing repo state.

## Design

### 1. Define a named request cap

Add a single named constant in the Desktop renderer remote-runtime layer, for example:

- File: `src/main/frontend/persist_db.cljs`
- Constant: `max-db-worker-request-failures`
- Value: `3`

Keep the cap near the code that owns the cached Desktop remote runtime state, because the cap is tied to one active graph session rather than to db-worker-node daemon startup.

### 2. Count consecutive active-graph invoke failures

Track request failures alongside `remote-db` and `remote-repo`:

- Add an atom such as `remote-request-failures` or include the counter in a small runtime state map.
- Increment it when an invoke to the active remote db-worker-node fails due to unavailable transport.
- Reset it when:
  - a db-worker-node invoke succeeds,
  - `clear-remote-runtime!` runs,
  - `<ensure-remote!` starts a new remote client,
  - the active repo changes.

The count should be repo-scoped. A late failure from graph A must not increment the counter after the active remote repo has already switched to graph B.

Recommended shape:

```clojure
{:repo repo
 :client client
 :request-failures 0
 :failover-triggered? false}
```

Using one atom with a map is safer than several independent atoms because it avoids stale async failures mutating the new graph's counter.

### 3. Wrap Desktop remote invokes at the renderer facade boundary

`frontend.persist-db.remote/invoke!` is the low-level HTTP primitive and is also unit-tested directly. The failover policy is Desktop-specific and graph-session-specific, so it should be applied in `frontend.persist-db.cljs` around the `wrapped-worker`/remote client used by Desktop.

Implementation direction:

1. Add a helper around the worker invoke function created by `remote/start!`:
   - On success, reset the active graph failure count.
   - On failure, increment the active graph failure count.
   - If the count reaches `3`, trigger graph failover exactly once.
   - Re-throw the original error so the current operation remains fail-fast.
2. Ensure protocol methods that call `protocol/<list-db`, `<unsafe-delete`, `<fetch-initial-data`, `<import-db`, etc. go through the same guarded remote client or guarded invoke path.
3. Avoid silently retrying the same failed operation after failover. The failover is a navigation action, not a hidden data-operation retry.

If guarding in `frontend.persist-db.cljs` cannot cover every `InRemote` protocol call cleanly, add an optional callback in `frontend.persist-db.remote/create-client` such as `:on-invoke-result` / `:on-invoke-failure`, then keep the Desktop failover decision in `frontend.persist-db.cljs`.

### 4. Bound SSE reconnects for stale clients

`frontend.persist-db.remote/connect-events!` currently schedules a reconnect on every SSE error while `connected?` is true.

Add one of these safeguards:

- Preferred: when the invoke failure cap triggers failover, call `remote/stop!` so `connected?` becomes false and scheduled SSE reconnects become no-ops.
- Optional extra hardening: make scheduled SSE reopen check `connected?` immediately before calling `open-sse-fn`, and add a test proving that `disconnect!` prevents a scheduled reconnect from reopening.

Product decision update: use the aggressive SSE failover policy. Count consecutive server-unavailable SSE connection failures for the active graph session through the same failure cap as db invokes. After 3 consecutive SSE connection failures, trigger the same graph failover flow as 3 consecutive invoke failures.

### 5. Reuse graph deletion's switch-away flow without deleting data

Extract or add a helper near current graph deletion logic:

- File: `src/main/frontend/handler/repo.cljs`
- Candidate helper: `switch-away-from-current-repo!`
- Inputs: failed repo url and options such as `{:reason :db-worker-request-failed}`.
- Behavior:
  1. Determine the current repo with `state/get-current-repo`.
  2. Only act when the failed repo is still the current repo.
  3. Pick the first repo from `state/get-repos` whose `:url` differs from the failed repo, matching the current deletion fallback selection rule.
  4. Call `state/set-current-repo! nil`, matching `remove-repo!` behavior.
  5. If a fallback graph exists, publish `[:graph/switch fallback-graph {:persist? false}]`.
  6. If no fallback graph exists, leave current repo nil and do not publish a switch event.

`remove-repo!` can optionally be refactored to use the same helper after it has removed the repo from state. This keeps the deletion and db-worker-failover switch behavior aligned.

Important difference from deletion:

- The failover helper must not call `state/delete-repo!`.
- The failed graph should remain visible in graph lists so the user can intentionally reopen it later.

### 6. Release stale runtime when failover triggers

When the cap is reached, release the current Desktop remote runtime before switching:

1. Call `remote/stop!` on the cached remote client to close SSE.
2. Clear renderer remote runtime state for that repo.
3. Ask the Electron main process to release the runtime association for the failed repo/window if an existing IPC path is available.

Current available paths:

- `persist-db/<close-db` closes the current remote db and calls `<stop-remote-if-current!`.
- Electron `:deleteGraph` uses `db-worker/release-repo!`, but this also unlinks the graph and must not be reused directly.
- Electron `release-window!` is currently called from window close and graph-runtime lifecycle paths.

Implementation options:

- Add a focused IPC such as `"releaseDbWorkerRuntime"` or `"releaseDbWorkerRepo"` that calls `electron.db-worker/release-repo!` without deleting the graph.
- Or add an internal renderer helper that uses existing close-db/stop paths if they fully release the runtime for the failed active repo.

Prefer one explicit IPC if current close paths leave Electron manager state pointing at the failed repo.

### 7. Avoid repeated failover loops

After failover has triggered for repo A:

- Mark the stale runtime session as `:failover-triggered? true`.
- Ignore later failures from that same stale session.
- Do not increment repo B's counter from repo A's late promises.
- Reset counters when repo B starts.

If the fallback graph's db-worker-node also exits, it gets its own 3-failure budget and can switch again using the same helper.

## Error classification

Only count server-unavailable failures. These are failures where the db-worker-node server cannot serve the request at all:

- `js/fetch` rejected because the server exited or the port refused the connection.
- transport/runtime unavailable errors from the remote client or Electron runtime path.
- malformed or missing response body from a dead/stale runtime.

Do not count app-level errors returned by a live worker. These errors should remain visible to callers and must not trigger graph failover:

- validation errors,
- graph data errors,
- permission or lock errors returned by a healthy worker,
- expected domain errors produced by application logic.

If error classification is uncertain, treat it as app-level and do not increment the request failure counter until tests prove it represents server unavailability.

## Implementation tasks

### Phase 1 — Tests for the current failure mode

1. Add tests in `src/test/frontend/persist_db_test.cljs` for Desktop active graph failure counting:
   - setup Electron runtime stubs,
   - create a current repo `graph-a` and fallback repo `graph-b`,
   - make remote invokes fail as if the db-worker-node server exited,
   - assert no switch happens after failures 1 and 2,
   - assert failure 3 triggers `[:graph/switch "graph-b" {:persist? false}]`.
2. Add a test that successful invoke resets the failure counter:
   - fail once,
   - succeed once,
   - assert the counter is reset to 0,
   - fail twice,
   - assert no failover occurs because only 2 consecutive failures happened after the success,
   - fail once more,
   - assert failover occurs on the 3rd consecutive failure after the reset.
3. Add a stale-promise test:
   - graph A failure reaches cap and triggers failover,
   - graph B starts,
   - a late graph A failure arrives,
   - assert graph B's counter is not incremented and no duplicate failover occurs.
4. Add a no-fallback test:
   - only graph A exists,
   - third failure clears current repo and does not publish `:graph/switch`.

### Phase 2 — Graph switch helper

1. Add a helper in `frontend.handler.repo` or a nearby graph lifecycle namespace to switch away from a failed current repo without deleting it.
2. Reuse the existing deletion selection semantics:
   - pick the first available graph after excluding the failed graph,
   - use `state/set-current-repo! nil`,
   - publish `[:graph/switch fallback {:persist? false}]` when fallback exists.
3. Show a localized notification when failover happens:
   - with a fallback graph: explain that the current graph's db-worker-node is unavailable and Desktop is switching to the fallback graph,
   - without a fallback graph: explain that the current graph's db-worker-node is unavailable and no other graph is available.
4. Add new i18n keys through the normal Logseq i18n workflow before adding shipped UI text.
5. Optionally refactor `remove-repo!` to call the helper after `state/delete-repo!`, as long as existing deletion tests keep passing.

### Phase 3 — Renderer failover policy

1. Replace the independent `remote-db` / `remote-repo` atoms with one coherent runtime state map, or add guarded mutation helpers that prevent stale async updates.
2. Add `max-db-worker-request-failures` with value `3`.
3. Guard active graph remote invokes:
   - reset count on success,
   - increment count on counted failure,
   - trigger failover once when count reaches 3,
   - rethrow the original error.
4. Ensure `clear-remote-runtime!`, `<stop-remote-if-current!`, and `<ensure-remote!` reset the counter.
5. Ensure `remote/stop!` is called when failover triggers so SSE disconnects.

### Phase 4 — Electron runtime release

1. Verify whether `remote/stop!` plus renderer state clearing is enough to make the next graph start correctly.
2. If Electron manager state still keeps the failed graph/window association, add a dedicated IPC handler:
   - Renderer channel: `"releaseDbWorkerRuntime"` or equivalent.
   - Main handler: calls `electron.db-worker/release-repo!` or a narrower release function.
   - Must not call `cli-common/unlink-graph!`.
3. Add tests in `src/test/electron/db_worker_manager_test.cljs` or handler-level tests to prove the release path detaches the failed repo without deleting graph data.

### Phase 5 — SSE reconnect hardening

1. Ensure `connect-events!` scheduled reconnect callbacks do nothing after `disconnect!`.
2. Add or update `src/test/frontend/persist_db/remote_test.cljs` to cover the scheduled-after-disconnect case.
3. Count consecutive server-unavailable SSE connection failures for the active graph session and trigger the same graph failover flow after the 3rd consecutive SSE failure.

## Verification plan

Run targeted tests first:

```bash
bb dev:test -v frontend.persist-db-test
bb dev:test -v frontend.persist-db.remote-test
bb dev:test -v electron.db-worker-manager-test
```

Then run the broader lint/test command before submitting implementation:

```bash
bb dev:lint-and-test
```

Manual Desktop verification:

1. Open Desktop with at least two DB graphs, `graph-a` and `graph-b`.
2. Open `graph-a`.
3. Identify and terminate the `db-worker-node` process for `graph-a`.
4. Trigger db operations from the renderer, such as loading pages or actions that call db-worker thread APIs.
5. Confirm the first two failed requests do not switch graph.
6. Confirm the third consecutive failed request switches to `graph-b` using the normal graph switch flow.
7. Confirm `graph-a` is not deleted and remains listed.
8. Confirm no repeated requests continue against the dead `graph-a` db-worker-node after failover.
9. Reopen `graph-a` intentionally and confirm it starts a fresh db-worker-node runtime.

## Acceptance criteria

- Desktop active graph db-worker-node server-unavailable invoke failures are capped at 3 consecutive failed requests.
- Any successful db-worker-node invoke before the 3rd consecutive failure resets the failure counter to 0.
- App-level errors returned by live application logic do not count toward the cap.
- After the 3rd consecutive server-unavailable failure, the Desktop app shows a localized notification and switches to another available graph through the same graph switch event path used by current graph deletion.
- If there is no other graph, Desktop shows a localized notification, current repo is cleared, and dead-runtime requests stop.
- The failed graph is not deleted or unlinked.
- Late failures from the stale graph do not affect the newly active graph.
- SSE reconnects stop after the stale remote client is disconnected.
- CLI behavior is unchanged.
- Targeted tests and `bb dev:lint-and-test` pass.

## Decisions

1. Show a localized notification after automatic graph failover or after clearing the current graph when no fallback graph exists.
2. Count only server-unavailable failures toward the 3-failure cap. App-level errors returned by live application logic do not count.
3. Use the aggressive SSE failover policy: 3 consecutive server-unavailable SSE connection failures trigger the same graph failover flow as 3 consecutive invoke failures.
4. The cap is based on consecutive failures. Any successful db-worker-node invoke before the 3rd consecutive failure resets the counter to 0.
5. Use the same fallback graph selection rule as current graph deletion: choose the first remaining graph from `state/get-repos` after excluding the failed graph.
