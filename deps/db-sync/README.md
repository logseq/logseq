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

#### Mobile Bots

Run the Node adapter for self-hosting or the Cloudflare Worker for hosted
service. Give each deployment its own PostgreSQL database and settings. Both
entrypoints use the same authenticated Bots API, queue and device protocol.

For the Node adapter, set `LOGSEQ_BOTS_DATABASE_URL` to its PostgreSQL database.
The adapter applies `worker/bots/schema.sql` on startup. Set
`LOGSEQ_BOTS_MOCK=1` for deterministic replies from all test Agents
without using Agent credentials. Use this mode for local UI testing.

For a Cloudflare deployment:

1. Apply `worker/bots/schema.sql` to its PostgreSQL database before deploying a
   Worker update. Use a migration role with DDL permissions and give the Worker
   connection only the access required to read and write the Bots tables and
   sequences.
2. Configure a Hyperdrive binding named `LOGSEQ_BOTS_HYPERDRIVE` in the target
   Wrangler environment. Disable Hyperdrive query caching so reads see fresh
   queue and chat state. For a direct PostgreSQL connection, set
   `LOGSEQ_BOTS_DATABASE_URL` as a Worker secret.
3. Deploy the `BotsScheduler` Durable Object binding and its migration. One
   scheduler per environment coalesces work into the nearest due alarm.
   Dispatches and completions wake it promptly. It schedules future provider
   polls, Automations and lease checks from PostgreSQL deadlines. An idle
   queue has no alarm. The hourly Cron Trigger repairs lost wakeups for
   overdue work and cleans up old unclaimed uploads once a day. Codex and Pi
   use paired desktop or CLI devices.

For example, add a provisioned Hyperdrive configuration to the staging Worker
with the following binding. Use the corresponding table under `env.prod` for
production.

```toml
[[env.staging.hyperdrive]]
binding = "LOGSEQ_BOTS_HYPERDRIVE"
id = "<staging Hyperdrive configuration ID>"
```

To enable a live Agent, set `LOGSEQ_BOTS_AGENT_OWNER` to the authenticated
Logseq account's Cognito subject. Command adapters on a self-hosted Node server
use `LOGSEQ_BOTS_AGENT_ROOT`
and the configured executable in `LOGSEQ_BOTS_CODEX`, `LOGSEQ_BOTS_PI` or
`LOGSEQ_BOTS_CIRCLE`. Map each permitted repository to its local checkout
using `LOGSEQ_BOTS_REPOSITORIES`, a JSON object keyed by `owner/repo`.
Circle consumes one JSON object on stdin with `prompt` and `sessionId`,
and returns JSON with `reply`, `sessionId` and an optional `url`.

Cursor uses the Cloud Agents v1 API with `CURSOR_API_KEY`. It defaults to
`grok-4.7` for new sessions and follow-ups. Set `LOGSEQ_BOTS_CURSOR_MODEL` to
override the model. A Bot with no repository can start a standalone cloud
session. To send tasks on a GitHub
repository, set `LOGSEQ_BOTS_CURSOR_PUBLISH_REPOS=1`. Cursor can then push its
generated branch without opening a pull request. Cursor accepts image
attachments through its API.

Bot owners can share a Bot with a collaborative Graph they manage. Current
Graph members can open its conversations and use Bot mentions to forward
messages within the Graph. Dispatch for members is opt-in via the
comma-separated `LOGSEQ_BOTS_SHARED_AGENTS` allowlist. Listed providers run
under the Bot owner's configuration and existing usage limits.

Live Devin requires `LOGSEQ_BOTS_DEVIN_ENABLED=1`, `DEVIN_ORG_ID`,
`DEVIN_API_KEY`, `LOGSEQ_BOTS_DEVIN_MAX_ACU` and
`LOGSEQ_BOTS_DEVIN_DAILY_STARTS`. The last two variables accept positive
integers. The Bots scheduler reserves an attempt for each new Start request,
enforces the rolling 24-hour limit, and passes the per-session ACU limit
to Devin. A timeout on creation counts as an attempt. Set
`LOGSEQ_BOTS_DEVIN_AUTOMATIONS=1` to permit scheduled Devin sessions.

An optional Graph destination uses a scoped `logseq/write` token in
`LOGSEQ_BOTS_GRAPH_TOKEN` plus `LOGSEQ_BOTS_GRAPH_OWNER` and
`LOGSEQ_BOTS_GRAPH_ID`. Set the destination block UUID when creating the
Bot. Set `DB_SYNC_BASE_URL` to the semantic API origin of the same deployment.
The worker writes completed replies through that API.

### Tests

Run db-sync tests (includes Node adapter tests):

```bash
cd deps/db-sync
pnpm test:node-adapter
```

To exercise the hosted Bots routes, set `LOGSEQ_BOTS_WORKER_TEST_DATABASE_URL`
to an isolated PostgreSQL test database and run `pnpm test:bots-worker`.

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
