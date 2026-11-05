---
name: logseq-rest-api
description: Call the Logseq semantic REST API (db-sync worker) with a graph-scoped personal access token, including E2EE-encrypted graphs. Use when writing integrations, scripts, or agent tooling that read or write Logseq DB graphs over HTTP, when working with `logseq_pat_` tokens, or when debugging API behavior on encrypted vs plain graphs.
---

# Logseq Semantic REST API

Use this skill to operate the semantic REST API served by the db-sync Cloudflare
worker (local dev: `node deps/db-sync/worker/dist/node-adapter.js`). The API
surface is defined by `GET /openapi.json`; handler code lives in
`deps/db-sync/src/logseq/db_sync/worker/handler/semantic.cljs`, routes in
`.../worker/routes/semantic.cljs`.

## Auth

```bash
curl -H "Authorization: Bearer logseq_pat_..." <base>/api/v1/graphs
```

- Personal access tokens are graph-scoped (`logseq_pat_` prefix) with `read`,
  `write`, or `read+write` permission. A token only works on its own graph —
  requests against another graph return `403 forbidden`; a write-scoped token on
  a read op returns `403 insufficient scope`.
- Creating PATs and creating graphs (`POST /graphs`, body `{"graph-name": ...,
  "graph-e2ee?": true}`) require a user JWT, not a PAT.
- Rate limits (Cloudflare, per PAT or user): **read 120/min, write 20/min** →
  `429 {"error":"rate limit exceeded"}`; limiter down → `503`. The local node
  adapter stubs limiters to unlimited.

## Operations

39 ops under `/api/v1/graphs/{graph-id}/...` plus `/api/v1/graphs`
(`listGraphs`, includes `graph-e2ee?` flag). Groups: pages, blocks (get,
update, delete, move, insert-children, insert-tree), block-properties (set,
delete, batch-set, batch-delete), tags (+ `/objects`), tasks, capture,
properties, assets, search, and 3 E2EE helpers. Non-`/api/v1` endpoint:
`GET /e2ee/graphs/{graph-id}/aes-key` (PAT allowed).

Request-shape gotchas (verified locally):
- `insertBlockChildren`: body `{"position":"append|prepend","blocks":[{title,children?}]}`, block-id in path.
- `insertBlockTree`: body `{"target-id":uuid,"position":"append","blocks":[...]}`.
- `moveBlocks`: `{"block-ids":[uuid],"target-id":uuid,"position":"before|after|first-child|last-child"}`.
- `batchSetBlockProperty`/`batchDeleteBlockProperty`: `{"entries":[{"block-id","property-id","value"?}]}`.
- `createAsset`: query `file-name` (needs a known extension), `size`, `checksum`
  (64-hex SHA-256), optional `title`, `page-id`, `encoding=base64`; body is raw
  bytes (octet-stream).
- **Path params are UUIDs only.** Passing an ident like `user.property/x`
  URL-encoded 404s on every graph — resolve UUIDs via `listProperties`/`listTags`.

## E2EE graphs

Text encryption covers `:block/title` and `:block/name`; orders, tags, property
values, and refs remain plaintext to the server. Asset file bytes are also encrypted.

**Title write rule**: every `title` field on a write op must be an *encrypted
package* — a transit string. Plaintext → `400 "content must be an encrypted
package on e2ee graphs"`. Gated ops: pages create/update, blocks update,
tags create/update, tasks create, properties create/update,
blocks-insert-children, blocks-insert-tree, capture, assets-create (the `title`
query param — effectively required on e2ee since a missing title fails the
gate; `file-name` stays plaintext).

**Producing ciphertext** — `POST /api/v1/graphs/:id/e2ee/encrypt`
`{"key":<raw-aes-b64>,"texts":["..."]}` requires the graph's base64 raw 32-byte
AES-GCM key and returns canonical Transit `[iv ciphertext]` packages. The helper
receives both the key and plaintext; integrations can instead encrypt locally.
RSA-envelope content is rejected, preserving the existing client storage format.

**Names**: creating or renaming a page, tag, or property requires a separate
`name` field containing the encrypted normalized lowercase name. This also applies
to `updateBlock` when its target is one of those named entities. For example,
encrypt `"Project Alpha"` and `"project alpha"` separately, then send
`{"title":<encrypted-title>,"name":<encrypted-name>}`. Never lowercase ciphertext.

**Assets**: encrypt the original file bytes with the graph's AES-GCM key and a
fresh 12-byte IV, then send the canonical Transit `[iv ciphertext]` package as the
body, optionally base64-encoding that whole package for transport. `size` is the
original plaintext byte length; `checksum` is its SHA-256. The title must also be
encrypted. Plaintext bodies and malformed packages return 400 without creating an
Asset block. The `upload_asset` and `get_asset_image` MCP tools support plain graphs;
use client encryption/decryption with the REST API for encrypted graphs.

**Getting the AES key** (agent holds the user's RSA private key):
`GET /e2ee/graphs/:id/aes-key` → `encrypted-aes-key-base64` (RSA-OAEP wrapped);
unwrap with the user's pkcs8 private key → base64 raw key.

**Reading back**: `POST .../e2ee/decrypt {"texts":[<ct>],"key":<raw-aes-b64>}` →
plaintext. `GET .../e2ee/public-keys` lists member RSA keys.

**Verified unusable / degraded on E2EE graphs** (probed on local server):

| Op | Behavior on e2ee |
|---|---|
| `searchGraph` | Runs, but only matches **ciphertext** substrings — plaintext keyword search is impossible (server can't read titles) |
| `listPageReferences` | Only returns client-authored refs — ref extraction is skipped for API writes on e2ee (`[[name]]` can't exist in ciphertext titles), and the API has no way to supply ref UUIDs, so agents cannot create references on e2ee |
| Property values on `:db.type/ref` props | Plaintext titles can't resolve (`:block/title` holds ciphertext) → 400. Pass the entity **UUID** or the **ciphertext title** instead — both resolve |
| `decryptE2eeText` | Requires the graph AES key and canonical `[iv ct]` packages |
| Plaintext titles on any gated write | 400 by design |

Also verified working on e2ee (ciphertext titles): every CRUD op for pages,
blocks (incl. move + nested tree inserts), tags, tasks, capture, properties,
assets (`file-name` + ciphertext `title` + encrypted body), `listGraphs`, all three
e2ee helpers.

## Generic API semantics (same on plain graphs)

- `default`-type properties are `:db.type/ref`: `setBlockProperty` expects the
  value to resolve to a **text block** entity (uuid/ident/title) — a bare string
  fails resolution (400) or validation. `node`-type props take entity refs.
- Deletes return `204` with empty body. Errors: `{"error": "..."}` (400/403/404/409/429/500).
- Pagination: list ops return `{"<plural>": [...], "cursor"?}`.

## MCP endpoint

`POST /mcp` (Streamable HTTP) on the same server exposes tools/list with the 4
code-mode tools (`search`, `execute`, `upload_asset`, `get_asset_image`) plus
one tool per OpenAPI operationId (39 ops). `search`/`execute` run code-mode JS
against the spec; the per-op tools map arguments to path params + query + body.

## Testing locally

```bash
cd deps/db-sync && pnpm install --ignore-workspace
DB_SYNC_PORT=8787 DB_SYNC_DATA_DIR=/tmp/dbsync DB_SYNC_ALLOW_UNVERIFIED_JWT_CLAIMS=true \
  COGNITO_ISSUER=x COGNITO_CLIENT_ID=x COGNITO_JWKS_URL=x \
  node worker/dist/node-adapter.js
```

Rebuild after cljs changes: `clojure -M:cljs compile db-sync-node`.
Tests: `bb dev:db-sync-test` (cljs handler tests) and
`pnpm test:chatgpt-app` in `deps/db-sync` (MCP/tools node tests).
