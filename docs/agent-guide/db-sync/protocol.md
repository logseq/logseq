# DB-Sync Client-Server Protocol

## Transport
- WebSocket `ws(s)` to `/sync/:graph-id`.
- Client builds URL from config and appends `?token=...` when available.
- Encoding: JSON objects; `tx` payloads are Transit strings.
- Note: keep this document in sync with the current implementation.

## Client -> Server
- `{"type":"hello","client":"<repo-id>"}`
  - Initial handshake from client.
- `{"type":"presence","editing-block-uuid":"<uuid|null>"}`
  - Update current editing block for presence (omit or null to clear).
- `{"type":"pull","since":<t>}`
  - Request txs after `since` (defaults to 0).
- `{"type":"tx/batch","t-before":<t>,"txs":["<tx-transit>", ...]}`
  - Upload a batch of txs based on `t-before` (required).
- `{"type":"ping"}`
  - Optional keepalive; server replies `pong`.

## Server -> Client
- `{"type":"hello","t":<t>}`
  - Server hello with current t.
- `{"type":"online-users","online-users":[{"user-id":"...","email":"...","username":"...","name":"..."}...]}`
  - Presence update
  - Optional `editing-block-uuid` indicates the block the user is editing.
- `{"type":"pull/ok","t":<t>,"txs":[{"t":<t>,"tx":"<tx-transit>"}...]}`
  - Pull response with txs.
- `{"type":"tx/batch/ok","t":<t>}`
  - Batch accepted; server advanced to t.
- `{"type":"changed","t":<t>}`
  - Broadcast that server state advanced; client should pull.
- `{"type":"tx/reject","reason":"stale","t":<t>}`
  - Client tx is based on stale t.
- `{"type":"tx/reject","reason":"cycle","data":"<transit {:attr <kw> :server-values ...}>"}`
  - Cycle detected with server values.
- `{"type":"tx/reject","reason":"empty tx data"|"invalid tx"|"invalid t-before"}`
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
  - List graphs the user owns. Response: `{"graphs":[{graph-id, graph-name, schema-version?, created-at, updated-at}...]}`.
- `POST /graphs`
  - Create graph. Body: `{"graph-name":"...","schema-version":"<major>"}` (schema-version optional). Response: `{"graph-id":"..."}`.
- `GET /graphs/:graph-id/access`
  - Access check. Response: `{"ok":true}`, `401` (unauthorized), `403` (forbidden), or `404` (not found).
- `GET /graphs/:graph-id/members`
  - Graph members list. Response: `{"members":[{user-id, graph-id, role, invited-by, created-at, email?, username?}...]}`.
- `DELETE /graphs/:graph-id`
  - Delete graph and reset data. Response: `{"graph-id":"...","deleted":true}` or `400` (missing graph id).

### E2EE (index DO)
- `GET /e2ee/user-keys`
  - Fetch current user's RSA key pair. Response: `{"public-key":"<transit>","encrypted-private-key":"<transit>"}` or `{}` when missing.
- `POST /e2ee/user-keys`
  - Upsert current user's RSA key pair. Body: `{"public-key":"<transit>","encrypted-private-key":"<transit>","reset-private-key":false?}`.
  - Response mirrors the stored keys: `{"public-key":"<transit>","encrypted-private-key":"<transit>"}`.
- `GET /e2ee/user-public-key?email=<email>`
  - Fetch a user's RSA public key by email. Response: `{"public-key":"<transit>"}` or `{}` when missing.
- `GET /e2ee/graphs/:graph-id/aes-key`
  - Fetch current user's encrypted graph AES key. Response: `{"encrypted-aes-key":"<transit>"}` or `{}` when missing.
- `POST /e2ee/graphs/:graph-id/aes-key`
  - Upsert current user's encrypted graph AES key. Body: `{"encrypted-aes-key":"<transit>"}`.
  - Response: `{"encrypted-aes-key":"<transit>"}`.
- `POST /e2ee/graphs/:graph-id/grant-access`
  - Manager-only. Upsert encrypted graph AES keys for members.
  - Body: `{"target-user-email+encrypted-aes-key-coll":[{"user/email":"<email>","encrypted-aes-key":"<transit>"}...]}`.
  - Response: `{"ok":true,"missing-users":["<email>", ...]?}`.

### Sync (per-graph DO, via `/sync/:graph-id/...`)
- `GET /sync/:graph-id/health`
  - Health check. Response: `{"ok":true}`.
- `GET /sync/:graph-id/pull?since=<t>`
  - Same as WS pull. Response: `{"type":"pull/ok","t":<t>,"txs":[{"t":<t>,"tx":"<tx-transit>"}...]}`.
  - Error response (400): `{"error":"invalid since"}`.
- `POST /sync/:graph-id/tx/batch`
  - Same as WS tx/batch. Body: `{"t-before":<t>,"txs":["<tx-transit>", ...]}`.
  - Response: `{"type":"tx/batch/ok","t":<t>}` or `{"type":"tx/reject","reason":...}`.
  - Error response (400): `{"error":"missing body"|"invalid tx"}`.
- `GET /sync/:graph-id/snapshot/download`
  - Build a snapshot file in R2 and return a download URL.
  - Response: `{"ok":true,"key":"<graph-id>/<uuid>.snapshot","url":"<origin>/assets/:graph-id/<uuid>.snapshot","content-encoding":"gzip"}`.
  - The snapshot file is a framed Transit JSON stream of kvs rows, optionally gzip-compressed.
- `POST /sync/:graph-id/snapshot/upload?reset=true|false`
  - Upload a snapshot stream (framed Transit JSON, optionally gzip-compressed). The server imports rows into kvs.
  - Request body: binary stream; headers should include `content-type: application/transit+json` and `content-encoding: gzip` when compressed.
  - Response: `{"ok":true,"count":<n>,"key":"<graph-id>/<uuid>.snapshot"}`.
  - Error response (400): `{"error":"missing body"|"missing graph id"}`.
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
