# DB-Sync Feature Agent Guide

## Purpose
This guide helps AI agents implement and review db-sync features consistently across the client and the Cloudflare Worker. Keep changes scoped, follow the existing flow, and document any protocol or storage changes. Keep this document accurate (file names, paths, commands, and parameters).

## Key Code Locations
- Client config: `src/main/frontend/config.cljs`
- Client runtime: `src/main/frontend/worker/db_sync.cljs`
- Worker thread API: `src/main/frontend/worker/db_worker.cljs`
- Handler entry points: `src/main/frontend/handler/db_based/db_sync.cljs`
- Server worker code: `deps/db-sync/src/logseq/db_sync/`
- Worker build/test notes: `deps/db-sync/worker/README.md`

## Implementation Workflow
1) **Define behavior**: state the new capability, expected inputs/outputs, and compatibility requirements.
2) **Update protocol first** (if needed): change `protocol.cljs` and adjust server/client serialization in tandem.
3) **Server changes**: update `worker.cljs`, `worker_core.cljs`, `storage.cljs`, or `cycle.cljs`.
4) **Client changes**: update `db_sync.cljs` and thread APIs in `db_worker.cljs`.
5) **Handler glue**: add or adjust the entry points in `handler/db_based/db_sync.cljs`.

## Data, Keywords, and Schema
- Use existing `:db-sync/*` keywords; add new keywords via `logseq.common.defkeywords/defkeyword`.
- When adding persisted fields, ensure any migration or index logic is updated on both client and worker.

## Client-Server Message Protocol (WebSocket)
- Transport: WebSocket `ws(s)` to `/sync/:graph-id` (client builds URL from config and appends `?token=...` when available).
- Encoding: JSON objects; `tx` payloads are Transit strings.
- Client -> Server:
  - `{"type":"hello","client":"<repo-id>"}`: initial hello; server responds with `t`.
  - `{"type":"pull","since":<t>}`: request txs after `since` (defaults to 0).
  - `{"type":"tx/batch","t_before":<t>,"txs":["<tx-transit>", ...]}`: upload batch.
  - `{"type":"ping"}`: optional keepalive; server replies `pong`.
- Server -> Client:
  - `{"type":"hello","t":<t>}`: server hello with current t.
  - `{"type":"pull/ok","t":<t>,"txs":[{"t":<t>,"tx":"<tx-transit>"}...]}`: pull response.
  - `{"type":"tx/batch/ok","t":<t>}`: batch accepted.
  - `{"type":"changed","t":<t>}`: broadcast that server state advanced; client should `pull`.
  - `{"type":"tx/reject","reason":"stale","t":<t>}`: client tx based on stale t.
  - `{"type":"tx/reject","reason":"cycle","data":"<transit {:attr <kw> :server_values ...}>"}`: cycle detected with server values.
  - `{"type":"tx/reject","reason":"empty tx data"|"invalid tx"}`: invalid batch.
  - `{"type":"pong"}`: keepalive response.
  - `{"type":"error","message":"..."}`: invalid/unknown message.

## Testing & Verification
- Local dev(client+server): `bb dev:db-sync-start` runs the db-sync watcher, `wrangler dev`, and `yarn watch` with `ENABLE_DB_SYNC_LOCAL=true`
- Unit tests: `bb dev:lint-and-test`
- DB-sync tests: `bb dev:db-sync-test`
- Single test example: `bb dev:test -v logseq.db-sync.storage-test/foo`
- Worker local build: `clojure -M:cljs release db-sync`

## Review Checklist
- Protocol versioning and error handling are consistent across client/server.
- No breaking changes without fallback or migration.
- New data fields are indexed or stored intentionally.
- Logs and errors use `:db-sync/*` context keys.
