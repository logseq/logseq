# Worker-Sync Client-Server Protocol

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
  - Upload a batch of txs based on `t_before`.
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
- `{"type":"tx/reject","reason":"empty tx data"|"invalid tx"}`
  - Invalid batch.
- `{"type":"pong"}`
  - Keepalive response.
- `{"type":"error","message":"..."}`
  - Invalid/unknown message.
