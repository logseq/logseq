# M13: Cloudflare Sandbox Runtime Provider

Status: Completed (2026-02-06)
Target: Add a first-class `cloudflare` runtime provider for agent sessions using Cloudflare Sandbox.

## Goal
Support `AGENT_RUNTIME_PROVIDER=cloudflare` end-to-end so db-sync can provision a Cloudflare sandbox, start `sandbox-agent`, and stream runtime events through existing session APIs.

## Why M13
- Runtime provider selection still accepts `cloudflare`, but the runtime implementation is currently Sprites-only.
- The Worker already has `Sandbox` bindings and container image config in `worker/wrangler.toml`.
- We can follow the validated Cloudflare pattern from sandbox-agent:
  - `examples/cloudflare/src/cloudflare.ts`
  - `docs/deploy/cloudflare.mdx`

## Inputs
- Cloudflare Sandbox reference flow:
  - `getSandbox(...)`
  - probe `/v1/health`
  - `setEnvVars(...)`
  - `startProcess("sandbox-agent server ...")`
  - proxy via `containerFetch(...)`

## Scope
1) Add `CloudflareProvider` in `src/logseq/agents/runtime_provider.cljs`.
2) Implement lifecycle methods:
- `<provision-runtime!`
- `<open-message-stream!`
- `<terminate-runtime!`
3) Restore provider resolution by runtime/env:
- `sprites` (default)
- `local-dev` (existing direct URL mode)
- `cloudflare` (new)
4) Persist Cloudflare runtime metadata in DO session state:
- `:provider`
- `:sandbox-id` or stable sandbox name
- `:sandbox-port`
- runtime `:session-id`
5) Add docs and env references for Cloudflare runtime operation.

## Out of Scope
- Changing default runtime away from `sprites`.
- Reworking UI behavior for sessions.
- Non-Cloudflare sandbox providers.

## Workstreams

### WS1: Cloudflare Sandbox Provisioning
- Provision/lookup sandbox by deterministic name from session id.
- Add health probe and bootstrapping logic for `sandbox-agent` in-container.
- Inject required runtime env vars for agent credentials.

### WS2: Cloudflare Message Streaming
- Create session through sandbox-hosted `sandbox-agent` API.
- Open `/v1/sessions/:id/messages/stream` via sandbox container networking.
- Preserve existing SSE parsing and event append behavior in session DO.

### WS3: Runtime Selection + Compatibility
- Implement `create-provider` / `resolve-provider` dispatch by provider kind.
- Keep Sprites behavior unchanged when provider is unset.
- Keep `local-dev` behavior for explicit local testing.

### WS4: Reliability + Cleanup
- Retry/backoff for sandbox bootstrap and health checks.
- Ensure runtime teardown on `completed|failed|canceled`.
- Guard against orphaned sessions/processes with timeout-safe cleanup.

### WS5: Tests + Docs
- Add unit tests for Cloudflare provider selection and request construction.
- Add smoke-test instructions for local `wrangler dev` Cloudflare runtime flow.
- Update `README.md` runtime-provider section with Cloudflare-specific requirements.

## Exit Criteria
1) `AGENT_RUNTIME_PROVIDER=cloudflare` can run create/message/stream for a real task session.
2) Session events stream continuously until terminal state.
3) Runtime cleanup executes on terminal states and cancel actions.
4) `sprites` default path remains working when provider is unset.
5) Tests cover provider resolution and Cloudflare runtime behavior.

## Implemented
- Added provider dispatch for `sprites`, `local-dev`, and `cloudflare`.
- Implemented `LocalDevProvider` using direct sandbox-agent HTTP/SSE endpoints.
- Implemented `CloudflareProvider` lifecycle:
  - deterministic sandbox naming via `CLOUDFLARE_SANDBOX_NAME_PREFIX`
  - health probe and bootstrap (`setEnvVars`, `startProcess` fallback to `exec`)
  - create session and message streaming via `containerFetch`
  - terminate session and best-effort sandbox cleanup
- Added Cloudflare/runtime metadata in session runtime state (`:sandbox-id`, `:sandbox-name`, `:sandbox-port`).
- Added `sandbox/<terminate-session` endpoint helper.
- Updated runtime event provisioning payload to include `:sandbox-name`.
- Added and updated tests in `test/logseq/agents/runtime_provider_test.cljs`.
- Updated runtime docs/env reference in `README.md`.
