# DB-Sync Client-Server Protocol

## Transport
- WebSocket `ws(s)` to `/sync/:graph-id`.
- Client builds URL from config and appends `?token=...` when available.
- Encoding: JSON objects; `tx` payloads are Transit strings.
- Note: keep this document in sync with the current implementation.

## websocket message state machine
### client
| State           | Event                     | Next state      | Notes / error handling                                                   |
| START           | send 'hello'              | hello-wait      | Send immediately after connection opens                                  |
| hello-wait      | recv 'hello'              | hello-done      | Update t; if remote > local then send `pull`                             |
| hello-wait      | recv other                | END             | Unexpected message                                                       |
| hello-done      | send 'pull'               | pull-wait       | Triggered by `hello` / `changed` / `stale`                               |
| hello-done      | send 'tx/batch'           | tx/batch-wait   | Flush pending local txs (inflight empty and ws open)                     |
| hello-done      | recv 'changed'            | hello-done      | If local < remote, send `pull` then enter pull-wait                      |
| hello-done      | recv 'error'              | END             | Fail fast                                                                |
| hello-done      | recv 'pong'               | hello-done      | Ignore (client does not send ping currently)                             |
| hello-done      | recv other                | END             | Unknown message type                                                     |
| pull-wait       | recv 'pull/ok'            | hello-done      | Apply remote txs, update local t                                         |
| pull-wait       | recv 'changed'            | pull-wait       | If local < remote, re-send `pull`                                        |
| pull-wait       | send 'tx/batch'           | tx/batch-wait   | Flush pending local txs (inflight empty and ws open)                     |
| pull-wait       | recv 'error'              | END             | Fail fast                                                                |
| pull-wait       | recv 'pong'               | pull-wait       | Ignore (client does not send ping currently)                             |
| pull-wait       | recv other                | END             | Unknown message type                                                     |
| tx/batch-wait   | recv 'tx/batch/ok'        | hello-done      | Update local t, clear inflight, continue flush; stay pull-wait if active |
| tx/batch-wait   | recv 'changed'            | tx/batch-wait   | Mark pull pending; pull after tx/batch completes                         |
| tx/batch-wait   | recv 'tx/reject' (stale)  | tx/reject/stale | Handle stale branch                                                      |
| tx/batch-wait   | recv 'tx/reject' (cycle)  | tx/reject/cycle | Handle cycle branch                                                      |
| tx/batch-wait   | recv 'error'              | END             | Fail fast                                                                |
| tx/batch-wait   | recv other                | END             | Unknown message type                                                     |
| tx/reject/stale | send 'pull'               | pull-wait       | Immediately pull on stale                                                |
| tx/reject/cycle | (reconcile/requeue/flush) | hello-done      | Reconcile cycle then resume normal flow (stay pull-wait if active)       |
| END             |                           |                 | Connection closed; reconnection handled elsewhere                        |

## Client -> Server
- `{"type":"hello","client":"<repo-id>"}`
  - Initial handshake from client.
- `{"type":"pull","since":<t>}`
  - Request txs after `since` (defaults to 0).
- `{"type":"tx/batch","t_before":<t>,"txs":["<tx-transit>", ...]}`
  - Upload a batch of txs based on `t_before` (required).
- `{"type":"ping"}`
  - Optional keepalive; server replies `pong`.

## Server -> Client
- `{"type":"hello","t":<t>}`
  - Server hello with current t.
- `{"type":"pull/ok","t":<t>,"txs":[{"t":<t>,"tx":"<tx-transit>"}...]}`
  - Pull response with txs.
- `{"type":"tx/batch/ok","t":<t>}`
  - Batch accepted; server advanced to t.
- `{"type":"changed","t":<t>}`
  - Broadcast that server state advanced; client should pull.
- `{"type":"tx/reject","reason":"stale","t":<t>}`
  - Client tx is based on stale t.
- `{"type":"tx/reject","reason":"cycle","data":"<transit {:attr <kw> :server_values ...}>"}`
  - Cycle detected with server values.
- `{"type":"tx/reject","reason":"empty tx data"|"invalid tx"|"invalid t_before"}`
  - Invalid batch.
- `{"type":"pong"}`
  - Keepalive response.
- `{"type":"error","message":"..."}`
  - Invalid/unknown message. Current messages: `"unknown type"`, `"invalid request"`, `"server error"`, `"invalid since"`.

## HTTP API
- Auth: Bearer token via `Authorization: Bearer <token>` or `?token=...`.
- JSON body/response unless noted.
- Auth required for `/graphs`, `/sync/:graph-id/*`, and `/assets/*`. Expect `401` (unauthorized) or `403` (forbidden) on access failure.

### Worker Health
- `GET /health`
  - Worker health check. Response: `{"ok":true}`.

### Graphs (index DO)
- `GET /graphs`
  - List graphs the user owns. Response: `{"graphs":[{graph_id, graph_name, schema_version?, created_at, updated_at}...]}`.
- `POST /graphs`
  - Create graph. Body: `{"graph_name":"...","schema_version":"<major>"}` (schema_version optional). Response: `{"graph_id":"..."}`.
- `GET /graphs/:graph-id/access`
  - Access check. Response: `{"ok":true}`, `401` (unauthorized), `403` (forbidden), or `404` (not found).
- `DELETE /graphs/:graph-id`
  - Delete graph and reset data. Response: `{"graph_id":"...","deleted":true}` or `400` (missing graph id).

### Sync (per-graph DO, via `/sync/:graph-id/...`)
- `GET /sync/:graph-id/health`
  - Health check. Response: `{"ok":true}`.
- `GET /sync/:graph-id/pull?since=<t>`
  - Same as WS pull. Response: `{"type":"pull/ok","t":<t>,"txs":[{"t":<t>,"tx":"<tx-transit>"}...]}`.
  - Error response (400): `{"error":"invalid since"}`.
- `POST /sync/:graph-id/tx/batch`
  - Same as WS tx/batch. Body: `{"t_before":<t>,"txs":["<tx-transit>", ...]}`.
  - Response: `{"type":"tx/batch/ok","t":<t>}` or `{"type":"tx/reject","reason":...}`.
  - Error response (400): `{"error":"missing body"|"invalid tx"}`.
- `GET /sync/:graph-id/snapshot/rows?after=<addr>&limit=<n>`
  - Pull sqlite kvs rows. Response: `{"rows":[{"addr":<addr>,"content":"<transit>","addresses":<json|null>}...],"last_addr":<addr>,"done":true|false}`.
- `POST /sync/:graph-id/snapshot/import`
  - Import sqlite kvs rows. Body: `{"reset":true|false,"rows":[[addr,content,addresses]...]}`.
  - Response: `{"ok":true,"count":<n>}`.
  - Error response (400): `{"error":"missing body"|"invalid body"}`.
- `DELETE /sync/:graph-id/admin/reset`
  - Drop/recreate per-graph tables. Response: `{"ok":true}`.

### Assets
- `GET /assets/:graph-id/:asset-uuid.:ext`
  - Download asset (binary response, `content-type` set, `x-asset-type` header included).
- `PUT /assets/:graph-id/:asset-uuid.:ext`
  - Upload asset (binary body). Size limit ~100MB. Response: `{"ok":true}`.
- `DELETE /assets/:graph-id/:asset-uuid.:ext`
  - Delete asset. Response: `{"ok":true}`.
- Asset error responses: `{"error":"invalid asset path"}` (400), `{"error":"not found"}` (404), `{"error":"asset too large"}` (413), `{"error":"method not allowed"}` (405), `{"error":"missing assets bucket"}` (500).
