# Worker-Sync Feature Agent Guide

## Purpose
This guide helps AI agents implement and review worker-sync features consistently across the client and the Cloudflare Worker. Keep changes scoped, follow the existing flow, and document any protocol or storage changes. Keep this document accurate (file names, paths, commands, and parameters).

## Key Code Locations
- Client config: `src/main/frontend/config.cljs`
- Client runtime: `src/main/frontend/worker/worker_sync.cljs`
- Worker thread API: `src/main/frontend/worker/db_worker.cljs`
- Handler entry points: `src/main/frontend/handler/db_based/worker_sync.cljs`
- Server worker code: `deps/worker-sync/src/logseq/worker_sync/`
- Worker build/test notes: `deps/worker-sync/worker/README.md`

## Implementation Workflow
1) **Define behavior**: state the new capability, expected inputs/outputs, and compatibility requirements.
2) **Update protocol first** (if needed): change `protocol.cljs` and adjust server/client serialization in tandem.
3) **Server changes**: update `worker.cljs`, `worker_core.cljs`, `storage.cljs`, or `cycle.cljs`.
4) **Client changes**: update `worker_sync.cljs` and thread APIs in `db_worker.cljs`.
5) **Handler glue**: add or adjust the entry points in `handler/db_based/worker_sync.cljs`.

## Data, Keywords, and Schema
- Use existing `:worker-sync/*` keywords; add new keywords via `logseq.common.defkeywords/defkeyword`.
- When adding persisted fields, ensure any migration or index logic is updated on both client and worker.

## Testing & Verification
- Local dev(client+server): `bb dev:worker-sync-start` runs the worker-sync watcher, `wrangler dev`, and `yarn watch` with `ENABLE_WORKER_SYNC_LOCAL=true`
- Unit tests: `bb dev:lint-and-test`
- Worker-sync tests: `bb dev:worker-sync-test`
- Single test example: `bb dev:test -v logseq.worker-sync.storage-test/foo`
- Worker local build: `clojure -M:cljs release worker-sync`

## Review Checklist
- Protocol versioning and error handling are consistent across client/server.
- No breaking changes without fallback or migration.
- New data fields are indexed or stored intentionally.
- Logs and errors use `:worker-sync/*` context keys.
