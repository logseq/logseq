# DB-Sync Feature Agent Guide

## Purpose
This guide helps AI agents implement and review db-sync features consistently across the client and the Cloudflare Worker. Keep changes scoped, follow the existing flow, and document any protocol or storage changes. Keep this document accurate (file names, paths, commands, and parameters).

## Key Code Locations
- Client config: `src/main/frontend/config.cljs`
- Client runtime: `src/main/frontend/worker/db_sync.cljs`
- Worker thread API: `src/main/frontend/worker/db_worker.cljs`
- Handler entry points: `src/main/frontend/handler/db_based/db_sync.cljs`
- Server worker code: `deps/db-sync/src/logseq/db_sync/`

## Implementation Workflow
1) **Define behavior**: state the new capability, expected inputs/outputs, and compatibility requirements.
2) **Update protocol first** (if needed): change `protocol.cljs` and adjust server/client serialization in tandem.
3) **Server changes**: update `worker.cljs`, `worker_core.cljs`, `storage.cljs`, or `cycle.cljs`.
4) **Client changes**: update `db_sync.cljs` and thread APIs in `db_worker.cljs`.
5) **Handler glue**: add or adjust the entry points in `handler/db_based/db_sync.cljs`.
6) **Function ordering**: keep related ClojureScript fns together and ordered to minimize `declare` usage.

## Data, Keywords, and Schema
- Use existing `:db-sync/*` keywords; add new keywords via `logseq.common.defkeywords/defkeyword`.
- When adding persisted fields, ensure any migration or index logic is updated on both client and worker.

## Fail-Fast Error Policy
- db-sync core code must fail fast on bugs: log an error (`log/error`) and throw immediately.
- Treat these as bugs (internal invariants or bad server responses on the client):
  - db connection missing when required (client or worker).
  - WS/HTTP response fields missing (e.g., `:t`, `:txs`, `:reason`, `:data`).
  - Response parse/coercion failures (e.g., transit decode, malli coercion).
  - Unexpected WS/HTTP message type or reason value on the client.
  - Asset operations missing required fields when processing client-side metadata.
  - Invariant violations in tx apply (e.g., tx-data empty after normalization).
- Server-side validation of client input should not throw. Respond with `tx/reject` or `400` errors for:
  - tx payload type mismatch (e.g., `:txs` not a sequence of strings).
  - Invalid graph identity (missing/empty graph id or uuid in sync path).
  - Invalid or negative `t`/`t_before` values.
- Do not silently recover or drop messages for bug cases; surface them via exceptions.

## HTTP API (Bootstrap + Assets)
- HTTP endpoints backfill initial graph data, snapshots, and assets.
- See `docs/agent-guide/db-sync/protocol.md` for request/response shapes.

## Client-Server Message Protocol (WebSocket)
- See `docs/agent-guide/db-sync/protocol.md` for request/response shapes.

## Testing & Verification
- Local dev(client+server): `bb dev:db-sync-start` runs the db-sync watcher, `wrangler dev`, and `yarn watch` with `ENABLE_DB_SYNC_LOCAL=true`
- DB-sync server side unit-tests: `bb dev:db-sync-test`

## Review Checklist
- Protocol versioning and error handling are consistent across client/server.
- No breaking changes without fallback or migration.
- New data fields are indexed or stored intentionally.
- Logs and errors use `:db-sync/*` context keys.
