# M23: Local Runner via Cloudflare Tunnel

Status: Proposed
Target: Support bring-your-own-compute by routing Cloudflare-managed agent sessions to user-hosted local runtimes over secure tunnels.

## Goal
Reduce hosted sandbox cost while keeping session lifecycle, auth, and collaboration in the Cloudflare control plane.

## Why M23
- Current `local-dev` provider is single-endpoint and local-only (`SANDBOX_AGENT_URL`), so it is not suitable for multi-user production.
- Durable session state/event history already lives in Cloudflare DO + D1, so only runtime execution needs to move to local machines.
- Reusing the existing sandbox-agent HTTP/SSE contract is the fastest path with the lowest migration risk.

## Inputs
- Existing provider abstraction in `src/logseq/agents/runtime_provider.cljs`.
- Session orchestration and event persistence in `src/logseq/agents/do.cljs`.
- Existing session routes/handler in `src/logseq/agents/routes.cljs` and `src/logseq/agents/handler.cljs`.
- Existing `local-dev` runtime behavior and limitations in `README.md`.

## Scope
1) Add a production runtime provider for remote local runners (for example `remote-runner`) that supports:
- `<provision-runtime!`
- `<open-events-stream!`
- `<send-message!`
- `<terminate-runtime!`
2) Add runner registration and heartbeat APIs in agents worker so each authenticated user can register a local endpoint.
3) Persist runner records in D1 with ownership, status, capacity, last heartbeat, and public endpoint metadata.
4) Route runtime provisioning per session/user to a healthy runner instead of global env URL.
5) Keep the current sandbox-agent protocol for runtime calls (`/v1/sessions/:id`, `/messages`, `/events/sse`, `/terminate`).
6) Secure runner traffic with Cloudflare Access service-token headers and request signing from worker to runner.
7) Add fallback policy: if no healthy runner is available, optionally provision hosted `cloudflare` runtime.

## Out of Scope
- Reverse-connection runner architecture (#2).
- Browser terminal support for local runtimes in this milestone.
- Snapshot/bundle/push parity for local runtimes in this milestone.
- Direct Boxlite provider implementation (can be added later behind adapter/runtime contract).

## Workstreams

### WS1: Runner Registry API + Storage
- Add new routes for runner lifecycle in `src/logseq/agents/routes.cljs` (register, heartbeat, list/get current user runner).
- Add handler logic in `src/logseq/agents/handler.cljs` with existing auth flow and user ownership checks.
- Add request normalization in `src/logseq/agents/request.cljs`.
- Add D1 store module `src/logseq/agents/runner_store.cljs` for CRUD/lease queries.
- Add migration `worker/migrations/0004_add_agent_runners.sql` with indexes on `user_id`, `status`, and `last_heartbeat_at`.

### WS2: Remote Runner Provider
- Extend provider kinds in `src/logseq/agents/runtime_provider.cljs` to include `remote-runner`.
- Implement `RemoteRunnerProvider` using per-runtime `:base-url` and token metadata from registry record.
- Persist runtime metadata in session state (`:provider`, `:runner-id`, `:base-url`, `:session-id`).
- Keep `local-dev` unchanged for local development workflows.

### WS3: Session Provisioning Integration
- Update runtime provisioning flow in `src/logseq/agents/do.cljs` to resolve runner endpoint from authenticated session owner context.
- Enforce ownership: a session can only bind to runners registered by the same user.
- Add retry/rebind behavior for transient runner failures and deterministic failure events for unavailable runners.
- Add optional hosted fallback to `cloudflare` provider when enabled by config.

### WS4: Security + Reliability Hardening
- Add worker-to-runner auth headers support:
- Cloudflare Access service token headers.
- Worker-signed timestamped request header for replay protection.
- Add heartbeat lease TTL checks and stale runner eviction rules.
- Add runtime call timeout, retry policy, and clear error mapping (`runner-offline`, `runner-auth-failed`, `runner-timeout`).

### WS5: Docs + Operator UX
- Update `README.md` with production local runner setup, env vars, and fallback behavior.
- Add startup script `scripts/start-local-runner-tunnel.sh` for local smoke testing.
- Document tunnel requirements and constraints for SSE support.

## Exit Criteria
1) Authenticated users can register a local runner and keep it healthy via heartbeat.
2) New sessions can provision against the user-owned runner and stream events end-to-end.
3) Session state and history remain in Cloudflare DO/D1; runtime execution happens on local machine.
4) If runner is unavailable, system returns explicit actionable error or uses hosted fallback when configured.
5) Existing providers (`cloudflare`, `vercel`, `sprites`, `local-dev`) continue to work unchanged.

## Validation
- Add route/handler tests in:
  - `test/logseq/agents/routes_test.cljs`
  - `test/logseq/agents/request_test.cljs`
  - `test/logseq/agents/dispatch_test.cljs`
- Add provider behavior tests in `test/logseq/agents/runtime_provider_test.cljs`.
- Add session provisioning/failure path tests in `test/logseq/agents/do_test.cljs`.
- Run:
  - `bb dev:lint-and-test`
  - targeted test runs for changed namespaces via `bb dev:test -v <namespace/test-name>`
- Add a manual smoke test:
  - start local runner + tunnel
  - register runner
  - create session
  - send message
  - confirm `/sessions/:id/stream` receives runtime events.
