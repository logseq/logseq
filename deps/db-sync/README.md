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

### Local Sandbox Agent (for agent sessions)

Use the local sandbox-agent repo at `~/Codes/projects/sandbox-agent`:

```bash
cd deps/db-sync
./scripts/start-local-sandbox-agent.sh
```

Then run db-sync worker with:

```bash
SANDBOX_AGENT_URL=http://127.0.0.1:2468
```

If sandbox-agent runs with token auth, also set:

```bash
SANDBOX_AGENT_TOKEN=...
```

Smoke test a Codex-backed session:

```bash
cd deps/db-sync
BASE_URL=http://127.0.0.1:8787 ./scripts/start-weather-session.sh
```

The control plane forwards each task message through sandbox-agent
`/v1/sessions/{id}/messages/stream` and relays runtime events to
`/sessions/{id}/stream`.

### Runtime Provider

Agent runtime is selected by `AGENT_RUNTIME_PROVIDER`:
- `sprites` (default): provisions a Sprite and runs `sandbox-agent` inside it.
- `local-dev`: uses `SANDBOX_AGENT_URL` directly.
- `cloudflare`: provisions a sandbox first, then connects to the sandbox-hosted `sandbox-agent`.

For `cloudflare`, bind and export `Sandbox` in the Worker and configure the container image in
`worker/wrangler.toml` (`[[containers]] class_name = "Sandbox"`).

Cloudflare runtime flow:
- resolve sandbox by deterministic name (session id + prefix)
- health probe `sandbox-agent` inside container
- set runtime env vars and start `sandbox-agent` when needed
- proxy create/message stream via `containerFetch`
- terminate session and cleanup sandbox on terminal states

## Environment Variables

| Variable | Purpose |
| --- | --- |
| DB_SYNC_PORT | HTTP server port |
| DB_SYNC_BASE_URL | External base URL for asset links |
| DB_SYNC_DATA_DIR | Data directory for sqlite + assets |
| DB_SYNC_STORAGE_DRIVER | Storage backend selection (sqlite) |
| DB_SYNC_ASSETS_DRIVER | Assets backend selection (filesystem) |
| DB_SYNC_AUTH_DRIVER | Auth driver (cognito, static, none) |
| DB_SYNC_AUTH_TOKEN | Static token for local dev |
| DB_SYNC_STATIC_USER_ID | Static user id for local dev |
| DB_SYNC_STATIC_EMAIL | Static user email for local dev |
| DB_SYNC_STATIC_USERNAME | Static username for local dev |
| AGENT_RUNTIME_PROVIDER | Runtime backend (`sprites`, `local-dev`, `cloudflare`) |
| SENTRY_DSN | Sentry DSN |
| SENTRY_RELEASE | Release identifier for Sentry events and sourcemaps |
| SENTRY_ENVIRONMENT | Sentry environment name (prod, staging, etc.) |
| SENTRY_TRACES_SAMPLE_RATE | Traces sample rate (0.0 - 1.0) |
| COGNITO_ISSUER | Cognito issuer URL |
| COGNITO_CLIENT_ID | Cognito client id |
| COGNITO_JWKS_URL | Cognito JWKS URL |
| SANDBOX_AGENT_URL | sandbox-agent base URL for agent sessions |
| SANDBOX_AGENT_TOKEN | Optional bearer token for sandbox-agent |
| SPRITE_TOKEN | Sprites API token (default runtime auth) |
| SPRITES_TOKEN | Alias for `SPRITE_TOKEN` |
| SPRITES_API_URL | Sprites API base URL override |
| SPRITES_TIMEOUT_MS | Sprites API request timeout |
| SPRITES_NAME_PREFIX | Prefix used when creating sprite names |
| SPRITES_RAM_MB | Optional sprite RAM override |
| SPRITES_CPUS | Optional sprite CPU override |
| SPRITES_REGION | Optional sprite region |
| SPRITES_STORAGE_GB | Optional sprite storage override |
| SPRITES_BOOTSTRAP_COMMAND | Command to start `sandbox-agent` inside sprite |
| SPRITES_SANDBOX_AGENT_PORT | sandbox-agent port inside sprite (default `2468`) |
| SPRITES_HEALTH_RETRIES | Sprite health check retry count |
| SPRITES_HEALTH_INTERVAL_MS | Sprite health check retry interval (ms) |
| CLOUDFLARE_SANDBOX_NAME_PREFIX | Prefix used when creating Cloudflare sandbox names |
| CLOUDFLARE_SANDBOX_AGENT_PORT | sandbox-agent port inside Cloudflare sandbox (default `2468`) |
| CLOUDFLARE_BOOTSTRAP_COMMAND | Optional command override to start sandbox-agent in Cloudflare sandbox |
| CLOUDFLARE_REPO_CLONE_COMMAND | Optional repo clone command template for Cloudflare sandbox |
| CLOUDFLARE_HEALTH_RETRIES | Cloudflare sandbox health check retry count |
| CLOUDFLARE_HEALTH_INTERVAL_MS | Cloudflare sandbox health check retry interval (ms) |
| GITHUB_TOKEN | Fallback token used for both git push and PR API calls |
| GITHUB_PUSH_TOKEN | Optional token used only for git push (preferred over `GITHUB_TOKEN`) |
| GITHUB_PR_TOKEN | Optional token used only for PR creation (preferred over `GITHUB_TOKEN`) |
| GITHUB_API_BASE | Optional GitHub API base URL override (default `https://api.github.com`) |
| GITHUB_DEFAULT_BASE_BRANCH | Default PR base branch fallback (default `main`) |
| OPENAI_API_KEY | Passed into Cloudflare sandbox runtime env (if set) |
| ANTHROPIC_API_KEY | Passed into Cloudflare sandbox runtime env (if set) |
| OPENAI_BASE_URL | Passed into Cloudflare sandbox runtime env (if set) |
| ANTHROPIC_BASE_URL | Passed into Cloudflare sandbox runtime env (if set) |

## M14 Publish Endpoint

Agent sessions now expose:

`POST /sessions/:session-id/pr`

This endpoint is available to any authenticated collaborator and supports:
- push only (`{"create-pr": false}`)
- push + PR (`{"create-pr": true}` or omitted)

Response `status` values:
- `pushed`
- `pr-created`
- `manual-pr-required`

If PR credentials are missing or PR API creation fails after a successful push, response includes `manual-pr-url`.

For Cloudflare deploys, store tokens as Worker secrets:
- `wrangler secret put GITHUB_PUSH_TOKEN --env <staging|prod>`
- `wrangler secret put GITHUB_PR_TOKEN --env <staging|prod>`

## Notes
- Protocol definitions live in `docs/agent-guide/db-sync/protocol.md`.
- DB sync implementation guide is in `docs/agent-guide/db-sync/db-sync-guide.md`.
