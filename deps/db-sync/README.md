# Logseq DB Sync (deps/db-sync)

This package contains the DB sync server code and tests used by Logseq.
It includes the Cloudflare Worker implementation and a Node.js adapter for self-hosting.

## Requirements
- Node.js (see repo root for required version)
- Clojure (for shadow-cljs builds)

## Build and Test

### Cloudflare Worker

```bash
cd deps/db-sync
yarn watch

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

### Node.js Adapter (self-hosted)

Build the adapter:

```bash
cd deps/db-sync
npm run build:node-adapter
```

Run the adapter with Cognito auth:

```bash
DB_SYNC_PORT=8787 \
COGNITO_ISSUER=https://cognito-idp.us-east-2.amazonaws.com/us-east-2_kAqZcxIeM \
COGNITO_CLIENT_ID=1qi1uijg8b6ra70nejvbptis0q \
COGNITO_JWKS_URL=https://cognito-idp.us-east-2.amazonaws.com/us-east-2_kAqZcxIeM/.well-known/jwks.json \
node worker/dist/node-adapter.js
```

### Tests

Run db-sync tests (includes Node adapter tests):

```bash
cd deps/db-sync
npm run test:node-adapter
```

## Environment Variables

| Variable | Purpose |
| --- | --- |
| DB_SYNC_PORT | HTTP server port |
| DB_SYNC_BASE_URL | External base URL for asset links |
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
- Protocol definitions live in `docs/agent-guide/db-sync/protocol.md`.
- DB sync implementation guide is in `docs/agent-guide/db-sync/db-sync-guide.md`.
