# Logseq DB Sync (deps/db-sync)

This package contains the DB sync server code and tests used by Logseq.
It includes the Cloudflare Worker implementation and a Node.js adapter for self-hosting.

## Requirements
- Node.js (see repo root for required version)
- Clojure (for shadow-cljs builds)

## Build and Test

### Cloudflare Worker

Graph sync clients POST to the authenticated asset endpoint with
`action: "prepare"` and the asset's plaintext size and SHA-256 checksum.
The Cloudflare Worker returns a presigned R2 PUT for encoded bodies over
100 MiB. After the PUT, the client POSTs to the same endpoint with
`action: "complete"` before publishing the asset's remote metadata.
Smaller uploads and the self-hosted Node adapter receive a plan to PUT
the file to the Logseq asset endpoint.

Older clients can continue to PUT directly to the Logseq asset endpoint with
their existing authorization and asset metadata headers. The Worker also
accepts a streamed body without a Content-Length header.

`R2_ASSET_UPLOAD_BUCKET` must name the bucket used by `LOGSEQ_SYNC_ASSETS`.
Set `R2_ASSET_UPLOAD_ENDPOINT` to the account's R2 S3 API endpoint and configure
the Worker secrets `R2_ASSET_UPLOAD_ACCESS_KEY_ID` and
`R2_ASSET_UPLOAD_SECRET_ACCESS_KEY` with Object Read & Write credentials scoped
to that environment's bucket. Configure bucket CORS to allow `PUT` from the
Logseq browser origins and the `content-type`, `if-match`, `if-none-match`,
`x-amz-meta-checksum`, `x-amz-meta-size` and `x-amz-meta-type` headers.

```bash
cd deps/db-sync
pnpm watch

# open another terminal
cd deps/db-sync/worker
wrangler dev
```

### D1 Schema (Worker)

The worker no longer initializes schema at request time. Apply the D1 schema
via migrations during deployment/CI.

```bash
cd deps/db-sync/worker
wrangler d1 migrations apply logseq-sync-graph-meta-staging --env staging
wrangler d1 migrations apply logseq-sync-graphs-prod --env prod
```

For local development, run `wrangler d1 migrations apply DB --local`.

### Production Graph Lookup

Show the graphs available to a production user by `username` or `user id`:

```bash
cd deps/db-sync
pnpm show-graphs-for-user --username alice
pnpm show-graphs-for-user --user-id us-east-1:example-user-id
```

The script uses `worker/wrangler.toml`, runs against the remote D1 binding `DB`,
defaults to `--env prod`, and prints JSON when `--json` is added.

Show usage totals (total users, total graphs, users created today, graphs created today):

```bash
cd deps/db-sync
pnpm show-usage-stats
pnpm show-usage-stats --days 7
pnpm show-usage-stats --json
```

`created today` uses UTC day boundaries from D1 (`date('now')`).
`active_*_last_n_days` uses deduplicated UTC-day activity rows from
`daily_active_entities` with the provided `--days` window.

Download a graph snapshot into a local sqlite debug file matching local graph DB schema (`kvs` table only):

```bash
cd deps/db-sync
pnpm run download-graph-db -- --graph-id 6f2d7f6f-xxxx-xxxx-xxxx-xxxxxxxxxxxx --admin-token <admin-token>
```

You can also pass `--admin-token <token>` or set `DB_SYNC_ADMIN_TOKEN`. The output defaults to
`tmp/graph-<graph-id>.snapshot.sqlite` and can be changed with `--output`.

Show stored and recomputed checksum for a local sqlite graph db:

```bash
cd deps/db-sync
pnpm run show-sqlite-checksum -- --db ~/Downloads/test.sqlite
```

Delete the graphs owned by a production user after an explicit confirmation:

```bash
cd deps/db-sync
pnpm delete-graphs-for-user --username alice
pnpm delete-graphs-for-user --user-id us-east-1:example-user-id
```

The delete script shows the owned graphs first and requires typing `DELETE`
before it calls the worker delete endpoint for each graph. Set
`DB_SYNC_BASE_URL` and `DB_SYNC_ADMIN_TOKEN` or pass `--base-url` and
`--admin-token` when running it.

Delete a user completely (owned graphs, memberships, keys, and user row):

```bash
cd deps/db-sync
pnpm run delete-user-totally -- --username alice
pnpm run delete-user-totally -- --user-id us-east-1:example-user-id
```

The script prints all linked graphs first, deletes owned graphs through the
admin graph delete endpoint, then removes the user's remaining D1 references.
It requires typing `DELETE` as confirmation.

### Node.js Adapter (self-hosted)

Build the adapter:

```bash
cd deps/db-sync
pnpm build:node-adapter
```

Run the adapter with Cognito auth:

```bash
DB_SYNC_PORT=8787 \
COGNITO_ISSUER=https://cognito-idp.us-east-1.amazonaws.com/us-east-1_dtagLnju8 \
COGNITO_CLIENT_ID=69cs1lgme7p8kbgld8n5kseii6 \
COGNITO_JWKS_URL=https://cognito-idp.us-east-1.amazonaws.com/us-east-1_dtagLnju8/.well-known/jwks.json \
node worker/dist/node-adapter.js
```

### Tests

Run db-sync tests (includes Node adapter tests):

```bash
cd deps/db-sync
pnpm test:node-adapter
```

## Environment Variables

| Variable | Purpose |
| --- | --- |
| DB_SYNC_PORT | HTTP server port |
| DB_SYNC_BASE_URL | External base URL for asset links |
| DB_SYNC_ADMIN_TOKEN | Admin-only token (header `x-db-sync-admin-token`): passes the graph access check on sync and asset routes, and the operator graph deletion endpoints |
| DB_SYNC_DATA_DIR | Data directory for sqlite + assets |
| DB_SYNC_STORAGE_DRIVER | Storage backend selection (sqlite) |
| DB_SYNC_ASSETS_DRIVER | Assets backend selection (filesystem) |
| SENTRY_DSN | Sentry DSN |
| SENTRY_RELEASE | Release identifier for Sentry events and sourcemaps |
| SENTRY_ENVIRONMENT | Sentry environment name (prod, staging, etc.) |
| SENTRY_TRACES_SAMPLE_RATE | Traces sample rate (0.0 - 1.0) |
| COGNITO_ISSUER | Cognito issuer URL |
| COGNITO_CLIENT_ID | Cognito client id |
| COGNITO_JWKS_URL | Cognito JWKS URL |

## Notes
- Runtime and db-sync engineering guidance is consolidated in `../../docs/agent-guide/implemented/architecture/2026-08-24-logseq-runtime-and-engineering-guide.md`; current protocol and route definitions live under `src/logseq/db_sync/worker/`.

### Mobile discussion push

Mobile devices register with `PUT /mobile/push-device` and unregister with
`DELETE /mobile/push-device`. The iOS URLSession and Android OkHttp clients call
the endpoint directly with Cognito authentication. Apply D1 migrations 0008
and 0009 before enabling the preference-aware Worker. For an existing deployment,
set `DISCUSSION_PUSH_ENABLED=false` before applying 0009. Deploy the new Worker
before re-enabling push. Migration 0009 adds device columns and requires the
new Worker's registration query. The Worker generates generic alerts after an
authenticated graph member writes a comment or reaction. Comment alerts
include authors of earlier, already committed comments in the same thread,
using the committed block order after sync. The push payload includes a graph
UUID and event UUID for navigation.

Set the following provider credentials in the worker environment.

- APNs needs `APNS_KEY_ID`, `APNS_TEAM_ID`, `APNS_PRIVATE_KEY` (PKCS#8 PEM),
  and `APNS_TOPIC` (the mobile bundle ID).
- FCM needs `FCM_PROJECT_ID`, `FCM_CLIENT_EMAIL`, and `FCM_PRIVATE_KEY`
  (PKCS#8 PEM). The service account needs permission to send FCM messages.

Set `DISCUSSION_PUSH_ENABLED=true` for a configured environment. Its cron
processes due deliveries each minute. Verify with signed builds and sandbox or
staging credentials before enabling production. Run the local delivery tests
with `pnpm test:discussion-push`.
