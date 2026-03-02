# Logseq DB Sync (deps/workers)

This package contains db-sync and agents worker code plus tests used by Logseq.
It includes separate Cloudflare worker entrypoints and a Node.js adapter for self-hosting.

## Requirements
- Node.js (see repo root for required version)
- Clojure (for shadow-cljs builds)

## Build and Test

### Cloudflare Workers

DB sync worker (`/sync/*`, `/graphs*`, `/e2ee*`, `/assets/*`):

```bash
cd deps/workers
yarn watch

# open another terminal
cd deps/workers/worker
wrangler dev
```

Agents worker (`/sessions*`):

```bash
cd deps/workers
yarn watch:agents

# open another terminal
cd deps/workers/worker
wrangler dev -c wrangler.agents.toml
```

Local split note:
- `db-sync` and `agents` are separate workers after M17.
- For a unified local API on one port, run:
  `wrangler dev -c wrangler.toml -c wrangler.agents.toml --port 8787`
  and `/sessions*` will be forwarded via `AGENTS_SERVICE`.
- If you run workers separately, call sessions on the agents port.
- `worker/wrangler.agents.toml` sets `AGENT_RUNTIME_PROVIDER=cloudflare` by default.
- On localhost, `/sessions*` forwarding retries during agents startup (up to ~30s) to avoid transient `503`.

Production routing note:
- If `api.logseq.com` is currently routed via AWS Route53/API Gateway, keep hostname routing in API Gateway.
- Forward only `/sessions*` from API Gateway to the deployed agents worker URL (`*.workers.dev` or another worker-facing domain).

### D1 Schema (db-sync Worker)

The worker no longer initializes schema at request time. Apply the D1 schema
via migrations during deployment/CI.

```bash
cd deps/workers/worker
wrangler d1 migrations apply logseq-sync-graph-meta-staging --env staging
wrangler d1 migrations apply logseq-sync-graphs-prod --env prod
```

For local development, run `wrangler d1 migrations apply DB --local`.

### Node.js Adapter (self-hosted)

Build the adapter:

```bash
cd deps/workers
npm run build:node-adapter
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
cd deps/workers
npm run test:node-adapter
```

### Local Sandbox Agent (for agent sessions)

Use the local sandbox-agent repo at `~/Codes/projects/sandbox-agent`:

```bash
cd deps/workers
./scripts/start-local-sandbox-agent.sh
```

Then run agents worker with:

```bash
SANDBOX_AGENT_URL=http://127.0.0.1:2468
```

If sandbox-agent runs with token auth, also set:

```bash
SANDBOX_AGENT_TOKEN=...
```

Smoke test a Codex-backed session:

```bash
cd deps/workers
BASE_URL=http://127.0.0.1:8787 ./scripts/start-weather-session.sh
```

The control plane forwards each task message through sandbox-agent
`/v1/sessions/{id}/messages/stream` and relays runtime events to
`/sessions/{id}/stream`.

### Runtime Provider

Agent runtime is selected by `AGENT_RUNTIME_PROVIDER`:
- `sprites`: provisions a Sprite and runs `sandbox-agent` inside it.
- `local-dev`: uses `SANDBOX_AGENT_URL` directly.
- `vercel`: provisions/manages Vercel sandboxes via `@vercel/sandbox`, then runs `sandbox-agent` inside the sandbox.
- `cloudflare`: provisions a sandbox first, then connects to the sandbox-hosted `sandbox-agent`.
- Agents worker default is `cloudflare` (set in `worker/wrangler.agents.toml`).

For `cloudflare`, bind and export `Sandbox` in the agents worker and configure the container image in
`worker/wrangler.agents.toml` (`[[containers]] class_name = "Sandbox"`).

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
| AGENT_RUNTIME_PROVIDER | Runtime backend (`sprites`, `local-dev`, `vercel`, `cloudflare`) |
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
| VERCEL_TEAM_ID | Vercel team ID for Sandbox SDK (required with `VERCEL_TOKEN`) |
| VERCEL_PROJECT_ID | Vercel project ID for Sandbox SDK (required with `VERCEL_TOKEN`) |
| VERCEL_TOKEN | Vercel API token for Sandbox SDK |
| VERCEL_REPO_CLONE_COMMAND | Optional repo clone command template for Vercel runtime |
| VERCEL_SANDBOX_AGENT_PORT | sandbox-agent port inside Vercel sandbox (default `2468`) |
| VERCEL_SANDBOX_TIMEOUT_MS | Vercel sandbox timeout in milliseconds (default `1800000`) |
| VERCEL_SANDBOX_RUNTIME | Vercel sandbox runtime image (default `node24`) |
| VERCEL_SANDBOX_VCPUS | Optional Vercel sandbox vCPU count |
| VERCEL_HEALTH_RETRIES | Vercel sandbox health check retry count |
| VERCEL_HEALTH_INTERVAL_MS | Vercel sandbox health check retry interval (ms) |
| GITHUB_APP_ID | GitHub App ID used to mint installation tokens |
| GITHUB_APP_INSTALLATION_ID | Optional fixed installation ID (if omitted, resolved from repo) |
| GITHUB_APP_PRIVATE_KEY | GitHub App private key PEM used for JWT signing |
| GITHUB_APP_SLUG | Optional app slug used to build install URL in setup prompts |
| GITHUB_API_BASE | Optional GitHub API base URL override (default `https://api.github.com`) |
| OPENAI_API_KEY | Passed into Cloudflare sandbox runtime env (if set) |
| ANTHROPIC_API_KEY | Passed into Cloudflare sandbox runtime env (if set) |
| OPENAI_BASE_URL | Passed into Cloudflare sandbox runtime env (if set) |
| ANTHROPIC_BASE_URL | Passed into Cloudflare sandbox runtime env (if set) |

For agent tasks with a GitHub repo configured, the worker also injects a short-lived GitHub App
installation token into sandbox runtime env as `GITHUB_TOKEN`, `GH_TOKEN`, and
`GITHUB_APP_INSTALLATION_TOKEN`.
It also configures git credentials inside sandbox runtimes so plain `git push` can authenticate.

## M14 Publish Endpoint

Agent sessions now expose (from the agents worker):

`POST /sessions/:session-id/pr`

This endpoint is available to any authenticated collaborator and supports:
- push only (`{"create-pr": false}`)
- push + PR (`{"create-pr": true}` or omitted)

When creating a session, the worker verifies the GitHub App is installed on the target repo.
If not installed, `POST /sessions` returns `412` with an install prompt message.

Agent chat messages can also trigger the same publish flow:
- `push`
- `submit PR`
- natural language requests like `please push this branch` or `can you submit a pull request?`

Response `status` values:
- `pushed`
- `pr-created`
- `manual-pr-required`

If PR API creation fails after a successful push, response includes `manual-pr-url`.

For Cloudflare deploys, store tokens as agents worker secrets:
- `wrangler secret put GITHUB_APP_PRIVATE_KEY -c worker/wrangler.agents.toml --env <staging|prod>`
- set `GITHUB_APP_ID` and optional `GITHUB_APP_INSTALLATION_ID` in worker vars

## Notes
- Protocol definitions live in `docs/agent-guide/db-sync/protocol.md`.
- DB sync implementation guide is in `docs/agent-guide/db-sync/db-sync-guide.md`.
