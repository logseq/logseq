# M6: Sprites Runtime Provider (Default Runtime)

Status: Completed (2026-02-02)
Target: Add a Sprites-backed runtime provider and make it the default runtime for agent sessions.

## Goal
Run task sessions on Sprites by default so every `#Task` can provision an isolated runtime without relying on local sandbox tooling.

## Why M6
- Cloudflare Sandbox works, but we want a provider-neutral runtime default.
- Sprites gives a simpler hosted runtime path and can reduce local/infra setup friction.
- The current protocol-based provider layer is ready for another provider implementation.

## Inputs
- Sprites quickstart: `https://docs.sprites.dev/quickstart/`

## Scope
1) Add `sprites` runtime provider implementation under the existing runtime provider protocol.
2) Add config/env plumbing for Sprites credentials and runtime settings.
3) Make `AGENT_RUNTIME_PROVIDER=sprites` the default for new deployments.
4) Keep `local-dev` and `cloudflare` as explicit fallback options.

## Out of Scope
- Removing Cloudflare/local providers.
- UI redesign in Logseq client.

## Workstreams

### WS1: Provider Implementation
- Add `SpritesProvider` in `src/logseq/db_sync/worker/agent/runtime_provider.cljs`.
- Implement:
  - `<provision-runtime!`
  - `<open-message-stream!`
  - `<terminate-runtime!`
- Persist runtime metadata in session state (`:provider`, runtime id, endpoint, auth mode).

### WS2: Runtime Bootstrapping
- Use Sprites runtime provisioning flow from quickstart patterns.
- Start/connect `sandbox-agent` in the runtime.
- Gate readiness on health checks before session traffic.

### WS3: Config + Defaults
- Add Sprites env vars in:
  - `src/logseq/db_sync/node/config.cljs`
  - `src/logseq/db_sync/node/server.cljs`
  - `README.md`
- Set provider default to `sprites` (with explicit opt-out via `AGENT_RUNTIME_PROVIDER`).

### WS4: Reliability + Security
- Retry/backoff for provision/health/teardown.
- Session TTL + cleanup on terminal states.
- Secret handling through runtime-scoped env only.

### WS5: Tests + Docs
- Add provider selection tests and Sprites provider behavior tests.
- Add local smoke-test script/docs for Sprites runtime sessions.
- Update milestone index and operator runbook.

## Exit Criteria
1) New sessions default to Sprites provider when `AGENT_RUNTIME_PROVIDER` is unset.
2) Session create/message/stream works end-to-end on Sprites.
3) Pause/resume/interrupt/cancel still work with Sprites runtimes.
4) Runtime cleanup succeeds after `completed|failed|canceled`.
5) Existing providers continue to work when explicitly selected.

## Implemented
- Added `SpritesProvider` in `src/logseq/db_sync/worker/agent/runtime_provider.cljs`.
- Set provider default to `sprites` via provider-kind normalization.
- Added Sprites runtime lifecycle:
  - create/get sprite
  - bootstrap `sandbox-agent`
  - health check via sprite exec
  - create sandbox-agent session
  - stream message SSE via sprite spawn + stdout bridge
  - delete sprite on terminate
- Added Sprites env passthrough in:
  - `src/logseq/db_sync/node/config.cljs`
  - `src/logseq/db_sync/node/server.cljs`
- Updated docs and env reference in `README.md`.
- Updated provider tests in `test/logseq/db_sync/agent_runtime_provider_test.cljs`.
