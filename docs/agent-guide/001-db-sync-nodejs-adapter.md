# DB Sync Node.js Adapter Implementation Plan

Goal: Build a Node.js server adapter for DB sync so users can self-host without Cloudflare dependencies.
Architecture: Reuse the existing db-sync core logic and route handlers while introducing a platform abstraction layer that swaps Cloudflare APIs for Node.js equivalents.
Architecture: Provide a new Node.js entrypoint that wires HTTP and WebSocket handling to the shared handlers and pluggable storage and auth backends.
Tech Stack: ClojureScript, shadow-cljs, Node.js LTS, standard Node HTTP and WebSocket libraries, existing db-sync ClojureScript modules.
Related: Builds on docs/agent-guide/db-sync/db-sync-guide.md and docs/agent-guide/db-sync/protocol.md and docs/adr/0001-nodejs-db-sync-server-adapter.md.

## Problem statement
The current DB sync server implementation assumes a Cloudflare Worker runtime and related APIs.
That assumption prevents users from running the sync server on standard Node.js infrastructure.
We need a portable adapter that preserves the DB sync protocol and behavior while replacing Cloudflare-specific primitives.

## Testing Plan
I will add an integration test that spins up the Node.js adapter, runs a health check, and performs a minimal pull and tx/batch round-trip over HTTP to confirm protocol compatibility.
I will add an integration test that opens a WebSocket connection, performs hello and pull, and validates changed notifications on tx/batch.
I will add a unit test that exercises the platform abstraction layer to ensure request and response coercion behave the same for both Node and worker inputs.
I will add a unit test that validates storage and auth adapter selection from configuration, including error handling for missing drivers.
NOTE: I will write all tests before I add any implementation behavior.

## Scope
The Node.js adapter will implement the existing HTTP and WebSocket endpoints as described in docs/agent-guide/db-sync/protocol.md.
The adapter will run the same handler logic currently used by the Cloudflare worker.
The adapter will support pluggable storage and auth providers to match the existing worker behavior.

## Non-goals
This plan does not add new DB sync protocol features.
This plan does not migrate existing cloud hosting or change client behavior.
This plan does not redesign storage schemas or transaction ordering.

## Architecture Overview
The adapter will introduce a platform boundary and a Node runtime entrypoint that binds HTTP and WS requests to the existing worker handlers.
The platform boundary will normalize request, response, and WebSocket interfaces so the core logic remains unchanged.
The Node entrypoint will be responsible only for server lifecycle and wiring adapters.

+--------------------+     HTTP/WS      +------------------------+     storage/auth     +------------------+
| Logseq Client Apps | <--------------> | Node.js DB Sync Adapter | <------------------> | Storage Backends |
+--------------------+                  +------------------------+                      +------------------+
                                        | Shared db-sync handlers |
                                        +------------------------+

## Implementation Plan
1. Read docs/agent-guide/db-sync/db-sync-guide.md and docs/agent-guide/db-sync/protocol.md and list the Cloudflare-specific APIs used by the worker in deps/db-sync/src/logseq/db_sync/worker/.
2. Create a platform abstraction namespace in deps/db-sync/src/logseq/db_sync/platform/core.cljs that defines the minimal request, response, and WebSocket operations used by handlers.
3. Add a Cloudflare platform adapter in deps/db-sync/src/logseq/db_sync/platform/cloudflare.cljs that wraps the current Worker Request, Response, and WebSocket types.
4. Add a Node platform adapter in deps/db-sync/src/logseq/db_sync/platform/node.cljs that wraps Node HTTP requests, responses, and WebSocket connections.
5. Update deps/db-sync/src/logseq/db_sync/worker/dispatch.cljs and deps/db-sync/src/logseq/db_sync/worker/http.cljs to depend on the platform abstraction instead of direct Worker APIs.
6. Add a Node server entrypoint in deps/db-sync/src/logseq/db_sync/node/entry.cljs that sets up HTTP routes, WS upgrade handling, and lifecycle start/stop.
7. Add a Node routing layer in deps/db-sync/src/logseq/db_sync/node/routes.cljs that maps incoming requests to the existing worker route handlers.
8. Introduce configuration parsing in deps/db-sync/src/logseq/db_sync/node/config.cljs to select storage and auth drivers via environment variables.
9. Add Node adapter implementations for storage and assets in deps/db-sync/src/logseq/db_sync/node/storage.cljs and deps/db-sync/src/logseq/db_sync/node/assets.cljs that map to the existing storage interfaces.
10. Add a new shadow-cljs build target in deps/db-sync/shadow-cljs.edn for the Node adapter output.
11. Add build and run scripts to deps/db-sync/package.json for the Node adapter, including a dev watch command.
12. Update docs/agent-guide/db-sync/db-sync-guide.md with the new local dev and test commands for the Node adapter.
13. Add a new self-hosting section to docs/develop-logseq.md with minimal steps to run the Node adapter.
14. Add integration tests under deps/db-sync/test/logseq/db_sync/node_adapter_test.cljs that launch the Node adapter and exercise HTTP and WS paths.
15. Add unit tests under deps/db-sync/test/logseq/db_sync/platform_test.cljs that cover request normalization and error propagation.
16. Run the tests using the commands listed in the Verification section and confirm they fail before implementation and pass after implementation.

## Configuration Matrix
Use the following environment variables for the Node adapter configuration.

| Variable | Purpose | Example |
| --- | --- | --- |
| DB_SYNC_PORT | HTTP server port | 8080 |
| DB_SYNC_BASE_URL | External base URL for asset links | https://sync.example.com |
| DB_SYNC_STORAGE_DRIVER | Storage backend selection | sqlite | 
| DB_SYNC_AUTH_DRIVER | Auth backend selection | bearer | 
| DB_SYNC_ASSETS_DRIVER | Asset storage backend selection | filesystem |
| DB_SYNC_LOG_LEVEL | Log verbosity | info |

## Verification
Run the server-side test suite.

```bash
bb dev:db-sync-test
```

Expected result is a zero exit code and no failing tests.

Run the Node adapter integration tests.

```bash
cd deps/db-sync
npm run test:node-adapter
```

Expected result is a zero exit code and logs that the Node adapter started and all tests passed.

## Edge Cases
Unauthorized requests should return the same 401 or 403 responses as the Cloudflare worker.
Invalid request payloads must produce the same error responses as the worker routes.
WebSocket message validation must reject unknown types with the same error shape.
Snapshot upload should preserve content-encoding and reject missing bodies consistently.
Asset uploads must enforce size limits and return the same error codes as the worker.

## Testing Details
I will add integration tests that launch the Node adapter and use HTTP and WebSocket calls to validate real protocol behavior rather than mocking handlers.
I will add unit tests for the platform adapters to ensure coercion and error handling match existing worker semantics.
These tests validate observable behavior and response shapes instead of internal data structures.

## Implementation Details
- Introduce a platform interface to normalize request, response, and WebSocket operations.
- Keep all protocol validation and handler logic inside deps/db-sync/src/logseq/db_sync/worker to avoid divergence.
- Make the Node entrypoint responsible only for wiring and lifecycle.
- Add configuration parsing and driver selection in Node-specific namespaces.
- Add a new shadow-cljs build target for the Node adapter output.
- Add npm scripts for building and testing the Node adapter.
- Update docs to include self-hosting and local dev guidance.

## Question
Where should the AGENTS.workflow.md guidance live for plan documents in this repo.
Do we want to support the same storage backends as Cloudflare on day one or limit to a single local driver for the first release.
Should the Node adapter include optional CORS configuration or match the current worker defaults exactly.

---
