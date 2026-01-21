# DB-Sync Client-Server Protocol

## Transport
- WebSocket `ws(s)` to `/sync/:graph-id`.
- Client builds URL from config and appends `?token=...` when available.
- Encoding: JSON objects; `tx` payloads are Transit strings.
- Note: keep this document in sync with the current implementation.

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
- `{"type":"online-users","online-users":[{"user_id":"...","email":"...","username":"...","name":"..."}...]}`
  - Presence update with currently online users (fields may be omitted).
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
- `GET /graphs/:graph-id/members`
  - Graph members list. Response: `{"members":[{user_id, graph_id, role, invited_by, created_at, email?, username?}...]}`.
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
