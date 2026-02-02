# M5: Cloudflare Sandbox Runtime (Replace Local sandbox-agent)

Status: Completed (2026-02-02)
Target: Move runtime execution from local `~/Codes/projects/sandbox-agent` to Cloudflare Sandbox-hosted `sandbox-agent` instances.

## Goal
Use Cloudflare Sandbox as the default runtime backend so every `#Task` session:
- allocates an isolated sandbox,
- boots `sandbox-agent` inside that sandbox,
- runs Codex/Claude via sandbox-agent APIs,
- streams events back to DB-sync DO, and
- can be paused/resumed/interrupted without relying on a locally running daemon.

## Why M5
- Current flow works but depends on local `sandbox-agent` availability.
- Production path needs per-task isolation, remote lifecycle control, and reproducible environments.
- Cloudflare Worker + DO control plane is already in place; runtime needs to be provider-backed.

## Reference Patterns from sandbox-agent repo
Use these as implementation templates:
- `examples/shared/src/sandbox-agent-client.ts`:
  - health wait (`/v1/health`)
  - session create (`POST /v1/sessions/{id}`)
  - turn stream (`POST /v1/sessions/{id}/messages/stream`)
- `examples/daytona/src/daytona.ts`:
  - create sandbox
  - install `sandbox-agent`
  - start daemon in background
  - expose sandbox URL to control plane
- `examples/e2b/src/e2b.ts`:
  - install agent binaries
  - start daemon
  - wait for health before session traffic
  - cleanup sandbox on shutdown

## Scope
1) Cloudflare Sandbox provisioning integration in DB-sync worker.
2) Runtime registry in DO: `session-id -> sandbox-id + sandbox-agent endpoint + auth`.
3) End-to-end session flow using sandbox-agent `/messages/stream`.
4) Cleanup/TTL for sandbox resources after terminal states.

## Out of Scope
- Non-Cloudflare sandbox providers in production path.
- Rich UI changes in Logseq client.

## Deliverables
- New runtime provider module for Cloudflare Sandbox lifecycle:
  - create sandbox
  - bootstrap `sandbox-agent` + coding agents
  - return endpoint/token
  - terminate sandbox
- DO recovery-safe runtime metadata persisted with session state.
- Retry/backoff + health-gated provisioning.
- Operational docs for required secrets/env and failure handling.

## Implemented
- Added runtime provider protocol in `src/logseq/db_sync/worker/agent/runtime_provider.cljs`:
  - `<provision-runtime!`
  - `<open-message-stream!`
  - `<terminate-runtime!`
- Added provider routing:
  - `local-dev` provider (direct sandbox-agent URL)
  - `cloudflare` provider (Cloudflare Sandbox SDK + `Sandbox` binding + health/bootstrap flow)
- Switched session DO logic to provider abstraction in
  `src/logseq/db_sync/worker/agent/do.cljs`.
- Persisted runtime metadata in session state:
  - `:provider`
  - `:sandbox-id` (cloudflare provider)
  - `:agent-endpoint`
  - `:session-id`
- Added runtime provider tests in
  `test/logseq/db_sync/agent_runtime_provider_test.cljs`.
- Added Node adapter env passthrough for provider/cloudflare settings in:
  - `src/logseq/db_sync/node/config.cljs`
  - `src/logseq/db_sync/node/server.cljs`
- Updated operational docs and env variable docs in `README.md`.

## Workstreams

### WS1: Runtime Provider Abstraction
- Introduce runtime provider interface in DB-sync:
  - `provision(session-task) -> runtime`
  - `terminate(runtime)`
  - `health(runtime)`
- Keep existing local mode as fallback (`local-dev` provider).
- Add `cloudflare` provider as default in staging/prod.

### WS2: Cloudflare Sandbox Provisioning
- Implement Cloudflare Sandbox SDK flow:
  - `getSandbox(env.Sandbox, sandbox-id, options)` per session
  - execute bootstrap script in sandbox:
    - install `sandbox-agent`
    - install requested coding agent(s)
    - start `sandbox-agent server` on fixed port
  - `sandbox.exposePort` URL/token for control plane.
- Wait for `/v1/health` before marking runtime ready.

### WS3: Session Lifecycle Wiring
- On `POST /sessions`, provision runtime through provider.
- Store runtime identity and connectivity fields in session state.
- On terminal session states (`completed|failed|canceled`), terminate sandbox.
- Add reconciliation for orphaned sandboxes.

### WS4: Reliability + Security
- Retry/backoff for sandbox create/bootstrap/health checks.
- Add per-session sandbox TTL and explicit keepalive rules.
- Pass secrets via scoped runtime env only (no persistent plain-text logs).
- Enforce egress/command policy based on workspace settings.

### WS5: Tests + Rollout
- Integration tests with mocked Cloudflare Sandbox provider adapter.
- One real smoke test job:
  - create task -> run -> receive assistant deltas -> complete -> sandbox cleanup.
- Rollout:
  1. local-dev provider default (current)
  2. staging: cloudflare default
  3. production canary -> full rollout

## Exit Criteria
1) No local `sandbox-agent` dependency for staging/prod sessions.
2) Every created session gets isolated Cloudflare Sandbox runtime metadata.
3) Message stream path works end-to-end through sandbox-agent `/messages/stream`.
4) Sandbox cleanup succeeds on all terminal session states.
5) Failure/retry telemetry available for provisioning and teardown.

## Required Configuration (initial)
- `AGENT_RUNTIME_PROVIDER=cloudflare|local-dev`
- `Sandbox` container binding in `worker/wrangler.toml`
- `CLOUDFLARE_SANDBOX_HOSTNAME`
- `CLOUDFLARE_SANDBOX_BOOTSTRAP_COMMAND` (optional)
- `CLOUDFLARE_SANDBOX_AGENT_PORT` (optional)

## Risks and Mitigations
- Bootstrap latency: cache prebuilt templates/snapshots.
- Provisioning flakiness: retry with bounded backoff + idempotency key.
- Cost spikes: enforce TTL and quota limits per workspace.
- Provider API drift: keep provider adapter isolated and contract-tested.
