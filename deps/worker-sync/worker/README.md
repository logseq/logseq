## Cloudflare Sync Worker (Skeleton)

This worker provides a simple WebSocket-based sync protocol backed by a
Durable Object using SQLite storage and the Logseq datascript fork.

### Bindings

- `LOGSEQ_SYNC_DO`: Durable Object namespace
- `LOGSEQ_SYNC_INDEX_DO`: Durable Object namespace for graph registry

### Routes

- `GET /health`
  - Returns a JSON health response
- `GET /graphs`
  - Returns the list of registered graphs
- `POST /graphs`
  - Registers or updates a graph
- `DELETE /graphs/:graph-id`
  - Deletes a graph and resets its DO state
- `GET /sync/:graph-id`
  - Proxies to the Durable Object for the given graph

### WebSocket Protocol

Messages are JSON. The payloads for `tx` and `snapshot` use Transit strings to
preserve keywords and UUIDs.

Client -> Server:

- `{ "type": "hello", "client": "...", "since": 0 }`
- `{ "type": "tx", "client": "...", "t_before": 0, "tx": "<transit>" }`
- `{ "type": "pull", "since": 0 }`
- `{ "type": "ping" }`
<!-- - `{ "type": "snapshot" }` -->


Server -> Client:

- `{ "type": "hello", "t": 1 }`
- `{ "type": "tx/ok", "t": 2 }`
- `{ "type": "tx/reject", "reason": "cycle", "server_values": "<transit>" }`
- `{ "type": "pull/ok", "t": 2, "txs": [{"t": 1, "tx": "<transit>"}] }`
- `{ "type": "snapshot/ok", "t": 2, "datoms": "<transit>" }`
- `{ "type": "pong" }`

### Notes

- The sync protocol is intentionally minimal for testing.
- For local testing, run `wrangler dev` and use `deps/worker-sync/worker/scripts/dev_test.sh`.
- For WebSocket testing, run `node deps/worker-sync/worker/scripts/ws_test.js`.
- If you switch schema versions, clear local DO state.
- Build the worker bundle with `clojure -M:cljs release worker-sync`.
- For dev, run `clojure -M:cljs watch worker-sync` in one terminal and
  `wrangler dev` in another.
