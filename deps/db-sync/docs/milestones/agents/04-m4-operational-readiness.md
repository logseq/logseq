# M4: Operational Readiness (Full Sandbox-Agent Integration)

Status: Planned
Target: Production-ready, fully wired Sandbox Agent integration for Logseq task-driven development.

## Goal
Make agent sessions reliable, observable, secure, and controllable end-to-end:
- `#Task` -> session creation -> sandbox-agent run -> live events -> pause/resume/interrupt -> replay/audit -> completion.

## Scope
- Control plane (Worker + Durable Object) and sandbox-agent runtime integration.
- Event bridge, approval flow, reliability controls, observability, security, and rollout readiness.

## Out of Scope
- New product UI redesign in Logseq.
- Non-coding agent providers that do not expose compatible runtime streams.

## Exit Criteria (M4 Done)
1) Live event bridge is stable and replayable.
2) Pause/resume/interrupt works across Codex and Claude Code providers.
3) Approval policy gates privileged tool calls.
4) Session replay/audit trail is complete and queryable.
5) Alerting, dashboards, and runbook are in place.
6) E2E integration tests pass in CI.

## Workstreams

### WS1: Event Bridge Completion
- Consume sandbox runtime stream (`/v1/sessions/:id/events/sse`) in the DO.
- Map runtime events into control-plane canonical events:
  - `agent.message`
  - `agent.tool_call`
  - `agent.tool_result`
  - `agent.artifact`
  - `agent.summary`
  - `session.running|paused|completed|failed`
- Persist mapped events with monotonic cursor and event-id.
- Broadcast to `/sessions/:id/stream` subscribers.
- Add replay endpoint semantics with filters:
  - `since` (timestamp)
  - `cursor`
  - `limit`

Acceptance:
- Reconnect from dropped client resumes from cursor with no event loss or duplication.

### WS2: Agent Control Semantics (Pause/Resume/Interrupt)
- Add explicit control endpoints:
  - `POST /sessions/:id/pause`
  - `POST /sessions/:id/resume`
  - `POST /sessions/:id/interrupt`
- Enforce state machine transitions:
  - `running -> paused -> running`
  - `running|paused -> canceled|failed|completed`
- Ensure "new orders" while paused are queued and applied deterministically on resume.
- Ensure interrupt stops active tool/task execution where provider supports it.

Acceptance:
- User can pause any running session and inject new instructions before resuming.

### WS3: Approval and Permission Model
- Define policy model for tool permissions by workspace/user/session:
  - allow/deny lists
  - privileged tools requiring approval
- Add approval lifecycle events:
  - `agent.approval_requested`
  - `agent.approval_granted`
  - `agent.approval_denied`
- Block runtime continuation until approval decision for gated actions.
- Record approver identity, timestamp, reason, and affected call-id.

Acceptance:
- Privileged calls cannot execute without explicit approval.

### WS4: Reliability and Recovery
- Add retry/backoff policies for sandbox create/message/stream operations.
- Implement heartbeat + idle timeout management.
- Add reconciliation job for "stuck" sessions (no heartbeat / stalled stream).
- Add idempotency for session creation and message submission.
- Add crash/redeploy recovery path from stored session/runtime metadata.

Acceptance:
- Sessions recover safely after transient failures and deploy restarts.

### WS5: Observability, Replay, and Audit
- Structured logs for each stage with `session-id`, `task-id`, `workspace-id`, `user-id`.
- Metrics:
  - session create latency
  - stream lag
  - event throughput
  - approval wait time
  - failure rates by phase/provider
- Dashboards and alerts:
  - high failure rate
  - stalled sessions
  - replay backlog
- Audit completeness checks:
  - every action has actor + timestamp + target session.

Acceptance:
- On-call can diagnose a failed session from logs + replay alone.

### WS6: Security Hardening
- Per-session scoped runtime token and expiry/rotation.
- Enforce repo/workdir boundaries and forbidden command policy.
- Rate limit create/message/control endpoints per user/workspace.
- Redact secrets from logs/events/artifacts.
- Validate all external input payloads + enforce payload size limits.

Acceptance:
- Security review passes for least privilege and data exposure controls.

### WS7: Test & Rollout Readiness
- Add E2E tests:
  - task create -> run -> summary
  - pause -> new order -> resume
  - approval required -> grant/deny paths
  - stream reconnect + replay cursor
  - provider swap (Codex/Claude)
- Add chaos tests for disconnects/timeouts/retries.
- Internal dogfood rollout phases:
  1) canary users
  2) broader internal usage
  3) default-on for selected workspaces
- Add rollback playbook with feature flags.

Acceptance:
- CI gates M4 features with stable E2E pass and rollback verified.

## Deliverables
- Updated API surface (control + replay + control actions).
- Canonical event schema with cursor semantics.
- Approval policy config + enforcement.
- Observability dashboards + alerts + runbook.
- Security checklist and rollout checklist.

## Dependencies
- Stable sandbox-agent deployment and auth configuration.
- Local dev baseline: `~/Codes/projects/sandbox-agent` server reachable at
  `SANDBOX_AGENT_URL` (default `http://127.0.0.1:2468`).
- Durable Object storage schema finalized for event indexing/cursor.
- Provider-level support for pause/interrupt semantics.

## Risks and Mitigations
- Provider behavior differences (Codex vs Claude): use capability matrix + adapter fallback paths.
- Stream gaps/duplication: enforce cursor-based idempotent replay and monotonic ordering checks.
- Long-running session drift: add heartbeat watchdog + reconciliation.
- Operational complexity: phase rollout and feature-flag risky controls.
