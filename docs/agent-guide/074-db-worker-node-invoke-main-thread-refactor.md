# db-worker-node `invoke-main-thread` Removal and Worker-Local Refactor Plan

Goal: Remove all production `invoke-main-thread` usage from db worker logic and make `db-worker-node` fully self-contained for API execution.

Goal: Refactor each current main-thread API dependency into db-worker-owned implementations that work in both Node and Browser runtimes.

Goal: For UI-dependent interactions, replace direct worker->main-thread invocation with a request/response protocol where worker sends `postMessage`, and main thread actively calls db-worker thread APIs to respond.

Goal: Enforce request isolation with `request-id` across concurrent UI requests.

Architecture: Keep runtime-specific logic behind worker platform adapters (`frontend.worker.platform`, `frontend.worker.platform.node`, `frontend.worker.platform.browser`) and keep shared logic runtime-agnostic.

Related:
- `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/state.cljs`
- `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/db_worker_node.cljs`
- `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/db_worker.cljs`
- `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/db_core.cljs`
- `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/sync/assets.cljs`
- `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/sync/auth.cljs`
- `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/sync/crypt.cljs`
- `/Users/rcmerci/gh-repos/logseq/src/main/frontend/handler/assets.cljs`
- `/Users/rcmerci/gh-repos/logseq/src/main/frontend/handler/e2ee.cljs`
- `/Users/rcmerci/gh-repos/logseq/src/main/frontend/handler/user.cljs`
- `/Users/rcmerci/gh-repos/logseq/src/main/frontend/persist_db/browser.cljs`
- `/Users/rcmerci/gh-repos/logseq/src/main/frontend/handler/worker.cljs`

## Problem statement

`db-worker-node` currently sets a main-thread stub that always rejects (`main-thread is not available in db-worker-node`).

However, shared worker modules still call `worker-state/<invoke-main-thread` for auth refresh, asset upload/download metadata, E2EE key/password operations, and search-idle checks.

This creates runtime divergence:
- Browser worker can call main-thread APIs through Comlink.
- Node daemon cannot, so behavior depends on fallback code quality or fails outright.

Target state: db worker should own all non-UI logic and only use explicit message protocol for UI interactions.

## Full inventory of current `invoke-main-thread` dependencies

| Call site | Current main-thread API | Category | Runtime risk in `db-worker-node` |
| --- | --- | --- | --- |
| `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/sync/auth.cljs` (`<resolve-ws-token`) | `:thread-api/ensure-id&access-token` | Auth/token refresh | Token refresh path may fail without worker-local refresh |
| `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/sync/assets.cljs` (`upload-remote-asset!`) | `:thread-api/rtc-upload-asset` | Asset I/O + network | Upload path depends on main-thread asset code |
| `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/sync/assets.cljs` (`download-remote-asset!`) | `:thread-api/rtc-download-asset` | Asset I/O + network | Download path depends on main-thread asset code |
| `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/sync/assets.cljs` (`request-asset-download!`) | `:thread-api/get-asset-file-metadata` | Asset metadata | Existence/checksum check depends on main thread |
| `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/sync/crypt.cljs` (`<native-save-password-text!`) | `:thread-api/native-save-e2ee-password` | Password persistence | Native keychain path unavailable in node daemon |
| `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/sync/crypt.cljs` (`<native-read-password-text`) | `:thread-api/native-get-e2ee-password` | Password persistence | Same |
| `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/sync/crypt.cljs` (`<native-delete-password-text!`) | `:thread-api/native-delete-e2ee-password` | Password persistence | Same |
| `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/sync/crypt.cljs` (`<generate-and-upload-user-rsa-key-pair!`) | `:thread-api/request-e2ee-password` | UI prompt | Requires explicit UI handshake |
| `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/sync/crypt.cljs` (`<decrypt-private-key`) | `:thread-api/decrypt-user-e2ee-private-key` | UI/session-dependent decrypt | Must be worker-local + UI fallback protocol |
| `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/sync/crypt.cljs` (`:thread-api/init-user-rsa-key-pair`) | `:thread-api/request-e2ee-password` | UI prompt | Same as above |
| `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/db_core.cljs` (`<wait-for-search-index-idle!`) | `:thread-api/input-idle?` | UI state query | Tight loop currently requires main-thread sync point |

## Design constraints and invariants

1. `db-worker-node` must never depend on main-thread APIs.
2. Shared worker code must run in both Node and Browser runtimes.
3. UI interactions must use explicit async protocol with `request-id` correlation.
4. Error shapes must remain stable (or be intentionally versioned) across transport layers.
5. Migration should be incremental with behavior-compatible phases.

## Target architecture

### 1) Remove worker-side direct main-thread invocation from business paths

Keep `frontend.worker.state/<invoke-main-thread` only as legacy infrastructure for browser compatibility during migration, then shrink/remove usage in production worker modules.

Acceptance target after migration:
- No production call sites to `<invoke-main-thread` outside temporary migration guards.
- `db-worker-node` main-thread stub remains reject-only and never hit in normal flows.

### 2) Move main-thread business logic into worker-owned modules

#### Auth refresh (`:thread-api/ensure-id&access-token`)
- Move token refresh implementation into worker sync auth module.
- Reuse current refresh token and auth state from worker state (`:auth/id-token`, `:auth/refresh-token`) that is already synchronized.
- Keep main thread responsible only for UI/session orchestration, not worker internal token lifecycle.

#### Asset operations (`:thread-api/rtc-upload-asset`, `:thread-api/rtc-download-asset`, `:thread-api/get-asset-file-metadata`)
- Introduce worker-side asset I/O + transfer module (shared, runtime-agnostic).
- Move file read/write/checksum/upload/download logic from main-thread handler into worker with platform adapter calls.
- Keep progress events emitted from worker via existing broadcast channel.

#### E2EE password storage (`native-save/get/delete`)
- Replace main-thread keychain dependency with worker platform capabilities.
- Add explicit storage abstraction in platform adapters for encrypted password persistence.
- Keep existing encrypted payload format unchanged where possible.

#### Private key decrypt (`:thread-api/decrypt-user-e2ee-private-key`)
- Make worker-local decrypt path primary.
- Request UI password only when worker-local credentials are unavailable.

### 3) UI request/response protocol (request-id isolated)

For UI-dependent operations, worker should not call main-thread thread APIs directly.

Use this flow:

```text
1) Worker needs UI input
   -> postMessage event to main thread
      {:type :db-worker/ui-request
       :request-id <uuid-v4>
       :action <keyword>
       :payload <map>
       :timeout-ms 60000}

2) Main thread handles UI action (prompt/dialog/user interaction)

3) Main thread actively calls db-worker thread API:
   :thread-api/resolve-ui-request [request-id result]
   or
   :thread-api/reject-ui-request [request-id error]

4) Worker resolves or rejects the pending promise by request-id.
```

Required worker internals:
- `*ui-requests-in-flight` map keyed by `request-id`.
- `request-id` is generated as UUID v4.
- default request timeout is `60000ms` (60s), with optional per-action override.
- timeout handling + cleanup.
- duplicate/late response protection.
- cancellation support for graph switch or worker shutdown.

Required acceptance:
- concurrent requests do not cross-resolve.
- timed-out request cannot be resolved later.
- all terminal states remove map entries.

#### UI interaction contract: headless vs interactive

The implementation uses two explicit modes instead of implicit fallback behavior.

- **Headless mode (default for `db-worker-node`/CLI):**
  - If an operation requires UI input and no interactive channel is available, return a typed error.
  - Error code should be stable and machine-readable: `:ui-interaction-required`.
  - Error payload should include at least `:action` and optional `:hint` (for example, configured password fallback).

- **Interactive mode (browser app):**
  - Worker emits `:db-worker/ui-request` with `request-id`.
  - Main thread performs UI interaction and actively calls worker thread APIs to resolve or reject the request.
  - Worker resumes flow only when matching `request-id` is resolved.

This dual contract keeps headless behavior deterministic while preserving async interactive UX in browser runtime.

### 4) Platform abstraction updates for Node/Browser parity

Extend `frontend.worker.platform` contract with only capabilities required by migrated APIs.

Likely additions:
- secure encrypted secret storage (or equivalent persisted encrypted blob)
- binary asset read/write/stat helpers
- HTTP transfer helpers with progress hooks (if not already available in shared runtime)
- monotonic clock/timer helpers for timeout handling

Node implementation: `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/platform/node.cljs`.

Browser implementation: `/Users/rcmerci/gh-repos/logseq/src/main/frontend/worker/platform/browser.cljs`.

## Per-API migration matrix

| Legacy main-thread API | New worker-owned implementation | UI request protocol needed? | Node/Browser notes |
| --- | --- | --- | --- |
| `:thread-api/ensure-id&access-token` | Worker-local refresh function in sync auth module | No | Must work without UI in node daemon |
| `:thread-api/rtc-upload-asset` | Worker asset upload API | No | Use platform file + HTTP adapters |
| `:thread-api/rtc-download-asset` | Worker asset download API | No | Same |
| `:thread-api/get-asset-file-metadata` | Worker metadata/checksum API | No | Same |
| `:thread-api/native-save-e2ee-password` | Worker secure persistence API | No | Use platform adapter implementations |
| `:thread-api/native-get-e2ee-password` | Worker secure read API | No | Same |
| `:thread-api/native-delete-e2ee-password` | Worker secure delete API | No | Same |
| `:thread-api/request-e2ee-password` | Worker emits UI request and waits on `resolve-ui-request` | Yes | Node can return typed `:ui-interaction-required` unless configured fallback exists |
| `:thread-api/decrypt-user-e2ee-private-key` | Worker-local decrypt + optional UI request for password | Yes (fallback) | Keep headless path for node |
| `:thread-api/input-idle?` | Main thread pushes idle-state updates; worker consumes a local TTL cache for indexing decisions | Yes | Push+TTL is the default model to avoid high-frequency request storms |

## Implementation phases

### Phase 0: Safety rails and observability

1. Add explicit metric/log points for any call to `<invoke-main-thread` in worker code.
2. Add request-id propagation fields to db-worker-node invoke/event logs for traceability.
3. Add temporary feature flag to switch between old and new path per migrated domain.

### Phase 1: Non-UI API migration

1. Migrate auth refresh from main thread to worker.
2. Migrate asset metadata/upload/download to worker module + platform adapters.
3. Migrate E2EE encrypted password persistence to worker platform APIs.
4. Keep compatibility shims temporarily, but default to worker-local path.

Exit criteria:
- No non-UI flow depends on main thread.
- CLI and db-worker-node sync paths pass regression tests.

### Phase 2: UI request protocol

1. Introduce generic worker UI request manager (`request-id`, timeout, cleanup).
2. Add worker thread APIs for resolving/rejecting UI requests.
3. Add main-thread handler wiring in `frontend.handler.worker` for `:db-worker/ui-request` events.
4. Route E2EE prompt/decrypt UI-dependent flows through new protocol.

Exit criteria:
- concurrent password requests are isolated by `request-id`.
- graph switch/shutdown does not leak pending requests.

### Phase 3: Search idle and remaining UI-state dependencies

1. Replace `:thread-api/input-idle?` direct invocation with **main-thread push + worker TTL cache** model.
2. Define TTL window and stale-state behavior for indexing loops.
3. Validate search indexing throughput and UI responsiveness.

Exit criteria:
- no direct worker->main-thread API invocation in search flow.
- push+TTL idle-state model is active and covered by tests.
- no regression in search build behavior.

### Phase 4: Remove legacy dependencies

1. Remove remaining production usages of `worker-state/<invoke-main-thread` in worker sync/core modules.
2. Update `non-repo-methods` and API inventory if method ownership changed.
3. Keep browser compatibility wrappers only if still required by bootstrapping internals.

Final exit criteria:
- `invoke-main-thread` usage in production code is zero (or explicitly limited to bootstrap-only internals with no business logic).
- `db-worker-node` full API suite works without main-thread API dependencies.

## Tests and verification plan

### Unit tests

- Worker auth tests: token refresh in worker without main-thread stubs.
- Worker asset tests: metadata/upload/download via worker module and platform mocks.
- Worker crypt tests: password storage/decrypt paths do not call main thread.
- UI request manager tests: request-id isolation, timeout, duplicate response rejection.

### Integration tests

- Browser flow: UI request roundtrip (`postMessage` -> main thread -> `resolve-ui-request`).
- Node flow: same API paths run headless and return typed errors when UI is mandatory.
- Search indexing flow: idle-state protocol behavior under repeated checks.

### Regression checks

- `eca__grep` gate: no production `worker-state/<invoke-main-thread` call sites in migrated modules.
- `db-worker-node` daemon invoke smoke tests for sync + e2ee + asset paths.
- Existing CLI and worker tests remain green.

## Risks and mitigations

1. **E2EE flow regressions**
   - Mitigation: migrate with feature flags and run dedicated crypt regression suite first.

2. **Asset transfer behavior drift**
   - Mitigation: keep payload format/checksum semantics unchanged during extraction.

3. **Request map leaks / stale requests**
   - Mitigation: enforce timeout + shutdown cleanup + finalizer assertions.

4. **Search performance impact**
   - Mitigation: add request throttling and local TTL cache for idle-state checks.

5. **Protocol mismatch between main thread and worker**
   - Mitigation: define strict message schema and validate fields at both ends.

## Acceptance criteria

1. Every current production `invoke-main-thread` dependency listed in this plan has a worker-owned replacement.
2. `db-worker-node` runs without any required main-thread API bridge.
3. UI-dependent flows use `postMessage` request + main-thread active callback to worker thread API.
4. `request-id` enforces isolation for concurrent UI requests.
5. In headless mode, UI-required operations return typed error `:ui-interaction-required` with stable machine-readable payload.
6. Node and Browser runtimes both pass targeted tests for migrated paths.
7. No unresolved pending UI requests remain after graph close or worker shutdown.

## Suggested execution order

1. Auth + non-UI crypt storage.
2. Asset API migration.
3. Generic UI request protocol.
4. E2EE prompt/decrypt migration.
5. Search idle-state migration.
6. Legacy call-site removal and cleanup.

## Confirmed decisions

1. `request-id` format: UUID v4.
2. Default UI request timeout: 60s (`60000ms`), optional per-action override.
3. Search idle state model: main-thread push + worker TTL cache.
4. Headless behavior: UI-required operations return typed error `:ui-interaction-required`.
5. Execution order: follow the phased order defined in this document.

## Notes

This plan intentionally prioritizes behavior parity and migration safety over immediate deep refactor of all related modules.

The protocol and platform abstraction should be stabilized first; broad code movement should follow once test harnesses are in place.
