# M14 Git Push and Optional PR Implementation Plan

Goal: Enable every authenticated collaborator to trigger agent-session git push and optional pull request creation with no role-based gating.

Architecture: Add a session-level publish endpoint that orchestrates push and PR from the existing Agent Session Durable Object. Reuse runtime-provider abstractions for sandbox execution and add a small source-control provider layer for GitHub PR creation and manual fallback links. Keep session/event APIs backward compatible and expose publish status through the existing event stream.

Tech Stack: ClojureScript Worker + Durable Objects, existing runtime providers (`sprites`, `cloudflare`, `local-dev`), Git CLI in sandbox, GitHub REST API, Malli request and response coercion.

Related: Builds on `deps/workers/docs/milestones/agents/14-m14-git-push-and-optional-pr.md`, `deps/workers/src/logseq/agents/do.cljs`, and `deps/workers/src/logseq/agents/runtime_provider.cljs`.

## Problem statement
Current agent milestones stop at local commit behavior inside session sandboxes and do not provide a first-class publish flow.

Users cannot reliably complete the delivery loop from task execution to remote branch and PR without manual out-of-band steps.

M14 must enable push and PR for all authenticated collaborators, not only special roles, while preserving existing session behavior.

The existing architecture already has what we need for orchestration, including session-scoped Durable Object state, runtime-provider dispatch, and event streaming.

The missing pieces are publish-specific API routes, source-control provider logic, runtime push execution hooks, and user-facing invocation paths.

## Testing Plan
I will follow @test-driven-development for every implementation slice, running RED, GREEN, and REFACTOR in small batches.

I will add route-level tests to verify `/sessions/:session-id/pr` matching and handler wiring in `deps/workers/test/logseq/sync/worker_routes_test.cljs`.

I will add schema coercion tests for publish request and response payloads in `deps/workers/test/logseq/agents/request_test.cljs` and new targeted schema tests if needed.

I will add runtime-provider tests for push command assembly and provider-specific execution behavior in `deps/workers/test/logseq/agents/runtime_provider_test.cljs`.

I will add Agent Session DO behavior tests for push success, push failure, PR success, manual PR fallback, and no-role-gate behavior in `deps/workers/test/logseq/agents/do_test.cljs`.

I will add source-control unit tests for repo URL parsing, branch sanitization, PR URL fallback, and GitHub API error mapping in a new test namespace under `deps/workers/test/logseq/sync/`.

I will add a lightweight frontend behavior test or deterministic handler-level test for publish action dispatch if the current frontend test harness supports it, otherwise I will document manual verification steps.

I will run focused tests after each slice and run the full db-sync test command before completion.

NOTE: I will write *all* tests before I add any implementation behavior.

## Background-agents inspiration
The `background-agents` implementation demonstrates a clean separation between push transport and PR API calls.

The same codebase also demonstrates resilient branch resolution and manual PR fallback when user OAuth is not available.

We will reuse the architectural pattern but adapt it to db-sync’s simpler session model and current runtime-provider contracts.

| Pattern from background-agents | Where it appears | M14 decision in db-sync |
| --- | --- | --- |
| Provider abstraction for source control operations. | `packages/control-plane/src/source-control/types.ts`. | Adopt with a smaller GitHub-first interface in `deps/workers/src/logseq/agents/source_control.cljs`. |
| Session endpoint that performs push then PR. | `POST /sessions/:id/pr` in `packages/control-plane/src/router.ts`. | Adopt with `POST /sessions/:session-id/pr` in db-sync routes and DO handler. |
| Push auth separated from PR auth. | `generatePushAuth()` and user OAuth in `durable-object.ts`. | Adapt by using server-side configured credentials for both push and PR in M14, with manual PR fallback when PR creds are missing. |
| Branch sanitization and precedence rules. | `branch-resolution.ts`. | Adopt equivalent sanitization and head-branch resolution helpers in db-sync. |
| Manual PR fallback artifact and URL return. | `buildManualPrFallbackResponse(...)`. | Adopt API-level fallback response and stream events, without artifact table because db-sync session state is KV-like. |
| Push completion via sandbox event resolver map. | `pendingPushResolvers` in `durable-object.ts`. | Skip for now because db-sync can execute push synchronously through runtime-provider command execution. |

## Scope
M14 will add a publish endpoint that can push a session branch and optionally create a pull request.

M14 will enforce collaborator-level access by requiring authentication only, with no manager or member role gate.

M14 will support GitHub first for PR API integration and use manual PR URL fallback when PR API credentials are absent.

M14 will keep existing session create, stream, pause, resume, interrupt, and cancel behaviors unchanged for callers that do not use publish.

M14 will emit explicit publish lifecycle events so UI and audit tooling can observe progress and failures.

## Non-goals
M14 will not implement auto-merge, reviewer assignment workflows, or repository hosting providers beyond GitHub.

M14 will not introduce a new participant table or user OAuth token storage model in db-sync.

M14 will not rework session runtime lifecycle semantics beyond what is needed to execute push and PR safely.

## Target API contract
The concrete publish contract for M14 is shown below.

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/sessions/:session-id/pr` | Push branch and optionally create PR. |

| Request field | Type | Required | Notes |
| --- | --- | --- | --- |
| `title` | string | no | Required when `create-pr` is true, default generated from task title otherwise. |
| `body` | string | no | Required when `create-pr` is true, default generated template otherwise. |
| `base-branch` | string | no | Defaults to provider default branch or repo default branch. |
| `head-branch` | string | no | Defaults to current branch if safe, otherwise generated branch name. |
| `create-pr` | boolean | no | Defaults to true, false means push-only. |
| `force` | boolean | no | Defaults to false for safe push behavior. |

| Response field | Type | Notes |
| --- | --- | --- |
| `status` | string | `pushed`, `pr-created`, `manual-pr-required`, or `error`. |
| `head-branch` | string | Final pushed branch. |
| `base-branch` | string | PR target branch when applicable. |
| `pr-url` | string | Present when PR is created. |
| `manual-pr-url` | string | Present when fallback is required. |
| `message` | string | Human-readable summary for UI and logs. |

## Event model additions
M14 will append events using the existing session event envelope.

| Event type | Data keys | When emitted |
| --- | --- | --- |
| `git.push.started` | `by`, `head-branch`, `force` | Before push execution begins. |
| `git.push.succeeded` | `by`, `head-branch`, `remote` | After push succeeds. |
| `git.push.failed` | `by`, `head-branch`, `error`, `reason` | After push fails. |
| `git.pr.started` | `by`, `head-branch`, `base-branch` | Before PR creation call. |
| `git.pr.succeeded` | `by`, `pr-url`, `head-branch`, `base-branch` | After PR is created. |
| `git.pr.manual` | `by`, `manual-pr-url`, `head-branch`, `base-branch`, `reason` | When PR API is skipped or unavailable. |
| `git.pr.failed` | `by`, `head-branch`, `base-branch`, `error`, `reason` | When PR API call fails. |

## Architecture sketch
The publish flow keeps control in the session DO and uses runtime/provider adapters.

```text
Logseq UI or agent-triggered call
          |
          v
POST /sessions/:id/pr  (worker.handler.agent)
          |
          v
AgentSessionDO /__session__/pr
  1) validate + audit
  2) resolve branch
  3) runtime-provider push
  4) source-control PR (optional)
  5) append + broadcast events
          |
          v
SSE /sessions/:id/stream
```

## Detailed implementation plan
This section is intentionally bite-sized so each step is a 2-5 minute action.

### Phase 1: Request and route contracts
1. Add `sessions-pr-request-schema` and `sessions-pr-response-schema` to `deps/workers/src/logseq/sync/malli_schema.cljs`.

2. Register `:sessions/pr` in `http-request-schemas` and `http-response-schemas` in `deps/workers/src/logseq/sync/malli_schema.cljs`.

3. Add optional capability contract fields to `sessions-create-request-schema` in `deps/workers/src/logseq/sync/malli_schema.cljs` using kebab-case keys only.

4. Extend `normalize-session-create` in `deps/workers/src/logseq/agents/request.cljs` to persist capability profile into task payload with defaults.

5. Add `POST /sessions/:session-id/pr` route entry in `deps/workers/src/logseq/sync/worker/routes/index.cljs`.

6. Add route coverage tests for the new path in `deps/workers/test/logseq/sync/worker_routes_test.cljs`.

7. Run `bb dev:test -v logseq.sync.worker-routes-test/match-route-sessions-test` and confirm the new route test fails before implementation and passes after wiring.

### Phase 2: Agent handler forwarding
1. Add `handle-pr` request forwarding function to `deps/workers/src/logseq/agents/handler.cljs`.

2. Reuse `base-headers` and `forward-request` in `deps/workers/src/logseq/agents/handler.cljs` so publish requests keep user identity headers.

3. Add `:sessions/pr` branch in `handle` dispatch in `deps/workers/src/logseq/agents/handler.cljs`.

4. Validate and coerce publish request body with `:sessions/pr` schema before forwarding in `deps/workers/src/logseq/agents/handler.cljs`.

5. Add a focused handler test namespace if missing to verify `/sessions/:id/pr` forwards to `/__session__/pr`.

6. Run the focused handler test and confirm red then green behavior.

### Phase 3: Source control abstraction
1. Create `deps/workers/src/logseq/agents/source_control.cljs` with a minimal provider protocol for repo parsing, manual PR URL building, and PR creation.

2. Add GitHub URL parsing helpers in `deps/workers/src/logseq/agents/source_control.cljs` for HTTPS and SSH remote forms.

3. Add branch-name normalization and sanitization helpers in `deps/workers/src/logseq/agents/source_control.cljs`.

4. Implement GitHub PR creation in `deps/workers/src/logseq/agents/source_control.cljs` using `js/fetch` and strict HTTP status handling.

5. Add manual PR URL fallback builder in `deps/workers/src/logseq/agents/source_control.cljs`.

6. Add source-control error classification with stable `:reason` values in `deps/workers/src/logseq/agents/source_control.cljs`.

7. Add a new test namespace `deps/workers/test/logseq/agents/source_control_test.cljs` for URL parsing, branch sanitization, fallback URL generation, and API error mapping.

8. Run `bb dev:test -v logseq.agents.source-control-test` and keep this test set green before moving on.

### Phase 4: Runtime-provider push execution
1. Extend `RuntimeProvider` protocol in `deps/workers/src/logseq/agents/runtime_provider.cljs` with a push execution entrypoint.

2. Implement push execution for `SpritesProvider` in `deps/workers/src/logseq/agents/runtime_provider.cljs` by executing git commands inside the repo directory.

3. Implement push execution for `CloudflareProvider` in `deps/workers/src/logseq/agents/runtime_provider.cljs` via existing sandbox exec helpers.

4. Implement explicit unsupported behavior for `LocalDevProvider` in `deps/workers/src/logseq/agents/runtime_provider.cljs` with actionable error data.

5. Add command builders that avoid shell injection by strict branch validation in `deps/workers/src/logseq/agents/runtime_provider.cljs`.

6. Classify push failures into deterministic reason codes such as `auth`, `no-branch`, `no-commits`, `remote-rejected`, and `unknown`.

7. Add push-path tests in `deps/workers/test/logseq/agents/runtime_provider_test.cljs` for sprites and cloudflare command composition.

8. Add tests that local-dev push returns a structured unsupported error in `deps/workers/test/logseq/agents/runtime_provider_test.cljs`.

9. Run `bb dev:test -v logseq.agents.runtime-provider-test` and verify all publish-related cases.

### Phase 5: Session DO publish orchestration
1. Add publish request parsing and validation helpers to `deps/workers/src/logseq/agents/do.cljs`.

2. Add capability guard helpers in `deps/workers/src/logseq/agents/do.cljs` with defaults `push-enabled=true` and `pr-enabled=true`.

3. Add branch resolution helper in `deps/workers/src/logseq/agents/do.cljs` using request head branch, runtime branch, and generated fallback.

4. Add `handle-pr` in `deps/workers/src/logseq/agents/do.cljs` that requires authenticated user header and active runtime.

5. Emit `git.push.started` and `git.push.succeeded` or `git.push.failed` events in `deps/workers/src/logseq/agents/do.cljs`.

6. Invoke runtime-provider push method from `deps/workers/src/logseq/agents/do.cljs` and return actionable errors.

7. Add optional PR path in `deps/workers/src/logseq/agents/do.cljs` controlled by `create-pr` request flag.

8. Emit `git.pr.started`, `git.pr.succeeded`, `git.pr.manual`, or `git.pr.failed` in `deps/workers/src/logseq/agents/do.cljs`.

9. Persist latest publish metadata under session state in `deps/workers/src/logseq/agents/do.cljs` for replay and UI hydration.

10. Add `/__session__/pr` path dispatch in `handle-fetch` in `deps/workers/src/logseq/agents/do.cljs`.

11. Add idempotency guard using request header key if present in `deps/workers/src/logseq/agents/do.cljs` so retries do not duplicate PRs.

12. Add publish behavior tests in `deps/workers/test/logseq/agents/do_test.cljs` covering success, failure, manual fallback, and unauthenticated rejection.

13. Add tests confirming no role-based gate exists for publish in `deps/workers/test/logseq/agents/do_test.cljs`.

14. Run `bb dev:test -v logseq.agents.do-test` and keep publish scenarios green.

### Phase 6: Configuration and environment wiring
1. Add publish-related env keys to `deps/workers/src/logseq/sync/node/config.cljs` for SCM provider and credentials.

2. Pass these env keys into runtime Worker env in `deps/workers/src/logseq/sync/node/server.cljs`.

3. Add non-secret provider vars to `deps/workers/worker/wrangler.toml` as placeholders for deploy-time secret config.

4. Add doc updates for required secrets and optional PR mode in `deps/workers/README.md`.

5. Confirm node adapter startup still succeeds with missing optional PR vars and returns manual fallback.

### Phase 7: Frontend invocation path for collaborators
1. Add a publish request helper in `src/main/frontend/handler/agent.cljs` that posts to `/sessions/:id/pr` using current auth token.

2. Add default PR title and body generators in `src/main/frontend/handler/agent.cljs` derived from task title and session context.

3. Add UI action controls in `src/main/frontend/components/agent_chat.cljs` for `Push only` and `Push + PR`.

4. Disable publish buttons while chat is streaming or session is missing in `src/main/frontend/components/agent_chat.cljs`.

5. Show success and failure notifications from publish responses in `src/main/frontend/handler/agent.cljs`.

6. Merge publish events into session state as normal events in `src/main/frontend/handler/agent.cljs` and rely on existing stream logic.

7. Run manual UI verification with two different authenticated users to confirm both users can execute publish actions.

### Phase 8: Protocol and milestone docs
1. Add sessions publish API docs to `docs/agent-guide/db-sync/protocol.md`.

2. Update `deps/workers/docs/milestones/agents/14-m14-git-push-and-optional-pr.md` with implementation status and final contract.

3. Add an operator runbook section in `deps/workers/README.md` for credential setup and common publish failures.

4. Document provider support matrix and fallback behavior in `deps/workers/README.md`.

## Verification commands
Run each command from repo root unless noted.

```bash
bb dev:test -v logseq.sync.worker-routes-test/match-route-sessions-test
```

Expected output is a passing test that includes the `/sessions/:session-id/pr` route.

```bash
bb dev:test -v logseq.agents.runtime-provider-test
```

Expected output is passing push command and provider behavior cases.

```bash
bb dev:test -v logseq.agents.do-test
```

Expected output is passing publish orchestration and event emission cases.

```bash
cd deps/workers && npm run test:node-adapter
```

Expected output is zero failing tests and no regression in node adapter behavior.

```bash
bb dev:lint-and-test
```

Expected output is a clean lint and test run for the full workspace.

## Edge cases to handle explicitly
Push must fail cleanly when the runtime provider does not support shell git execution.

Push must fail cleanly when branch name is invalid or resolves to a protected branch without force permission.

Push must return actionable auth errors when token configuration is missing or invalid.

PR creation must return manual fallback URL when PR API credentials are unavailable but push succeeded.

PR creation must not create duplicates when the same idempotency key is retried.

Session publish must reject unauthenticated requests and must not check manager or member role.

Publish must fail with a clear message when session runtime was already terminated and no repo workspace is available.

Repo URL parsing must reject unsupported host formats and return a deterministic reason.

Event stream consumers must tolerate new `git.*` event types without UI crashes.

## Rollout strategy
Ship backend publish API and events first behind a configuration flag so production can validate credentials and provider behavior.

Enable frontend buttons after backend validation in staging confirms stable publish outcomes.

Turn on default frontend publish actions in production after two-user collaborator verification succeeds.

## Testing Details
Tests will verify behavior boundaries, including route access, request coercion, runtime push execution, PR fallback logic, and event-stream observability under success and failure.

The tests will validate real response payloads and session state transitions instead of implementation details, mocks-only assertions, or data-structure snapshots.

## Implementation Details
- Add `POST /sessions/:session-id/pr` route and handler forwarding through existing session stub flow.
- Add publish schemas and capability fields in `malli_schema.cljs` with backward-compatible defaults.
- Add GitHub-first source-control helper namespace for PR creation and manual fallback URL generation.
- Extend runtime-provider protocol for provider-specific git push execution.
- Implement deterministic branch sanitization and resolution before any push.
- Add publish orchestration in Agent Session DO with `git.*` lifecycle events.
- Keep collaborator access model authentication-only with no manager or role gate.
- Add node and worker configuration for SCM credentials and publish behavior toggles.
- Add frontend publish actions for `Push only` and `Push + PR` in agent chat UI.
- Update protocol and milestone docs with final API, env requirements, and fallback semantics.

## Question
Should M14 support only GitHub in the first implementation, or do we need Bitbucket or GitLab stubs in the same milestone.
Just GitHub.

Should push use force mode by default for generated branches, or should force be opt-in only via request flag.
Force mode.

Should publish be callable only by authenticated users from UI, or must we also support in-sandbox tool invocation with a dedicated session-scoped token in M14.
From UI.

Should PR title and body defaults come from task metadata only, or should we extract a summary from recent assistant events for better defaults.
Extract a summary for better defaults.

Should runtime auto-termination on `session.completed` be delayed briefly to improve publish reliability when users click publish after completion.
Yes, delayed.

---

No need to care about backward-compatible.
