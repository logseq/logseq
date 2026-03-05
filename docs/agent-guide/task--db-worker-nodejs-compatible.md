# task--db-worker-nodejs-compatible

## Goal
Make `frontend.worker.db-worker` and its dependencies run in both browser and Node.js. Add a Node.js daemon that can be started from the command line and exposes HTTP APIs to the same worker capabilities.

## Scope
- Primary target: `src/main/frontend/worker/db_worker.cljs`.
- All dependencies used by db-worker: `src/main/frontend/worker/**`, `src/main/frontend/worker_common/**`, and any browser-only utilities used by those namespaces.
- Callers: `src/main/frontend/persist_db/browser.cljs`, `src/main/frontend/handler/worker.cljs`, and any callers that assume a WebWorker or Comlink transport.

## Refactor Items (Concrete Work List)
1. Split worker core logic from runtime-specific host APIs.
   - Create a core module (e.g. `frontend.worker.db-core`) that contains thread-api functions and business logic.
   - Move all direct uses of `js/self`, `js/location`, `js/navigator`, `importScripts`, `BroadcastChannel`, and `navigator.locks` out of core.
2. Add a platform adapter layer with a consistent interface for browser and Node.js.
   - Define `frontend.worker.platform` interface: storage, kv-store, broadcast, websocket, crypto, timers, and env flags.
   - Implement `frontend.worker.platform.browser` using OPFS, IDB, BroadcastChannel, navigator.locks, WebSocket, and `globalThis`.
   - Implement `frontend.worker.platform.node` using `fs/promises`, `path`, `crypto`, and `ws`.
3. Abstract sqlite storage and VFS specifics.
   - Browser: keep OPFS SAH pool implementation.
   - Node: use file-backed sqlite storage (via sqlite-wasm Node VFS or a Node sqlite binding).
   - Route db path resolution through the platform adapter (data dir, per-repo paths).
4. Replace `importScripts` bootstrap with an explicit init entrypoint.
   - Browser build still uses `:web-worker`, but entrypoint should call `init!` with a browser platform adapter.
   - Node build should call the same `init!` with a Node adapter.
5. Normalize RPC and transport.
   - Define a transport-agnostic RPC layer that accepts a method name and args (transit string or direct args).
   - Keep Comlink for browser worker transport.
   - Add HTTP transport for Node (see daemon section).
6. Update shared-service for non-browser environments.
   - Provide a "single-client" fallback for Node; no multi-client coordination is needed.
7. Replace browser-only storage in RTC and crypto modules.
   - `frontend.worker.rtc.crypt` uses IDB/OPFS and should switch to the platform kv-store and file API.
   - Any other worker modules using `js/navigator` or OPFS should be routed through the platform adapter.
8. Replace direct `js/WebSocket` usage with a platform websocket factory.
   - Browser: `js/WebSocket`.
   - Node: `ws` client with the same interface shape.
9. Update caller-side initialization.
   - Add a Node-specific db worker client (e.g. `frontend.persist-db.node` or `frontend.persist-db.remote`) that talks to the HTTP daemon.
   - Keep browser `frontend.persist-db.browser` using WebWorker + Comlink.
10. Build config changes.
    - Add a Node build target in `shadow-cljs.edn` for db-worker (e.g. `:db-worker-node`).
    - Ensure shared code compiles for `:node-script` or `:node-library` with the correct externs.
11. Tests and fixtures.
    - Add unit tests for platform adapters and storage abstraction.
    - Add a minimal integration test that starts the Node daemon and exercises a small RPC call.

## Refactor Steps (Milestones + Status)

### Milestone 1: Architecture & Abstractions
- DONE 1. Inventory db-worker dependencies and classify browser-only APIs.
- DONE 2. Define a platform adapter interface (storage, kv, broadcast, websocket, crypto, timers, env flags).
- DONE 3. Extract db-worker core logic into a platform-agnostic module (e.g. `frontend.worker.db-core`).
#### Acceptance Criteria
- Core worker module has zero direct references to `js/self`, `js/location`, `js/navigator`, `importScripts`, `BroadcastChannel`, or `navigator.locks`.
- `frontend.worker.platform` exists with required sections and validation; platform adapter passes validation at init time.
- Browser worker entry initializes via `init!`/`init-core!` with a platform adapter.
- `bb dev:lint-and-test` passes.

### Milestone 2: Browser Path Parity
- DONE 4. Implement `frontend.worker.platform.browser`.
- DONE 5. Update db-worker entry to inject the platform adapter and call core init.
- DONE 6. Route OPFS/IDB usage through the platform adapter in worker submodules.
- DONE 7. Replace direct `js/WebSocket` usage with platform websocket factory.
#### Acceptance Criteria
- Browser platform adapter encapsulates OPFS/IDB storage, kv-store, and WebSocket factory; worker submodules no longer import OPFS/IDB directly.
- RTC WebSocket creation uses the platform adapter.
- Browser db-worker entry injects the platform adapter and serves Comlink RPC.
- `bb dev:lint-and-test` passes.

### Milestone 3: Node Path & Daemon
- TODO 8. Implement `frontend.worker.platform.node` in single-client mode (no locks or BroadcastChannel).
- TODO 9. Update shared-service to no-op/single-client behavior in Node.
- TODO 10. Add Node build target in `shadow-cljs.edn` for db-worker.
- TODO 11. Implement Node daemon entrypoint and HTTP server.
- TODO 12. Add a Node client in frontend to call the daemon (HTTP + SSE/WS events).
#### Acceptance Criteria
- Node platform adapter provides storage/kv/broadcast/websocket/crypto/timers and validates via `frontend.worker.platform`.
- Node build target compiles db-worker core without browser-only APIs.
- Node daemon starts via CLI and reports readiness; `GET /healthz` and `GET /readyz` return `200 OK`.
- `POST /v1/invoke` handles `list-db`, `create-or-open-db`, `q`, `transact` in a smoke test.
- Node client can invoke at least one RPC and receive one event (SSE or WS).
- `bb dev:lint-and-test` passes.

### Milestone 4: Validation
- TODO 13. Add tests: adapter unit tests + daemon integration smoke test.
- TODO 14. Verify browser worker path still works with Comlink.
#### Acceptance Criteria
- Adapter unit tests cover browser and node implementations for storage/kv/broadcast/websocket factories.
- Daemon integration smoke test starts the node process and exercises `/v1/invoke` with at least one method.
- Browser worker path verified with Comlink RPCs (smoke test).
- `bb dev:lint-and-test` passes.

## Node.js Daemon Requirements
The db-worker should be runnable as a standalone process for Node.js environments.

### Entry Point
- Provide a CLI entry (example: `bin/logseq-db-worker` or `node dist/db-worker-node.js`).
- CLI flags (suggested):
  - `--host` (default `127.0.0.1`)
  - `--port` (default `8080`)
  - `--data-dir` (path for sqlite files, required or default to `~/.logseq/db-worker`)
  - `--repo` (optional: auto-open a repo on boot)
  - `--rtc-ws-url` (optional)
  - `--log-level` (default `info`)
  - `--auth-token` (optional; bearer token for HTTP)

### Lifecycle
1. Initialize platform adapter (Node).
2. Initialize sqlite module and storage roots.
3. Start HTTP server.
4. Emit readiness when init completes.
5. Graceful shutdown on SIGINT/SIGTERM (close dbs, flush logs).

### HTTP API (Minimum)
Use HTTP for RPC and event delivery. Prefer a single generic RPC entrypoint to avoid one endpoint per method.

Required endpoints:
- `GET /healthz` -> `200 OK` when process is alive.
- `GET /readyz` -> `200 OK` only after sqlite init completes.
- `POST /v1/invoke`
  - Request JSON:
    - `method`: string, e.g. `"thread-api/create-or-open-db"`
    - `directPass`: boolean
    - `argsTransit`: string (transit-encoded args) OR `args`: array for direct pass
  - Response JSON:
    - `ok`: boolean
    - `resultTransit`: string (transit-encoded result) when `directPass=false`
    - `result`: any (when `directPass=true`)
    - `error`: error object if failed

Event delivery options:
- `GET /v1/events` using SSE for worker -> client events
  - Event payload should mirror current `postMessage` payloads in `frontend.handler.worker`.
  - Each event should be tagged with `type` and `payload`.
- Alternatively, provide `WS /v1/events` with the same payload format.

### Security
- If `--auth-token` is provided, require `Authorization: Bearer <token>` for all endpoints except `healthz` and `readyz`.
- Bind to localhost by default.

## Notes on Compatibility Gaps
- OPFS and IndexedDB do not exist in Node; file-backed storage and a Node KV store are required.
- `BroadcastChannel` and `navigator.locks` are browser-only; Node should use a simpler single-client mode.
- `Comlink` is browser-optimized; the Node daemon should use HTTP, not Comlink.

## Success Criteria
- Browser build continues to work with WebWorker + Comlink.
- Node daemon can start from CLI, open a repo, and respond to at least:
  - `list-db`
  - `create-or-open-db`
  - `q`
  - `transact`
- A minimal client can call the daemon and receive event notifications.
